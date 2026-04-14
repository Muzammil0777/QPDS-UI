import React, { useEffect, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../../services/api';

export default function FacultyManagement() {
    const [faculty, setFaculty] = useState([]);

    const [debugInfo, setDebugInfo] = useState('');

    const fetchFaculty = async () => {
        try {
            const response = await api.get('/admin/faculty');
            console.log('Fetched faculty:', response.data);
            setFaculty(response.data);
            setDebugInfo(`Success. Items: ${response.data.length}`);
        } catch (error) {
            console.error('Failed to fetch faculty', error);
            const errMsg = error.response ? `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}` : error.message;
            setDebugInfo(`Error: ${errMsg}`);
        }
    };

    useEffect(() => {
        fetchFaculty();
    }, []);

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/approve/${id}`);
            fetchFaculty();
        } catch (error) {
            alert('Approval failed');
        }
    };

    const handleDeny = async (id) => {
        if (!window.confirm("Are you sure you want to deny (delete) this request?")) return;
        try {
            await api.post(`/admin/deny/${id}`);
            fetchFaculty();
        } catch (error) {
            alert('Deny failed');
        }
    };

    const handleDeactivate = async (id) => {
        if (!window.confirm("Are you sure you want to deactivate this faculty member? They will not be able to log in, but their questions will remain.")) return;
        try {
            await api.put(`/admin/deactivate-user/${id}`);
            fetchFaculty();
        } catch (error) {
            alert('Deactivate failed');
        }
    };

    const handleReactivate = async (id) => {
        if (!window.confirm("Are you sure you want to reactivate this faculty member?")) return;
        try {
            await api.put(`/admin/reactivate-user/${id}`);
            fetchFaculty();
        } catch (error) {
            alert('Reactivate failed');
        }
    };

    // Edit Logic
    const [editOpen, setEditOpen] = useState(false);
    const [editData, setEditData] = useState({ id: '', name: '', designation: '' });

    const handleEditClick = (fac) => {
        setEditData({ id: fac.id, name: fac.name, designation: fac.designation || '' });
        setEditOpen(true);
    };

    const handleEditSave = async () => {
        try {
            await api.put(`/admin/faculty/${editData.id}`, {
                name: editData.name,
                designation: editData.designation
            });
            setEditOpen(false);
            fetchFaculty();
        } catch (err) {
            alert('Update failed');
        }
    };

    return (
        <div>
            <Typography variant="h5" gutterBottom>Faculty Management</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Assigned Subjects</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Designation</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {faculty.map((fac) => (
                            <TableRow key={fac.id} sx={{ opacity: fac.isApproved && !fac.isActive ? 0.5 : 1 }}>
                                <TableCell>{fac.name}</TableCell>
                                <TableCell>
                                    {fac.subjects && fac.subjects.length > 0 ? (
                                        fac.subjects.map((sub, index) => (
                                            <div key={index} style={{ fontSize: '0.85rem' }}>• {sub}</div>
                                        ))
                                    ) : (
                                        <span style={{ color: '#aaa' }}>-</span>
                                    )}
                                </TableCell>
                                <TableCell>{fac.email}</TableCell>
                                <TableCell>{fac.designation}</TableCell>
                                <TableCell>
                                    {!fac.isApproved ? (
                                        <Chip label="Pending" color="warning" />
                                    ) : fac.isActive ? (
                                        <Chip label="Active" color="success" />
                                    ) : (
                                        <Chip label="Deactivated" color="default" />
                                    )}
                                </TableCell>
                                <TableCell>
                                    {!fac.isApproved && (
                                        <Box>
                                            <Button variant="contained" size="small" onClick={() => handleApprove(fac.id)} sx={{ mr: 1 }}>
                                                Approve
                                            </Button>
                                            <Button variant="contained" color="error" size="small" onClick={() => handleDeny(fac.id)}>
                                                Deny
                                            </Button>
                                        </Box>
                                    )}
                                    {fac.isApproved && (
                                        <Box>
                                            <IconButton onClick={() => handleEditClick(fac)} color="primary" title="Edit">
                                                <EditIcon />
                                            </IconButton>
                                            {fac.isActive ? (
                                                <IconButton onClick={() => handleDeactivate(fac.id)} color="warning" title="Deactivate">
                                                    <BlockIcon />
                                                </IconButton>
                                            ) : (
                                                <IconButton onClick={() => handleReactivate(fac.id)} color="success" title="Reactivate">
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            )}
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {faculty.length === 0 && (
                <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                    No faculty members found.
                </Typography>
            )}
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                Debug: {debugInfo}
            </Typography>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
                <DialogTitle>Edit Faculty</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    />
                    <TextField
                        select
                        margin="dense"
                        label="Designation"
                        fullWidth
                        value={editData.designation}
                        onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
                    >
                        {['HOD', 'Professor', 'Associate Professor', 'Assistant Professor'].map((option) => (
                            <MenuItem key={option} value={option}>
                                {option}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditOpen(false)}>Cancel</Button>
                    <Button onClick={handleEditSave} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
