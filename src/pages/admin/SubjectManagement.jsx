import React, { useEffect, useState } from 'react';
import { Typography, TextField, Button, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
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
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {subjects.map((sub) => (
                            <TableRow key={sub.id}>
                                <TableCell>{sub.code}</TableCell>
                                <TableCell>{sub.name}</TableCell>
                                <TableCell>{sub.semester}</TableCell>
                                <TableCell>{sub.academic_year}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>
    );
}
