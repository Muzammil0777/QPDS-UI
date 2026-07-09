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
import SecurityIcon from '@mui/icons-material/Security';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StorageIcon from '@mui/icons-material/Storage';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export default function Home() {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Hero Section */}
            <Container maxWidth="lg" sx={{ pt: 12, pb: 10 }}>
                <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto', mb: 8 }}>
                    <Typography 
                        component="span" 
                        variant="overline" 
                        sx={{ 
                            fontWeight: 700, 
                            color: 'primary.main', 
                            letterSpacing: 2, 
                            mb: 2, 
                            display: 'inline-block' 
                        }}
                    >
                        Enterprise Academic Solutions
                    </Typography>
                    
                    <Typography 
                        variant="h2" 
                        component="h1" 
                        sx={{ 
                            fontWeight: 800, 
                            color: '#1a1a1a', 
                            lineHeight: 1.15,
                            mb: 3,
                            letterSpacing: '-0.02em'
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
                            mb: 5,
                            maxWidth: 650,
                            mx: 'auto'
                        }}
                    >
                        A secure, audit-compliant academic portal designed to orchestrate question banking, peer-review workflows, and automated exam paper composition.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <Button 
                            variant="contained" 
                            size="large"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate('/login')}
                            sx={{ 
                                bgcolor: '#1a1a1a', 
                                color: '#fff', 
                                px: 4, 
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': {
                                    bgcolor: '#333'
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
                                color: '#1a1a1a', 
                                borderColor: '#ccc',
                                px: 4, 
                                py: 1.5,
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                '&:hover': {
                                    borderColor: '#1a1a1a',
                                    bgcolor: 'rgba(0,0,0,0.02)'
                                }
                            }}
                        >
                            Documentation
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ my: 6, borderColor: '#eaeaea' }} />

                {/* Features Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            textAlign: 'center', 
                            fontWeight: 700, 
                            color: '#1a1a1a',
                            mb: 6
                        }}
                    >
                        Engineered for High-Trust Evaluations
                    </Typography>

                    <Grid container spacing={4}>
                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <SecurityIcon color="primary" sx={{ fontSize: 28 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                                        Contextual RBAC
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        Time-bound assignments (Faculty, Subject Expert, HOD) mapping specific roles to courses for semesters.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <AssignmentIcon color="primary" sx={{ fontSize: 28 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                                        N-Stage Workflows
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        Customizable review sequences logging audit histories, peer corrections, and reviewer decisions.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <StorageIcon color="primary" sx={{ fontSize: 28 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                                        Smart Blueprinting
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        Instantly generate exam sheets matching Bloom's taxonomy balances and course specifications.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>

                        <Grid item xs={12} sm={6} md={3}>
                            <Card variant="outlined" sx={{ height: '100%', borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff' }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <VerifiedUserIcon color="primary" sx={{ fontSize: 28 }} />
                                    </Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
                                        Audit Assurance
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                        Immutable logs tracking who created, edited, reviewed, or exported question materials.
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* Footer */}
            <Box sx={{ mt: 'auto', py: 4, borderTop: '1px solid #eaeaea', bgcolor: '#fff', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    QPDS © {new Date().getFullYear()} — Question Paper Generation and Distribution System. All rights reserved.
                </Typography>
            </Box>
        </Box>
    );
}
