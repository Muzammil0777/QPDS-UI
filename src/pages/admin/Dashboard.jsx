import React, { useEffect, useState } from 'react';
import { 
    Typography, 
    Grid, 
    Card, 
    CardContent, 
    Box, 
    CircularProgress, 
    LinearProgress, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button, 
    Chip, 
    Divider 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../../services/api';

export default function AdminDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/api/dashboard/academic');
                setDashboardData(response.data);
            } catch (error) {
                console.error('Failed to fetch dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const { hodStats, coePapers, staffTracker } = dashboardData || {
        hodStats: { department: 'All', totalSubjects: 0, totalQuestions: 0, approvedQuestions: 0, activeFaculty: 0 },
        coePapers: [],
        staffTracker: []
    };

    const statsCards = [
        { 
            title: 'Mapped Subjects', 
            value: hodStats?.totalSubjects || 0, 
            subtitle: 'Academic Curriculum', 
            icon: <SchoolIcon sx={{ color: 'primary.main', fontSize: 32 }} /> 
        },
        { 
            title: 'Active Faculty', 
            value: hodStats?.activeFaculty || 0, 
            subtitle: 'Registered Members', 
            icon: <PeopleIcon sx={{ color: 'primary.main', fontSize: 32 }} /> 
        },
        { 
            title: 'Question Bank Volume', 
            value: hodStats?.totalQuestions || 0, 
            subtitle: 'Total Submissions', 
            icon: <ArticleIcon sx={{ color: 'primary.main', fontSize: 32 }} /> 
        },
        { 
            title: 'Approved Questions', 
            value: hodStats?.approvedQuestions || 0, 
            subtitle: 'Verified & Secured', 
            icon: <AssignmentTurnedInIcon sx={{ color: 'primary.main', fontSize: 32 }} /> 
        }
    ];

    return (
        <Box sx={{ py: 2 }}>
            {/* Header Title */}
            <Box sx={{ mb: 4 }}>
                <Typography 
                    variant="h4" 
                    sx={{ 
                        fontWeight: 800, 
                        letterSpacing: '-0.02em', 
                        fontFamily: 'Plus Jakarta Sans, sans-serif',
                        color: 'text.primary',
                        mb: 1
                    }}
                >
                    Academic Operations Dashboard
                </Typography>
                <Typography color="textSecondary" variant="subtitle1">
                    Command center for syllabus mapping, question validation, and examination workflows.
                </Typography>
            </Box>

            {/* Metrics cards */}
            <Grid container spacing={3} sx={{ mb: 5 }}>
                {statsCards.map((card, idx) => (
                    <Grid item xs={12} sm={6} md={3} key={idx}>
                        <Card 
                            variant="outlined" 
                            sx={{ 
                                borderRadius: 3.5, 
                                borderColor: 'divider',
                                transition: '0.2s',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    boxShadow: '0 8px 24px rgba(30, 58, 138, 0.04)'
                                }
                            }}
                        >
                            <CardContent sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography color="textSecondary" variant="caption" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                        {card.title}
                                    </Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800, my: 0.5, letterSpacing: '-0.03em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {card.value}
                                    </Typography>
                                    <Typography color="textSecondary" variant="body2" sx={{ fontSize: '0.75rem' }}>
                                        {card.subtitle}
                                    </Typography>
                                </Box>
                                <Box sx={{ bgcolor: 'rgba(30, 58, 138, 0.04)', p: 1.5, borderRadius: 3 }}>
                                    {card.icon}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Main sections */}
            <Grid container spacing={4}>
                {/* 1. Subjects syllabus tracker */}
                <Grid item xs={12} md={7}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Course Syllabus Progress Tracker
                        </Typography>
                        <Button 
                            size="small" 
                            endIcon={<ArrowForwardIcon />} 
                            onClick={() => navigate('/admin/subjects')}
                            sx={{ fontWeight: 600 }}
                        >
                            Manage Subjects
                        </Button>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3.5, borderColor: 'divider' }}>
                        <Table>
                            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Total</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Approved</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="center">Pending</TableCell>
                                    <TableCell sx={{ fontWeight: 600 }} align="right">Completion</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {staffTracker.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                            No course data found. Please add subjects in Subject Management.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    staffTracker.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.subjectCode}</Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {row.subjectName}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">{row.totalQuestions}</TableCell>
                                            <TableCell align="center">{row.approvedQuestions}</TableCell>
                                            <TableCell align="center">{row.pendingQuestions}</TableCell>
                                            <TableCell align="right">
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                                    <Box sx={{ width: 60 }}>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={row.completionPercentage} 
                                                            sx={{ height: 6, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.04)' }} 
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 28 }}>
                                                        {row.completionPercentage}%
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>

                {/* 2. Recent Exam Papers & Actions */}
                <Grid item xs={12} md={5}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Recent Secured Exam Papers
                        </Typography>
                        <Button 
                            size="small" 
                            endIcon={<ArrowForwardIcon />} 
                            onClick={() => navigate('/admin/question-paper')}
                            sx={{ fontWeight: 600 }}
                        >
                            All Papers
                        </Button>
                    </Box>
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3.5, borderColor: 'divider' }}>
                        <Table>
                            <TableBody>
                                {coePapers.length === 0 ? (
                                    <TableRow>
                                        <TableCell align="center" sx={{ py: 6, color: 'text.secondary' }}>
                                            No question papers generated yet. Go to Question Bank to compose one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    coePapers.map((paper, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell sx={{ py: 2 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{paper.title}</Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                    Course: {paper.subjectCode} • Generated: {new Date(paper.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ py: 2 }} align="right">
                                                <Chip 
                                                    label={paper.status} 
                                                    size="small" 
                                                    color={
                                                        paper.status === 'APPROVED' ? 'success' : 
                                                        paper.status === 'DRAFT' ? 'secondary' : 'default'
                                                    }
                                                    sx={{ fontWeight: 600, textTransform: 'capitalize', fontSize: '0.75rem' }}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Quick Access Actions */}
                    <Card variant="outlined" sx={{ borderRadius: 3.5, borderColor: 'divider', mt: 3, bgcolor: 'rgba(30, 58, 138, 0.01)' }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Administrative Actions
                            </Typography>
                            <Divider sx={{ my: 1.5 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Button 
                                        fullWidth 
                                        variant="outlined" 
                                        size="small" 
                                        onClick={() => navigate('/admin/faculty')}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Register Faculty
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
