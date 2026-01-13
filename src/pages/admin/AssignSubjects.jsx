import React, { useEffect, useState } from 'react';
import { Typography, MenuItem, TextField, Button, Box, Alert } from '@mui/material';
import api from '../../services/api';

export default function AssignSubjects() {
    const [faculty, setFaculty] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedFaculty, setSelectedFaculty] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [facRes, subRes] = await Promise.all([
                    api.get('/admin/faculty'),
                    api.get('/api/subjects')
                ]);
                setFaculty(facRes.data.filter(f => f.isApproved)); // Only approved faculty
                setSubjects(subRes.data);
            } catch (error) {
                console.error('Data fetch failed', error);
            }
        };
        fetchData();
    }, []);

    const handleAssign = async () => {
        setMessage({ type: '', text: '' });
        if (!selectedFaculty || !selectedSubject) return;

        try {
            await api.post('/admin/assign-subject', {
                facultyId: selectedFaculty,
                subjectId: selectedSubject
            });
            setMessage({ type: 'success', text: 'Subject assigned successfully' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Assignment failed' });
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>Assign Subjects</Typography>
            {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

            <Box sx={{ display: 'flex', gap: 2, maxWidth: 600 }}>
                <TextField
                    select
                    label="Select Faculty"
                    value={selectedFaculty}
                    onChange={(e) => setSelectedFaculty(e.target.value)}
                    fullWidth
                >
                    {faculty.map((fac) => (
                        <MenuItem key={fac.id} value={fac.id}>{fac.name} ({fac.designation})</MenuItem>
                    ))}
                </TextField>

                <TextField
                    select
                    label="Select Subject"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    fullWidth
                >
                    {subjects.map((sub) => (
                        <MenuItem key={sub.id} value={sub.id}>{sub.code} - {sub.name}</MenuItem>
                    ))}
                </TextField>
            </Box>

            <Button variant="contained" sx={{ mt: 2 }} onClick={handleAssign}>
                Assign
            </Button>
        </div>
    );
}
