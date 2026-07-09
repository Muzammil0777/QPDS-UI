import React, { useEffect, useState } from 'react';
import { 
    Typography, 
    Card, 
    CardContent, 
    Grid, 
    Box, 
    Avatar, 
    IconButton, 
    Button, 
    Chip, 
    CircularProgress, 
    Divider, 
    LinearProgress, 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow,
    Paper
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import SchoolIcon from '@mui/icons-material/School';
import RateReviewIcon from '@mui/icons-material/RateReview';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function FacultyDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [user, setUser] = useState({ name: 'Academic Member', profilePicture: null, designation: '', department: '' });
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

        const fetchUser = async () => {
            try {
                const res = await api.get('/faculty/me');
                setUser({
                    name: res.data.name,
                    profilePicture: res.data.profilePicture,
                    designation: res.data.designation || 'Academic Staff',
                    department: res.data.department || 'N/A'
                });
            } catch (err) {
                console.error("Failed to fetch user profile", err);
            }
        };

        fetchUser();
        fetchDashboard();
    }, []);

    const handleUploadClick = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post('/faculty/profile-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setUser(prev => ({ ...prev, profilePicture: res.data.url }));
            alert("Profile picture updated!");
        } catch (err) {
            console.error(err);
            alert("Failed to upload image.");
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    const { activeRoles, facultySubjects, expertSubjects, hodStats, coePapers, staffTracker } = dashboardData || {
        activeRoles: [],
        facultySubjects: [],
        expertSubjects: [],
        hodStats: null,
        coePapers: [],
        staffTracker: []
    };

    return (
        <Box sx={{ p: 4, bgcolor: 'background.default', minHeight: '90vh' }}>
            {/* Header / Greeting section */}
            <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 3, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={user.profilePicture ? `http://localhost:5000/${user.profilePicture}` : undefined}
                                sx={{ width: 90, height: 90, bgcolor: 'primary.main', fontSize: '2.2rem', fontWeight: 600 }}
                            >
                                {!user.profilePicture && (user.name ? user.name[0] : 'U')}
                            </Avatar>
                            <IconButton 
                                color="primary" 
                                aria-label="upload picture" 
                                component="label" 
                                sx={{ 
                                    position: 'absolute', 
                                    bottom: -5, 
                                    right: -5, 
                                    bgcolor: 'background.paper', 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } 
                                }}
                            >
                                <input hidden accept="image/*" type="file" onChange={handleUploadClick} />
                                <PhotoCamera sx={{ fontSize: 18, color: 'text.secondary' }} />
                            </IconButton>
                        </Box>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a', mb: 0.5 }}>
                            Welcome back, {user.name}
                        </Typography>
                        <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 2 }}>
                            {user.designation} • Dept. of {user.department}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {activeRoles.map(role => (
                                <Chip 
                                    key={role} 
                                    label={role.replace('_', ' ')} 
                                    size="small" 
                                    sx={{ 
                                        fontWeight: 600, 
                                        textTransform: 'uppercase', 
                                        letterSpacing: 0.5,
                                        bgcolor: '#f0f0f0', 
                                        color: '#333' 
                                    }} 
                                />
                            ))}
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Fallback Empty State */}
            {activeRoles.length === 0 && (
                <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #eaeaea', textAlign: 'center', p: 5, bgcolor: '#fff' }}>
                    <CardContent>
                        <FolderOpenIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            No Active Semester Assignments
                        </Typography>
                        <Typography color="textSecondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                            You do not have any active subject or role assignments for this semester. Please contact your department HOD or system Administrator to map your course responsibilities.
                        </Typography>
                    </CardContent>
                </Card>
            )}

            <Grid container spacing={4}>
                {/* 1. FACULTY View */}
                {activeRoles.includes('FACULTY') && facultySubjects.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SchoolIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>My Assigned Subjects</Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {facultySubjects.map((sub) => (
                                <Grid item xs={12} sm={6} md={4} key={sub.id}>
                                    <Card 
                                        variant="outlined"
                                        sx={{ 
                                            cursor: 'pointer', 
                                            borderRadius: 3,
                                            border: '1px solid #eaeaea',
                                            transition: '0.2s', 
                                            '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
                                        }}
                                        onClick={() => navigate(`/faculty/subject/${sub.id}`)}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a' }}>{sub.code}</Typography>
                                            <Typography color="textSecondary" sx={{ mb: 2, fontSize: '0.95rem' }}>{sub.name}</Typography>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Semester {sub.semester}
                                                </Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                    {sub.academic_year}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                )}

                {/* 2. SUBJECT_EXPERT View */}
                {activeRoles.includes('SUBJECT_EXPERT') && expertSubjects.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <RateReviewIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Pending Expert Reviews</Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {expertSubjects.map((sub) => (
                                <Grid item xs={12} sm={6} md={4} key={sub.id}>
                                    <Card 
                                        variant="outlined"
                                        sx={{ 
                                            cursor: 'pointer', 
                                            borderRadius: 3,
                                            border: '1px solid #eaeaea',
                                            transition: '0.2s', 
                                            '&:hover': { borderColor: 'primary.main', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' } 
                                        }}
                                        onClick={() => navigate(`/faculty/subject/${sub.id}`)}
                                    >
                                        <CardContent sx={{ p: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{sub.code}</Typography>
                                            <Typography color="textSecondary" sx={{ mb: 2 }}>{sub.name}</Typography>
                                            <Divider sx={{ my: 1.5 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Chip 
                                                    label={`${sub.pendingCount} Pending Reviews`} 
                                                    size="small" 
                                                    color={sub.pendingCount > 0 ? "error" : "success"}
                                                    variant={sub.pendingCount > 0 ? "filled" : "outlined"}
                                                    sx={{ fontWeight: 600 }}
                                                />
                                                <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Grid>
                )}

                {/* 3. HOD Stats View */}
                {activeRoles.includes('HOD') && hodStats && (
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssessmentIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Department Metrics (HOD)</Typography>
                        </Box>
                        <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff' }}>
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                                    Department of {hodStats.department}
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="textSecondary">Total Subjects</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{hodStats.totalSubjects}</Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography variant="caption" color="textSecondary">Active Faculty</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{hodStats.activeFaculty}</Typography>
                                    </Grid>
                                </Grid>
                                <Box sx={{ mb: 1 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" color="textSecondary">Approved Question Bank Progress</Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{hodStats.approvedQuestions} / {hodStats.totalQuestions}</Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={hodStats.totalQuestions > 0 ? (hodStats.approvedQuestions / hodStats.totalQuestions * 100) : 0} 
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* 4. COE Paper generation panel */}
                {activeRoles.includes('COE') && (
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AssignmentIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Exam Paper Composing (COE)</Typography>
                        </Box>
                        <Card variant="outlined" sx={{ borderRadius: 3, border: '1px solid #eaeaea', bgcolor: '#fff', height: '100%' }}>
                            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '90%' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                                    Generated Blueprints
                                </Typography>
                                <List sx={{ mb: 2, p: 0, flexGrow: 1 }}>
                                    {coePapers.map(p => (
                                        <React.Fragment key={p.id}>
                                            <ListItem sx={{ px: 0, py: 1 }}>
                                                <ListItemText 
                                                    primary={p.title} 
                                                    secondary={`Subject: ${p.subjectCode} • Created: ${new Date(p.createdAt).toLocaleDateString()}`}
                                                />
                                                <Chip label={p.status} size="small" color={p.status === 'GENERATED' ? 'success' : 'warning'} />
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                    {coePapers.length === 0 && (
                                        <Typography variant="body2" color="textSecondary">No recent question papers generated.</Typography>
                                    )}
                                </List>
                                <Button 
                                    variant="contained" 
                                    fullWidth
                                    onClick={() => navigate('/admin/compose-paper')}
                                    sx={{ mt: 'auto', bgcolor: '#1a1a1a', color: '#fff', '&:hover': { bgcolor: '#333' } }}
                                >
                                    Compose Question Paper
                                </Button>
                            </CardContent>
                        </Card>
                    </Grid>
                )}

                {/* 5. STAFF Central Progress Tracker */}
                {activeRoles.includes('STAFF') && staffTracker.length > 0 && (
                    <Grid item xs={12}>
                        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GroupIcon sx={{ color: 'primary.main' }} />
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>Course Question Bank Status (Staff)</Typography>
                        </Box>
                        <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #eaeaea', overflow: 'hidden' }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 700 }}>Course Code</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Course Name</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Total Questions</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Approved Questions</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Pending Review</TableCell>
                                        <TableCell sx={{ fontWeight: 700 }}>Progress</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {staffTracker.map((row) => (
                                        <TableRow key={row.subjectCode}>
                                            <TableCell sx={{ fontWeight: 600 }}>{row.subjectCode}</TableCell>
                                            <TableCell>{row.subjectName}</TableCell>
                                            <TableCell>{row.totalQuestions}</TableCell>
                                            <TableCell>{row.approvedQuestions}</TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={row.pendingQuestions} 
                                                    size="small" 
                                                    color={row.pendingQuestions > 0 ? "warning" : "default"} 
                                                />
                                            </TableCell>
                                            <TableCell sx={{ width: '200px' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LinearProgress 
                                                        variant="determinate" 
                                                        value={row.completionPercentage} 
                                                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                                    />
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.completionPercentage}%</Typography>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    </Grid>
                )}
            </Grid>
        </Box>
    );
}
