import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AdminRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;

    try {
        const decoded = jwtDecode(token);
        if (decoded.role !== 'ADMIN') { // Adjust role string based on backend
            return <Navigate to="/" replace />;
        }
    } catch (e) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default AdminRoute;
