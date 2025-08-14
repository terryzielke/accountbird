// client/src/components/ManageUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './ManageUsers.css';

const ManageUsers = ({ onLogout }) => {
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

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            const body = { role: newRole };
            await axios.put(`http://localhost:5001/api/admin/user/${userId}`, body, config);
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user role.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/user/${userId}`, config);
                fetchUsers();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
            }
        }
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="manage-users-container">
            <h3>All Users</h3>
            <ul>
                {users.length > 0 ? (
                    users.map(user => (
                        <li key={user._id}>
                            <strong>Name:</strong> {user.firstName} {user.lastName}<br />
                            <strong>Email:</strong> {user.email}<br />
                            <strong>Role:</strong> {user.role}<br />
                            <button onClick={() => handleUpdateUserRole(user._id, user.role === 'subscriber' ? 'contributor' : 'subscriber')}>
                                Toggle to {user.role === 'subscriber' ? 'Contributor' : 'Subscriber'}
                            </button>
                            <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No regular users found.</p>
                )}
            </ul>
        </div>
    );
};

export default ManageUsers;