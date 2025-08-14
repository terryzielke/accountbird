// client/src/components/PrimaryUserManageUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import PrimaryUserAddUserForm from './PrimaryUserAddUserForm';
import PrimaryUserUserDetail from './PrimaryUserUserDetail';
import './PrimaryUserManageUsers.css';

const PrimaryUserManageUsers = ({ user, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [view, setView] = useState('list');
    const [selectedUser, setSelectedUser] = useState(null);

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'x-auth-token': token,
        },
    }), [token]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const usersResponse = await axios.get('http://localhost:5001/api/account/users', config);
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

    const handleUserAdded = (msg) => {
        setMessage(msg);
        setView('list');
        fetchUsers();
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/account/users/${userId}`, config);
                setMessage('User deleted successfully!');
                fetchUsers();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
            }
        }
    };

    const handleEditClick = (u) => {
        setSelectedUser(u);
        setView('detail');
    };

    const handleBackClick = () => {
        setSelectedUser(null);
        setView('list');
        fetchUsers();
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (view === 'detail') {
        return <PrimaryUserUserDetail user={selectedUser} onBack={handleBackClick} onLogout={onLogout} />;
    }

    if (view === 'add') {
        return <PrimaryUserAddUserForm onUserAdded={handleUserAdded} onBack={handleBackClick} onLogout={onLogout} />;
    }

    return (
        <div className="manage-users-container">
            <h4>Users in Your Account</h4>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="user-list">
                <ul>
                    {users.length > 0 ? (
                        users.map(u => (
                            <li key={u._id}>
                                <strong>Name:</strong> {u.firstName} {u.lastName}<br />
                                <strong>Email:</strong> {u.email}<br />
                                <strong>Role:</strong> {u.role}<br />
                                <button onClick={() => handleEditClick(u)}>Edit</button>
                                <button onClick={() => handleDeleteUser(u._id)}>Delete</button>
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

export default PrimaryUserManageUsers;