import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Container, 
    Box, 
    Typography, 
    Button, 
    Grid, 
    Card, 
    CardContent, 
    Divider,
    LinearProgress,
    Chip,
    Avatar
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorageOutlinedIcon from '@mui/icons-material/StorageOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import HistoryToggleOffOutlinedIcon from '@mui/icons-material/HistoryToggleOffOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';

// Framer motion animation variants
const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function Home() {
    const navigate = useNavigate();

    return (
        <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', color: 'text.primary' }}>
            
            {/* HERO SECTION */}
            <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 20 }, pb: { xs: 8, md: 16 } }}>
                <Grid container spacing={8} alignItems="center">
                    {/* Left: Heading and CTA */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <motion.div 
                            initial="hidden"
                            animate="visible"
                            variants={staggerContainer}
                        >
                            <motion.div variants={fadeIn}>
                                <Typography 
                                    variant="overline" 
                                    sx={{ 
                                        fontWeight: 700, 
                                        color: 'text.secondary', 
                                        letterSpacing: '0.15em', 
                                        mb: 3, 
                                        display: 'inline-block',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    ACADEMIC OPERATIONS PLATFORM
                                </Typography>
                            </motion.div>
                            
                            <motion.div variants={fadeIn}>
                                <Typography 
                                    variant="h1" 
                                    sx={{ 
                                        fontWeight: 800, // ExtraBold per guidelines
                                        letterSpacing: '-0.04em', 
                                        lineHeight: 1.05,
                                        mb: 3,
                                        fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.25rem' }
                                    }}
                                >
                                    Modern Academic Operations.<br />
                                    <Box component="span" sx={{ color: 'text.secondary' }}>Built for Universities.</Box>
                                </Typography>
                            </motion.div>
                            
                            <motion.div variants={fadeIn}>
                                <Typography 
                                    variant="body1" 
                                    sx={{ 
                                        color: 'text.secondary', 
                                        fontSize: { xs: '1.05rem', sm: '1.15rem' }, 
                                        lineHeight: 1.6, 
                                        mb: 6,
                                        maxWidth: 520
                                    }}
                                >
                                    Asteriq streamlines examination workflows through secure role-based governance, AI-assisted question creation, configurable approval workflows, and enterprise-grade academic automation.
                                </Typography>
                            </motion.div>
                            
                            <motion.div variants={fadeIn}>
                                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                                    <Button 
                                        variant="contained" 
                                        color="primary"
                                        size="large"
                                        endIcon={<ArrowForwardIcon />}
                                        onClick={() => navigate('/login')}
                                        sx={{ 
                                            px: 4, 
                                            py: 1.8,
                                        }}
                                    >
                                        Request Demo
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="secondary"
                                        size="large"
                                        onClick={() => navigate('/about')}
                                        sx={{ 
                                            px: 4, 
                                            py: 1.8,
                                        }}
                                    >
                                        View Documentation
                                    </Button>
                                </Box>
                            </motion.div>
                        </motion.div>
                    </Grid>
                    
                    {/* Right: Mockup Interface */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <Box sx={{ 
                                border: '1px solid #eaeaea', 
                                borderRadius: 4, 
                                bgcolor: '#ffffff', 
                                boxShadow: '0 20px 40px rgba(0,0,0,0.03)',
                                overflow: 'hidden',
                                p: { xs: 2.25, sm: 3.5 }
                            }}>
                                {/* Mockup Topbar */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ff5f56' }} />
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#ffbd2e' }} />
                                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#27c93f' }} />
                                    </Box>
                                    <Chip label="LIVE QUESTION REVIEW TRACKER" size="small" variant="outlined" sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.5, color: '#666666' }} />
                                </Box>

                                {/* Question Header Card */}
                                <Box sx={{ border: '1px solid #e5e7eb', borderRadius: 3, p: 2, bgcolor: '#f8fafc', mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.7rem' }}>QUESTION ID: Q-9481</Typography>
                                        <Chip label="IN ACTIVE WORKFLOW" size="small" color="primary" sx={{ height: 18, fontSize: '0.55rem', fontWeight: 700 }} />
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                        Explain the difference between TCP and UDP protocols, providing two use-cases for each.
                                    </Typography>
                                </Box>

                                {/* Workflow Progress Steps */}
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                    {[
                                        { stage: 'Draft Created', role: 'Faculty (Drafting)', status: 'Completed', details: "Bloom's Level: UNDERSTAND | Difficulty: EASY", date: '10:04 AM' },
                                        { stage: 'Editorial Verification', role: 'Subject Expert (Reviewing)', status: 'Completed', details: "Taxonomy validated & review comment log entry created", date: '11:15 AM' },
                                        { stage: 'Department Endorsement', role: 'Department HOD (Approving)', status: 'Completed', details: "Approved & promoted to subject question bank", date: '12:30 PM' },
                                        { stage: 'Secured Paper Composition', role: 'Controller of Examination', status: 'Active', details: "Assembled in B.Tech Midterm Exam Sheet - Hashing in progress...", date: 'In Progress' }
                                    ].map((step, idx) => (
                                        <Box key={idx} sx={{ display: 'flex', gap: 2 }}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <Box sx={{ 
                                                    width: 22, 
                                                    height: 22, 
                                                    borderRadius: '50%', 
                                                    border: '2px solid',
                                                    borderColor: step.status === 'Completed' ? 'success.main' : 'primary.main',
                                                    bgcolor: step.status === 'Completed' ? 'success.main' : '#ffffff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: step.status === 'Completed' ? '#ffffff' : 'primary.main',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {step.status === 'Completed' ? '✓' : '●'}
                                                </Box>
                                                {idx < 3 && <Box sx={{ width: 2, flexGrow: 1, bgcolor: '#e5e7eb', minHeight: 18, mt: 0.5 }} />}
                                            </Box>
                                            <Box sx={{ flexGrow: 1, pb: idx < 3 ? 0.5 : 0 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{step.stage}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>{step.date}</Typography>
                                                </Box>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>Role: {step.role}</Typography>
                                                <Typography variant="caption" sx={{ color: step.status === 'Completed' ? 'text.secondary' : 'primary.main', fontWeight: step.status === 'Active' ? 600 : 400 }}>{step.details}</Typography>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </motion.div>
                    </Grid>
                </Grid>
            </Container>

            {/* TRUST & METRICS SECTION */}
            <Box sx={{ bgcolor: '#fafafa', borderTop: '1px solid #eaeaea', borderBottom: '1px solid #eaeaea', py: 8 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        {[
                            { value: '99.9%', label: 'Platform Availability' },
                            { value: '100%', label: 'Audit Traceability' },
                            { value: 'Role-Based', label: 'Access Control' },
                            { value: 'Time-Bound', label: 'Security Windows' },
                            { value: 'Multi-Stage', label: 'Approval Workflows' }
                        ].map((metric, idx) => (
                            <Grid size={{ xs: 6, md: 2.4 }} key={idx}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h4" sx={{ fontWeight: 800, color: 'text.primary', mb: 0.5 }}>
                                        {metric.value}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {metric.label}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* CAPABILITIES SECTION */}
            <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
                <Box sx={{ textAlign: 'center', mb: 8 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                        Designed for Governance and Integrity
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary" sx={{ maxWidth: 600, mx: 'auto' }}>
                        Enterprise capabilities built to give universities comprehensive control over their evaluation assets.
                    </Typography>
                </Box>

                <Grid container spacing={3}>
                    {[
                        { icon: <ShieldOutlinedIcon />, title: 'Contextual Access Control', desc: 'Semester-specific subject mappings keep users isolated to their assigned tasks.' },
                        { icon: <TimelineOutlinedIcon />, title: 'Configurable Workflows', desc: 'Define multi-stage approval sequences customized per department requirements.' },
                        { icon: <StorageOutlinedIcon />, title: 'Question Bank Management', desc: 'Maintain structured, version-controlled repository of course evaluation blocks.' },
                        { icon: <LayersOutlinedIcon />, title: 'Blueprint-Based Generation', desc: 'Automate exam composition by mapping questions to specific course outlines.' },
                        { icon: <AutoAwesomeOutlinedIcon />, title: 'AI Question Assistance', desc: 'Accelerate drafting by generating raw question suggestions with difficulty scales.' },
                        { icon: <TrackChangesOutlinedIcon />, title: 'Duplicate Detection', desc: 'Identify and prevent redundant evaluations across semesters via AI checking.' },
                        { icon: <AssignmentTurnedInOutlinedIcon />, title: "Bloom's Validation", desc: 'Ensure balanced examinations by tracking knowledge-level metrics on questions.' },
                        { icon: <HistoryToggleOffOutlinedIcon />, title: 'Immutable Audit Logging', desc: 'Log edit histories, peer feedback, approvals, and paper exports permanently.' },
                        { icon: <TuneOutlinedIcon />, title: 'System Configuration', desc: 'University-wide domain limitations, department rules, and API definitions.' },
                        { icon: <SpeedOutlinedIcon />, title: 'Analytics Dashboard', desc: 'Track generation quotas, approved question progress, and workflow delays.' },
                        { icon: <LockOutlinedIcon />, title: 'Provider-Independent AI', desc: 'Adapt adapters to run on Hugging Face, Gemini, or local on-premise servers.' },
                        { icon: <TimelineOutlinedIcon />, title: 'Time-Bound Assignments', desc: 'Set temporary roles and delegation mappings that expire automatically.' }
                    ].map((cap, idx) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                            <motion.div
                                whileHover={{ y: -4 }}
                                transition={{ duration: 0.2 }}
                                style={{ height: '100%' }}
                            >
                                <Card variant="outlined" sx={{ 
                                    height: '100%', 
                                    borderRadius: 3.5, 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    transition: 'border-color 0.2s',
                                    '&:hover': {
                                        borderColor: 'text.secondary'
                                    }
                                }}>
                                    <CardContent sx={{ p: 4 }}>
                                        <Box sx={{ bgcolor: 'background.paper', p: 1.25, borderRadius: 2, display: 'inline-flex', mb: 2, color: 'text.primary' }}>
                                            {cap.icon}
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, letterSpacing: '-0.01em' }}>
                                            {cap.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                            {cap.desc}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* VISUAL WORKFLOW SECTION */}
            <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 10, md: 14 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                            The Evaluation Lifecycle
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            From initial drafting to secure generation, every step is governed and logged.
                        </Typography>
                    </Box>

                    <Grid container spacing={2} justifyContent="center" alignItems="stretch">
                        {[
                            { step: '01', title: 'Faculty Drafts', desc: 'Creates questions manually or with AI assistants mapping course outcomes.' },
                            { step: '02', title: 'Expert Review', desc: 'Reviews accuracy, taxonomy, difficulty, and leaves review logs.' },
                            { step: '03', title: 'HOD Approval', desc: 'Authorizes question promotion to the active bank.' },
                            { step: '04', title: 'COE Blueprinting', desc: 'Defines paper criteria, blueprints, and taxonomy weights.' },
                            { step: '05', title: 'Secure Composition', desc: 'Assembles papers and generates tamper-proof packages.' }
                        ].map((wf, idx) => (
                            <Grid size={{ xs: 12, md: 2.4 }} key={idx} sx={{ display: 'flex' }}>
                                <Box sx={{ 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    bgcolor: 'background.default', 
                                    borderRadius: 3.5, 
                                    p: { xs: 2.25, sm: 3 }, 
                                    width: '100%',
                                    position: 'relative',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    <Typography variant="h6" sx={{ color: '#ccc', fontWeight: 800, mb: 1 }}>{wf.step}</Typography>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{wf.title}</Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ fontSize: '0.85rem', lineHeight: 1.5 }}>{wf.desc}</Typography>
                                    {idx < 4 && (
                                        <Box sx={{ 
                                            display: { xs: 'none', md: 'block' },
                                            position: 'absolute', 
                                            right: -10, 
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            zIndex: 2,
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            bgcolor: '#fff',
                                            border: '1px solid #eaeaea',
                                            textAlign: 'center',
                                            lineHeight: '18px',
                                            fontSize: '10px',
                                            fontWeight: 'bold',
                                            color: '#666'
                                        }}>➔</Box>
                                    )}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* DASHBOARD SHOWCASE SECTION */}
            <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
                <Box sx={{ textAlign: 'center', mb: 10 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                        Operational Workspaces
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        Tailored workspaces optimized for specific roles in the academic hierarchy.
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Faculty Workspace */}
                    <Grid container spacing={6} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.25, sm: 3 }, bgcolor: 'background.default', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'background.paper', color: 'text.primary', width: 32, height: 32, fontSize: '0.85rem', border: '1px solid', borderColor: 'divider' }}>F</Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Faculty Drafting Board</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary', mb: 1 }}>Question Content:</Typography>
                                <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.paper', mb: 2 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>Explain the difference between TCP and UDP protocols.</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip label="Suggest Difficulty" size="small" variant="outlined" />
                                    <Chip label="Bloom's Mapping" size="small" variant="outlined" />
                                    <Chip label="Submit to Review" size="small" color="primary" />
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', pl: { md: 4 } }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                                    Faculty Drafting Workspace
                                </Typography>
                                <Typography color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                    Faculty can construct questions manually or trigger automated drafting suggestions. The system handles duplicate detection, maps course outcomes, and logs revisions instantly.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* Subject Expert Workspace */}
                    <Grid container spacing={6} alignItems="center" direction={{ xs: 'column-reverse', md: 'row' }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', pr: { md: 4 } }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                                    Subject Expert Reviews
                                </Typography>
                                <Typography color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                    Assigned reviewers evaluate question blueprints, verify the difficulty coefficients, validate taxonomy standards, and leave audit suggestions or approve the drafts.
                                </Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.25, sm: 3 }, bgcolor: 'background.default', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'background.paper', color: 'text.primary', width: 32, height: 32, fontSize: '0.85rem', border: '1px solid', borderColor: 'divider' }}>E</Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Peer Evaluation Queue</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, borderRadius: 2 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Is the taxonomy correct for CS101?</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Button size="small" variant="contained" color="primary">Approve</Button>
                                            <Button size="small" variant="outlined" color="secondary">Reject</Button>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>

                    {/* HOD Workspace */}
                    <Grid container spacing={6} alignItems="center">
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: { xs: 2.25, sm: 3 }, bgcolor: 'background.default', boxShadow: '0 10px 30px rgba(0,0,0,0.01)' }}>
                                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, alignItems: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'background.paper', color: 'text.primary', width: 32, height: 32, fontSize: '0.85rem', border: '1px solid', borderColor: 'divider' }}>H</Avatar>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Department Assignment Board</Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="body2">Faculty: Dr. Sarah Jacob</Typography>
                                        <Chip label="SUBJECT_EXPERT (CS101)" size="small" />
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                                        <Typography variant="body2">Faculty: Prof. Amit Sharma</Typography>
                                        <Chip label="FACULTY (CS101)" size="small" />
                                    </Box>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', pl: { md: 4 } }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                                    Department Governance (HOD)
                                </Typography>
                                <Typography color="textSecondary" sx={{ lineHeight: 1.6 }}>
                                    HODs monitor course progress, map subjects to specific educators, and manage workload requirements across semesters with zero operational friction.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Container>

            {/* SECURITY & GOVERNANCE SECTION */}
            <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 10, md: 14 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                            Security & Governance Architecture
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Designed to meet mission-critical evaluation requirements.
                        </Typography>
                    </Box>
 
                    <Grid container spacing={3}>
                        {[
                            { title: 'Role-Based Access Control', desc: 'Enforces explicit system-level and contextual mappings for all users.' },
                            { title: 'Continuous Audit Logging', desc: 'Records all question revisions, creator edits, and reviewer comments permanently.' },
                            { title: 'Time-Bound Permissions', desc: 'Sets expiration dates for subject associations and evaluator mappings.' },
                            { title: 'Delegated Responsibilities', desc: 'Supports secure, audited temporary delegation windows during staff absences.' },
                            { title: 'Version History', desc: 'Maintains complete question logs to ensure complete recovery and trace.' },
                            { title: 'Secure Authentication', desc: 'Decodes claims securely using robust JWT tokens and configurable settings.' },
                            { title: 'Configuration Driven Policies', desc: 'Control domain bounds and departmental configurations via a centralized panel.' }
                        ].map((sec, idx) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                                <Box sx={{ p: { xs: 2.25, sm: 3 }, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', borderRadius: 3.5, height: '100%' }}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>{sec.title}</Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ lineHeight: 1.5 }}>{sec.desc}</Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>
 
            {/* AI SERVICE SECTION */}
            <Container maxWidth="lg" sx={{ py: { xs: 10, md: 16 } }}>
                <Grid container spacing={8} alignItems="center">
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.02em' }}>
                            Provider-Independent AI
                        </Typography>
                        <Typography color="textSecondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                            Asteriq utilizes a provider-independent architecture, separating application business logic from LLM services. 
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Generate draft questions based on course syllabus inputs.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Estimate difficulty metrics to maintain balanced tests.</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Run duplicate verification checking past semester banks.</Typography>
                            </Box>
                        </Box>
                    </Grid>
 
                    {/* Architecture Diagram */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 4, p: 4, bgcolor: 'background.paper', textAlign: 'center' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#666', mb: 4 }}>INTELLIGENT INTEGRATION ARCHITECTURE</Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                                <Box sx={{ border: '1px solid #111', bgcolor: '#111', color: '#fff', px: 3, py: 1.5, borderRadius: 2, fontWeight: 600, width: '220px', fontSize: '0.85rem' }}>
                                    Asteriq Core Application
                                </Box>
                                <Typography sx={{ color: '#ccc', fontSize: '1rem', py: 0.25 }}>▼</Typography>
                                <Box sx={{ border: '1px solid #ccc', bgcolor: '#fff', px: 3, py: 1.5, borderRadius: 2, fontWeight: 600, width: '220px', fontSize: '0.85rem' }}>
                                    AI Service Adapter Layer
                                </Box>
                                <Typography sx={{ color: '#ccc', fontSize: '1rem', py: 0.25 }}>▼</Typography>
                                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', width: '100%', flexWrap: 'wrap' }}>
                                    <Chip label="Gemini API" variant="outlined" sx={{ fontWeight: 600 }} />
                                    <Chip label="Hugging Face" variant="outlined" sx={{ fontWeight: 600 }} />
                                    <Chip label="On-Premise LLM" variant="outlined" sx={{ fontWeight: 600 }} />
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>

            {/* WHY ASTERIQ */}
            <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 10, md: 14 } }}>
                <Container maxWidth="lg">
                    <Box sx={{ textAlign: 'center', mb: 8 }}>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em' }}>
                            Why Institutions Choose Asteriq
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary">
                            Restoring accountability and structure to academic assessments.
                        </Typography>
                    </Box>

                    <Grid container spacing={4}>
                        {[
                            { problem: 'Manual approval loops', solution: 'Automated workflow pipelines with real-time logging.' },
                            { problem: 'Examination leakage risks', solution: 'Encrypted question exports and secure distribution layers.' },
                            { problem: 'Zero edit tracking', solution: 'Immutable version control on every question modification.' },
                            { problem: 'Disconnected systems', solution: 'A single, unified platform for faculty, reviewers, and administrators.' }
                        ].map((item, idx) => (
                            <Grid size={{ xs: 12, md: 6 }} key={idx}>
                                <Box sx={{ p: 4, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default', borderRadius: 4 }}>
                                    <Typography variant="subtitle1" sx={{ color: 'error.main', fontWeight: 700, mb: 1 }}>
                                        ✕ {item.problem}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: 'success.main', fontWeight: 700, mb: 1 }}>
                                        ✓ {item.solution}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* FINAL CTA */}
            <Container maxWidth="md" sx={{ py: { xs: 10, md: 16 }, textAlign: 'center' }}>
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 3, letterSpacing: '-0.03em' }}>
                    Elevate Your Academic Operations.
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 6, maxWidth: 550, mx: 'auto', lineHeight: 1.6 }}>
                    Join leading universities in establishing rigorous governance over their examination workflows.
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => navigate('/login')}
                    sx={{ 
                        px: 5, 
                        py: 2,
                    }}
                >
                    Request Portal Access
                </Button>
            </Container>

            {/* ENTERPRISE FOOTER */}
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 8, bgcolor: 'background.default' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={6}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, letterSpacing: '-0.02em', color: 'primary.main', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>ASTERIQ</Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ maxWidth: 300, lineHeight: 1.6 }}>
                                Academic Operations Platform designed for secure, auditable, and automated institutional evaluations.
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Resources</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }} onClick={() => navigate('/about')}>Documentation</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>Terms & Conditions</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>Privacy Policy</Typography>
                            </Box>
                        </Grid>
                        <Grid size={{ xs: 6, md: 4 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Contact & Community</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Typography variant="body2" color="textSecondary">support@asteriq.com</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>GitHub Repository</Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>LinkedIn Profile</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            Asteriq © {new Date().getFullYear()} — Enterprise Academic Operations Platform.
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Engineered for high-trust academic institutions.
                        </Typography>
                    </Box>
                </Container>
            </Box>
        </Box>
    );
}
