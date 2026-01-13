import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import SubjectIcon from '@mui/icons-material/Subject';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'Faculty Management', icon: <PeopleIcon />, path: '/admin/faculty' },
    { text: 'Subject Management', icon: <SubjectIcon />, path: '/admin/subjects' },
    { text: 'Assign Subjects', icon: <AssignmentIndIcon />, path: '/admin/assign' },
    { text: 'Course Outcomes', icon: <SchoolIcon />, path: '/admin/course-outcomes' },
    { text: 'Question Paper', icon: <ArticleIcon />, path: '/admin/question-paper' },
    { text: 'Question Bank', icon: <SubjectIcon />, path: '/admin/question-bank' },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', mt: 8 }, // mt: 8 to clear AppBar
                display: { print: 'none' }, // Hide in print mode
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
                <List>
                    {menuItems.map((item) => (
                        <ListItem
                            button
                            key={item.text}
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                        >
                            <ListItemIcon>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItem>
                    ))}
                </List>
            </Box>
        </Drawer>
    );
}
