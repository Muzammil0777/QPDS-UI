import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Paper, Box, Typography, Button, TextField, Chip, Divider, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import ImageTool from "@editorjs/image";
import Paragraph from "@editorjs/paragraph";
import AlignmentTuneTool from "editorjs-text-alignment-blocktune";
import api from "../../services/api";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import RateReviewIcon from "@mui/icons-material/RateReview";
import SaveIcon from "@mui/icons-material/Save";

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

export default function ReviewQuestion() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggerAnalysis, setTriggerAnalysis] = useState(0);
  const [bloomAnalysis, setBloomAnalysis] = useState(null);
  
  const [openRevisionDialog, setOpenRevisionDialog] = useState(false);
  const [revisionComments, setRevisionComments] = useState("");

  const editorInstanceRef = useRef(null);
  const holderId = useRef("editorjs-review-" + Math.random().toString(36).slice(2, 9));

  useEffect(() => {
    // Fetch question details
    api.get(`/api/questions/${questionId}`)
      .then(res => {
        setQuestion(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Failed to load question details");
        navigate("/faculty");
      });
  }, [questionId]);

  // Initialize EditorJS
  useEffect(() => {
    if (loading || !question || editorInstanceRef.current) return;

    const editor = new EditorJS({
      holder: holderId.current,
      autofocus: true,
      tools,
      data: question.editorData,
      onReady: () => {
        editorInstanceRef.current = editor;
        setTriggerAnalysis(prev => prev + 1);
      },
      onChange: () => {
        setTriggerAnalysis(prev => prev + 1);
      }
    });

    return () => {
      if (editorInstanceRef.current) {
        safeDestroyEditorInstance(editorInstanceRef.current);
        editorInstanceRef.current = null;
      }
    };
  }, [loading, question]);

  // Debounced live bloom analysis
  useEffect(() => {
    if (loading || !editorInstanceRef.current) return;

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
        if (!text.trim()) return;

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
  }, [triggerAnalysis, loading]);

  const handleUpdateContentOnly = async () => {
    if (!editorInstanceRef.current) return;
    setSaving(true);
    try {
      const content = await editorInstanceRef.current.save();
      await api.put(`/api/questions/${questionId}`, {
        editorData: content
      });
      alert("Changes saved to database successfully.");
    } catch (err) {
      alert("Save failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!editorInstanceRef.current) return;
    setSaving(true);
    try {
      const content = await editorInstanceRef.current.save();
      await api.put(`/api/questions/${questionId}`, {
        editorData: content,
        status: "APPROVED"
      });
      alert("Question approved successfully and promoted to active bank!");
      navigate(`/faculty/subject/${question.subjectId}`);
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleRequestRevisionSubmit = async () => {
    if (!revisionComments.trim()) {
      alert("Please provide revision comments.");
      return;
    }
    setSaving(true);
    try {
      const content = await editorInstanceRef.current.save();
      await api.put(`/api/questions/${questionId}`, {
        editorData: content,
        status: "REVISION_NEEDED",
        reviewComments: revisionComments
      });
      alert("Revision request submitted successfully.");
      setOpenRevisionDialog(false);
      navigate(`/faculty/subject/${question.subjectId}`);
    } catch (err) {
      alert("Submission failed: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Choose color based on detected level
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
      {/* Navigation header */}
      <Box sx={{ mb: 3, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/faculty/subject/${question.subjectId}`)}
          sx={{ fontWeight: 600 }}
        >
          Back to Subject
        </Button>
        <Chip 
          label={`Current Status: ${question.status}`} 
          color={
            question.status === "APPROVED" ? "success" :
            question.status === "PENDING_REVIEW" ? "warning" :
            question.status === "REVISION_NEEDED" ? "error" : "default"
          }
          sx={{ fontWeight: 700 }}
        />
      </Box>

      <Grid container spacing={4}>
        {/* Left: Editor Stem */}
        <Grid item xs={12} md={7.5}>
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 4, borderColor: "divider" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              Evaluate Question Stem
            </Typography>
            <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
              You can modify the wording or format of the question directly in the editor below before confirming review status.
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box 
              id={holderId.current} 
              sx={{ 
                border: "1px solid #eef2f6", 
                borderRadius: 3, 
                minHeight: 340, 
                p: 2, 
                bgcolor: "#fff",
                "& .ce-block": { maxWidth: "100%" }
              }}
            />

            <Box sx={{ mt: 3, display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button 
                variant="outlined" 
                startIcon={<SaveIcon />} 
                onClick={handleUpdateContentOnly}
                disabled={saving}
                sx={{ fontWeight: 600 }}
              >
                Save Edits
              </Button>
              <Button 
                variant="contained" 
                color="primary"
                startIcon={<CheckCircleIcon />} 
                onClick={handleApprove}
                disabled={saving}
                sx={{ fontWeight: 600 }}
              >
                Approve & Promote
              </Button>
              <Button 
                variant="contained" 
                color="error"
                startIcon={<ErrorIcon />} 
                onClick={() => setOpenRevisionDialog(true)}
                disabled={saving}
                sx={{ fontWeight: 600 }}
              >
                Request Revision
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right: Live Taxonomy Panel & Action Suggestions */}
        <Grid item xs={12} md={4.5}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderColor: "divider", bgcolor: "#fcfdfe", height: "100%" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <RateReviewIcon color="primary" /> Bloom's Cognitive Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 3.5 }}>
              Real-time classification based on action verbs detected in the question content.
            </Typography>
            
            {bloomAnalysis ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Level Chip */}
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

                {/* Difficulty Recommendation */}
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

                {/* Action Suggestions */}
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>Analysis & Quality Tips:</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {bloomAnalysis.suggestions.map((s, idx) => (
                      <Alert key={idx} severity="info" icon={false} sx={{ py: 0.5, px: 2, borderRadius: 2, fontSize: "0.825rem", border: "1px solid #e0f2fe", bgcolor: "#f0f9ff", color: "#0369a1" }}>
                        {s}
                      </Alert>
                    ))}
                  </Box>
                </Box>

                <Divider />

                {/* Verb cheat sheet */}
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
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, color: "text.secondary" }}>
                <CircularProgress size={24} sx={{ mb: 2 }} />
                <Typography variant="body2">Analyzing question text...</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Revision Dialog */}
      <Dialog open={openRevisionDialog} onClose={() => setOpenRevisionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Revision</DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please outline the improvements or corrections required by the author to approve this question stem.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            placeholder="E.g., Please use an application verb instead of 'define' to match the CO3 analytical tier, or provide exact numeric boundaries..."
            value={revisionComments}
            onChange={(e) => setRevisionComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenRevisionDialog(false)}>Cancel</Button>
          <Button onClick={handleRequestRevisionSubmit} color="error" variant="contained" sx={{ fontWeight: 600 }}>
            Submit Revision Request
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
