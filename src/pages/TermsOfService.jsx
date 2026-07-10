import React from 'react';
import { Container, Box, Typography, Divider, Paper } from '@mui/material';

export default function TermsOfService() {
    return (
        <Container maxWidth="md" sx={{ py: 8 }}>
            <Paper variant="outlined" sx={{ p: 5, borderRadius: 4, borderColor: 'divider', bgcolor: 'background.paper' }}>
                <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.5 }}>
                    LEGAL AGREEMENT
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, mt: 1, mb: 2, letterSpacing: '-0.02em', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Terms of Service
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 4 }}>
                    Last Updated: July 10, 2026
                </Typography>
                
                <Divider sx={{ mb: 4 }} />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            1. Acceptance of Terms
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            By accessing or using the Asteriq Academic Operations Platform, you agree to comply with and be bound by these Terms of Service. These terms apply to all registered university administrators, faculty members, subject experts, and academic personnel.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            2. Academic Integrity & Non-Disclosure
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Asteriq is used for the management, creation, and secure handling of sensitive examination questions and blueprints. Users are strictly prohibited from copying, distributing, leaking, or disclosing any content from the Question Bank or generated Question Papers to unauthorized parties. Any violation of exam confidentiality will be subject to strict disciplinary actions under institutional regulations.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            3. Role Assignments & Time-Bound Access
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            Your access to subjects and departments is controlled contextually by the university administration. Role assignments (Faculty, Subject Expert, HOD, COE) are time-bound and active only for the duration specified. You agree not to attempt to bypass access controls or perform actions outside your assigned permissions.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            4. Account Security & Audit Trail
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            You are responsible for safeguarding your credentials and JWT tokens used to log in. To maintain platform integrity and security, all actions performed on Asteriq—including question creation, review logs, comments, status changes, and exports—are permanently logged in an immutable audit trail mapped to your account identity.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            5. Platform Availability
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            While we aim to provide 99.9% uptime, we do not guarantee uninterrupted platform availability. Asteriq reserves the right to conduct scheduled maintenance windows, during which access may be temporarily limited.
                        </Typography>
                    </Box>

                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                            6. Governing Law & Contact
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                            These Terms of Service are governed by the laws of the jurisdiction in which your university is registered, as well as institutional bylaws. For any questions regarding these terms, please contact the System Administrator or email <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>security@asteriq.com</Box>.
                        </Typography>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
