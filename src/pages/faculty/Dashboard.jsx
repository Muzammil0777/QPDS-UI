// src/pages/faculty/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Typography, Card, CardContent, Grid, Box, Avatar, IconButton, Button } from '@mui/material';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import PhotoCamera from '@mui/icons-material/PhotoCamera';

export default function FacultyDashboard() {
    const [subjects, setSubjects] = useState([]);
    const [user, setUser] = useState({ name: 'Faculty', profilePicture: null });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const response = await api.get('/faculty/my-subjects');
                setSubjects(response.data);
            } catch (error) {
                console.error('Failed to fetch subjects', error);
            }
        };
        fetchSubjects();

        const fetchUser = async () => {
            try {
                const res = await api.get('/faculty/me');
                setUser({
                    name: res.data.name,
                    profilePicture: res.data.profilePicture
                });
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };
        fetchUser();
    }, []);

    const handleUploadClick = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/faculty/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local state to show new image
            // We assume backend returns relative URL. We need to prepend base URL if needed.
            // Let's assume the API returns the full relative path e.g. "static/uploads/..."
            // We need to make sure we can access it.
            // For dev, react proxy might handle /static? Or we need absolute URL.
            // Let's set it and see.
            setUser(prev => ({ ...prev, profilePicture: res.data.url }));
            alert("Profile picture updated!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
                <Box sx={{ position: 'relative' }}>
                    <Avatar
                        src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : undefined}
                        sx={{ width: 80, height: 80, bgcolor: '#1976d2', fontSize: '2rem' }}
                    >
                        {!user.profilePicture && (user.name ? user.name[0] : 'F')}
                    </Avatar>
                    <IconButton color="primary" aria-label="upload picture" component="label" sx={{ position: 'absolute', bottom: -10, right: -10, bgcolor: 'white', '&:hover': { bgcolor: '#f0f0f0' } }}>
                        <input hidden accept="image/*" type="file" onChange={handleUploadClick} />
                        <PhotoCamera />
                    </IconButton>
                </Box>
                <Box>
                    <Typography variant="h4">Hello, {user.name || 'Faculty'}</Typography>
                    <Typography variant="subtitle1" color="textSecondary">Welcome to your dashboard</Typography>
                </Box>
            </Box>

            <Typography variant="h6" gutterBottom>My Assigned Subjects</Typography>

            <Grid container spacing={3}>
                {subjects.map((sub) => (
                    <Grid item xs={12} sm={6} md={4} key={sub.id}>
                        <Card
                            sx={{ cursor: 'pointer', transition: '0.3s', '&:hover': { boxShadow: 6 } }}
                            onClick={() => navigate(`/faculty/subject/${sub.id}`)}
                        >
                            <CardContent>
                                <Typography variant="h6">{sub.code}</Typography>
                                <Typography color="textSecondary">{sub.name}</Typography>
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                    Sem: {sub.semester} | AY: {sub.academic_year}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
