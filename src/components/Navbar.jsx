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
                bgcolor: 'background.default', 
                borderBottom: '1px solid',
                borderColor: 'divider', 
                boxShadow: 'none', 
                color: 'text.primary',
                top: 0,
                zIndex: 1100
            }}
        >
            <Toolbar sx={{ width: '100%', px: { xs: 2, sm: 4 } }}>
                <Typography 
                    variant="h6" 
                    component={Link} 
                    to="/" 
                    sx={{ 
                        flexGrow: 1, 
                        textDecoration: 'none', 
                        color: 'primary.main', 
                        fontWeight: 800, 
                        letterSpacing: '-0.03em',
                        fontSize: '1.25rem',
                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}
                >
                    ASTERIQ
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    {['SUPER_ADMIN', 'ADMIN'].includes(role) && (
                        <Button 
                            color="inherit" 
                            component={Link} 
                            to="/admin"
                            sx={{ fontWeight: 600 }}
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
                                sx={{ fontWeight: 600 }}
                            >
                                Dashboard
                            </Button>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/faculty/create-question"
                                sx={{ 
                                    fontWeight: 600,
                                    display: { xs: 'none', sm: 'inline-flex' } // Hide on mobile to prevent overflow
                                }}
                            >
                                Create Question
                            </Button>
                        </>
                    )}
 
                    {token ? (
                        <Button 
                            variant="outlined"
                            color="secondary"
                            onClick={handleLogout}
                            sx={{ fontWeight: 600 }}
                        >
                            Logout
                        </Button>
                    ) : (
                        <>
                            <Button 
                                color="inherit" 
                                component={Link} 
                                to="/login"
                                sx={{ fontWeight: 600 }}
                            >
                                Login
                            </Button>
                            <Button 
                                variant="contained"
                                color="primary"
                                component={Link} 
                                to="/signup"
                                sx={{ fontWeight: 600 }}
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
