// client/src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    // Use useMemo to memoize the config object
    const config = useMemo(() => ({
        headers: {
            'x-auth-token': token,
        },
    }), [token]); // The config object only changes when the token changes

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const usersResponse = await axios.get('http://localhost:5001/api/admin/users', config);
            setUsers(usersResponse.data);

            const accountsResponse = await axios.get('http://localhost:5001/api/admin/accounts', config);
            setAccounts(accountsResponse.data);
            setError('');
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError(err.response?.data?.msg || 'Failed to fetch admin data.');
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

        fetchAdminData();
    }, [token, onLogout, fetchAdminData]);

    const handleUpdateAccount = async (accountId, newAccountType) => {
        try {
            const body = { accountType: newAccountType };
            await axios.put(`http://localhost:5001/api/admin/accounts/${accountId}`, body, config);
            fetchAdminData();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the account.');
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this account and all its users?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/accounts/${accountId}`, config);
                fetchAdminData();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the account.');
            }
        }
    };

    const handleUpdateUserRole = async (userId, newRole) => {
        try {
            const body = { role: newRole };
            await axios.put(`http://localhost:5001/api/admin/user/${userId}`, body, config);
            fetchAdminData();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user role.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/user/${userId}`, config);
                fetchAdminData();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
            }
        }
    };

    if (loading) {
        return <div className="admin-dashboard-container">Loading admin data...</div>;
    }

    if (error) {
        return <div className="admin-dashboard-container error-message">{error}</div>;
    }

    return (
        <div className="admin-dashboard-container">
            <h2>Admin Dashboard</h2>
            <button onClick={onLogout} className="logout-btn">Log Out</button>

            <div className="dashboard-section">
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

            <div className="dashboard-section">
                <h3>All Accounts</h3>
                <ul>
                    {accounts.length > 0 ? (
                        accounts.map(account => (
                            <li key={account._id}>
                                <strong>ID:</strong> {account._id}<br />
                                <strong>Type:</strong> {account.accountType}<br />
                                <strong>Primary User:</strong> {account.primaryUser?.firstName || 'N/A'} {account.primaryUser?.lastName || ''}<br />
                                <button onClick={() => handleUpdateAccount(account._id, account.accountType === 'subscriber' ? 'contributor' : 'subscriber')}>
                                    Toggle to {account.accountType === 'subscriber' ? 'Contributor' : 'Subscriber'}
                                </button>
                                <button onClick={() => handleDeleteAccount(account._id)}>Delete</button>
                            </li>
                        ))
                    ) : (
                        <p>No accounts found.</p>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminDashboard;