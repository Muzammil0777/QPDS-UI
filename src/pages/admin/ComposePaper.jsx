
// src/pages/admin/ComposePaper.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
    Box, Typography, Button, Paper, TextField, Divider,
    List, ListItem, ListItemText, IconButton, Grid, CircularProgress, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PrintIcon from '@mui/icons-material/Print';
import api from '../../services/api';
import { MathJax, MathJaxContext } from "better-react-mathjax";

// MathJax Config reuse
const mathJaxConfig = {
    loader: { load: ["input/tex", "input/mml", "output/svg"] },
    tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
};

export default function ComposePaper() {
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedQuestionIds = [], subjectId } = location.state || {}; // IDs passed from QuestionBank

    const componentRef = useRef(); // Ref for printing

    const [questions, setQuestions] = useState([]); // Full question objects
    const [loading, setLoading] = useState(true);
    const [paperTitle, setPaperTitle] = useState("Semester End Examination");
    const [subjectName, setSubjectName] = useState("");
    const [duration, setDuration] = useState("3 Hours");
    const [maxMarks, setMaxMarks] = useState("100");

    useEffect(() => {
        if (!selectedQuestionIds.length) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                // 1. Fetch Subject Name
                if (subjectId) {
                    const subRes = await api.get('/api/subjects');
                    const sub = subRes.data.find(s => s.id === subjectId);
                    if (sub) setSubjectName(`${sub.code} - ${sub.name}`);
                }

                // 2. Fetch all questions details
                if (subjectId) {
                    const qRes = await api.get(`/api/questions?subjectId=${subjectId}`);
                    const selected = qRes.data.filter(q => selectedQuestionIds.includes(q.id));
                    setQuestions(selected);
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedQuestionIds, subjectId]);

    // Helpers
    const handleMove = (index, direction) => {
        const newQuestions = [...questions];
        if (direction === 'up' && index > 0) {
            [newQuestions[index], newQuestions[index - 1]] = [newQuestions[index - 1], newQuestions[index]];
        } else if (direction === 'down' && index < newQuestions.length - 1) {
            [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
        }
        setQuestions(newQuestions);
    };

    const handleRemove = (index) => {
        const newQuestions = [...questions];
        newQuestions.splice(index, 1);
        setQuestions(newQuestions);
    };

    const getQuestionText = (editorData) => {
        if (!editorData?.blocks) return "No content";
        return editorData.blocks.map(b => {
            if (b.type === 'paragraph' || b.type === 'header') return b.data.text;
            if (b.type === 'list') return b.data.items.map((it, i) => `${i + 1}. ${it}`).join('<br/>');
            if (b.type === 'math') return `$$${b.data.latex}$$`;
            return "";
        }).join('<br/>');
    };

    const getMarks = (q) => {
        // Marks stored in editorData.marks or top level if strictly mapped (but we mapped to editorData)
        return q.editorData?.marks || "";
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: paperTitle || 'Question Paper',
        onAfterPrint: () => console.log("Print finished"),
    });

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (questions.length === 0) return <Box p={4}><Alert severity="warning">No questions selected.</Alert><Button onClick={() => navigate(-1)}>Go Back</Button></Box>;

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Controls - OUTSIDE the print ref */}
            <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center', width: '100%', maxWidth: '210mm' }}>
                <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print / Save PDF</Button>
                <Button onClick={() => navigate(-1)}>Back to Bank</Button>
            </Box>

            {/* Printable Content Wrapper */}
            <Box
                ref={componentRef}
                sx={{
                    p: 5,
                    width: '210mm',
                    minHeight: '297mm',
                    bgcolor: 'white',
                    boxShadow: 3,
                    color: 'black',
                    '@media print': {
                        boxShadow: 'none',
                        margin: 0,
                    }
                }}
            >
                {/* Paper Header Inputs */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <TextField
                        variant="standard"
                        fullWidth
                        inputProps={{ style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold' } }}
                        placeholder="Institution Name / Paper Title"
                        value={paperTitle}
                        onChange={(e) => setPaperTitle(e.target.value)}
                        sx={{ mb: 1, '& .MuiInput-underline:before': { borderBottom: 'none' } }}
                    />

                    <Typography variant="h6">{subjectName}</Typography>

                    <Grid container justifyContent="space-between" sx={{ mt: 2 }}>
                        <Grid item>
                            Duration: <input
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', fontSize: '1rem', width: '150px' }}
                            />
                        </Grid>
                        <Grid item>
                            Max Marks: <input
                                value={maxMarks}
                                onChange={(e) => setMaxMarks(e.target.value)}
                                style={{ border: 'none', borderBottom: '1px solid #ccc', outline: 'none', fontSize: '1rem', width: '60px' }}
                            />
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 2, borderBottomWidth: 2, borderColor: 'black' }} />
                </Box>

                {/* Questions List */}
                <MathJaxContext config={mathJaxConfig}>
                    <List>
                        {questions.map((q, index) => (
                            <ListItem key={q.id} alignItems="flex-start" sx={{
                                '&:hover .question-actions': { opacity: 1 },
                                position: 'relative',
                                pr: 2, // Less padding needed for print
                                breakInside: 'avoid' // Prevent breaking question in half
                            }}>
                                <Typography variant="body1" sx={{ mr: 1, fontWeight: 'bold' }}>{index + 1}.</Typography>

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
                                    sx={{ margin: 0 }}
                                />

                                {/* Reordering Actions - Needs 'no-print' class OR hide via CSS if inside print ref? 
                                     react-to-print copies styles. We can force hide them with a class.
                                 */}
                                <Box className="question-actions" sx={{
                                    position: 'absolute', right: 0, top: 0,
                                    opacity: 0, transition: 'opacity 0.2s',
                                    bgcolor: '#f5f5f5', borderRadius: 1,
                                    '@media print': { display: 'none' }
                                }}>
                                    <IconButton size="small" onClick={() => handleMove(index, 'up')} disabled={index === 0}>
                                        <ArrowUpwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={() => handleMove(index, 'down')} disabled={index === questions.length - 1}>
                                        <ArrowDownwardIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" color="error" onClick={() => handleRemove(index)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </MathJaxContext>
            </Box>
        </Box>
    );
}

// Add CSS to hide standard inputs borders in print if needed, or rely on browser print style.
// Best approach is swap input for span in print media query but simple styling works for MVP.
