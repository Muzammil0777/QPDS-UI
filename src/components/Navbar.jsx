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
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
                    QPDS
                </Typography>
                <Box>
                    {role === 'ADMIN' && (
                        <>
                            <Button color="inherit" component={Link} to="/admin">Dashboard</Button>
                        </>
                    )}
                    {role === 'FACULTY' && (
                        <>
                            <Button color="inherit" component={Link} to="/faculty">Dashboard</Button>
                            <Button color="inherit" component={Link} to="/faculty/create-question">Create Question</Button>
                        </>
                    )}

                    {token ? (
                        <Button color="inherit" onClick={handleLogout}>Logout</Button>
                    ) : (
                        <>
                            <Button color="inherit" component={Link} to="/login">Login</Button>
                            <Button color="inherit" component={Link} to="/signup">Signup</Button>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
}
