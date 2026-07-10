import React, { useEffect, useRef, useState } from "react";
import { TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, List as MuiList, ListItem, ListItemText, Snackbar, Grid, Card, CardContent, Divider, Chip, CircularProgress } from '@mui/material';
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import ImageTool from "@editorjs/image";
import Paragraph from "@editorjs/paragraph";
import AlignmentTuneTool from "editorjs-text-alignment-blocktune";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import api from "../../services/api";
import "./createQuestion.css";
import RateReviewIcon from "@mui/icons-material/RateReview";

function safeDestroyEditorInstance(inst) {
  if (!inst) return;
  try {
    const maybePromise = inst.destroy && inst.destroy();
    if (maybePromise && typeof maybePromise.then === "function") {
      maybePromise.catch((err) => {
        console.warn("Editor destroy rejected:", err);
      });
    }
  } catch (err) {
    console.warn("Editor destroy threw:", err);
  }
}

class MathTool {
  constructor({ data }) {
    this.data = {
      latex: (data && data.latex) || "",
      mathml: (data && data.mathml) || "",
      display: (data && data.display) !== undefined ? data.display : false,
    };
  }

  static get toolbox() {
    return {
      title: "Math",
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h6" stroke="currentColor" stroke-width="2"/><path d="M15 12h6" stroke="currentColor" stroke-width="2"/><path d="M8 6l8 12" stroke="currentColor" stroke-width="2"/></svg>',
    };
  }

  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "ce-math-tool";

    const labelRow = document.createElement("div");
    labelRow.style.display = "flex";
    labelRow.style.gap = "8px";
    labelRow.style.marginBottom = "6px";

    const latexBtn = document.createElement("button");
    latexBtn.type = "button";
    latexBtn.textContent = "LaTeX";
    latexBtn.className = "math-tool-switch";

    const mathmlBtn = document.createElement("button");
    mathmlBtn.type = "button";
    mathmlBtn.textContent = "MathML";
    mathmlBtn.className = "math-tool-switch";

    labelRow.appendChild(latexBtn);
    labelRow.appendChild(mathmlBtn);

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Enter LaTeX or MathML";
    textarea.className = "ce-math-textarea";
    textarea.value = this.data.latex || this.data.mathml || "";

    const displayLabel = document.createElement("label");
    displayLabel.style.fontSize = "13px";
    displayLabel.style.marginTop = "6px";
    displayLabel.innerHTML = ` Display <input type="checkbox" ${this.data.display ? "checked" : ""} />`;
    const displayCheckbox = displayLabel.querySelector("input");

    const preview = document.createElement("div");
    preview.className = "ce-math-preview";
    preview.style.minHeight = "36px";

    const makePreviewHtml = () => {
      const v = textarea.value.trim();
      if (!v) return "<div class='ce-math-empty'>No formula</div>";
      const isMathML = v.startsWith("<") && v.toLowerCase().includes("<math");
      if (isMathML) return v;
      return displayCheckbox.checked ? `\\[${v}\\]` : `\\(${v}\\)`;
    };

    const typeset = () => {
      try {
        if (window && window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([preview]).catch(() => { });
        }
      } catch (e) {}
    };

    preview.innerHTML = makePreviewHtml();
    setTimeout(typeset, 80);

    textarea.addEventListener("input", () => {
      const v = textarea.value || "";
      const isMathML = v.trim().startsWith("<") && v.toLowerCase().includes("<math");
      if (isMathML) {
        this.data.mathml = v;
        this.data.latex = "";
      } else {
        this.data.latex = v;
        this.data.mathml = "";
      }
      preview.innerHTML = makePreviewHtml();
      typeset();
    });

    displayCheckbox.addEventListener("change", () => {
      this.data.display = displayCheckbox.checked;
      preview.innerHTML = makePreviewHtml();
      typeset();
    });

    this.wrapper.appendChild(labelRow);
    this.wrapper.appendChild(textarea);
    this.wrapper.appendChild(displayLabel);
    this.wrapper.appendChild(preview);

