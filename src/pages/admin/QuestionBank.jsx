
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, TextField, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Checkbox, FormControlLabel, Switch, Chip, Pagination
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
    
    // Pagination States
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState("");
    const [aiDifficulty, setAiDifficulty] = useState("MEDIUM");
    const [aiMarks, setAiMarks] = useState(100);
    const [aiLoading, setAiLoading] = useState(false);

    const [targetMarks, setTargetMarks] = useState(100);
    const [validationResult, setValidationResult] = useState(null);

    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    const filteredQuestions = questions; // Server handles filtering

    const [debouncedCreator, setDebouncedCreator] = useState('');
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCreator(filterCreator);
        }, 500);
        return () => clearTimeout(handler);
    }, [filterCreator]);

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchQuestions(selectedSubject, 1);
            setPage(1);
        } else {
            setQuestions([]);
        }
    }, [selectedSubject, includeUsed, filterDifficulty, filterSource, debouncedCreator]);

    useEffect(() => {
        if (selectedQuestions.length === 0) {
            setValidationResult(null);
            return;
        }
        const validateDraft = async () => {
            try {
                const res = await api.post('/api/papers/validate-draft', {
                    questionIds: selectedQuestions,
                    totalMarks: Number(targetMarks) || 0
                });
                setValidationResult(res.data);
            } catch (err) {
                console.error("Validation check failed", err);
            }
        };
        const timeoutId = setTimeout(() => validateDraft(), 500);
        return () => clearTimeout(timeoutId);
    }, [selectedQuestions, targetMarks]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/api/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async (subId, curPage = page) => {
        try {
            let url = `/api/questions?subjectId=${subId}&includeUsed=${includeUsed}&page=${curPage}&limit=${limit}`;
            if (filterDifficulty) url += `&difficulty=${filterDifficulty}`;
            if (filterSource) url += `&source=${filterSource}`;
            if (debouncedCreator) url += `&creatorName=${encodeURIComponent(debouncedCreator)}`;
            
            const res = await api.get(url);
            
            // Backend returns pagination dict or fallback flat array
            if (res.data.questions) {
                setQuestions(res.data.questions);
                setTotalQuestions(res.data.total);
                setTotalPages(res.data.pages);
            } else {
                // Backward compatibility fallback
                setQuestions(res.data);
                setTotalQuestions(res.data.length);
                setTotalPages(1);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        try {
            await api.delete(`/api/questions/${confirmDelete}`);
            setNotification({ open: true, message: 'Question deleted successfully', severity: 'success' });
            fetchQuestions(selectedSubject, page);
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
        if (!aiMarks) return;
        setAiLoading(true);
        try {
            const res = await api.post('/api/papers/auto-generate', {
                subjectId: selectedSubject,
                totalMarks: Number(aiMarks),
                difficulty: aiDifficulty
            });
            setNotification({ open: true, message: 'AI Question Paper generated successfully!', severity: 'success' });
            setGenerateDialogOpen(false);
            
            // Navigate directly to compose page with the new paper
            navigate('/admin/compose-paper', {
                state: { paperId: res.data.paperId, subjectId: selectedSubject }
            });
        } catch(err) {
            setNotification({ open: true, message: 'Failed to generate AI question paper: ' + (err.response?.data?.error || err.message), severity: 'error' });
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
                        <Box sx={{ ml: 'auto', display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => setGenerateDialogOpen(true)}
                            >
                                Generate AI Question Paper
                            </Button>
                            {selectedQuestions.length > 0 && (
                                <>
                                    <TextField 
                                        label="Target Marks" 
                                        type="number" 
                                        size="small" 
                                        sx={{ width: 100 }}
                                        value={targetMarks}
                                        onChange={(e) => setTargetMarks(e.target.value)}
                                    />
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleCompose}
                                    >
                                        Compose Paper ({selectedQuestions.length})
                                    </Button>
                                </>
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

            {/* Validation Panel */}
            {selectedSubject && selectedQuestions.length > 0 && validationResult && validationResult.details && (
                <Card sx={{ p: 2, mb: 3, width: '100%', bgcolor: validationResult.valid ? '#e8f5e9' : '#ffebee' }}>
                    <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>📊 Live Question Paper Status</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        <Box>
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
                        </Box>
                        <Box>
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
                        </Box>
                    </Box>
                </Card>
            )}

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
                {totalPages > 1 && (
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                        <Pagination 
                            count={totalPages} 
                            page={page} 
                            onChange={(e, val) => {
                                setPage(val);
                                fetchQuestions(selectedSubject, val);
                            }} 
                            color="primary"
                        />
                    </Box>
                )}
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
                <DialogTitle>Generate AI Question Paper</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        The AI will select the best subset of questions from your Question Bank that match exactly the Target Marks and strictly satisfy the Difficulty (40/30/30) and Bloom's Taxonomy rules.
                    </Typography>
                    <TextField 
                        label="Target Total Marks" 
                        type="number" 
                        fullWidth 
                        value={aiMarks} 
                        onChange={(e) => setAiMarks(Number(e.target.value))}
                    />
                    <TextField 
                        select 
                        label="Target Difficulty (for flexible slots)" 
                        fullWidth 
                        value={aiDifficulty} 
                        onChange={(e) => setAiDifficulty(e.target.value)}
                    >
                        <MenuItem value="EASY">EASY</MenuItem>
                        <MenuItem value="MEDIUM">MEDIUM</MenuItem>
                        <MenuItem value="HARD">HARD</MenuItem>
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleAIGenerate} variant="contained" color="primary" disabled={aiLoading || !aiMarks}>
                        {aiLoading ? "Generating..." : "Generate Paper"}
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
