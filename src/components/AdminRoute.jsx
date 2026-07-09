import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminRoute = ({ children }) => {
    const { validateToken } = useAuth();
    const decoded = validateToken();

    if (!decoded) return <Navigate to="/login" replace />;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(decoded.role)) return <Navigate to="/" replace />;

    return children;
};

export default AdminRoute;
