import axios from 'axios';
import axiosRetry from 'axios-retry';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Fix #11: Auto-retry on transient failures (Render cold starts, network blips)
axiosRetry(api, {
    retries: 2,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        // Retry on network errors or 5xx server errors (NOT on 4xx client errors)
        return !error.response || error.response.status >= 500;
    },
});

// Add a request interceptor to attach JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (!error.response) {
            // Network error — axios-retry already handles retries above
            console.error("Server is unavailable.");
        } else if (error.response.status === 401) {
            // Fix #12: Only clear token on 401 (expired/invalid token)
            // 403 means "permission denied" — user is logged in but not authorized for this action
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else if (error.response.status === 429) {
            // Rate limited — show a user-friendly message
            alert("Too many requests. Please wait a moment and try again.");
        }
        return Promise.reject(error);
    }
);

export default api;
