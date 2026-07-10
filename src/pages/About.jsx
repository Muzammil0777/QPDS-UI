import React from 'react';
import { Container, Box, Typography, Divider, Grid, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

export default function About() {
    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            {/* Header section */}
            <Box sx={{ mb: 6, textAlign: 'center' }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                    PLATFORM GUIDE & MANUAL
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 800, mt: 1, mb: 2, letterSpacing: '-0.03em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Documentation
                </Typography>
                <Typography color="text.secondary" variant="subtitle1" sx={{ maxWidth: 650, mx: 'auto', lineHeight: 1.6 }}>
                    A comprehensive overview of the Asteriq platform, describing user governance, academic role structures, and automated question generation workflows.
                </Typography>
            </Box>

            <Divider sx={{ mb: 6 }} />

            <Grid container spacing={5}>
                {/* 1. Overview Section */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <HelpOutlineIcon color="primary" /> Overview
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 3 }}>
                        Asteriq is a secure, enterprise-grade academic operations platform designed to help universities govern, organize, and automate examination question banks and paper generation. 
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                        By combining multi-stage role verification with secure compartmentalization and AI-assisted drafting, Asteriq ensures complete transparency, auditability, and academic integrity.
                    </Typography>
                </Grid>

                {/* 2. Platform Roles Section */}
                <Grid item xs={12} md={8}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ShieldOutlinedIcon color="primary" /> Academic Governance Roles
                    </Typography>
                    <Grid container spacing={3}>
                        {[
                            { role: 'FACULTY', desc: 'Drafts questions matching specific course outlines, manages learning outcomes, and initiates AI-assisted draft suggestions.' },
                            { role: 'SUBJECT_EXPERT', desc: 'Evaluates drafting standards, verifies taxonomy limits, provides peer-review logs, and endorses questions to the next workflow stage.' },
                            { role: 'HOD', desc: 'Monitors overall department syllabus progress, assigns subject domains to faculty, and approves questions to promote them into the active question bank.' },
                            { role: 'COE', desc: 'Creates balanced test blueprints (specifying taxonomy, difficulty levels, and outcomes) and generates/exports tamper-proof exam papers.' }
                        ].map((item, idx) => (
                            <Grid item xs={12} sm={6} key={idx}>
                                <Card variant="outlined" sx={{ borderRadius: 3, height: '100%', borderColor: 'divider' }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 800, mb: 1, letterSpacing: 0.5 }}>
                                            {item.role}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                            {item.desc}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Grid>
            </Grid>

            <Divider sx={{ my: 6 }} />

            {/* 3. Core Automated Workflows */}
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, letterSpacing: '-0.02em', textAlign: 'center' }}>
                Core System Workflows
            </Typography>

            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 4, borderRadius: 4, height: '100%', bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'inline-flex', bgcolor: 'rgba(30, 58, 138, 0.04)', p: 1.5, borderRadius: 3, color: 'primary.main', mb: 2 }}>
                            <AutoAwesomeOutlinedIcon fontSize="medium" />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            AI-Assisted Question Drafting
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                            Asteriq integrates with underlying Large Language Models (LLMs) through an isolated, provider-independent adapter layer. This allows faculty to:
                        </Typography>
                        <List dense>
                            {[
                                'Generate questions targeted directly to specific Course Outcomes (COs).',
                                'Classify difficulty indices dynamically (Easy, Medium, Hard).',
                                'Verify matching Bloom\'s Taxonomy tiers (Remember, Understand, Apply, etc.).'
                            ].map((text, idx) => (
                                <ListItem key={idx} disableGutters sx={{ alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 24, mt: 0.5, color: 'success.main' }}>✓</ListItemIcon>
                                    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 4, borderRadius: 4, height: '100%', bgcolor: 'background.paper' }}>
                        <Box sx={{ display: 'inline-flex', bgcolor: 'rgba(30, 58, 138, 0.04)', p: 1.5, borderRadius: 3, color: 'primary.main', mb: 2 }}>
                            <LayersOutlinedIcon fontSize="medium" />
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                            Blueprint-Based Exam Composition
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                            Exam question papers are compiled automatically by the Controller of Examination (COE) using blueprints. This ensures:
                        </Typography>
                        <List dense>
                            {[
                                'Randomized selection of approved questions matching the target blueprint metrics.',
                                'Ensures strict adherence to target Bloom\'s Taxonomy percentages.',
                                'Enforces syllabus compliance by matching all specified Course Outcomes (COs).',
                                'Export templates in Word (.docx) and LaTeX format with cryptographic hashes.'
                            ].map((text, idx) => (
                                <ListItem key={idx} disableGutters sx={{ alignItems: 'flex-start' }}>
                                    <ListItemIcon sx={{ minWidth: 24, mt: 0.5, color: 'success.main' }}>✓</ListItemIcon>
                                    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
            </Grid>

            {/* 4. Getting Started Section */}
            <Box sx={{ mt: 8, p: 5, border: '1px solid', borderColor: 'divider', borderRadius: 4, bgcolor: '#fafafa' }}>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.01em' }}>
                    Getting Started
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                    If you are a new faculty member, check your assigned subjects in the **Dashboard**. You can start adding questions immediately to build the database. All added questions will transition to the review queue for subject experts.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    Administrators can map new faculty to subjects and configure settings directly from the **Assignment Manager** panel. For further inquiries or system support, contact the IT desk of your institution.
                </Typography>
            </Box>
        </Container>
    );
}
