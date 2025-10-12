import React, { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { MathJax, MathJaxContext } from "better-react-mathjax";

function CreateQuestion() {
  // Department criteria
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subcode, setSubcode] = useState("");

  // Questions state
  const [numQuestions, setNumQuestions] = useState(3);
  const [questions, setQuestions] = useState(
    Array(3).fill({ content: "", image: null, mathml: "", latex: "" })
  );

  // Handle changes for each question field
  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  // Handle image upload
  const handleImageUpload = (index, file) => {
    if (file) {
      const updated = [...questions];
      updated[index].image = URL.createObjectURL(file);
      setQuestions(updated);
    }
  };

  // Save questions as JSON
  const saveAsJson = () => {
    const submission = {
      academicYear,
      semester,
      subcode,
      questions,
    };
    const blob = new Blob([JSON.stringify(submission, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        🧾 Create Question Page
      </h1>

      {/* 🏛️ Department Criteria Section */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          background: "#f9f9f9",
        }}
      >
        <h3>Department Criteria Section</h3>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "15px" }}>
          <div>
            <label>Academic Year:</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="">Select AY</option>
              <option>2024-25</option>
              <option>2025-26</option>
              <option>2026-27</option>
            </select>
          </div>

          <div>
            <label>Semester:</label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="">Select Sem</option>
              {[...Array(8)].map((_, i) => (
                <option key={i}>Sem {i + 1}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Subcode:</label>
            <select
              value={subcode}
              onChange={(e) => setSubcode(e.target.value)}
              style={{ marginLeft: "10px", padding: "5px" }}
            >
              <option value="">Select Subcode</option>
              <option>AI701</option>
              <option>CS702</option>
              <option>ML703</option>
            </select>
          </div>
        </div>
      </div>

      {/* 🔢 Number of Questions */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          background: "#f9f9f9",
          marginBottom: "30px",
        }}
      >
        <h3>Input Type Section</h3>
        <label>Enter number of questions:</label>
        <input
          type="number"
          value={numQuestions}
          min="1"
          onChange={(e) => {
            const count = Number(e.target.value);
            setNumQuestions(count);
            setQuestions(
              Array(count).fill({ content: "", image: null, mathml: "", latex: "" })
            );
          }}
          style={{ width: "60px", marginLeft: "10px" }}
        />
      </div>

      {/* 🧮 Question Input Section */}
      <div
        style={{
          border: "1px solid #ccc",
          padding: "20px",
          borderRadius: "8px",
          background: "#f9f9f9",
        }}
      >
        <h3>Question Input Section</h3>

        {questions.map((q, i) => (
          <div
            key={i}
            style={{
              marginBottom: "40px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              background: "white",
            }}
          >
            <h4>Q{i + 1}</h4>

            {/* 📝 Rich Text Editor */}
            <ReactQuill
              theme="snow"
              value={q.content}
              onChange={(value) => handleQuestionChange(i, "content", value)}
              placeholder="Type your question here..."
              style={{ background: "white", borderRadius: "8px" }}
            />

            {/* 📷 Image Upload */}
            <div style={{ marginTop: "15px" }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(i, e.target.files[0])}
              />
              {q.image && (
                <img
                  src={q.image}
                  alt="preview"
                  style={{
                    width: "150px",
                    marginTop: "10px",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>

            {/* 🧮 MathML */}
            <textarea
              rows="2"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "8px",
                borderRadius: "6px",
              }}
              value={q.mathml}
              onChange={(e) =>
                handleQuestionChange(i, "mathml", e.target.value)
              }
              placeholder="<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>"
            />

            {/* 🔢 LaTeX */}
            <input
              type="text"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "8px",
                borderRadius: "6px",
              }}
              value={q.latex}
              onChange={(e) => handleQuestionChange(i, "latex", e.target.value)}
              placeholder="Example: \\frac{a}{b}"
            />

            {/* 👁️ Preview */}
            <div
              style={{
                marginTop: "15px",
                padding: "10px",
                background: "#f0f0f0",
                borderRadius: "6px",
              }}
            >
              <h4>Preview:</h4>
              <div
                dangerouslySetInnerHTML={{ __html: q.content }}
                style={{ marginBottom: "10px" }}
              />
              {q.image && <img src={q.image} alt="preview" width="150" />}
              {q.mathml && (
                <div dangerouslySetInnerHTML={{ __html: q.mathml }} />
              )}
              {q.latex && (
                <MathJaxContext>
                  <MathJax>{`\\(${q.latex}\\)`}</MathJax>
                </MathJaxContext>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 💾 Save Button */}
      <button
        onClick={saveAsJson}
        style={{
          background: "#007bff",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold",
          display: "block",
          margin: "20px auto",
        }}
      >
        Save Questions as JSON
      </button>
    </div>
  );
}

export default CreateQuestion;
