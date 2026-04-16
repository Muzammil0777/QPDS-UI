import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const FacultyRoute = ({ children }) => {
    const { validateToken } = useAuth();
    const decoded = validateToken();

    if (!decoded) return <Navigate to="/login" replace />;
    if (decoded.role !== 'FACULTY') return <Navigate to="/" replace />;

    return children;
};

export default FacultyRoute;