    return this.wrapper;
  }

  save() {
    return {
      latex: this.data.latex || "",
      mathml: this.data.mathml || "",
      display: !!this.data.display,
    };
  }

  static get isReadOnlySupported() {
    return true;
  }
}

const tools = {
  alignmentTune: { class: AlignmentTuneTool, config: { default: "left" } },
  paragraph: { class: Paragraph, inlineToolbar: true, tunes: ["alignmentTune"] },
  header: { class: Header, tunes: ["alignmentTune"] },
  list: { class: List, tunes: ["alignmentTune"] },
  table: { class: Table, tunes: ["alignmentTune"] },
  image: {
    class: ImageTool,
    tunes: ["alignmentTune"],
    config: {
      uploader: {
        async uploadByFile(file) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({ success: 1, file: { url: e.target.result } });
            };
            reader.readAsDataURL(file);
          });
        },
      },
    },
  },
  math: { class: MathTool, tunes: ["alignmentTune"] },
};

const DRAFT_KEY = 'qpds_draft_new_question';

export default function CreateQuestion() {
  const editorInstanceRef = useRef(null);
  const [savedJson, setSavedJson] = useState(null);

  const [mySubjects, setMySubjects] = useState([]);
  const [availableCOs, setAvailableCOs] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCO, setSelectedCO] = useState("");
  const [marks, setMarks] = useState(5);
  const [difficulty, setDifficulty] = useState("MEDIUM");

  // Similarity Check State
  const [checking, setChecking] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [openSimDialog, setOpenSimDialog] = useState(false);

  // --- Auto-save draft state ---
  const debounceTimerRef = useRef(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [draftSavedOpen, setDraftSavedOpen] = useState(false);

  // Live analysis state
  const [editorContentTrigger, setEditorContentTrigger] = useState(0);
  const [bloomAnalysis, setBloomAnalysis] = useState(null);

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
      console.warn('Failed to parse draft:', e);
      localStorage.removeItem(DRAFT_KEY);
    }
  }, []);

  // --- Restore / Discard handlers ---
  const handleRestoreDraft = () => {
    if (!draftData) return;
    if (draftData.selectedSubject) setSelectedSubject(draftData.selectedSubject);
    if (draftData.selectedCO) setSelectedCO(draftData.selectedCO);
    if (draftData.marks !== undefined) setMarks(draftData.marks);
    if (draftData.difficulty) setDifficulty(draftData.difficulty);

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

  const triggerDebouncedSave = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (!editorInstanceRef.current) return;
        const content = await editorInstanceRef.current.save();
        const draft = {
          selectedSubject,
          selectedCO,
          marks,
          difficulty,
          editorContent: content,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setDraftSavedOpen(true);
      } catch (err) {
        console.warn('Auto-save draft failed:', err);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  useEffect(() => {
    api.get('/faculty/my-subjects')
      .then(res => setMySubjects(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get(`/api/subjects/${selectedSubject}/course-outcomes`)
        .then(res => {
          setAvailableCOs(res.data);
        })
        .catch(err => {
          console.error("Failed to fetch COs:", err);
          setAvailableCOs([]);
        });
    } else {
      setAvailableCOs([]);
    }
  }, [selectedSubject]);

  const holderId = useRef("editorjs-" + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    if (editorInstanceRef.current) return;

    const editor = new EditorJS({
      holder: holderId.current,
      autofocus: true,
      tools,
      data: {
        time: Date.now(),
        blocks: [
          { type: "header", data: { text: "Question title", level: 2 } },
          { type: "paragraph", data: { text: "Write the question stem..." } },
        ],
      },
      onReady: () => {
        editorInstanceRef.current = editor;
        setEditorContentTrigger(prev => prev + 1);
      },
      onChange: async () => {
        triggerDebouncedSave();
        setEditorContentTrigger(prev => prev + 1);
      }
    });

    return () => {
      if (editorInstanceRef.current) {
        safeDestroyEditorInstance(editorInstanceRef.current);
        editorInstanceRef.current = null;
      }
    };
  }, []);

  // Debounced live bloom analysis
  useEffect(() => {
    if (!editorInstanceRef.current) return;

    const extractText = (blocks) => {
      if (!blocks) return "";
      return blocks.map(b => {
        if (b.type === 'header' || b.type === 'paragraph') return b.data.text || "";
        if (b.type === 'list') return (b.data.items || []).join(' ');
        if (b.type === 'math') return b.data.latex || b.data.mathml || "";
        return "";
      }).join(' ');
    };

    const runAnalysis = async () => {
      try {
        const content = await editorInstanceRef.current.save();
        const text = extractText(content.blocks);
        if (!text.trim() || text.trim() === "Question title Write the question stem...") {
          setBloomAnalysis(null);
          return;
        }

        const res = await api.post("/api/questions/analyze-bloom", { text });
        setBloomAnalysis(res.data);
      } catch (err) {
        console.warn("Bloom analysis failed:", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      runAnalysis();
    }, 600);

    return () => clearTimeout(delayDebounce);
  }, [editorContentTrigger]);

  const handleSave = async (targetStatus = "DRAFT") => {
    if (!editorInstanceRef.current) return alert("Editor not ready");
    if (!selectedSubject || !selectedCO) {
      return alert("Please select Subject and Course Outcome.");
    }
    if (!marks) return alert("Please enter marks.");

    try {
      const content = await editorInstanceRef.current.save();
      
      let hasRealContent = false;
      if (content.blocks && content.blocks.length > 0) {
          for (let block of content.blocks) {
              if (block.type === 'paragraph' && block.data?.text && block.data.text.trim() !== '' && block.data.text.replace(/&nbsp;/g, '').trim() !== 'Write the question stem...') {
                  hasRealContent = true;
                  break;
              }
              if (block.type === 'header' && block.data?.text && block.data.text.trim() !== '' && block.data.text.replace(/&nbsp;/g, '').trim() !== 'Question title') {
                  hasRealContent = true;
                  break;
              }
              if (block.type !== 'paragraph' && block.type !== 'header') {
                  hasRealContent = true;
                  break;
              }
          }
      }
      
      if (!hasRealContent) {
          return alert("Cannot save an empty question. Please write the actual question content.");
      }

      const payload = {
        subjectId: selectedSubject,
        courseOutcomeId: selectedCO,
        marks: parseInt(marks),
        difficulty: difficulty,
        editorData: content,
        status: targetStatus
      };

      console.log("Sending payload:", payload);

      const response = await api.post("/api/questions", payload);

      setSavedJson(response.data);
      localStorage.removeItem(DRAFT_KEY);
      alert(targetStatus === "PENDING_REVIEW" 
        ? "Question submitted successfully for peer review!" 
        : "Question saved as draft successfully!"
      );
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleClear = async () => {
    const inst = editorInstanceRef.current;
    if (!inst) return alert("Editor not ready");
    try {
      if (inst.blocks && typeof inst.blocks.clear === "function") {
        await inst.blocks.clear();
      } else if (typeof inst.clear === "function") {
        await inst.clear();
      } else {
        safeDestroyEditorInstance(inst);
        window.location.reload();
        return;
      }
      setSavedJson(null);
      setBloomAnalysis(null);
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      safeDestroyEditorInstance(inst);
      window.location.reload();
    }
  };

  const handleCheckSimilarity = async () => {
    if (!editorInstanceRef.current) return;
    if (!selectedSubject) return alert("Please select a subject first.");

    setChecking(true);
    try {
      const content = await editorInstanceRef.current.save();
      const text = content.blocks.map(b => {
        if (b.type === 'header' || b.type === 'paragraph') return b.data.text;
        if (b.type === 'list') return b.data.items.join(' ');
        if (b.type === 'math') return b.data.latex || b.data.mathml;
        return '';
      }).join('\n');

      const res = await api.post('/faculty/ai/check-duplicate', {
        subjectId: selectedSubject,
        questionText: text
      });
      setSimResult(res.data);
      setOpenSimDialog(true);
    } catch (err) {
      console.error("Similarity check error:", err);
      alert('Failed to check similarity: ' + (err.response?.data?.error || err.message));
    } finally {
      setChecking(false);
    }
  };

  const mathJaxConfig = {
    loader: { load: ["input/tex", "input/mml", "output/svg"] },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
  };

  const getBloomColor = (level) => {
    const mapping = {
      remember: "#3b82f6",
      understand: "#10b981",
      apply: "#f59e0b",
      analyze: "#8b5cf6",
      evaluate: "#ef4444",
      create: "#ec4899"
    };
    return mapping[level?.toLowerCase()] || "#6b7280";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.02em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        Create Question
      </Typography>

      {showDraftBanner && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: 3 }}
          action={
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button color="inherit" size="small" onClick={handleRestoreDraft} sx={{ fontWeight: 700 }}>
                Restore Draft
              </Button>
              <Button color="inherit" size="small" onClick={handleDiscardDraft}>
                Discard
              </Button>
            </Box>
          }
        >
          We found an unsaved draft from your previous session.
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Left Column: Form & Editor */}
        <Grid item xs={12} md={7.5}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, borderColor: "divider", mb: 4 }}>
            {/* Subject and CO Inputs */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Subject"
                  size="small"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <MenuItem value="">Select Subject</MenuItem>
                  {mySubjects.map(sub => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.code} - {sub.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Course Outcome"
                  size="small"
                  value={selectedCO}
                  disabled={!selectedSubject}
                  onChange={(e) => setSelectedCO(e.target.value)}
                >
                  <MenuItem value="">Select CO</MenuItem>
                  {availableCOs.map(co => (
                    <MenuItem key={co.id} value={co.id}>{co.coCode} - {co.description}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Marks & Difficulty */}
            <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
              <Grid item xs={6}>
                <TextField
                  label="Marks"
                  type="number"
                  fullWidth
                  size="small"
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  select
                  fullWidth
                  label="Difficulty"
                  size="small"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <MenuItem value="EASY">Easy</MenuItem>
                  <MenuItem value="MEDIUM">Medium</MenuItem>
                  <MenuItem value="HARD">Hard</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Editor Stem */}
            <Box 
              id={holderId.current} 
              sx={{ 
                border: "1px solid #eef2f6", 
                borderRadius: 3, 
                minHeight: 340, 
                p: 2, 
                bgcolor: "#fff",
                mb: 3,
                "& .ce-block": { maxWidth: "100%" }
              }}
            />

            {/* Action Buttons */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => handleSave("PENDING_REVIEW")}
                sx={{ fontWeight: 600 }}
              >
                Submit for Review
              </Button>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => handleSave("DRAFT")}
                sx={{ fontWeight: 600 }}
              >
                Save as Draft
              </Button>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleCheckSimilarity}
                disabled={checking}
                sx={{ fontWeight: 600 }}
              >
                {checking ? 'Checking...' : 'Check Similarity'}
              </Button>
              <Button 
                variant="text" 
                color="inherit" 
                onClick={handleClear}
                sx={{ fontWeight: 600 }}
              >
                Clear
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Live Bloom analysis */}
        <Grid item xs={12} md={4.5}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderColor: "divider", bgcolor: "#fcfdfe", minHeight: 300 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <RateReviewIcon color="primary" /> Bloom's Cognitive Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3.5 }}>
              Real-time classification based on action verbs detected in the question content.
            </Typography>
            
            {bloomAnalysis ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Cognitive Tier:</Typography>
                  <Chip 
                    label={bloomAnalysis.bloomLevel?.toUpperCase()} 
                    sx={{ 
                      bgcolor: getBloomColor(bloomAnalysis.bloomLevel), 
                      color: "#fff", 
                      fontWeight: 800, 
                      letterSpacing: 0.5,
                      px: 1.5
                    }} 
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Difficulty Recommendation:</Typography>
                  <Chip 
                    label={bloomAnalysis.difficulty} 
                    variant="outlined"
                    sx={{ 
                      borderColor: bloomAnalysis.difficulty === "EASY" ? "success.main" : bloomAnalysis.difficulty === "MEDIUM" ? "warning.main" : "error.main",
                      color: bloomAnalysis.difficulty === "EASY" ? "success.main" : bloomAnalysis.difficulty === "MEDIUM" ? "warning.main" : "error.main",
                      fontWeight: 700 
                    }} 
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>Quality & Improvement Tips:</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {bloomAnalysis.suggestions.map((s, idx) => (
                      <Alert key={idx} severity="info" icon={false} sx={{ py: 0.5, px: 2, borderRadius: 2, fontSize: "0.825rem", border: "1px solid #e0f2fe", bgcolor: "#f0f9ff", color: "#0369a1" }}>
                        {s}
                      </Alert>
                    ))}
                  </Box>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5, color: "text.secondary" }}>
                    Reference Action Verbs
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {bloomAnalysis.tips && bloomAnalysis.tips[bloomAnalysis.bloomLevel]?.slice(0, 10).map((v, i) => (
                      <Chip key={i} label={v} size="small" variant="outlined" sx={{ fontSize: "0.75rem" }} />
                    ))}
                  </Box>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8, color: "text.secondary" }}>
                <Typography variant="body2" align="center">
                  Start typing in the editor to see real-time cognitive classification & verb recommendations.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for auto-draft */}
      <Snackbar
        open={draftSavedOpen}
        autoHideDuration={2000}
        onClose={() => setDraftSavedOpen(false)}
        message="Draft saved"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />

      {/* Similarity Dialog */}
      <Dialog open={openSimDialog} onClose={() => setOpenSimDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Similarity Check Result</DialogTitle>
        <DialogContent dividers>
          {simResult && (
            <div>
              {simResult.isDuplicate ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Potential Duplicate Detected! (Confidence: {(simResult.similarityScore * 100).toFixed(1)}%)
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  No significant duplicates found.
                </Alert>
              )}

              {simResult.similarQuestions && simResult.similarQuestions.length > 0 && (
                <>
                  <Typography variant="subtitle2">Similar Questions in DB:</Typography>
                  <MuiList dense sx={{ bgcolor: '#f5f5f5', borderRadius: 1, mt: 1 }}>
                    {simResult.similarQuestions.map((q, i) => (
                      <ListItem key={i}>
                        <ListItemText primary={q} />
                      </ListItem>
                    ))}
                  </MuiList>
                </>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSimDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Preview Section */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Preview</Typography>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, bgcolor: "background.paper" }}>
          <MathJaxContext config={mathJaxConfig}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {savedJson && savedJson.editorData ? (
                savedJson.editorData.blocks.slice(0, 8).map((b, i) => {
                  const alignment = b.tunes?.alignmentTune?.alignment || "left";
                  const style = { textAlign: alignment };

                  if (b.type === "header") return <h4 key={i} style={style}>{b.data.text}</h4>;
                  if (b.type === "paragraph") return <p key={i} style={style}>{b.data.text}</p>;
                  if (b.type === "image")
                    return (
                      <div key={i} style={style}>
                        <img src={b.data.file?.url || b.data.url} alt="" style={{ maxWidth: "100%" }} />
                      </div>
                    );
                  if (b.type === "table") return <div key={i} style={style} dangerouslySetInnerHTML={{ __html: "<table><!-- table preview omitted --></table>" }} />;
                  return <div key={i} style={style}>{JSON.stringify(b.data).slice(0, 200)}</div>;
                })
              ) : (
                "No saved question yet."
              )}
            </div>
            {savedJson && savedJson.editorData &&
              savedJson.editorData.blocks
                .filter((b) => b.type === "math")
                .map((b, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    {b.data.mathml ? <div dangerouslySetInnerHTML={{ __html: b.data.mathml }} /> : <MathJax>{b.data.display ? `\\[${b.data.latex}\\]` : `\\(${b.data.latex}\\)`}</MathJax>}
                  </div>
                ))}
          </MathJaxContext>
        </Paper>
      </Box>
    </Container>
  );
}
