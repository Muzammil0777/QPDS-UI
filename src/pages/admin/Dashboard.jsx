import React from 'react';
import { Typography } from '@mui/material';

export default function AdminDashboard() {
    return (
        <div>
            <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
            <Typography paragraph>
                Welcome, Admin. Use the sidebar to manage faculty, subjects, and course outcomes.
            </Typography>
        </div>
    );
}
