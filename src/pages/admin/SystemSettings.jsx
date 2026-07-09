import React, { useEffect, useState } from 'react';
import { 
    Typography, 
    TextField, 
    Button, 
    Box, 
    Alert, 
    Card, 
    CardContent, 
    MenuItem, 
    Grid, 
    Divider,
    IconButton,
    Tooltip
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import { jwtDecode } from 'jwt-decode';
import api from '../../services/api';

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        allowed_email_domains: '',
        departments: '',
        active_ai_provider: 'HUGGING_FACE',
        ai_endpoint_url: '',
        approval_workflow: 'DRAFT,PENDING_REVIEW,APPROVED'
    });
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setIsSuperAdmin(decoded.role === 'SUPER_ADMIN');
            } catch (e) {
                console.error(e);
            }
        }

        const fetchSettings = async () => {
            try {
                const res = await api.get('/api/settings');
                // Ensure arrays are converted to comma-separated strings for inputs
                const formatted = {};
                for (const [key, val] of Object.entries(res.data)) {
                    if (Array.isArray(val)) {
                        formatted[key] = val.join(', ');
                    } else {
                        formatted[key] = val;
                    }
                }
                setSettings(prev => ({ ...prev, ...formatted }));
            } catch (error) {
                console.error('Failed to load settings', error);
                setMessage({ type: 'error', text: 'Failed to load system configurations.' });
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!isSuperAdmin) return;
        setMessage({ type: '', text: '' });

        // Prepare payload, parsing lists
        const payload = {};
        for (const [key, val] of Object.entries(settings)) {
            if (['allowed_email_domains', 'departments', 'approval_workflow'].includes(key)) {
                payload[key] = val.split(',').map(s => s.trim()).filter(Boolean);
            } else {
                payload[key] = val;
            }
        }

        try {
            const res = await api.put('/api/settings', payload);
            setMessage({ type: 'success', text: 'System settings updated successfully.' });
            if (res.data.settings) {
                const formatted = {};
                for (const [key, val] of Object.entries(res.data.settings)) {
                    if (Array.isArray(val)) {
                        formatted[key] = val.join(', ');
                    } else {
                        formatted[key] = val;
                    }
                }
                setSettings(prev => ({ ...prev, ...formatted }));
            }
        } catch (error) {
            console.error('Failed to save settings', error);
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.error || 'Failed to update system settings.' 
            });
        }
    };

    if (loading) {
        return <Box sx={{ p: 3 }}><Typography>Loading configurations...</Typography></Box>;
    }

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
                <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h4" sx={{ fontWeight: 600 }}>System Settings</Typography>
            </Box>

            {!isSuperAdmin && (
                <Alert severity="info" icon={<LockIcon />} sx={{ mb: 3 }}>
                    You are viewing these settings in <strong>Read-Only mode</strong>. Only the Super Administrator of this deployment can modify configurations.
                </Alert>
            )}

            {message.text && (
                <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage({ type: '', text: '' })}>
                    {message.text}
                </Alert>
            )}

            <Card variant="outlined" sx={{ borderRadius: 3, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        Institution Policy
                        <Tooltip title="Core parameters defining university domain policies and academic divisions.">
                            <IconButton size="small"><InfoIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Allowed Email Domains"
                                name="allowed_email_domains"
                                value={settings.allowed_email_domains}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                fullWidth
                                helperText="Comma-separated list of authorized domains (e.g. msruas.ac.in, ruas.ac.in). User registration will be restricted to these."
                                placeholder="msruas.ac.in, ruas.ac.in"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Academic Departments"
                                name="departments"
                                value={settings.departments}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                fullWidth
                                helperText="Comma-separated list of recognized academic departments."
                                placeholder="CSE, ECE, ME, CE"
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        AI Configuration
                        <Tooltip title="Provider-independent abstraction settings. Point to external vendors or on-premise local servers.">
                            <IconButton size="small"><InfoIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Active AI Provider"
                                name="active_ai_provider"
                                value={settings.active_ai_provider}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                fullWidth
                            >
                                <MenuItem value="HUGGING_FACE">Hugging Face Inference API</MenuItem>
                                <MenuItem value="GEMINI">Google Gemini Pro API</MenuItem>
                                <MenuItem value="ON_PREMISE">On-Premise Local Server (OpenAI API Compatible)</MenuItem>
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="AI Endpoint URL"
                                name="ai_endpoint_url"
                                value={settings.ai_endpoint_url || ''}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                fullWidth
                                placeholder="http://localhost:11434/v1"
                                helperText="Required for On-Premise deployments (e.g. local Ollama or vLLM server endpoint)."
                            />
                        </Grid>
                    </Grid>

                    <Divider sx={{ my: 4 }} />

                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                        Workflow & Review Stages
                        <Tooltip title="Configure custom multi-stage approval workflow paths without schema modifications.">
                            <IconButton size="small"><InfoIcon sx={{ fontSize: 18 }} /></IconButton>
                        </Tooltip>
                    </Typography>

                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <TextField
                                label="Approval Workflow Stages"
                                name="approval_workflow"
                                value={settings.approval_workflow}
                                onChange={handleChange}
                                disabled={!isSuperAdmin}
                                fullWidth
                                helperText="Comma-separated sequence of audit trail stages (e.g. DRAFT, PENDING_REVIEW, APPROVED)."
                            />
                        </Grid>
                    </Grid>

                    {isSuperAdmin && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                            <Button 
                                variant="contained" 
                                size="large"
                                onClick={handleSave}
                                sx={{ 
                                    borderRadius: 2, 
                                    px: 4, 
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: '0 4px 14px rgba(25, 118, 210, 0.4)'
                                }}
                            >
                                Save System Configurations
                            </Button>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
