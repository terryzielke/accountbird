// client/src/components/AdminAccountUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import UserDetail from './UserDetail';
import AdminAddUserForm from './AdminAddUserForm'; // Import the new component
import './AdminAccountUsers.css';

const AdminAccountUsers = ({ accountId, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [view, setView] = useState('list');
    const [selectedUser, setSelectedUser] = useState(null);

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const fetchAccountUsers = useCallback(async () => {
        setLoading(true);
        try {
            const usersResponse = await axios.get(`http://localhost:5001/api/admin/accounts/${accountId}/users`, config);
            setUsers(usersResponse.data);
            setError('');
        } catch (err) {
            console.error('Error fetching account users:', err);
            setError(err.response?.data?.msg || 'Failed to fetch account users.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [onLogout, config, accountId]);

    useEffect(() => {
        if (!token) {
            onLogout();
            return;
        }
        fetchAccountUsers();
    }, [token, onLogout, fetchAccountUsers]);

    const handleUserAdded = () => {
        setMessage('User added successfully!');
        setView('list');
        fetchAccountUsers();
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/users/${userId}`, config);
                setMessage('User deleted successfully!');
                fetchAccountUsers();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
            }
        }
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setView('detail');
    };

    const handleBackClick = () => {
        setSelectedUser(null);
        setView('list');
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (view === 'detail') {
        return <UserDetail user={selectedUser} onBack={handleBackClick} onLogout={onLogout} />;
    }

    if (view === 'add') {
        return <AdminAddUserForm accountId={accountId} onUserAdded={handleUserAdded} onBack={handleBackClick} onLogout={onLogout} />;
    }

    return (
        <div className="account-users-container">
            <h4>Users in this Account</h4>
            <div className="user-list">
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}
                <ul>
                    {users.length > 0 ? (
                        users.map(user => (
                            <li key={user._id}>
                                <strong>Name:</strong> {user.firstName} {user.lastName}<br />
                                <strong>Email:</strong> {user.email}<br />
                                <strong>Role:</strong> {user.role}<br />
                                <button onClick={() => handleEditClick(user)}>Edit</button>
                                <button onClick={() => handleDeleteUser(user._id)}>Delete</button>
                            </li>
                        ))
                    ) : (
                        <p>No users found for this account.</p>
                    )}
                </ul>
            </div>
            <button onClick={() => setView('add')} className="secondary-btn">Add New User</button>
        </div>
    );
};

export default AdminAccountUsers;