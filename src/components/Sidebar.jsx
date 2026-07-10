import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import SubjectIcon from '@mui/icons-material/Subject';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SchoolIcon from '@mui/icons-material/School';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ArticleIcon from '@mui/icons-material/Article';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import SettingsIcon from '@mui/icons-material/Settings';
import { jwtDecode } from 'jwt-decode';

const drawerWidth = 240;

export default function Sidebar() {
    const location = useLocation();
    const token = localStorage.getItem('token');
    
    let role = null;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            role = decoded.role;
        } catch (e) {
            console.error('Failed to decode token in Sidebar', e);
        }
    }

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
        { text: 'Faculty Management', icon: <PeopleIcon />, path: '/admin/faculty' },
        { text: 'Subject Management', icon: <SubjectIcon />, path: '/admin/subjects' },
        { text: 'Course Outcomes', icon: <SchoolIcon />, path: '/admin/course-outcomes' },
        { text: 'Question Paper', icon: <ArticleIcon />, path: '/admin/question-paper' },
        { text: 'Question Bank', icon: <SubjectIcon />, path: '/admin/question-bank' },
    ];

    // Admin & Super Admin get access to advanced contextual assignments manager
    if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        menuItems.push({ 
            text: 'Assignment Manager', 
            icon: <AssignmentTurnedInIcon />, 
            path: '/admin/assignments' 
        });
    }

    // Only SUPER_ADMIN can view and edit global system parameters
    if (role === 'SUPER_ADMIN') {
        menuItems.push({ 
            text: 'System Settings', 
            icon: <SettingsIcon />, 
            path: '/superadmin/settings' 
        });
    }

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { 
                    width: drawerWidth, 
                    boxSizing: 'border-box', 
                    mt: 8,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default'
                },
                display: { print: 'none' }, // Hide in print mode
            }}
        >
            <Toolbar />
            <Box sx={{ overflow: 'auto', py: 2 }}>
                <List sx={{ px: 1.5 }}>
                    {menuItems.map((item) => {
                        const isSelected = location.pathname === item.path;
                        return (
                            <ListItem
                                key={item.text}
                                disablePadding
                                sx={{ mb: 0.5 }}
                            >
                                <ListItemButton
                                    component={Link}
                                    to={item.path}
                                    selected={isSelected}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        px: 2,
                                        color: isSelected ? 'primary.main' : 'text.secondary',
                                        '&.Mui-selected': {
                                            bgcolor: 'rgba(30, 58, 138, 0.06)',
                                            color: 'primary.main',
                                            fontWeight: 700,
                                            '&:hover': {
                                                bgcolor: 'rgba(30, 58, 138, 0.1)'
                                            }
                                        },
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.03)',
                                            borderRadius: 2
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{ 
                                        color: isSelected ? 'primary.main' : 'text.secondary',
                                        minWidth: 36
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={item.text} 
                                        primaryTypographyProps={{ 
                                            fontWeight: isSelected ? 700 : 500,
                                            fontSize: '0.875rem'
                                        }} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </Drawer>
    );
}
