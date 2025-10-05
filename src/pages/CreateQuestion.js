import React, { useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

function CreateQuestion() {
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [subcode, setSubcode] = useState("");
  const [inputType, setInputType] = useState("individual");
  const [numQuestions, setNumQuestions] = useState(3);
  const [questions, setQuestions] = useState(
    Array(3).fill({ text: "", image: null, mathml: "", latex: "" })
  );

  const handleQuestionChange = (index, field, value) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleImageUpload = (index, file) => {
    if (file) {
      const updated = [...questions];
      updated[index].image = URL.createObjectURL(file);
      setQuestions(updated);
    }
  };

  const saveAsJson = () => {
    const submission = { academicYear, semester, subcode, inputType, questions };
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
    <div className="page-container">
      <h1>Questions Portal</h1>

      {/* Department Criteria */}
      <div className="card">
        <h3>Department Criteria Section</h3>
        <div className="dropdown-row">
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)}>
            <option value="">Select AY</option>
            <option>2024-25</option>
            <option>2025-26</option>
          </select>

          <select value={semester} onChange={(e) => setSemester(e.target.value)}>
            <option value="">Select Sem</option>
            {[...Array(8)].map((_, i) => (
              <option key={i}>Sem {i + 1}</option>
            ))}
          </select>

          <select value={subcode} onChange={(e) => setSubcode(e.target.value)}>
            <option value="">Select Subcode</option>
            <option>CS701</option>
            <option>AI702</option>
          </select>
        </div>
      </div>

      {/* Input Type */}
      <div className="card">
        <h3>Input Type</h3>
        <label>
          <input
            type="radio"
            value="individual"
            checked={inputType === "individual"}
            onChange={(e) => setInputType(e.target.value)}
          />{" "}
          Individual Input
        </label>
        <label style={{ marginLeft: "20px" }}>
          <input
            type="radio"
            value="bulk"
            checked={inputType === "bulk"}
            onChange={(e) => setInputType(e.target.value)}
          />{" "}
          Bulk Upload
        </label>
        {inputType === "bulk" && <input type="file" style={{ marginLeft: "20px" }} />}
      </div>

      {/* Number of Questions */}
      <div className="card">
        <h3>Input Type Section</h3>
        <label>Enter number of questions:</label>
        <input
          type="number"
          value={numQuestions}
          onChange={(e) => {
            const count = Number(e.target.value);
            setNumQuestions(count);
            setQuestions(
              Array(count).fill({ text: "", image: null, mathml: "", latex: "" })
            );
          }}
        />
      </div>

      {/* Question Input Section */}
      <div className="card">
        <h3>Question Input Section</h3>
        {questions.map((q, i) => (
          <div key={i} className="question-block">
            <h4>Q{i + 1}</h4>
            <textarea
              rows="3"
              value={q.text}
              onChange={(e) => handleQuestionChange(i, "text", e.target.value)}
              placeholder="Enter question text..."
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(i, e.target.files[0])}
            />
            {q.image && <img src={q.image} alt="preview" width="150" />}

            <textarea
              rows="2"
              value={q.mathml}
              onChange={(e) => handleQuestionChange(i, "mathml", e.target.value)}
              placeholder="<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>"
            />

            <input
              type="text"
              value={q.latex}
              onChange={(e) => handleQuestionChange(i, "latex", e.target.value)}
              placeholder="LaTeX: \\frac{a}{b}"
            />

            <div className="preview-box">
              <p>{q.text}</p>
              {q.image && <img src={q.image} alt="preview" width="150" />}
              {q.mathml && (
                <div dangerouslySetInnerHTML={{ __html: q.mathml }} />
              )}
              {q.latex && (
                <MathJaxContext>
                  <MathJax dynamic inline={false}>{`\\(${q.latex}\\)`}</MathJax>
                </MathJaxContext>
              )}
            </div>
          </div>
        ))}
      </div>

      <button className="primary-btn" onClick={saveAsJson}>
        Save as JSON
      </button>
    </div>
  );
}

export default CreateQuestion;
