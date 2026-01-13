
import React, { useState, useEffect } from 'react';
import {
    Typography, Box, TextField, Button, MenuItem,
    Dialog, DialogTitle, DialogContent, DialogActions,
    List, ListItem, ListItemText, Divider, Alert, CircularProgress,
    Card, CardContent, Chip
} from '@mui/material';
import api from '../../services/api';

export default function QuestionPaper() {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [cos, setCos] = useState([]);
    const [selectedCos, setSelectedCos] = useState([]);
    const [difficulty, setDifficulty] = useState('medium');
    const [numShort, setNumShort] = useState(5);
    const [numLong, setNumLong] = useState(3);
    const [saving, setSaving] = useState(false);

    const [loading, setLoading] = useState(false);
    const [generatedPaper, setGeneratedPaper] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const res = await api.get('/api/subjects');
                setSubjects(res.data);
            } catch (err) {
                console.error("Failed to fetch subjects", err);
            }
        };
        fetchSubjects();
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            const fetchCos = async () => {
                try {
                    const res = await api.get(`/api/subjects/${selectedSubject}/course-outcomes`);
                    setCos(res.data);
                } catch (err) {
                    console.error("Failed to fetch COs", err);
                    setCos([]);
                }
            };
            fetchCos();
        } else {
            setCos([]);
        }
    }, [selectedSubject]);

    const handleGenerate = async () => {
        if (!selectedSubject || selectedCos.length === 0) {
            setError("Please select a subject and at least one Course Outcome.");
            return;
        }
        setLoading(true);
        setError('');
        setGeneratedPaper(null);

        try {
            const payload = {
                subjectId: selectedSubject,
                courseOutcomeIds: selectedCos,
                difficulty,
                marksDistribution: {
                    short: parseInt(numShort),
                    long: parseInt(numLong)
                }
            };
            const res = await api.post('/admin/ai/generate-paper', payload);
            setGeneratedPaper(res.data);
            setOpenDialog(true);
        } catch (err) {
            console.error(err);
            setError('Failed to generate paper. Please check settings and API Key.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        const text = `Section A:\n${generatedPaper?.sectionA?.join('\n')}\n\nSection B:\n${generatedPaper?.sectionB?.join('\n')}`;
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const handleSave = async () => {
        if (!generatedPaper) return;
        setSaving(true);
        try {
            // Flatten questions
            const questionsToSave = [
                ...(generatedPaper.sectionA?.map(q => ({ text: q, type: 'short' })) || []),
                ...(generatedPaper.sectionB?.map(q => ({ text: q, type: 'long' })) || [])
            ];

            await api.post('/api/questions/bulk', {
                subjectId: selectedSubject,
                coIds: selectedCos,
                questions: questionsToSave
            });
            alert('Questions saved successfully to Question Bank!');
            setOpenDialog(false);
        } catch (err) {
            console.error(err);
            alert('Failed to save questions');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>AI Question Paper Generator</Typography>

            <Card sx={{ maxWidth: 800, mb: 4 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            select
                            label="Select Subject"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            fullWidth
                        >
                            {subjects.map((sub) => (
                                <MenuItem key={sub.id} value={sub.id}>
                                    {sub.code} - {sub.name}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Select Course Outcomes"
                            value={selectedCos}
                            onChange={(e) => setSelectedCos(e.target.value)}
                            SelectProps={{
                                multiple: true,
                                renderValue: (selected) => (
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {selected.map((value) => {
                                            const co = cos.find(c => c.id === value);
                                            return <Chip key={value} label={co ? co.coCode : value} />;
                                        })}
                                    </Box>
                                )
                            }}
                            fullWidth
                            disabled={!selectedSubject}
                        >
                            {cos.map((co) => (
                                <MenuItem key={co.id} value={co.id}>
                                    {co.coCode} - {co.description}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            label="Difficulty"
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                            fullWidth
                        >
                            <MenuItem value="easy">Easy</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="hard">Hard</MenuItem>
                        </TextField>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="No. of Short Questions"
                                type="number"
                                value={numShort}
                                onChange={(e) => setNumShort(e.target.value)}
                                fullWidth
                            />
                            <TextField
                                label="No. of Long Questions"
                                type="number"
                                value={numLong}
                                onChange={(e) => setNumLong(e.target.value)}
                                fullWidth
                            />
                        </Box>

                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleGenerate}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Paper with AI'}
                        </Button>

                        {error && <Alert severity="error">{error}</Alert>}
                    </Box>
                </CardContent>
            </Card>

            <Dialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Generated Question Paper Draft</DialogTitle>
                <DialogContent dividers>
                    {generatedPaper && (
                        <Box>
                            <Typography variant="h6" gutterBottom color="primary">Section A (Short Questions)</Typography>
                            <List dense>
                                {generatedPaper.sectionA?.map((q, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText primary={`${idx + 1}. ${q}`} />
                                    </ListItem>
                                ))}
                            </List>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" gutterBottom color="primary">Section B (Long Questions)</Typography>
                            <List dense>
                                {generatedPaper.sectionB?.map((q, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText primary={`${idx + 1}. ${q}`} />
                                    </ListItem>
                                ))}
                            </List>
                            <Typography variant="caption" display="block" sx={{ mt: 2 }}>
                                Total Questions: {generatedPaper.totalQuestions}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCopy}>Copy to Clipboard</Button>
                    <Button onClick={handleSave} disabled={saving} variant="contained" color="success">
                        {saving ? 'Saving...' : 'Save to Question Bank'}
                    </Button>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
