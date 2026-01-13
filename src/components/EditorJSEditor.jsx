// src/components/EditorJSEditor.js
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { createReactEditorJS } from "react-editor-js";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Table from "@editorjs/table";
import ImageTool from "@editorjs/image";
import EditorJsToHtml from "editorjs-html";

// Simple MathTool - same basic one used earlier (keeps LaTeX)
class MathTool {
  constructor({ data }) {
    this.data = { latex: (data && data.latex) || "", display: (data && data.display) !== undefined ? data.display : true };
    this.wrapper = null;
  }
  static get toolbox() { return { title: "Math", icon: "∑" }; }
  render() {
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add("ce-math-tool");
    const ta = document.createElement("textarea");
    ta.placeholder = "Enter LaTeX (e.g. \\frac{a}{b})";
    ta.value = this.data.latex || "";
    ta.className = "ce-math-textarea";
    const displayRow = document.createElement("div");
    displayRow.className = "ce-math-display-row";
    const displayLabel = document.createElement("label");
    displayLabel.textContent = "Display ";
    const displayCheckbox = document.createElement("input");
    displayCheckbox.type = "checkbox";
    displayCheckbox.checked = this.data.display;
    displayLabel.appendChild(displayCheckbox);
    displayRow.appendChild(displayLabel);
    const preview = document.createElement("div");
    preview.className = "ce-math-preview";
    preview.innerHTML = this._renderLatexToHtml(this.data.latex, this.data.display);
    ta.addEventListener("input", () => {
      this.data.latex = ta.value;
      preview.innerHTML = this._renderLatexToHtml(ta.value, displayCheckbox.checked);
      this._typesetMath(preview);
    });
    displayCheckbox.addEventListener("change", () => {
      this.data.display = displayCheckbox.checked;
      preview.innerHTML = this._renderLatexToHtml(ta.value, displayCheckbox.checked);
      this._typesetMath(preview);
    });
    this.wrapper.appendChild(ta);
    this.wrapper.appendChild(displayRow);
    this.wrapper.appendChild(preview);
    setTimeout(() => this._typesetMath(preview), 50);
    return this.wrapper;
  }
  save() { return { latex: this.data.latex || "", display: !!this.data.display }; }
  _renderLatexToHtml(latex, display) { if (!latex) return "<div class='ce-math-empty'>No equation</div>"; return display ? `\\[${latex}\\]` : `\\(${latex}\\)`; }
  _typesetMath(container) { try { if (window && window.MathJax && window.MathJax.typesetPromise) window.MathJax.typesetPromise([container]).catch(()=>{}); } catch(e) {} }
  static get isReadOnlySupported() { return true; }
}

// Create Editor.js tools config factory (uses uploadUrl from props)
const createTools = (uploadUrl) => ({
  header: Header,
  list: List,
  table: Table,
  image: {
    class: ImageTool,
    config: {
      uploader: {
        async uploadByFile(file) {
          const form = new FormData();
          form.append("upload", file);
          const res = await fetch(uploadUrl || "/api/upload", { method: "POST", body: form });
          if (!res.ok) throw new Error("Upload failed");
          const data = await res.json();
          return { success: 1, file: { url: data.url } };
        },
      },
    },
  },
  math: MathTool,
});

const ReactEditorJS = createReactEditorJS();
const editorJsToHtml = EditorJsToHtml(); // factory

// ForwardRef so parent can call .save() or .clear()
const EditorJSEditor = forwardRef(({ onInitialize, onChange, defaultValue, uploadUrl }, ref) => {
  const instanceRef = useRef(null);

  const handleInitialize = useCallback((instance) => {
    instanceRef.current = instance;
    if (onInitialize) onInitialize(instance);
  }, [onInitialize]);

  // Hook up onChange via editor.save() on demand (react-editor-js doesn't have a continuous onChange)
  const saveToParent = useCallback(async () => {
    if (!instanceRef.current) return null;
    const data = await instanceRef.current.save();
    if (onChange) onChange(data);
    return data;
  }, [onChange]);

  // expose imperative methods
  useImperativeHandle(ref, () => ({
    save: async () => {
      return await saveToParent();
    },
    clear: async () => {
      if (!instanceRef.current) return;
      if (typeof instanceRef.current.clear === "function") {
        await instanceRef.current.clear();
      } else if (instanceRef.current.blocks && instanceRef.current.blocks.clear) {
        await instanceRef.current.blocks.clear();
      }
    },
    getInstance: () => instanceRef.current,
    toHtml: (json) => {
      try {
        const blocks = editorJsToHtml.parse(json || {});
        return blocks.map(b => b).join("");
      } catch (e) {
        return "";
      }
    }
  }), [saveToParent]);

  return (
    <div className="editor-shell">
      <ReactEditorJS
        onInitialize={handleInitialize}
        tools={createTools(uploadUrl)}
        placeholder="Type '/' for blocks — add text, lists, tables, images, Math..."
        defaultValue={defaultValue}
      />
    </div>
  );
});

export default EditorJSEditor;
