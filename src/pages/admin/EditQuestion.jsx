
// src/pages/admin/EditQuestion.jsx
import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import ImageTool from "@editorjs/image";
import api from "../../services/api";
import { Box, Button, Typography, Alert, CircularProgress, Select, MenuItem, InputLabel, FormControl, Snackbar } from '@mui/material';

// --- Reusing MathTool Class ---
class MathTool {
    constructor({ data }) {
        this.data = {
            latex: (data && data.latex) || "",
            mathml: (data && data.mathml) || "",
            display: (data && data.display) !== undefined ? data.display : false,
        };
        this.wrapper = null;
    }
    static get toolbox() {
        return {
            title: "Math",
            icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12h6" stroke="currentColor" stroke-width="2"/><path d="M15 12h6" stroke="currentColor" stroke-width="2"/><path d="M8 6l8 12" stroke="currentColor" stroke-width="2"/></svg>',
        };
    }
    render() {
        this.wrapper = document.createElement("div");
        this.wrapper.className = "ce-math-tool";
        const textarea = document.createElement("textarea");
        textarea.className = "ce-math-textarea";
        textarea.value = this.data.latex || this.data.mathml || "";
        textarea.placeholder = "Enter LaTeX or MathML";
        textarea.style.width = "100%";
        textarea.style.minHeight = "60px";
        textarea.style.padding = "8px";
        textarea.style.border = "1px solid #ccc";
        textarea.style.borderRadius = "4px";

        textarea.addEventListener("input", () => {
            const v = textarea.value;
            if (v.trim().startsWith('<') && v.toLowerCase().includes('<math')) {
                this.data.mathml = v; this.data.latex = "";
            } else {
                this.data.latex = v; this.data.mathml = "";
            }
        });
        this.wrapper.appendChild(textarea);
        return this.wrapper;
    }
    save() { return { latex: this.data.latex, mathml: this.data.mathml, display: this.data.display }; }
}

const tools = {
    header: Header,
    list: List,
    table: Table,
    image: {
        class: ImageTool,
        config: {
            uploader: {
                async uploadByFile(file) {
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = (e) => resolve({ success: 1, file: { url: e.target.result } });
                        reader.readAsDataURL(file);
                    });
                }
            }
        }
    },
    math: MathTool,
};

