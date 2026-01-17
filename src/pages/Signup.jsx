import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, MenuItem, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Signup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        designation: 'Assistant Professor',
        department: 'CSE',
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [captchaData, setCaptchaData] = useState({ image: '', id: '' });
    const [captchaInput, setCaptchaInput] = useState('');

    const fetchCaptcha = async () => {
        try {
            const res = await api.get('/auth/captcha');
            setCaptchaData({ image: res.data.image, id: res.data.captchaId });
            setCaptchaInput('');
        } catch (err) {
            console.error("Failed to fetch captcha", err);
        }
    };

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Email Validation
        const emailRegex = /^[a-zA-Z0-9._]+(\.cs\.et@msruas\.ac\.in)$/;
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email. Must be a faculty email (e.g., name.cs.et@msruas.ac.in)');
            return;
        }

        try {
            const payload = {
                ...formData,
                role: 'FACULTY',
                captchaId: captchaData.id,
                captchaInput
            };
            await api.post('/auth/register', payload);
            setSuccess('Registration successful. Await admin approval.');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            if (err.response?.data?.error === 'Invalid captcha') {
                fetchCaptcha();
            }
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Faculty Signup</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {success && <Alert severity="success">{success}</Alert>}
                    {error && <Alert severity="error">{error}</Alert>}

                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        autoFocus
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        select
                        label="Designation"
                        name="designation"
                        value={formData.designation}
                        onChange={handleChange}
                    >
                        {['HOD', 'Professor', 'Associate Professor', 'Assistant Professor'].map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        margin="normal"
                        fullWidth
                        label="Department"
                        name="department"
                        value={formData.department}
                        disabled
                    />

                    {/* CAPTCHA Section */}
                    <Box sx={{ mt: 2, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            {captchaData.image && (
                                <img
                                    src={`data:image/png;base64,${captchaData.image}`}
                                    alt="CAPTCHA"
                                    style={{ borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            )}
                            <IconButton onClick={fetchCaptcha} color="primary" sx={{ ml: 1 }}>
                                <RefreshIcon />
                            </IconButton>
                        </Box>
                        <TextField
                            margin="dense"
                            required
                            fullWidth
                            id="captcha"
                            label="Enter Captcha Text"
                            name="captcha"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                        />
                    </Box>

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                    >
                        Sign Up
                    </Button>
                    <Link to="/login" variant="body2">
                        Already have an account? Sign in
                    </Link>
                </Box>
            </Box>
        </Container>
    );
}
