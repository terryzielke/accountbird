// client/src/components/AdminAccountUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import UserDetail from './UserDetail';
import AddUserForm from './AdminAddUserForm';
import './AdminAccountUsers.css';

const AdminAccountUsers = ({ accountId, onLogout, usersView, setUsersView }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    //const [view, setView] = useState('list');
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

    const handleUserAdded = (msg) => {
        setMessage(msg);
        setUsersView('list');
        fetchAccountUsers();
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setUsersView('detail');
    };

    const handleBackClick = () => {
        setSelectedUser(null);
        setUsersView('list');
    };
    
    // New function to handle deletion from the child component
    const handleUserDeleted = () => {
        setMessage('User deleted successfully!');
        setUsersView('list');
        fetchAccountUsers();
    };

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (usersView === 'detail') {
        return <UserDetail user={selectedUser} onBack={handleBackClick} onLogout={onLogout} onUserDeleted={handleUserDeleted} />;
    }

    if (usersView === 'add') {
        return <AddUserForm accountId={accountId} onUserAdded={handleUserAdded} onBack={handleBackClick} onLogout={onLogout} />;
    }

    return (
        <div className="section account-users">
            <header className="header">
                <h2>{users.find(user => user.role === 'primary_user')?.firstName + ' ' + users.find(user => user.role === 'primary_user')?.lastName || 'None'}: Users</h2>
                <button onClick={() => setUsersView('add')} className="secondary-btn">Add New User</button>
            </header>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            
            <div className="user-list">
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                    {users.length > 0 ? (
                        users.map(user => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.role}</td>
                                <td>
                                    <button onClick={() => handleEditClick(user)}>Edit</button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="4">No users found for this account.</td>
                        </tr>
                    )}
                </table>
            </div>
        </div>
    );
};

export default AdminAccountUsers;