export default function EditQuestion() {
    const { questionId } = useParams();
    const navigate = useNavigate();
    const editorInstanceRef = useRef(null);
    const holderId = useRef("editor-edit-" + Math.random().toString(36).slice(2, 9));

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [availableCOs, setAvailableCOs] = useState([]);
    const [selectedCO, setSelectedCO] = useState("");
    const [subjectName, setSubjectName] = useState(""); // Display only

    // Data loaded from backend
    const [initialData, setInitialData] = useState(null);

    // --- Auto-save draft state ---
    const debounceTimerRef = useRef(null);
    const [showDraftBanner, setShowDraftBanner] = useState(false);
    const [draftData, setDraftData] = useState(null);
    const [draftSavedOpen, setDraftSavedOpen] = useState(false);
    const DRAFT_KEY = `qpds_draft_edit_${questionId}`;

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Question Details
                const qRes = await api.get(`/api/questions/${questionId}`);
                const qData = qRes.data;
                setInitialData(qData.editorData);
                setSelectedCO(qData.courseOutcomeId || "");

                // 2. We need subject details for COs.
                // qData should have subjectId? The to_dict() might have 'subcode' but maybe not ID?
                // Let's check questions.py: to_dict() returns 'subcode', 'academicYear', ... 
                // It DOES NOT return subjectId explicitly in the to_dict method I saw earlier! 
                // It returns 'subcode'. 
                // I need 'subjectId' to fetch COs.
                // I should update questions.py to return subjectId in to_dict() or I can't fetch COs easily.
                // OR I can fetch all subjects and match subcode.

                // Fallback: Fetch all subjects, find match by subcode (inefficient but safe)
                const subRes = await api.get('/api/subjects');
                const matchedSub = subRes.data.find(s => s.code === qData.subcode);

                if (matchedSub) {
                    setSubjectName(matchedSub.name);
                    // Fetch COs
                    const coRes = await api.get(`/api/subjects/${matchedSub.id}/course-outcomes`);
                    setAvailableCOs(coRes.data);
                }

                setLoading(false);
            } catch (err) {
                console.error(err);
                setError("Failed to load question details.");
                setLoading(false);
            }
        };

        if (questionId) fetchData();
    }, [questionId]);

    // --- Check for existing draft on mount ---
    useEffect(() => {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                setDraftData(parsed);
                setShowDraftBanner(true);
            }
        } catch (e) {
            console.warn('Failed to parse edit draft:', e);
            localStorage.removeItem(DRAFT_KEY);
        }
    }, [DRAFT_KEY]);

    // --- Restore / Discard handlers ---
    const handleRestoreDraft = () => {
        if (!draftData) return;
        if (draftData.selectedCO) setSelectedCO(draftData.selectedCO);

        // Re-render editor with saved blocks
        if (draftData.editorContent && editorInstanceRef.current) {
            const inst = editorInstanceRef.current;
            if (inst.isReady) {
                inst.isReady.then(() => {
                    inst.render(draftData.editorContent).catch(err =>
                        console.warn('Failed to restore editor content:', err)
                    );
                });
            }
        }
        setShowDraftBanner(false);
    };

    const handleDiscardDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setDraftData(null);
        setShowDraftBanner(false);
    };

    // --- Debounced auto-save helper ---
    const triggerDebouncedSave = () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(async () => {
            try {
                if (!editorInstanceRef.current) return;
                const content = await editorInstanceRef.current.save();
                const draft = {
                    selectedCO,
                    editorContent: content,
                    savedAt: new Date().toISOString(),
                };
                localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
                setDraftSavedOpen(true);
            } catch (err) {
                console.warn('Auto-save edit draft failed:', err);
            }
        }, 3000);
    };

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!loading && initialData && !editorInstanceRef.current) {
            const editor = new EditorJS({
                holder: holderId.current,
                tools: tools,
                data: initialData,
                autofocus: true,
                onReady: () => { editorInstanceRef.current = editor; },
                onChange: async () => {
                    triggerDebouncedSave();
                }
            });

            return () => {
                if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === 'function') {
                    editorInstanceRef.current.destroy().catch(e => console.warn(e));
                    editorInstanceRef.current = null;
                }
            };
        }
    }, [loading, initialData]);

    const handleSave = async () => {
        if (!editorInstanceRef.current) return;
        setSaving(true);
        try {
            const content = await editorInstanceRef.current.save();
            const payload = {
                editorData: content,
                courseOutcomeId: selectedCO // Allow updating CO
            };

            await api.put(`/api/questions/${questionId}`, payload);
            // Clear auto-save draft on successful update
            localStorage.removeItem(DRAFT_KEY);
            alert("Question updated successfully!");
            navigate(-1); // Go back
        } catch (err) {
            console.error(err);
            alert("Failed to update question.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (error) return <Box p={4}><Alert severity="error">{error}</Alert></Box>;

    return (
        <Box sx={{ p: 3, maxWidth: 1100, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom>Edit Question</Typography>
            <Typography variant="subtitle1" gutterBottom color="textSecondary">{subjectName}</Typography>

            {/* --- Draft Restore Banner --- */}
            {showDraftBanner && (
                <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                        <>
                            <Button color="inherit" size="small" onClick={handleRestoreDraft}>
                                Restore Draft
                            </Button>
                            <Button color="inherit" size="small" onClick={handleDiscardDraft}>
                                Discard
                            </Button>
                        </>
                    }
                >
                    We found an unsaved draft from your previous session.
                </Alert>
            )}

            <Box sx={{ my: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Course Outcome</InputLabel>
                    <Select
                        value={selectedCO}
                        label="Course Outcome"
                        onChange={(e) => setSelectedCO(e.target.value)}
                    >
                        <MenuItem value=""><em>None</em></MenuItem>
                        {availableCOs.map(co => (
                            <MenuItem key={co.id} value={co.id}>{co.coCode} - {co.description}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            <div id={holderId.current} style={{ border: "1px solid #e6e9ef", borderRadius: 8, minHeight: 400, padding: 20, background: "#fff" }} />

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button variant="contained" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Update Question"}
                </Button>
                <Button variant="outlined" onClick={() => { localStorage.removeItem(DRAFT_KEY); navigate(-1); }}>Cancel</Button>
            </Box>

            {/* --- Draft Saved Snackbar --- */}
            <Snackbar
                open={draftSavedOpen}
                autoHideDuration={2000}
                onClose={() => setDraftSavedOpen(false)}
                message="Draft saved"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            />
        </Box>
    );
}
