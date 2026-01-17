// src/pages/CreateQuestion.js
import React, { useEffect, useRef, useState } from "react";
import { TextField, MenuItem } from '@mui/material';
import EditorJS from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import Checklist from "@editorjs/checklist";
import ImageTool from "@editorjs/image";
import { MathJax, MathJaxContext } from "better-react-mathjax";
import api from "../../services/api";
import "./createQuestion.css";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Alert, List as MuiList, ListItem, ListItemText } from '@mui/material';

/**
 * Helper: safely destroy EditorJS instance without assuming destroy() returns a Promise.
 */
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

/* --------------------
   MathTool: accepts LaTeX or MathML input.
   Stores { latex: string, mathml: string, display: boolean }
   -------------------- */
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
      icon:
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h6" stroke="currentColor" stroke-width="2"/><path d="M15 12h6" stroke="currentColor" stroke-width="2"/><path d="M8 6l8 12" stroke="currentColor" stroke-width="2"/></svg>',
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
    textarea.placeholder = "Enter LaTeX (\\frac{a}{b}) or MathML (<math>...)</math>)";
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
      if (isMathML) return v; // inject MathML directly
      return displayCheckbox.checked ? `\\[${v}\\]` : `\\(${v}\\)`;
    };

    const typeset = () => {
      try {
        if (window && window.MathJax && window.MathJax.typesetPromise) {
          window.MathJax.typesetPromise([preview]).catch(() => { });
        }
      } catch (e) {
        // ignore
      }
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

    latexBtn.addEventListener("click", () => {
      const current = this.data.latex || this.data.mathml || "";
      textarea.value = current;
      textarea.focus();
    });

    mathmlBtn.addEventListener("click", () => {
      const current = this.data.mathml || this.data.latex || "";
      textarea.value = current;
      textarea.focus();
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

/* --------------------
   Editor tools config
   -------------------- */
import AlignmentTuneTool from "editorjs-text-alignment-blocktune";
import Paragraph from "@editorjs/paragraph";

/* --------------------
   Editor tools config
   -------------------- */
const tools = {
  alignmentTune: {
    class: AlignmentTuneTool,
    config: {
      default: "left",
      blocks: {
        header: "center",
        list: "right",
      },
    },
  },
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
    tunes: ["alignmentTune"],
  },
  header: {
    class: Header,
    tunes: ["alignmentTune"],
  },
  list: {
    class: List,
    tunes: ["alignmentTune"],
  },
  // checklist: {
  //   class: Checklist,
  //   inlineToolbar: true,
  //   tunes: ["alignmentTune"],
  // },
  table: {
    class: Table,
    tunes: ["alignmentTune"],
  },
  image: {
    class: ImageTool,
    tunes: ["alignmentTune"],
    config: {
      uploader: {
        // Convert image to Base64 for storage in JSON
        async uploadByFile(file) {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                success: 1,
                file: {
                  url: e.target.result,
                },
              });
            };
            reader.readAsDataURL(file);
          });
        },
      },
    },
  },
  math: {
    class: MathTool,
    tunes: ["alignmentTune"],
  },
};

/* --------------------
   Main component
   -------------------- */
