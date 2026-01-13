import React, { useEffect, useState } from 'react';
import { Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from '@mui/material';
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
                            <TableRow key={fac.id}>
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
                                    <Chip label={fac.isApproved ? "Approved" : "Pending"} color={fac.isApproved ? "success" : "warning"} />
                                </TableCell>
                                <TableCell>
                                    {!fac.isApproved && (
                                        <Button variant="contained" size="small" onClick={() => handleApprove(fac.id)}>
                                            Approve
                                        </Button>
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
        </div>
    );
}
