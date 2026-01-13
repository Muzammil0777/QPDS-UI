import React, { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Alert, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { jwtDecode } from 'jwt-decode';

export default function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
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
        try {
            const payload = { ...formData, captchaId: captchaData.id, captchaInput };
            const response = await api.post('/auth/login', payload);
            const { token } = response.data; // Backend returns 'token'

            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);

            if (decoded.role === 'ADMIN') {
                navigate('/admin');
            } else if (decoded.role === 'FACULTY') {
                navigate('/faculty');
            } else {
                setError('Unknown role');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            if (err.response?.data?.error === 'Invalid captcha') {
                fetchCaptcha();
            }
        }
    };

    return (
        <Container maxWidth="xs" sx={{ mt: 8 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Sign in</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error && <Alert severity="error">{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={formData.email}
                        onChange={handleChange}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
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
                        Sign In
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}
