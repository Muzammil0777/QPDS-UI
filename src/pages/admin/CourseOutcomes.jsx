import React, { useEffect, useState } from 'react';
import { Typography, MenuItem, TextField, Button, Box, Table, TableBody, TableCell, TableHead, TableRow, Paper, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

export default function CourseOutcomes() {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [outcomes, setOutcomes] = useState([]);
    const [formData, setFormData] = useState({ co_code: '', description: '' });

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await api.get('/api/subjects');
                setSubjects(response.data);
            } catch (error) {
                console.error('Failed to fetch subjects', error);
            }
        };
        fetchSubjects();
    }, []);

    const fetchOutcomes = async (subjectId) => {
        if (!subjectId) return;
        try {
            const response = await api.get(`/admin/course-outcomes/subject/${subjectId}`);
            if (Array.isArray(response.data)) {
                setOutcomes(response.data);
            } else {
                console.error("API returned non-array:", response.data);
                setOutcomes([]);
            }
        } catch (error) {
            console.error('Failed to fetch COs', error);
            setOutcomes([]);
        }
    };

    useEffect(() => {
        fetchOutcomes(selectedSubject);
    }, [selectedSubject]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/course-outcomes', {
                subjectId: selectedSubject,
                coCode: `CO${formData.co_code}`, // Prepend CO
                description: formData.description
            });
            setFormData({ co_code: '', description: '' });
            fetchOutcomes(selectedSubject);
        } catch (error) {
            console.error('Add CO Failed:', error);
            const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to add CO';
            alert(`Error: ${msg}`);
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>Course Outcomes Management</Typography>

            <TextField
                select
                label="Select Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                sx={{ mb: 4, width: 300 }}
            >
                {subjects.map((sub) => (
                    <MenuItem key={sub.id} value={sub.id}>{sub.code} - {sub.name}</MenuItem>
                ))}
            </TextField>

            {selectedSubject && (
                <>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, display: 'flex', gap: 2 }}>
                        <TextField
                            label="CO Number"
                            type="number"
                            value={formData.co_code}
                            onChange={(e) => setFormData({ ...formData, co_code: e.target.value })}
                            required
                            InputProps={{
                                startAdornment: <InputAdornment position="start">CO</InputAdornment>,
                            }}
                        />
                        <TextField label="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} fullWidth required />
                        <Button type="submit" variant="contained">Add CO</Button>
                    </Box>

                    <Paper>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>CO Code</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.isArray(outcomes) && outcomes.map((co) => (
                                    <TableRow key={co.id}>
                                        <TableCell>{co.coCode}</TableCell>
                                        <TableCell>{co.description}</TableCell>
                                        <TableCell>
                                            <IconButton onClick={() => handleEditClick(co)} color="primary"><EditIcon /></IconButton>
                                            <IconButton onClick={() => handleDelete(co.id)} color="error"><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Paper>

                    <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                        <DialogTitle>Edit CO Description</DialogTitle>
                        <DialogContent>
                            <TextField
                                label="Description"
                                value={editData.description}
                                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                fullWidth margin="dense" multiline rows={3}
                            />
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button onClick={handleEditSave} variant="contained">Save</Button>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </div>
    );
}
