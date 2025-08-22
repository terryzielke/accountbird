// client/src/components/ManageUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AdminManageUsers.css';

const AdminManageUsers = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'x-auth-token': token,
        },
    }), [token]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const usersResponse = await axios.get('http://localhost:5001/api/admin/users', config);
            setUsers(usersResponse.data);
            setError('');
        } catch (err) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.msg || 'Failed to fetch users.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [onLogout, config]);

    useEffect(() => {
        if (!token) {
            onLogout();
            return;
        }
        fetchUsers();
    }, [token, onLogout, fetchUsers]);

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="content">
            <header className="header">
                <h3>All Users</h3>
            </header>
            <ul>
                {users.length > 0 ? (
                    users.map(user => (
                        <li key={user._id}>
                            <strong>Name:</strong> {user.firstName} {user.lastName}<br />
                            <strong>Email:</strong> {user.email}<br />
                            <strong>Role:</strong> {user.role}<br />
                        </li>
                    ))
                ) : (
                    <p>No regular users found.</p>
                )}
            </ul>
        </div>
    );
};

export default AdminManageUsers;