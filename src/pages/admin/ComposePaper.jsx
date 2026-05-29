// src/pages/admin/ComposePaper.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Box, Typography, Button, Paper, TextField, Divider,
    List, ListItem, ListItemText, IconButton, Grid, CircularProgress, Alert,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import api from '../../services/api';
import { MathJax, MathJaxContext } from "better-react-mathjax";

const mathJaxConfig = {
    loader: { load: ["input/tex", "input/mml", "output/svg"] },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
};

export default function ComposePaper() {
    const location = useLocation();
    const navigate = useNavigate();
    const { paperId, subjectId } = location.state || {};
    const componentRef = useRef();

    const [paperData, setPaperData] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    
    const [paperTitle, setPaperTitle] = useState("Semester End Examination");
    const [subjectName, setSubjectName] = useState("");
    const [duration, setDuration] = useState("3 Hours");
    const [maxMarks, setMaxMarks] = useState("100");
    
    // Modal states
    const [openAddModal, setOpenAddModal] = useState({ open: false, targetSectionId: null });
    const [openReplaceModal, setOpenReplaceModal] = useState({ open: false, targetSectionId: null, oldQuestionId: null });
    const [bankQuestions, setBankQuestions] = useState([]);
    const [validationResult, setValidationResult] = useState(null);
    const [subjectCOs, setSubjectCOs] = useState([]);
    
    useEffect(() => {
        if (!paperId || sections.length === 0) {
            setValidationResult(null);
            return;
        }
        const validatePaper = async () => {
            try {
                const res = await api.post(`/api/papers/${paperId}/validate`, { totalMarks: Number(maxMarks) || 0 });
                setValidationResult(res.data);
            } catch (err) {
                console.error("Validation check failed", err);
            }
        };
        
        // Debounce to avoid spamming the backend while typing maxMarks
        const timeoutId = setTimeout(() => validatePaper(), 500);
        return () => clearTimeout(timeoutId);
    }, [sections, maxMarks, paperId]);
    
    useEffect(() => {
        if (!paperId) {
            setLoading(false);
            return;
        }
        fetchPaperDetails();
        fetchSubjectDetails();
    }, [paperId]);

    // Fetch course outcomes for CO coverage panel
    useEffect(() => {
        if (!subjectId) return;
        api.get(`/api/subjects/${subjectId}/course-outcomes`)
            .then(res => setSubjectCOs(res.data))
            .catch(() => setSubjectCOs([]));
    }, [subjectId]);

    const fetchPaperDetails = async () => {
        try {
            const res = await api.get(`/api/papers/${paperId}`);
            setPaperData(res.data);
            setSections(res.data.sections || []);
            setPaperTitle(res.data.title || "Draft Paper");
        } catch (err) {
            console.error("Error fetching paper details:", err);
            alert("Failed to load paper details");
        } finally {
            setLoading(false);
        }
    };
    
    const fetchSubjectDetails = async () => {
        if (!subjectId) return;
        try {
            const subRes = await api.get('/api/subjects');
            const sub = subRes.data.find(s => s.id === subjectId);
            if (sub) setSubjectName(`${sub.code} - ${sub.name}`);
        } catch(err) {
            console.log(err);
        }
    };

    const isFinalized = paperData?.status === "FINALIZED";

    const fetchBankQuestions = async () => {
        try {
            const res = await api.get(`/api/questions?subjectId=${subjectId}&includeUsed=false`);
            setBankQuestions(res.data);
        } catch (err) {
            console.error("Failed to fetch bank questions:", err);
        }
    };

    // --- Core Drag & Drop Mechanics ---
    const handleDragEnd = async (result) => {
        if (!result.destination || isFinalized) return;
        const { source, destination, type, draggableId } = result;

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        const newSections = Array.from(sections);

        if (type === 'section') {
            const [reorderedSection] = newSections.splice(source.index, 1);
            newSections.splice(destination.index, 0, reorderedSection);
            setSections(newSections);

            try {
                await api.put(`/api/papers/${paperId}/reorder-sections`, {
                    orderedSectionIds: newSections.map(s => s.id)
                });
            } catch (err) {
                console.error(err);
                fetchPaperDetails();
            }
            return;
        }

        if (type === 'question') {
            const sourceSecIndex = newSections.findIndex(s => s.id === source.droppableId);
            const destSecIndex = newSections.findIndex(s => s.id === destination.droppableId);
            
            const sourceSection = newSections[sourceSecIndex];
            const destSection = newSections[destSecIndex];

            const [movedQuestion] = sourceSection.questions.splice(source.index, 1);

            if (source.droppableId === destination.droppableId) {
                // Moving inside same section
                destSection.questions.splice(destination.index, 0, movedQuestion);
                setSections(newSections);

                try {
                    await api.put(`/api/sections/${sourceSection.id}/reorder-questions`, {
                        orderedQuestionIds: destSection.questions.map(q => q.id)
                    });
                } catch (err) {
                    console.error(err);
                    fetchPaperDetails();
                }
            } else {
                // Moving across sections
                destSection.questions.splice(destination.index, 0, movedQuestion);
                setSections(newSections);

                try {
                    await api.put(`/api/papers/${paperId}/move-question`, {
                        questionId: draggableId,
                        fromSectionId: sourceSection.id,
                        toSectionId: destSection.id,
                        newIndex: destination.index
                    });
                } catch (err) {
                    console.error(err);
                    alert("Failed to move across section: " + (err.response?.data?.error || ""));
                    fetchPaperDetails();
                }
            }
        }
    };

    // --- Section & Question Controls ---
    const handleAddSection = async () => {
        if (isFinalized) return;
        const title = prompt("Enter new section title:", `Section ${String.fromCharCode(65 + sections.length)}`);
        if (!title) return;

        try {
            const res = await api.post(`/api/papers/${paperId}/sections`, { title });
            setSections([...sections, res.data]);
        } catch(err) {
            alert("Failed to add section");
        }
    };

    const handleDeleteSection = async (sectionId) => {
        if (isFinalized) return;
        const sec = sections.find(s => s.id === sectionId);
        if (sec?.questions?.length > 0) {
            alert("Cannot delete a section that has questions in it. Remove questions first.");
            return;
        }
        if (!window.confirm("Delete this empty section?")) return;

        try {
            await api.delete(`/api/sections/${sectionId}`);
            setSections(sections.filter(s => s.id !== sectionId));
        } catch(err) {
            alert("Failed to delete section: " + (err.response?.data?.error || err.message));
        }
    };

    const handleRemoveQuestion = async (sectionId, questionId) => {
        if (isFinalized) return;
        try {
            await api.delete(`/api/sections/${sectionId}/remove-question/${questionId}`);
            fetchPaperDetails();
        } catch (err) {
            console.error("Failed to remove question", err);
            alert("Failed to remove question: " + err.response?.data?.error);
        }
    };

    const handleFinalize = async () => {
        const emptySec = sections.find(s => s.questions.length === 0);
        if (emptySec) {
            alert(`Cannot finalize paper. "${emptySec.title}" is completely empty!`);
            return;
        }

        if (!window.confirm("Are you sure? Once finalized, the structured paper cannot be edited.")) return;
        setFinalizing(true);
        try {
            await api.put(`/api/papers/${paperId}/finalize`, { totalMarks: Number(maxMarks) });
            alert('Paper finalized successfully!');
            fetchPaperDetails();
        } catch (err) {
            console.error('Finalize fail:', err);
            alert('Failed to finalize paper: ' + (err.response?.data?.error || err.message));
        } finally {
            setFinalizing(false);
        }
    };

    // --- Modal Executes ---
    const getUsedQuestionIds = () => {
        const used = [];
        sections.forEach(s => s.questions.forEach(q => used.push(q.id)));
        return used;
    };

    const handleExecuteAdd = async (newQuestionId) => {
        try {
            await api.post(`/api/sections/${openAddModal.targetSectionId}/add-question`, { questionId: newQuestionId });
            setOpenAddModal({ open: false, targetSectionId: null });
            fetchPaperDetails();
        } catch (err) {
            alert("Failed to add question: " + (err.response?.data?.error || err.message));
        }
    };

    const handleExecuteReplace = async (newQuestionId) => {
        try {
            await api.put(`/api/sections/${openReplaceModal.targetSectionId}/replace-question`, {
                oldQuestionId: openReplaceModal.oldQuestionId,
                newQuestionId: newQuestionId
            });
            setOpenReplaceModal({ open: false, targetSectionId: null, oldQuestionId: null });
            fetchPaperDetails();
        } catch (err) {
            alert("Failed to replace question: " + (err.response?.data?.error || err.message));
        }
    };

    // --- Helpers ---
    const getQuestionText = (editorData) => {
        if (!editorData?.blocks) return "No content";
        return editorData.blocks.map(b => {
            if (b.type === 'paragraph' || b.type === 'header') return b.data.text;
            if (b.type === 'list') return b.data.items.map((it, i) => `${i + 1}. ${it}`).join('<br/>');
            if (b.type === 'math') return `$$${b.data.latex}$$`;
            return "";
        }).join('<br/>');
    };

    const getMarks = (q) => q.editorData?.marks || "";

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: paperTitle || 'Question Paper',
    });

    const handleExportDocx = async () => {
        try {
            const res = await api.get(`/api/papers/${paperId}/export/docx`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `Exam_Paper_${paperTitle.replace(/\s+/g, '_')}.docx`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export Word failed:", err);
            alert("Failed to export Word document");
        }
    };

    const handleExportLatex = async () => {
        try {
            const res = await api.get(`/api/papers/${paperId}/export/latex`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `Exam_Paper_${paperTitle.replace(/\s+/g, '_')}.tex`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Export LaTeX failed:", err);
            alert("Failed to export LaTeX document");
        }
    };

    // ============ Blueprint Dashboard Data ============
    const blueprint = useMemo(() => {
        const allQuestions = [];
        sections.forEach(s => s.questions?.forEach(q => allQuestions.push(q)));
        const totalQ = allQuestions.length;
        let currentMarks = 0;
        let easyCount = 0, mediumCount = 0, hardCount = 0;
        let hasLow = false, hasMid = false, hasHigh = false;
        const coveredCOs = new Set();

        allQuestions.forEach(q => {
            // Marks
            const m = parseFloat(q.editorData?.marks || 0);
            if (!isNaN(m)) currentMarks += m;
            // Difficulty
            const diff = (q.difficulty || 'MEDIUM').toUpperCase();
            if (diff === 'EASY') easyCount++;
            else if (diff === 'MEDIUM') mediumCount++;
            else if (diff === 'HARD') hardCount++;
            // Bloom
            const bloom = (q.bloomLevel || 'understand').toLowerCase();
            if (['remember', 'understand'].includes(bloom)) hasLow = true;
            if (['apply', 'analyze'].includes(bloom)) hasMid = true;
            if (['evaluate', 'create'].includes(bloom)) hasHigh = true;
            // CO
            if (q.coCode) coveredCOs.add(q.coCode);
        });

        const requiredMarks = parseFloat(maxMarks) || 0;
        const marksPercent = requiredMarks > 0 ? Math.min(100, (currentMarks / requiredMarks) * 100) : 0;

        return {
            totalQ, currentMarks, requiredMarks, marksPercent,
            easyCount, mediumCount, hardCount,
            hasLow, hasMid, hasHigh,
            coveredCOs: Array.from(coveredCOs)
        };
    }, [sections, maxMarks]);

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!paperData) return <Box p={4}><Alert severity="error">Failed to load Paper structure.</Alert><Button onClick={() => navigate(-1)}>Go Back</Button></Box>;

    const usedIds = getUsedQuestionIds();

    // Blueprint Sidebar Component
    const BlueprintSidebar = () => {
        const marksOk = blueprint.currentMarks === blueprint.requiredMarks;
        const bloomAllOk = blueprint.hasLow && blueprint.hasMid && blueprint.hasHigh;
        const totalQ = blueprint.totalQ;
        const easyPct = totalQ > 0 ? ((blueprint.easyCount / totalQ) * 100).toFixed(0) : 0;
        const medPct = totalQ > 0 ? ((blueprint.mediumCount / totalQ) * 100).toFixed(0) : 0;
        const hardPct = totalQ > 0 ? ((blueprint.hardCount / totalQ) * 100).toFixed(0) : 0;

        return (
            <Paper elevation={4} sx={{
                p: 2.5, width: '280px', position: 'sticky', top: 24, alignSelf: 'flex-start',
                borderRadius: 3, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                color: '#e0e0e0', '@media print': { display: 'none' },
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
                {/* Title */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#fff', letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }}>
                    📊 Blueprint Dashboard
                </Typography>

                {/* Marks Gauge */}
                <Box sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>Total Marks</Typography>
                        <Typography variant="caption" sx={{ color: marksOk ? '#66bb6a' : '#ef5350', fontWeight: 700 }}>
                            {blueprint.currentMarks} / {blueprint.requiredMarks}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={blueprint.marksPercent}
                        sx={{
                            height: 10, borderRadius: 5,
                            bgcolor: 'rgba(255,255,255,0.08)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 5,
                                background: marksOk
                                    ? 'linear-gradient(90deg, #43a047, #66bb6a)'
                                    : blueprint.marksPercent > 100
                                        ? 'linear-gradient(90deg, #e53935, #ff5252)'
                                        : 'linear-gradient(90deg, #ff9800, #ffb74d)'
                            }
                        }}
                    />
                    {marksOk && <Typography variant="caption" sx={{ color: '#66bb6a', mt: 0.3, display: 'block' }}>✓ Marks matched</Typography>}
                </Box>

                {/* Difficulty Distribution */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block' }}>Difficulty Distribution ({totalQ} Qs)</Typography>
                    {totalQ > 0 ? (
                        <>
                            <Box sx={{ display: 'flex', borderRadius: 5, overflow: 'hidden', height: 14 }}>
                                <Tooltip title={`Easy: ${blueprint.easyCount} (${easyPct}%)`}>
                                    <Box sx={{ width: `${easyPct}%`, bgcolor: '#66bb6a', transition: 'width 0.4s ease' }} />
                                </Tooltip>
                                <Tooltip title={`Medium: ${blueprint.mediumCount} (${medPct}%)`}>
                                    <Box sx={{ width: `${medPct}%`, bgcolor: '#ffa726', transition: 'width 0.4s ease' }} />
                                </Tooltip>
                                <Tooltip title={`Hard: ${blueprint.hardCount} (${hardPct}%)`}>
                                    <Box sx={{ width: `${hardPct}%`, bgcolor: '#ef5350', transition: 'width 0.4s ease' }} />
                                </Tooltip>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                <Typography variant="caption" sx={{ color: '#66bb6a', fontSize: '0.65rem' }}>● Easy {easyPct}%</Typography>
                                <Typography variant="caption" sx={{ color: '#ffa726', fontSize: '0.65rem' }}>● Med {medPct}%</Typography>
                                <Typography variant="caption" sx={{ color: '#ef5350', fontSize: '0.65rem' }}>● Hard {hardPct}%</Typography>
                            </Box>
                        </>
                    ) : (
                        <Typography variant="caption" sx={{ color: '#555' }}>No questions yet</Typography>
                    )}
                </Box>

                {/* Bloom's Taxonomy */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block' }}>Bloom's Coverage</Typography>
                    {[{ label: 'Low (Remember/Understand)', ok: blueprint.hasLow },
                      { label: 'Mid (Apply/Analyze)', ok: blueprint.hasMid },
                      { label: 'High (Evaluate/Create)', ok: blueprint.hasHigh }].map(item => (
                        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', mb: 0.3 }}>
                            {item.ok
                                ? <CheckCircleIcon sx={{ fontSize: 16, color: '#66bb6a', mr: 0.5 }} />
                                : <CancelIcon sx={{ fontSize: 16, color: '#ef5350', mr: 0.5 }} />}
                            <Typography variant="caption" sx={{ color: item.ok ? '#c8e6c9' : '#ef9a9a' }}>{item.label}</Typography>
                        </Box>
                    ))}
                    {bloomAllOk && <Typography variant="caption" sx={{ color: '#66bb6a', mt: 0.3, display: 'block' }}>✓ All levels covered</Typography>}
                </Box>

                {/* CO Coverage */}
                {subjectCOs.length > 0 && (
                    <Box>
                        <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block' }}>CO Coverage ({blueprint.coveredCOs.length}/{subjectCOs.length})</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {subjectCOs.map(co => {
                                const covered = blueprint.coveredCOs.includes(co.coCode);
                                return (
                                    <Tooltip key={co.id} title={co.description}>
                                        <Chip
                                            label={co.coCode}
                                            size="small"
                                            sx={{
                                                fontSize: '0.65rem', fontWeight: 600, height: 22,
                                                bgcolor: covered ? 'rgba(102,187,106,0.2)' : 'rgba(255,255,255,0.05)',
                                                color: covered ? '#66bb6a' : '#777',
                                                border: `1px solid ${covered ? '#66bb6a' : '#444'}`,
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </Box>
                        {blueprint.coveredCOs.length === subjectCOs.length && subjectCOs.length > 0 && (
                            <Typography variant="caption" sx={{ color: '#66bb6a', mt: 0.5, display: 'block' }}>✓ All COs covered</Typography>
                        )}
                    </Box>
                )}

                {/* Validation Errors */}
                {validationResult && !validationResult.valid && validationResult.errors?.length > 0 && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <Typography variant="caption" sx={{ color: '#ef5350', fontWeight: 700, display: 'block', mb: 0.5 }}>⚠ Validation Issues</Typography>
                        {validationResult.errors.map((e, i) => (
                            <Typography key={i} variant="caption" sx={{ color: '#ef9a9a', display: 'block', fontSize: '0.65rem' }}>• {e}</Typography>
                        ))}
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 1200, mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Paper Composer
                    {isFinalized ? (
                        <Chip label="FINALIZED" color="success" sx={{ ml: 2, fontWeight: 'bold' }} />
                    ) : (
                        <Chip label="DRAFT" color="warning" sx={{ ml: 2, fontWeight: 'bold' }} />
                    )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="contained" size="small" startIcon={<PrintIcon />} onClick={handlePrint}>Print PDF</Button>
                    <Button variant="contained" size="small" color="secondary" startIcon={<DescriptionIcon />} onClick={handleExportDocx}>Export Word</Button>
                    <Button variant="contained" size="small" sx={{ bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }} startIcon={<CodeIcon />} onClick={handleExportLatex}>Export LaTeX</Button>
                    {!isFinalized && (
                        <Button 
                            variant="contained" 
                            size="small"
                            color="success" 
                            onClick={handleFinalize} 
                            disabled={finalizing || (validationResult && !validationResult.valid)}
                        >
                            {finalizing ? 'Finalizing...' : 'Finalize Paper'}
                        </Button>
                    )}
                    <Button size="small" onClick={() => navigate(-1)}>Back</Button>
                </Box>
            </Box>

            {/* Two-column layout: Paper + Blueprint Sidebar */}
            <Box sx={{ display: 'flex', gap: 3, width: '100%', maxWidth: 1200, justifyContent: 'center', alignItems: 'flex-start' }}>

            <Box
                ref={componentRef}
                sx={{
                    p: 5, width: '210mm', minHeight: '297mm', bgcolor: 'white',
                    boxShadow: 3, color: 'black', flexShrink: 0,
                    '@media print': { boxShadow: 'none', margin: 0, p: 0 }
                }}
            >
                {/* Header Inputs */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <TextField
                        variant="standard" fullWidth
                        inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }}
                        placeholder="Institution Name / Paper Title"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        disabled={isFinalized}
                        sx={{ mb: 1, '& .MuiInput-underline:before': { borderBottom: 'none' } }}
                    />
                    <Typography variant="h6">{subjectName}</Typography>
                    
                    <Grid container justifyContent="space-between" sx={{ mt: 2 }}>
                        <Grid item>
                            Duration: <input value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isFinalized} style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', fontSize: '1rem', width: '150px' }} />
                        </Grid>
                        <Grid item>
                            Max Marks: <input value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} disabled={isFinalized} style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', fontSize: '1rem', width: '60px' }} />
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 2, borderBottomWidth: 2, borderColor: 'black' }} />
                </Box>

                <MathJaxContext config={mathJaxConfig}>
                    <DragDropContext onDragEnd={handleDragEnd}>
                        
                        {/* Outer Droppable for SECTIONS */}
                        <Droppable droppableId="board" type="section">
                            {(providedBoard) => (
                                <Box ref={providedBoard.innerRef} {...providedBoard.droppableProps}>
                                    
                                    {sections.map((section, sIndex) => (
                                        <Draggable key={section.id} draggableId={section.id} index={sIndex} isDragDisabled={isFinalized}>
                                            {(providedSection) => (
                                                <Box
                                                    ref={providedSection.innerRef}
                                                    {...providedSection.draggableProps}
                                                    sx={{ mb: 4, p: 2, border: '1px dashed transparent', '&:hover': { borderColor: isFinalized ? 'transparent' : '#ccc' } }}
                                                >
                                                    {/* Section Header */}
                                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                        {!isFinalized && (
                                                            <Box {...providedSection.dragHandleProps} sx={{ mr: 1, color: 'text.secondary', display: 'flex', alignItems: 'center', '@media print': { display: 'none' }}}>
                                                                <DragIndicatorIcon />
                                                            </Box>
                                                        )}
                                                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                                                            {section.title}
                                                        </Typography>
                                                        {!isFinalized && (
                                                            <Box sx={{ '@media print': { display: 'none' }}}>
                                                                <IconButton size="small" color="error" disabled={section.questions.length > 0} onClick={() => handleDeleteSection(section.id)}>
                                                                    <DeleteIcon />
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    {/* Inner Droppable for QUESTIONS */}
                                                    <Droppable droppableId={section.id} type="question">
                                                        {(providedSecList) => (
                                                            <List ref={providedSecList.innerRef} {...providedSecList.droppableProps} sx={{ minHeight: '50px' }}>
                                                                {section.questions.map((q, qIndex) => (
                                                                    <Draggable key={q.id} draggableId={q.id} index={qIndex} isDragDisabled={isFinalized}>
                                                                        {(providedQuestion) => (
                                                                            <ListItem
                                                                                ref={providedQuestion.innerRef}
                                                                                {...providedQuestion.draggableProps}
                                                                                alignItems="flex-start"
                                                                                sx={{ '&:hover .question-actions': { opacity: 1 }, position: 'relative', pr: 2, breakInside: 'avoid', bgcolor: 'white', mb: 1 }}
                                                                            >
                                                                                {!isFinalized && (
                                                                                    <Box {...providedQuestion.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mr: 2, color: 'text.secondary', '@media print': { display: 'none' }}}>
                                                                                        <DragIndicatorIcon fontSize="small" />
                                                                                    </Box>
                                                                                )}
                                                                                
                                                                                <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }}>{qIndex + 1}.</Typography>

                                                                                <ListItemText
                                                                                    primary={
                                                                                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                                                                            <div dangerouslySetInnerHTML={{ __html: getQuestionText(q.editorData) }} style={{ flex: 1 }} />
                                                                                            {getMarks(q) && (
                                                                                                <Typography variant="body2" sx={{ fontWeight: 'bold', ml: 2, whiteSpace: 'nowrap' }}>
                                                                                                    [{getMarks(q)} Marks]
                                                                                                </Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                    }
                                                                                />

                                                                                {!isFinalized && (
                                                                                    <Box className="question-actions" sx={{ position: 'absolute', right: 0, top: 0, opacity: 0, transition: '0.2s', bgcolor: '#f1f1f1', borderRadius: 1, display: 'flex', '@media print': { display: 'none' }}}>
                                                                                        <IconButton size="small" color="primary" onClick={() => { fetchBankQuestions(); setOpenReplaceModal({ open: true, targetSectionId: section.id, oldQuestionId: q.id }); }}>
                                                                                            <SwapHorizIcon />
                                                                                        </IconButton>
                                                                                        <IconButton size="small" color="error" onClick={() => handleRemoveQuestion(section.id, q.id)}>
                                                                                            <DeleteIcon />
                                                                                        </IconButton>
                                                                                    </Box>
                                                                                )}
                                                                            </ListItem>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {providedSecList.placeholder}
                                                            </List>
                                                        )}
                                                    </Droppable>

                                                    {/* Add Question Button per section */}
                                                    {!isFinalized && (
                                                        <Box sx={{ mt: 1, textAlign: 'center', '@media print': { display: 'none' } }}>
                                                            <Button size="small" variant="text" startIcon={<AddIcon />} onClick={() => { fetchBankQuestions(); setOpenAddModal({ open: true, targetSectionId: section.id }); }}>
                                                                Add Question
                                                            </Button>
                                                        </Box>
                                                    )}
                                                </Box>
                                            )}
                                        </Draggable>
                                    ))}
                                    {providedBoard.placeholder}
                                    
                                </Box>
                            )}
                        </Droppable>
                    </DragDropContext>
                </MathJaxContext>

                {!isFinalized && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', '@media print': { display: 'none' } }}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddSection}>
                            Add New Section
                        </Button>
                    </Box>
                )}
            </Box>

                {/* Blueprint Sidebar */}
                <Box sx={{ display: { xs: 'none', lg: 'block' }, flexShrink: 0 }}>
                    <BlueprintSidebar />
                </Box>
            </Box>

            {/* Repurposed Modal for Add / Replace with unified state rendering */}
            <Dialog open={openAddModal.open || openReplaceModal.open} onClose={() => { setOpenAddModal({open: false}); setOpenReplaceModal({open: false}); }} maxWidth="md" fullWidth>
                <DialogTitle>{openAddModal.open ? "Add Question" : "Replace Question"}</DialogTitle>
                <DialogContent dividers>
                    <List>
                        {bankQuestions.filter(bq => !usedIds.includes(bq.id)).length > 0 ? (
                            bankQuestions.filter(bq => !usedIds.includes(bq.id)).map(bq => (
                                <ListItem key={bq.id} disablePadding sx={{ borderBottom: '1px solid #ddd' }}>
                                    <Box sx={{ py: 1, px: 2, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ flex: 1, mr: 2, maxHeight: '60px', overflow: 'hidden' }}>
                                            <div dangerouslySetInnerHTML={{ __html: getQuestionText(bq.editorData) }} />
                                        </Box>
                                        <Button variant="contained" size="small" onClick={() => openAddModal.open ? handleExecuteAdd(bq.id) : handleExecuteReplace(bq.id)}>
                                            Select
                                        </Button>
                                    </Box>
                                </ListItem>
                            ))
                        ) : (
                            <Typography sx={{ p: 2, textAlign: 'center' }}>No unused questions available.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenAddModal({open: false}); setOpenReplaceModal({open: false}); }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