export default function CreateQuestion() {
  const editorInstanceRef = useRef(null);
  const [savedJson, setSavedJson] = useState(null);

  const [mySubjects, setMySubjects] = useState([]);
  const [availableCOs, setAvailableCOs] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedCO, setSelectedCO] = useState("");
  const [marks, setMarks] = useState(5);
  const [difficulty, setDifficulty] = useState("Medium");

  // Similarity Check State
  const [checking, setChecking] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [openSimDialog, setOpenSimDialog] = useState(false);

  useEffect(() => {
    // Fetch assigned subjects
    api.get('/faculty/my-subjects')
      .then(res => setMySubjects(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      api.get(`/api/subjects/${selectedSubject}/course-outcomes`)
        .then(res => {
          console.log("Fetched COs for subject:", res.data);
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
    if (editorInstanceRef.current) return; // Prevent double init

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
        console.info("[CreateQuestion] Editor ready");
        editorInstanceRef.current = editor;
      },
      onChange: async () => {
        // Optional: Auto-save or debug logging
      }
    });

    return () => {
      // Cleanup function
      if (editorInstanceRef.current && typeof editorInstanceRef.current.destroy === 'function') {
        // We can't await in cleanup, but we can fire and forget, catching errors
        editorInstanceRef.current.destroy().catch(e => console.warn("Destroy error", e));
        editorInstanceRef.current = null;
      }
    };
  }, []);

  const handleSave = async () => {
    if (!editorInstanceRef.current) return alert("Editor not ready");
    if (!selectedSubject || !selectedCO) {
      return alert("Please select Subject and Course Outcome.");
    }
    if (!marks) return alert("Please enter marks.");

    try {
      const content = await editorInstanceRef.current.save();
      const payload = {
        subjectId: selectedSubject,
        courseOutcomeId: selectedCO,
        marks: parseInt(marks),
        difficulty: difficulty,
        editorData: content,
      };

      console.log("Sending payload:", payload);

      const response = await api.post("/api/questions", payload);

      setSavedJson(response.data);
      alert("Question saved successfully to database!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handleClear = async () => {
    const inst = editorInstanceRef.current;
    if (!inst) {
      alert("Editor not ready");
      return;
    }
    try {
      if (inst.blocks && typeof inst.blocks.clear === "function") {
        await inst.blocks.clear();
      } else if (typeof inst.clear === "function") {
        await inst.clear();
      } else {
        // fallback: destroy safely and reload page to re-init
        safeDestroyEditorInstance(inst);
        window.location.reload();
        return;
      }
      setSavedJson(null);
    } catch (e) {
      console.warn("Clear failed, reloading:", e);
      safeDestroyEditorInstance(inst);
      window.location.reload();
    }
  };

  // MathJax config for preview
  const mathJaxConfig = {
    loader: { load: ["input/tex", "input/mml", "output/svg"] },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
  };

  const handleCheckSimilarity = async () => {
    if (!editorInstanceRef.current) return;
    if (!selectedSubject) return alert("Please select a subject first.");

    setChecking(true);
    try {
      const content = await editorInstanceRef.current.save();
      // Extract text
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
      alert('Failed to check similarity: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1100, margin: "auto" }}>
      <h1>Create Question</h1>

      <div
        style={{
          border: "1px solid #eef2f6",
          padding: 12,
          borderRadius: 8,
          marginBottom: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <label>
          Subject:
          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ marginLeft: 8, padding: 4 }}>
            <option value="">Select Subject</option>
            {mySubjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.code} - {sub.name}</option>
            ))}
          </select>
        </label>

        <label>
          Course Outcome:
          <select value={selectedCO} onChange={(e) => setSelectedCO(e.target.value)} style={{ marginLeft: 8, padding: 4 }}>
            <option value="">Select CO</option>
            {availableCOs.map(co => (
              <option key={co.id} value={co.id}>{co.coCode} - {co.description}</option>
            ))}
          </select>
        </label>
      </div>

      <div style={{
        border: "1px solid #eef2f6",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
        display: "flex",
        gap: 12,
        alignItems: "center",
        flexWrap: "wrap",
        background: "#fafafa"
      }}>
        <TextField
          label="Marks"
          type="number"
          size="small"
          value={marks}
          onChange={(e) => setMarks(e.target.value)}
          style={{ width: 100 }}
        />
        <TextField
          select
          label="Difficulty"
          size="small"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{ width: 150 }}
        >
          <MenuItem value="Easy">Easy</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="Hard">Hard</MenuItem>
        </TextField>
      </div>

      <div id={holderId.current} style={{ border: "1px solid #e6e9ef", borderRadius: 8, minHeight: 360, padding: 12, background: "#fff" }}></div>

      <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
        <button onClick={handleSave} style={{ background: "#2563eb", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 6 }}>
          Save Question
        </button>
        <button onClick={handleCheckSimilarity} disabled={checking} style={{ background: "#7c3aed", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 6 }}>
          {checking ? 'Checking...' : 'Check Similarity'}
        </button>
        <button onClick={handleClear} style={{ background: "#f6f6f6", color: "#333", padding: "8px 14px", border: "none", borderRadius: 6 }}>
          Clear
        </button>
      </div>

      <Dialog open={openSimDialog} onClose={() => setOpenSimDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Similarity Check Result</DialogTitle>
        <DialogContent dividers>
          {simResult && (
            <div>
              {simResult.isDuplicate ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Potential Duplicate Detected! (Confidence: {(simResult.confidence * 100).toFixed(1)}%)
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

      <div style={{ marginTop: 18 }}>
        <h3>Preview</h3>
        <div style={{ padding: 12, background: "#fafafa", minHeight: 80, borderRadius: 6 }}>
          <MathJaxContext config={mathJaxConfig}>
            <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {savedJson && savedJson.editorData ? (
                // naive preview: show first few blocks textually; math blocks rendered below
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
                  if (b.type === "math") {
                    // handled below separately
                    return <div key={i} style={style} />;
                  }
                  return <div key={i} style={style}>{JSON.stringify(b.data).slice(0, 200)}</div>;
                })
              ) : (
                "No saved payload yet."
              )}
            </div>

            {/* Render math blocks explicitly */}
            {savedJson && savedJson.editorData &&
              savedJson.editorData.blocks
                .filter((b) => b.type === "math")
                .map((b, idx) => (
                  <div key={idx} style={{ marginTop: 8 }}>
                    {b.data.mathml ? <div dangerouslySetInnerHTML={{ __html: b.data.mathml }} /> : <MathJax>{b.data.display ? `\\[${b.data.latex}\\]` : `\\(${b.data.latex}\\)`}</MathJax>}
                  </div>
                ))}
          </MathJaxContext>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h3>Saved payload (inspectable)</h3>
        <pre style={{ maxHeight: 260, overflow: "auto", background: "#0b0b0b", color: "#eee", padding: 12 }}>{savedJson ? JSON.stringify(savedJson, null, 2) : "No saved payload yet."}</pre>
      </div>
    </div>
  );
}
