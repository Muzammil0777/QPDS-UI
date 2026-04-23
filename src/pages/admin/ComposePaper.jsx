// src/pages/admin/ComposePaper.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
    Box, Typography, Button, Paper, TextField, Divider,
    List, ListItem, ListItemText, IconButton, Grid, CircularProgress, Alert,
    Chip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
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

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!paperData) return <Box p={4}><Alert severity="error">Failed to load Paper structure.</Alert><Button onClick={() => navigate(-1)}>Go Back</Button></Box>;

    const usedIds = getUsedQuestionIds();

    return (
        <Box sx={{ p: 4, bgcolor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '210mm', mb: 2 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Paper Composer
                    {isFinalized ? (
                        <Chip label="FINALIZED" color="success" sx={{ ml: 2, fontWeight: 'bold' }} />
                    ) : (
                        <Chip label="DRAFT" color="warning" sx={{ ml: 2, fontWeight: 'bold' }} />
                    )}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print PDF</Button>
                    {!isFinalized && (
                        <Button 
                            variant="contained" 
                            color="success" 
                            onClick={handleFinalize} 
                            disabled={finalizing || (validationResult && !validationResult.valid)}
                        >
                            {finalizing ? 'Finalizing...' : 'Finalize Paper'}
                        </Button>
                    )}
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </Box>
            </Box>

            {/* Validation Panel */}
            {!isFinalized && validationResult && validationResult.details && (
                <Paper sx={{ p: 2, mb: 3, width: '100%', maxWidth: '210mm', bgcolor: validationResult.valid ? '#e8f5e9' : '#ffebee' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>📊 Question Paper Status</Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                                {validationResult.details.current_total_marks === validationResult.details.required_total_marks ? '✔' : '❌'} Total Marks: {validationResult.details.current_total_marks}/{validationResult.details.required_total_marks}
                            </Typography>
                            <Typography variant="body2">
                                {validationResult.details.easy_count >= validationResult.details.min_easy ? '✔' : '❌'} Easy Questions: {validationResult.details.easy_count} (Need {validationResult.details.min_easy})
                            </Typography>
                            <Typography variant="body2">
                                {validationResult.details.medium_count >= validationResult.details.min_medium ? '✔' : '❌'} Medium Questions: {validationResult.details.medium_count} (Need {validationResult.details.min_medium})
                            </Typography>
                            <Typography variant="body2">
                                {validationResult.details.hard_count >= validationResult.details.min_hard ? '✔' : '❌'} Hard Questions: {validationResult.details.hard_count} (Need {validationResult.details.min_hard})
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <Typography variant="body2">
                                {validationResult.details.has_low_bloom && validationResult.details.has_medium_bloom && validationResult.details.has_high_bloom ? '✔' : '❌'} Bloom Coverage: 
                                {validationResult.details.has_low_bloom && validationResult.details.has_medium_bloom && validationResult.details.has_high_bloom ? ' OK' : ' Missing Levels'}
                            </Typography>
                            {!validationResult.valid && validationResult.errors.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                    {validationResult.errors.map((e, i) => (
                                        <Typography key={i} variant="caption" color="error" display="block">• {e}</Typography>
                                    ))}
                                </Box>
                            )}
                        </Grid>
                    </Grid>
                </Paper>
            )}

            <Box
                ref={componentRef}
                sx={{
                    p: 5, width: '210mm', minHeight: '297mm', bgcolor: 'white',
                    boxShadow: 3, color: 'black',
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
