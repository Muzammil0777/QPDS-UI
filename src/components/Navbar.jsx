import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function Navbar() {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    let role = null;

    if (token) {
        try {
            const decoded = jwtDecode(token);
            role = decoded.role; // Assuming payload has 'role'
        } catch (e) {
            console.error('Invalid token', e);
            localStorage.removeItem('token');
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <AppBar 
            position="sticky" 
            sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.8)', 
                backdropFilter: 'blur(12px)', 
                borderBottom: '1px solid #eaeaea', 
                boxShadow: 'none', 
                color: '#1a1a1a',
                top: 0,
                zIndex: 1100
            }}
        >
            <Toolbar sx={{ maxWidth: '1200px', width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
                <Typography 
                    variant="h6" 
                    component={Link} 
                    to="/" 
                    sx={{ 
                        flexGrow: 1, 
                        textDecoration: 'none', 
                        color: '#1a1a1a', 
                        fontWeight: 800, 
                        letterSpacing: '-0.03em',
                        fontSize: '1.25rem'
                    }}
                >
                    QPDS
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {['SUPER_ADMIN', 'ADMIN'].includes(role) && (
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/admin"
                            sx={{ textTransform: 'none', fontWeight: 600, color: '#444', '&:hover': { color: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
                        >
                            Dashboard
                        </Button>
                    )}
                    {['ACADEMIC', 'FACULTY'].includes(role) && (
                        <>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/faculty"
                                sx={{ textTransform: 'none', fontWeight: 600, color: '#444', '&:hover': { color: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
                            >
                                Dashboard
                            </Button>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/faculty/create-question"
                                sx={{ textTransform: 'none', fontWeight: 600, color: '#444', '&:hover': { color: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
                            >
                                Create Question
                            </Button>
                        </>
                    )}
 
                    {token ? (
                        <Button 
                            variant="outlined"
                            onClick={handleLogout}
                            sx={{ 
                                textTransform: 'none', 
                                fontWeight: 600, 
                                color: '#1a1a1a', 
                                borderColor: '#1a1a1a',
                                borderRadius: 2,
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)', borderColor: '#1a1a1a' } 
                            }}
                        >
                            Logout
                        </Button>
                    ) : (
                        <>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/login"
                                sx={{ textTransform: 'none', fontWeight: 600, color: '#444', '&:hover': { color: '#000', bgcolor: 'rgba(0,0,0,0.04)' } }}
                            >
                                Login
                            </Button>
                            <Button 
                                variant="contained"
                                component={Link} 
                                to="/signup"
                                sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    bgcolor: '#1a1a1a', 
                                    color: '#fff',
                                    borderRadius: 2,
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#333', boxShadow: 'none' } 
                                }}
                            >
                                Signup
                            </Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
