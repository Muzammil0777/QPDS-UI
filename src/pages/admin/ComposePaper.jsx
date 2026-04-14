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
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [finalizing, setFinalizing] = useState(false);
    
    const [paperTitle, setPaperTitle] = useState("Semester End Examination");
    const [subjectName, setSubjectName] = useState("");
    const [duration, setDuration] = useState("3 Hours");
    const [maxMarks, setMaxMarks] = useState("100");
    
    const [openAddModal, setOpenAddModal] = useState(false);
    const [openReplaceModal, setOpenReplaceModal] = useState({ open: false, oldQuestionId: null });
    const [bankQuestions, setBankQuestions] = useState([]);
    
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
            setQuestions(res.data.questions || []);
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

    const handleDragEnd = async (result) => {
        if (!result.destination || isFinalized) return;
        if (result.destination.index === result.source.index) return;

        const items = Array.from(questions);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setQuestions(items);

        try {
            await api.put(`/api/papers/${paperId}/reorder`, {
                orderedQuestionIds: items.map(q => q.id)
            });
        } catch (err) {
            console.error("Reorder failed", err);
            fetchPaperDetails(); // Revert
        }
    };

    const handleRemove = async (questionId) => {
        if (isFinalized) return;
        try {
            await api.delete(`/api/papers/${paperId}/remove-question/${questionId}`);
            setQuestions(questions.filter(q => q.id !== questionId));
        } catch (err) {
            console.error("Failed to remove question", err);
            alert("Failed to remove question: " + err.response?.data?.error);
        }
    };

    const handleFinalize = async () => {
        if (!window.confirm("Are you sure? Once finalized, the paper cannot be edited.")) return;
        setFinalizing(true);
        try {
            await api.put(`/api/papers/${paperId}/finalize`);
            alert('Paper finalized successfully! Usages logged permanently.');
            fetchPaperDetails();
        } catch (err) {
            console.error('Finalize fail:', err);
            alert('Failed to finalize paper.');
        } finally {
            setFinalizing(false);
        }
    };

    const fetchBankQuestions = async () => {
        try {
            const res = await api.get(`/api/questions?subjectId=${subjectId}&includeUsed=false`);
            setBankQuestions(res.data);
        } catch (err) {
            console.error("Failed to fetch bank questions:", err);
        }
    };

    const handleOpenAddModal = () => {
        fetchBankQuestions();
        setOpenAddModal(true);
    };

    const handleOpenReplaceModal = (oldQId) => {
        fetchBankQuestions();
        setOpenReplaceModal({ open: true, oldQuestionId: oldQId });
    };

    const handleExecuteAdd = async (newQuestionId) => {
        try {
            await api.post(`/api/papers/${paperId}/add-question`, { questionId: newQuestionId });
            setOpenAddModal(false);
            fetchPaperDetails();
        } catch (err) {
            alert("Failed to add question: " + (err.response?.data?.error || err.message));
        }
    };

    const handleExecuteReplace = async (newQuestionId) => {
        try {
            await api.put(`/api/papers/${paperId}/replace-question`, {
                oldQuestionId: openReplaceModal.oldQuestionId,
                newQuestionId: newQuestionId
            });
            setOpenReplaceModal({ open: false, oldQuestionId: null });
            fetchPaperDetails();
        } catch (err) {
            alert("Failed to replace question: " + (err.response?.data?.error || err.message));
        }
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

    const getMarks = (q) => q.editorData?.marks || "";

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: paperTitle || 'Question Paper',
    });

    if (loading) return <Box p={4} display="flex" justifyContent="center"><CircularProgress /></Box>;
    if (!paperData) return <Box p={4}><Alert severity="error">Failed to load local Paper Draft context.</Alert><Button onClick={() => navigate(-1)}>Go Back</Button></Box>;

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
                        <Button variant="contained" color="success" onClick={handleFinalize} disabled={finalizing}>
                            {finalizing ? 'Finalizing...' : 'Finalize Paper'}
                        </Button>
                    )}
                    <Button onClick={() => navigate(-1)}>Back</Button>
                </Box>
            </Box>

            <Box
                ref={componentRef}
                sx={{
                    p: 5, width: '210mm', minHeight: '297mm', bgcolor: 'white',
                    boxShadow: 3, color: 'black',
                    '@media print': { boxShadow: 'none', margin: 0, p: 0 }
                }}
            >
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
                        <Droppable droppableId="questionsDropdown">
                            {(provided) => (
                                <List {...provided.droppableProps} ref={provided.innerRef}>
                                    {questions.map((q, index) => (
                                        <Draggable key={q.id} draggableId={q.id} index={index} isDragDisabled={isFinalized}>
                                            {(provided2) => (
                                                <ListItem
                                                    ref={provided2.innerRef}
                                                    {...provided2.draggableProps}
                                                    alignItems="flex-start"
                                                    sx={{
                                                        '&:hover .question-actions': { opacity: 1 },
                                                        position: 'relative', pr: 2, breakInside: 'avoid',
                                                        bgcolor: 'white', mb: 1
                                                    }}
                                                >
                                                    {!isFinalized && (
                                                        <Box {...provided2.dragHandleProps} sx={{ display: 'flex', alignItems: 'center', mr: 2, color: 'text.secondary' }}>
                                                            <DragIndicatorIcon />
                                                        </Box>
                                                    )}
                                                    
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
                                                    />

                                                    {!isFinalized && (
                                                        <Box className="question-actions" sx={{ position: 'absolute', right: 0, top: 0, opacity: 0, transition: '0.2s', bgcolor: '#f1f1f1', borderRadius: 1, display: 'flex', '@media print': { display: 'none' }}}>
                                                            <IconButton size="small" color="primary" onClick={() => handleOpenReplaceModal(q.id)}>
                                                                <SwapHorizIcon />
                                                            </IconButton>
                                                            <IconButton size="small" color="error" onClick={() => handleRemove(q.id)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Box>
                                                    )}
                                                </ListItem>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </List>
                            )}
                        </Droppable>
                    </DragDropContext>
                </MathJaxContext>

                {!isFinalized && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', '@media print': { display: 'none' } }}>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenAddModal}>
                            Add Question from Bank
                        </Button>
                    </Box>
                )}
            </Box>

            <Dialog open={openAddModal || openReplaceModal.open} onClose={() => { setOpenAddModal(false); setOpenReplaceModal({open: false, oldQuestionId: null}); }} maxWidth="md" fullWidth>
                <DialogTitle>{openAddModal ? "Add New Question" : "Replace Question"}</DialogTitle>
                <DialogContent dividers>
                    <List>
                        {bankQuestions.filter(bq => !questions.some(q => q.id === bq.id)).length > 0 ? (
                            bankQuestions.filter(bq => !questions.some(q => q.id === bq.id)).map(bq => (
                                <ListItem key={bq.id} disablePadding sx={{ borderBottom: '1px solid #ddd' }}>
                                    <Box sx={{ py: 1, px: 2, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box sx={{ flex: 1, mr: 2, maxHeight: '60px', overflow: 'hidden' }}>
                                            <div dangerouslySetInnerHTML={{ __html: getQuestionText(bq.editorData) }} />
                                        </Box>
                                        <Button variant="contained" size="small" onClick={() => openAddModal ? handleExecuteAdd(bq.id) : handleExecuteReplace(bq.id)}>
                                            Select
                                        </Button>
                                    </Box>
                                </ListItem>
                            ))
                        ) : (
                            <Typography sx={{ p: 2, textAlign: 'center' }}>No unused questions available in bank for this subject.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setOpenAddModal(false); setOpenReplaceModal({open: false, oldQuestionId: null}); }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
