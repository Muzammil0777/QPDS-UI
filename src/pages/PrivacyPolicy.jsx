import React from 'react';
import { Container, Box, Typography, Divider, Paper } from '@mui/material';

export default function PrivacyPolicy() {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper variant="outlined" sx={{ p: 5, borderRadius: 4, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                    CONFIDENTIALITY & DATA PROTECTION
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 2, letterSpacing: '-0.02em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Privacy Policy
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 4 }}>
                    Last Updated: July 10, 2026
                </Typography>
                
                <Divider sx={{ mb: 4 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            1. Information Collection
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Asteriq collects and processes minimal personal data required for secure institutional operations. This includes your name, institutional email address, hashed password, role designation, and department details. We also collect automated system access data, such as IP addresses, login histories, and user action timestamps.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            2. Purpose of Data Processing
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            All personal data is processed strictly for authentication, secure role-based routing (RBAC), and compliance tracking. User identities are linked directly to created questions, review comment logs, HOD endorsements, and exam paper exports to establish a comprehensive, tamper-proof academic audit trail.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            3. Data Security Architecture
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            We implement industry-standard security measures to safeguard your credentials and content. All communications are encrypted in transit over HTTPS. Passwords are securely hashed, and session states are managed using cryptographically signed JSON Web Tokens (JWT) that expire automatically.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            4. Retention & Logs
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            To preserve academic accountability, audit log mappings (e.g., who approved a question, who generated a paper) and question revision histories are retained indefinitely. Other operational data is stored in accordance with your university's data preservation policies.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            5. Sharing & Disclosures
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Asteriq does not sell, lease, or share personal data with external third parties. Access to your information is strictly limited to authorized administrators within your university network.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            6. Contact & Inquiries
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            If you have concerns about how your data is handled or wish to inquire about privacy controls, please reach out to your university's IT administration or contact our compliance team at <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>privacy@asteriq.com</Box>.
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
