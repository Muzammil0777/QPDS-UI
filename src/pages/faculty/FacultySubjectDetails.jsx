import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Box, Paper, List, ListItem, ListItemText, Divider, Chip, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import api from '../../services/api';

export default function FacultySubjectDetails() {
    const { subjectId } = useParams();
    const navigate = useNavigate();
    const [subject, setSubject] = useState(null); // We might need an endpoint for single subject or find from list
    const [cos, setCos] = useState([]);
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        // Fetch Subject Details (Currently we store list in dashboard, but here we can fetch from generic subjects if available, or just fetch filtered COs and Questions)
        // Since we don't have a direct "Get Subject By ID" for generic info exposed easily without params, 
        // We'll rely on COs and Questions fetching. Ideally we'd have `GET /api/subjects/:id`.
        // Let's assume we can get COs and Questions and maybe infer name or fetch subject list again.

        // Fetch COs (using the new endpoint I added)
        api.get(`/api/subjects/${subjectId}/course-outcomes`)
            .then(res => setCos(res.data))
            .catch(err => console.error(err));

        // Fetch Questions
        api.get(`/api/questions?subjectId=${subjectId}`)
            .then(res => setQuestions(res.data))
            .catch(err => console.error(err));

    }, [subjectId]);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Subject Details</Typography>

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" gutterBottom>Course Outcomes</Typography>
                <Paper>
                    <List>
                        {cos.length > 0 ? cos.map((co) => (
                            <React.Fragment key={co.id}>
                                <ListItem>
                                    <ListItemText
                                        primary={co.coCode}
                                        secondary={co.description}
                                    />
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        )) : <Box p={2}>No Course Outcomes found.</Box>}
                    </List>
                </Paper>
            </Box>

            <Box sx={{ my: 4 }}>
                <Typography variant="h5" gutterBottom>Questions Bank</Typography>
                <Paper>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Question Info</TableCell>
                                <TableCell>CO Mapped</TableCell>
                                <TableCell>Created At</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {questions.length > 0 ? questions.map((q) => (
                                <TableRow key={q.id}>
                                    <TableCell>
                                        <div style={{ maxHeight: '100px', overflow: 'hidden' }}>
                                            {/* Render a snippet or title if possible. EditorJs data is complex JSON. */}
                                            {/* Just showing "Question ID" or snippet might be tricky without parsing. */}
                                            {/* Let's Try to show first block text */}
                                            {q.editorData?.blocks?.[0]?.data?.text || "Untitled Question"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {/* We need to map CO ID to Code? Or just show ID? */}
                                        {/* Ideally backend populates CO Code. Currently q.courseOutcomeId is ID. */}
                                        {/* We can match with `cos` list */}
                                        {cos.find(c => c.id === q.courseOutcomeId)?.coCode || "-"}
                                    </TableCell>
                                    <TableCell>{new Date(q.createdAt).toLocaleDateString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3}>No questions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Paper>
            </Box>
        </Box>
    );
}
