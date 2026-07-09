import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1E3A8A', // Midnight Blue
            dark: '#1D4ED8', // Primary Hover
            contrastText: '#ffffff',
        },
        secondary: {
            main: '#475569', // Slate
            contrastText: '#ffffff',
        },
        background: {
            default: '#ffffff', // Bright, clean white interface
            paper: '#f8fafc',   // Secondary background for cards/tables/panels
        },
        text: {
            primary: '#111827',   // Heading and important content
            secondary: '#475569', // Descriptions, metadata, helpers
        },
        divider: '#e5e7eb', // Thin border divider
        success: {
            main: '#059669',
        },
        warning: {
            main: '#d97706',
        },
        error: {
            main: '#dc2626',
        },
    },
    typography: {
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        h1: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 800,
            color: '#111827',
        },
        h2: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 800,
            color: '#111827',
        },
        h3: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 700,
            color: '#111827',
        },
        h4: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 700,
            color: '#111827',
        },
        h5: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 600,
            color: '#111827',
        },
        h6: {
            fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
            fontWeight: 600,
            color: '#111827',
        },
        button: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 600,
            textTransform: 'none', // Avoid uppercase buttons
        },
        body1: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 400,
        },
        body2: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontWeight: 400,
        },
    },
    shape: {
        borderRadius: 12, // Consistent 12px border radius
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    textTransform: 'none',
                    fontWeight: 600,
                    padding: '8px 16px',
                },
                containedPrimary: {
                    backgroundColor: '#1E3A8A',
                    '&:hover': {
                        backgroundColor: '#1D4ED8',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    boxShadow: 'none',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: 'none',
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
        MuiTableCell: {
            styleOverrides: {
                head: {
                    fontFamily: 'Inter, system-ui, sans-serif',
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e5e7eb',
                },
                body: {
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderBottom: '1px solid #e5e7eb',
                },
            },
        },
    },
});

export default theme;
