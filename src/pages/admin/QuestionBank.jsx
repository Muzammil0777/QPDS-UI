
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Card, CardContent, TextField, MenuItem,
    Table, TableBody, TableCell, TableHead, TableRow,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, Snackbar, Checkbox
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
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            fetchQuestions(selectedSubject);
        } else {
            setQuestions([]);
        }
    }, [selectedSubject]);

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
            const res = await api.get(`/api/questions?subjectId=${subId}`);
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

    const handleCompose = () => {
        // Navigate to compose page with selected question IDs
        // We can pass state through navigation
        navigate('/admin/compose-paper', { state: { selectedQuestionIds: selectedQuestions, subjectId: selectedSubject } });
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
                    {/* Could add Semester/Year filter here to filter the subjects list above if needed */}
                    {selectedQuestions.length > 0 && (
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleCompose}
                            sx={{ ml: 'auto' }}
                        >
                            Compose Paper ({selectedQuestions.length})
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={questions.length > 0 && selectedQuestions.length === questions.length}
                                    indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedQuestions(questions.map(q => q.id));
                                        else setSelectedQuestions([]);
                                    }}
                                />
                            </TableCell>
                            <TableCell width="60%">Question Preview</TableCell>
                            <TableCell>Type/CO</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions.length > 0 ? questions.map((q) => (
                            <TableRow key={q.id}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedQuestions.includes(q.id)}
                                        onChange={() => handleSelectQuestion(q.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div dangerouslySetInnerHTML={{ __html: getPreviewText(q.editorData) }} />
                                </TableCell>
                                <TableCell>
                                    {/* Backend doesn't send explicit Type (Short/Long) in Question Model yet, 
                                       usually inferred or stored in editorData? 
                                       Actually, currently we don't store Type explicitly in model. 
                                       We can show CO instead if available.
                                   */}
                                    {q.courseOutcomeId ? "Mapped to CO" : "General"}
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
                                <TableCell colSpan={3} align="center">
                                    {selectedSubject ? "No questions found for this subject." : "Please select a subject."}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    Are you sure you want to delete this question? This action cannot be undone.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
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
