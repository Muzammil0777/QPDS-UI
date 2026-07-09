import React, { useEffect, useState } from 'react';
import { 
    Typography, 
    MenuItem, 
    TextField, 
    Button, 
    Box, 
    Alert, 
    Card, 
    CardContent, 
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import api from '../../services/api';

export default function AssignmentManager() {
    const [assignments, setAssignments] = useState([]);
    const [facultyList, setFacultyList] = useState([]);
    const [subjectList, setSubjectList] = useState([]);
    const [deptList, setDeptList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    // Dialog state
    const [openDialog, setOpenDialog] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        userId: '',
        roleType: 'FACULTY',
        contextType: 'SUBJECT', // 'SUBJECT' or 'DEPARTMENT'
        subjectId: '',
        department: '',
        validFrom: '',
        validUntil: '',
        delegatedFromUserId: '',
        isActive: true
    });

    const roles = ['FACULTY', 'SUBJECT_EXPERT', 'HOD', 'COE', 'STAFF'];

    // Get current date and one year from now formatted for datetime-local
    const formatDateForInput = (date) => {
        const d = new Date(date);
        const pad = (num) => String(num).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [assignRes, facRes, subRes, settingsRes] = await Promise.all([
                api.get('/api/assignments'),
                api.get('/admin/faculty'),
                api.get('/api/subjects'),
                api.get('/api/settings')
            ]);
            setAssignments(assignRes.data);
            setFacultyList(facRes.data.filter(f => f.isApproved && f.isActive));
            setSubjectList(subRes.data);
            
            if (settingsRes.data.departments) {
                // If it is returned as array or comma separated string
                const depts = Array.isArray(settingsRes.data.departments) 
                    ? settingsRes.data.departments 
                    : settingsRes.data.departments.split(',').map(d => d.trim()).filter(Boolean);
                setDeptList(depts);
            }
        } catch (error) {
            console.error('Failed to load assignments data', error);
            setMessage({ type: 'error', text: 'Error loading required assignment data.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const resetForm = () => {
        const now = new Date();
        const nextYear = new Date();
        nextYear.setFullYear(now.getFullYear() + 1);

        setFormData({
            userId: '',
            roleType: 'FACULTY',
            contextType: 'SUBJECT',
            subjectId: '',
            department: '',
            validFrom: formatDateForInput(now),
            validUntil: formatDateForInput(nextYear),
            delegatedFromUserId: '',
            isActive: true
        });
        setEditingAssignment(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setOpenDialog(true);
    };

    const handleOpenEdit = (assign) => {
        setEditingAssignment(assign);
        setFormData({
            userId: assign.user_id,
            roleType: assign.role_type,
            contextType: assign.department ? 'DEPARTMENT' : 'SUBJECT',
            subjectId: assign.subject_id || '',
            department: assign.department || '',
            validFrom: formatDateForInput(assign.valid_from),
            validUntil: formatDateForInput(assign.valid_until),
            delegatedFromUserId: assign.delegated_from_user_id || '',
            isActive: assign.is_active
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        resetForm();
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleActive = (e) => {
        setFormData(prev => ({ ...prev, isActive: e.target.checked }));
    };

    const handleSubmit = async () => {
        setMessage({ type: '', text: '' });
        
        // Validation
        if (!formData.userId || !formData.roleType || !formData.validUntil) {
            setMessage({ type: 'error', text: 'Please fill in all required fields.' });
            return;
        }

        const payload = {
            userId: formData.userId,
            roleType: formData.roleType,
            validFrom: new Date(formData.validFrom).toISOString(),
            validUntil: new Date(formData.validUntil).toISOString(),
            delegatedFromUserId: formData.delegatedFromUserId || null,
            isActive: formData.isActive
        };

        if (formData.contextType === 'SUBJECT') {
            if (!formData.subjectId) {
                setMessage({ type: 'error', text: 'Please select a Subject.' });
                return;
            }
            payload.subjectId = formData.subjectId;
            payload.department = null;
        } else {
            if (!formData.department) {
                setMessage({ type: 'error', text: 'Please select/enter a Department.' });
                return;
            }
            payload.department = formData.department;
            payload.subjectId = null;
        }

        try {
            if (editingAssignment) {
                // Update assignment path
                await api.put(`/api/assignments/${editingAssignment.id}`, {
                    validFrom: payload.validFrom,
                    validUntil: payload.validUntil,
                    isActive: payload.isActive,
                    delegatedFromUserId: payload.delegatedFromUserId
                });
                setMessage({ type: 'success', text: 'Assignment updated successfully.' });
            } else {
                // Create assignment path
                await api.post('/api/assignments', payload);
                setMessage({ type: 'success', text: 'New assignment created successfully.' });
            }
            handleCloseDialog();
            fetchAllData();
        } catch (error) {
            console.error('Failed to submit assignment', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Operation failed. Please verify dates.' 
            });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this assignment?')) return;
        setMessage({ type: '', text: '' });
        try {
            await api.delete(`/api/assignments/${id}`);
            setMessage({ type: 'success', text: 'Assignment deleted successfully.' });
            fetchAllData();
        } catch (error) {
            console.error('Delete assignment failed', error);
            setMessage({ type: 'error', text: 'Failed to delete assignment.' });
        }
    };

    const isExpired = (untilStr) => {
        return new Date(untilStr) < new Date();
    };

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading Assignment Manager...</Typography></Box>;
    }

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600 }}>Assignment Manager</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Manage academic assignments (Faculty, Subject Expert, HOD, COE, Staff) with semester-bound validity.
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenCreate}
                    sx={{ borderRadius: 2, px: 3, textTransform: 'none', fontWeight: 600 }}
                >
                    Create Assignment
                </Button>
            </Box>

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 600 }}>User / Academic</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Assigned Role</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Context Scope</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Validity Window</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Delegated From</TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 600 }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {assignments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <Typography color="text.secondary">No assignments found. Click 'Create Assignment' to assign roles.</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            assignments.map((assign) => {
                                const expired = isExpired(assign.valid_until);
                                return (
                                    <TableRow key={assign.id} hover>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{assign.userName}</Typography>
                                            <Typography variant="caption" color="text.secondary">{assign.userEmail}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={assign.role_type} 
                                                color={
                                                    assign.role_type === 'HOD' ? 'primary' :
                                                    assign.role_type === 'COE' ? 'secondary' :
                                                    assign.role_type === 'SUBJECT_EXPERT' ? 'info' : 'default'
                                                }
                                                size="small"
                                                sx={{ fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {assign.subject_id ? (
                                                <Tooltip title={assign.subjectName}>
                                                    <Typography variant="body2">{assign.subjectCode}</Typography>
                                                </Tooltip>
                                            ) : (
                                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                                    Dept: {assign.department}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="caption" display="block">
                                                From: {new Date(assign.valid_from).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="caption" display="block" color={expired ? 'error.main' : 'text.secondary'}>
                                                Until: {new Date(assign.valid_until).toLocaleDateString()} {expired && '(Expired)'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {assign.delegatedFromName ? (
                                                <Chip label={`From: ${assign.delegatedFromName}`} size="small" variant="outlined" />
                                            ) : (
                                                <Typography variant="caption" color="text.secondary">-</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {assign.is_active && !expired ? (
                                                <Chip icon={<CheckCircleIcon />} label="Active" color="success" size="small" variant="light" />
                                            ) : (
                                                <Chip icon={<CancelIcon />} label={expired ? "Expired" : "Inactive"} color="error" size="small" variant="outlined" />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton color="primary" onClick={() => handleOpenEdit(assign)} size="small">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => handleDelete(assign.id)} size="small">
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Create/Edit Assignment Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {editingAssignment ? 'Modify Assignment Window' : 'Assign Contextual Role'}
                </DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={3} sx={{ mt: 0.5 }}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Academic User"
                                name="userId"
                                value={formData.userId}
                                onChange={handleFormChange}
                                disabled={!!editingAssignment}
                                fullWidth
                                required
                            >
                                {facultyList.map((f) => (
                                    <MenuItem key={f.id} value={f.id}>{f.name} ({f.email})</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Contextual Role Type"
                                name="roleType"
                                value={formData.roleType}
                                onChange={handleFormChange}
                                disabled={!!editingAssignment}
                                fullWidth
                                required
                            >
                                {roles.map((r) => (
                                    <MenuItem key={r} value={r}>{r}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Scope Context"
                                name="contextType"
                                value={formData.contextType}
                                onChange={handleFormChange}
                                disabled={!!editingAssignment}
                                fullWidth
                                required
                            >
                                <MenuItem value="SUBJECT">Subject-bound</MenuItem>
                                <MenuItem value="DEPARTMENT">Department-wide</MenuItem>
                            </TextField>
                        </Grid>

                        {formData.contextType === 'SUBJECT' ? (
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="Target Subject"
                                    name="subjectId"
                                    value={formData.subjectId}
                                    onChange={handleFormChange}
                                    disabled={!!editingAssignment}
                                    fullWidth
                                    required
                                >
                                    {subjectList.map((sub) => (
                                        <MenuItem key={sub.id} value={sub.id}>{sub.code} - {sub.name}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                        ) : (
                            <Grid item xs={12}>
                                <TextField
                                    select
                                    label="Target Department"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleFormChange}
                                    disabled={!!editingAssignment}
                                    fullWidth
                                    required
                                >
                                    {deptList.length === 0 ? (
                                        <MenuItem value="">-- Configure departments in System Settings first --</MenuItem>
                                    ) : (
                                        deptList.map((dept) => (
                                            <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                                        ))
                                    )}
                                </TextField>
                            </Grid>
                        )}

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Valid From"
                                name="validFrom"
                                type="datetime-local"
                                value={formData.validFrom}
                                onChange={handleFormChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Valid Until (Expiry)"
                                name="validUntil"
                                type="datetime-local"
                                value={formData.validUntil}
                                onChange={handleFormChange}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Delegated From (Optional)"
                                name="delegatedFromUserId"
                                value={formData.delegatedFromUserId}
                                onChange={handleFormChange}
                                fullWidth
                                helperText="To delegate responsibilities temporarily from another faculty member."
                            >
                                <MenuItem value="">-- None (Direct Assignment) --</MenuItem>
                                {facultyList.map((f) => (
                                    <MenuItem key={f.id} value={f.id}>{f.name} ({f.email})</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControlLabel
                                control={
                                    <Switch 
                                        checked={formData.isActive} 
                                        onChange={handleToggleActive} 
                                        color="primary"
                                    />
                                }
                                label="Assignment Status is Active"
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleCloseDialog} color="inherit" sx={{ textTransform: 'none' }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        sx={{ textTransform: 'none', px: 3 }}
                    >
                        {editingAssignment ? 'Save Changes' : 'Confirm Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
