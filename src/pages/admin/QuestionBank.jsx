
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, TextField, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Checkbox, FormControlLabel, Switch, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // Placeholder for future use
import api from '../../services/api';

export default function QuestionBank() {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [semester, setSemester] = useState(''); // Optional filter if subjects list is huge
    // Assuming 'subjects' list contains semester info.

    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [includeUsed, setIncludeUsed] = useState(false);
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterSource, setFilterSource] = useState('');
    const [filterCreator, setFilterCreator] = useState('');

    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiDifficulty, setAiDifficulty] = useState("MEDIUM");
    const [aiMarks, setAiMarks] = useState(5);
    const [aiLoading, setAiLoading] = useState(false);

    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const filteredQuestions = questions.filter(q => {
        if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
        if (filterSource && q.source !== filterSource) return false;
        if (filterCreator && !q.creatorName?.toLowerCase().includes(filterCreator.toLowerCase())) return false;
        return true;
    });

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchQuestions(selectedSubject);
        } else {
            setQuestions([]);
        }
    }, [selectedSubject, includeUsed]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/api/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async (subId) => {
        try {
            const res = await api.get(`/api/questions?subjectId=${subId}&includeUsed=${includeUsed}`);
            setQuestions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/api/questions/${confirmDelete}`);
            setNotification({ open: true, message: 'Question deleted successfully', severity: 'success' });
            fetchQuestions(selectedSubject);
        } catch (err) {
            setNotification({ open: true, message: 'Failed to delete question', severity: 'error' });
        } finally {
            setConfirmDelete(null);
        }
    };

    const handleSelectQuestion = (id) => {
        setSelectedQuestions(prev => {
            if (prev.includes(id)) {
                return prev.filter(qId => qId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    const handleCompose = async () => {
        try {
            const res = await api.post('/api/papers/draft', {
                subjectId: selectedSubject,
                title: "New Draft Exam",
                initialQuestionIds: selectedQuestions
            });
            navigate('/admin/compose-paper', {
                state: { paperId: res.data.id, subjectId: selectedSubject }
            });
        } catch(err) {
            console.error(err);
            setNotification({ open: true, message: 'Failed to generate draft. Ensure backend is running and migrated.', severity: 'error' });
        }
    };

    const handleAIGenerate = async () => {
        if (!aiTopic.trim()) return;
        setAiLoading(true);
        try {
            await api.post('/api/ai/generate-question', {
                subjectId: selectedSubject,
                topic: aiTopic,
                difficulty: aiDifficulty,
                marks: aiMarks
            });
            setNotification({ open: true, message: 'AI Question generated successfully!', severity: 'success' });
            setGenerateDialogOpen(false);
            setAiTopic("");
            fetchQuestions(selectedSubject);
        } catch(err) {
            setNotification({ open: true, message: 'Failed to generate AI question: ' + (err.response?.data?.error || err.message), severity: 'error' });
        } finally {
            setAiLoading(false);
        }
    };

    // Helper to extract text from EditorJS blocks safely
    const getPreviewText = (editorData) => {
        if (!editorData?.blocks) return "No content";
        const firstBlock = editorData.blocks.find(b => b.type === 'paragraph' || b.type === 'header');
        if (firstBlock) return firstBlock.data.text;
        // Fallback for list
        const listBlock = editorData.blocks.find(b => b.type === 'list');
        if (listBlock && listBlock.data.items.length > 0) return listBlock.data.items[0];

        return "Complex Content (Image/Math)";
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Question Bank Management</Typography>

            <Card sx={{ mb: 4 }}>
                <CardContent sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        select
                        label="Select Subject"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        fullWidth
                    >
                        {subjects.map((sub) => (
                            <MenuItem key={sub.id} value={sub.id}>
                                {sub.code} - {sub.name} (Sem {sub.semester})
                            </MenuItem>
                        ))}
                    </TextField>
                    
                    <FormControlLabel
                        control={<Switch checked={includeUsed} onChange={(e) => setIncludeUsed(e.target.checked)} />}
                        label="Include recently used questions"
                    />

                    {/* Could add Semester/Year filter here to filter the subjects list above if needed */}
                    {selectedSubject && (
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setGenerateDialogOpen(true)}
                            >
                                Generate AI Question
                            </Button>
                            {selectedQuestions.length > 0 && (
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleCompose}
                                >
                                    Compose Paper ({selectedQuestions.length})
                                </Button>
                            )}
                        </Box>
                    )}
                </CardContent>
                {selectedSubject && (
                    <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 0 }}>
                        <TextField
                            select
                            size="small"
                            label="Filter Difficulty"
                            value={filterDifficulty}
                            onChange={(e) => setFilterDifficulty(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="EASY">EASY</MenuItem>
                            <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                            <MenuItem value="HARD">HARD</MenuItem>
                        </TextField>
                        <TextField
                            select
                            size="small"
                            label="Filter Source"
                            value={filterSource}
                            onChange={(e) => setFilterSource(e.target.value)}
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="AI">AI</MenuItem>
                            <MenuItem value="MANUAL">MANUAL</MenuItem>
                        </TextField>
                        <TextField
                            size="small"
                            label="Search Creator"
                            value={filterCreator}
                            onChange={(e) => setFilterCreator(e.target.value)}
                            sx={{ minWidth: 200 }}
                        />
                    </CardContent>
                )}
            </Card>

            <Card>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={filteredQuestions.length > 0 && selectedQuestions.length === filteredQuestions.length}
                                    indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < filteredQuestions.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedQuestions(filteredQuestions.map(q => q.id));
                                        else setSelectedQuestions([]);
                                    }}
                                />
                            </TableCell>
                            <TableCell width="40%">Question Preview</TableCell>
                            <TableCell>Type/CO</TableCell>
                            <TableCell>Difficulty</TableCell>
                            <TableCell>Source</TableCell>
                            <TableCell>Creator</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredQuestions.length > 0 ? filteredQuestions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedQuestions.includes(q.id)}
                                        onChange={() => handleSelectQuestion(q.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div dangerouslySetInnerHTML={{ __html: getPreviewText(q.editorData) }} />
                                    {q.isRecentlyUsed && (
                                        <Chip label="Recently Used" size="small" color="error" sx={{ mt: 1, fontWeight: 'bold' }} />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {q.coCode ? q.coCode : "General"}
                                </TableCell>
                                <TableCell>
                                    <Box sx={{
                                        px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', fontSize: '0.85rem', fontWeight: 'bold',
                                        backgroundColor: q.difficulty === 'EASY' ? '#e8f5e9' : q.difficulty === 'MEDIUM' ? '#fff3e0' : '#ffebee',
                                        color: q.difficulty === 'EASY' ? '#2e7d32' : q.difficulty === 'MEDIUM' ? '#ed6c02' : '#c62828'
                                    }}>
                                        {q.difficulty}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <Box sx={{
                                        px: 1, py: 0.5, borderRadius: 1, display: 'inline-block', fontSize: '0.85rem', fontWeight: 'bold',
                                        backgroundColor: q.source === 'AI' ? '#e3f2fd' : '#f5f5f5',
                                        color: q.source === 'AI' ? '#1565c0' : '#616161'
                                    }}>
                                        {q.source}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {q.creatorName || "Unknown"}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => navigate(`/admin/edit-question/${q.id}`)} color="primary">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton color="error" onClick={() => setConfirmDelete(q.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    {selectedSubject ? "No questions match your filters or found for this subject." : "Please select a subject."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this question? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate AI Question</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <TextField 
                        label="Topic or Keywords" 
                        fullWidth 
                        value={aiTopic} 
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="e.g. Laws of Thermodynamics"
                    />
                    <TextField 
                        select 
                        label="Difficulty" 
                        fullWidth 
                        value={aiDifficulty} 
                        onChange={(e) => setAiDifficulty(e.target.value)}
                    >
                        <MenuItem value="EASY">EASY</MenuItem>
                        <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                        <MenuItem value="HARD">HARD</MenuItem>
                    </TextField>
                    <TextField 
                        label="Marks" 
                        type="number" 
                        fullWidth 
                        value={aiMarks} 
                        onChange={(e) => setAiMarks(Number(e.target.value))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAIGenerate} variant="contained" color="primary" disabled={aiLoading || !aiTopic.trim()}>
                        {aiLoading ? <CircularProgress size={24} /> : "Generate"}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={() => setNotification({ ...notification, open: false })}
            >
                <Alert severity={notification.severity}>{notification.message}</Alert>
            </Snackbar>
        </Box>
    );
}
