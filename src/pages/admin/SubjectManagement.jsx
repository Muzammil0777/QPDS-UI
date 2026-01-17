import React, { useEffect, useState } from 'react';
import { Typography, TextField, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

export default function SubjectManagement() {
    const [subjects, setSubjects] = useState([]);
    const [formData, setFormData] = useState({ code: '', name: '', semester: '', academic_year: '' });

    const fetchSubjects = async () => {
        try {
            const response = await api.get('/api/subjects');
            setSubjects(response.data);
        } catch (error) {
            console.error('Failed to fetch subjects', error);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/subjects', formData);
            setFormData({ code: '', name: '', semester: '', academic_year: '' });
            fetchSubjects();
        } catch (error) {
            alert('Failed to create subject');
        }
    };

    // Edit/Delete Logic
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState({ id: '', code: '', name: '' });

    const handleEditClick = (sub) => {
        setEditData({ id: sub.id, code: sub.code, name: sub.name });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            await api.put(`/api/subjects/${editData.id}`, {
                code: editData.code,
                name: editData.name
            });
            setEditOpen(false);
            fetchSubjects();
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure? This might fail if questions are linked.")) return;
        try {
            await api.delete(`/api/subjects/${id}`);
            fetchSubjects();
        } catch (err) {
            alert('Delete failed (Check if subject has related data)');
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>Subject Management</Typography>

            <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField label="Subject Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required />
                <TextField label="Subject Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                <TextField label="Semester (1-8)" type="number" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} required />
                <TextField label="Academic Year" value={formData.academic_year} onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })} required placeholder="2024-25" />
                <Button type="submit" variant="contained">Add Subject</Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell>Semester</TableCell>
                            <TableCell>Academic Year</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subjects.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell>{sub.code}</TableCell>
                                <TableCell>{sub.name}</TableCell>
                                <TableCell>{sub.semester}</TableCell>
                                <TableCell>{sub.academicYear}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEditClick(sub)} color="primary"><EditIcon /></IconButton>
                                    <IconButton onClick={() => handleDelete(sub.id)} color="error"><DeleteIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Edit Subject</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Code"
                        value={editData.code}
                        onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                        fullWidth margin="dense"
                    />
                    <TextField
                        label="Name"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        fullWidth margin="dense"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
