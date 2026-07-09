import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Container, 
    Box, 
    Typography, 
    Button, 
    Grid, 
    Card, 
    CardContent, 
    Divider 
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';

export default function Home() {
    const navigate = useNavigate();

    return (
        <Box sx={{ 
            bgcolor: '#ffffff', 
            minHeight: '100vh', 
            display: 'flex', 
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Elegant, subtle background decoration (Spotlight Gradient) */}
            <Box sx={{
                position: 'absolute',
                top: '-20%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '1000px',
                height: '600px',
                background: 'radial-gradient(circle, rgba(26,118,210,0.03) 0%, rgba(255,255,255,0) 70%)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: 16, pb: 12, position: 'relative', zIndex: 1 }}>
                <Box sx={{ textAlign: 'center', maxWidth: 850, mx: 'auto', mb: 10 }}>
                    <Typography 
                        component="span" 
                        variant="overline" 
                        sx={{ 
                            fontWeight: 700, 
                            color: '#666666', 
                            letterSpacing: '0.15em', 
                            mb: 2, 
                            display: 'inline-block',
                            fontSize: '0.8rem'
                        }}
                    >
                        SECURE EXAM ORCHESTRATION
                    </Typography>
                    
                    <Typography 
                        variant="h1" 
                        component="h1" 
                        sx={{ 
                            fontWeight: 900, 
                            color: '#111111', 
                            lineHeight: 1.1,
                            mb: 3,
                            letterSpacing: '-0.04em',
                            fontSize: { xs: '2.5rem', sm: '3.75rem', md: '4.5rem' }
                        }}
                    >
                        Question Paper Generation & Distribution System
                    </Typography>
                    
                    <Typography 
                        variant="h6" 
                        color="text.secondary" 
                        sx={{ 
                            fontWeight: 400, 
                            lineHeight: 1.6, 
                            mb: 6,
                            maxWidth: 700,
                            mx: 'auto',
                            fontSize: { xs: '1rem', sm: '1.15rem' },
                            color: '#555555'
                        }}
                    >
                        An institutional portal engineered to orchestrate question banking, peer-review workflows, and automated exam paper distribution with absolute audit compliance.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2.5, justifyContent: 'center', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center' }}>
                        <Button 
                            variant="contained" 
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/login')}
                            sx={{ 
                                bgcolor: '#111111', 
                                color: '#ffffff', 
                                px: 4, 
                                py: 1.8,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                                '&:hover': {
                                    bgcolor: '#222222',
                                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
                                }
                            }}
                        >
                            Enter Portal Demo
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="large"
                            onClick={() => navigate('/about')}
                            sx={{ 
                                color: '#111111', 
                                borderColor: '#e0e0e0',
                                px: 4, 
                                py: 1.8,
                                borderRadius: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': {
                                    borderColor: '#111111',
                                    bgcolor: '#f9f9f9'
                                }
                            }}
                        >
                            Read Documentation
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ my: 8, borderColor: '#f0f0f0' }} />

                {/* Features Section */}
                <Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            textAlign: 'center', 
                            fontWeight: 800, 
                            color: '#111111',
                            letterSpacing: '-0.02em',
                            mb: 8
                        }}
                    >
                        Built for High-Trust Academic Operations
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ 
                                height: '100%', 
                                borderRadius: 4, 
                                border: '1px solid #f0f0f0', 
                                bgcolor: '#ffffff',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.03)',
                                    borderColor: '#dcdcdc'
                                }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ bgcolor: '#f4f4f4', p: 1.5, borderRadius: 2.5, display: 'flex' }}>
                                            <SecurityOutlinedIcon sx={{ fontSize: 24, color: '#111111' }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#111111', letterSpacing: '-0.01em' }}>
                                        Contextual RBAC
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, color: '#666666' }}>
                                        Dynamic, time-bound roles mapped to specific courses for clean authorization and course control.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ 
                                height: '100%', 
                                borderRadius: 4, 
                                border: '1px solid #f0f0f0', 
                                bgcolor: '#ffffff',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.03)',
                                    borderColor: '#dcdcdc'
                                }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ bgcolor: '#f4f4f4', p: 1.5, borderRadius: 2.5, display: 'flex' }}>
                                            <AssignmentOutlinedIcon sx={{ fontSize: 24, color: '#111111' }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#111111', letterSpacing: '-0.01em' }}>
                                        Flexible Review
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, color: '#666666' }}>
                                        Configurable N-stage peer review and editorial approval workflow tracking step logs.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ 
                                height: '100%', 
                                borderRadius: 4, 
                                border: '1px solid #f0f0f0', 
                                bgcolor: '#ffffff',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.03)',
                                    borderColor: '#dcdcdc'
                                }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ bgcolor: '#f4f4f4', p: 1.5, borderRadius: 2.5, display: 'flex' }}>
                                            <LayersOutlinedIcon sx={{ fontSize: 24, color: '#111111' }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#111111', letterSpacing: '-0.01em' }}>
                                        Blueprint Composer
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, color: '#666666' }}>
                                        Generate balanced assessment papers based on Bloom's taxonomy and mapped outcomes.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ 
                                height: '100%', 
                                borderRadius: 4, 
                                border: '1px solid #f0f0f0', 
                                bgcolor: '#ffffff',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.03)',
                                    borderColor: '#dcdcdc'
                                }
                            }}>
                                <CardContent sx={{ p: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box sx={{ bgcolor: '#f4f4f4', p: 1.5, borderRadius: 2.5, display: 'flex' }}>
                                            <HistoryToggleOffOutlinedIcon sx={{ fontSize: 24, color: '#111111' }} />
                                        </Box>
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, color: '#111111', letterSpacing: '-0.01em' }}>
                                        Audit Assurance
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, color: '#666666' }}>
                                        Continuous security logs and change tracking on each question revision.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{ mt: 'auto', py: 5, borderTop: '1px solid #f0f0f0', bgcolor: '#ffffff', textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: '#888888', letterSpacing: '0.02em' }}>
                    QPDS © {new Date().getFullYear()} — Question Paper Generation and Distribution System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}
