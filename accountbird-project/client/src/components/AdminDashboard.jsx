// client/src/components/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'x-auth-token': token,
        },
    };

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
            if (err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [token, onLogout]);

    useEffect(() => {
        if (token) {
            fetchAdminData();
        } else {
            onLogout();
        }
    }, [token, fetchAdminData, onLogout]);

    const handleUpdateAccount = async (accountId, newAccountType) => {
        try {
            const body = { accountType: newAccountType };
            await axios.put(`http://localhost:5001/api/admin/accounts/${accountId}`, body, config);
            // Refresh the data after a successful update
            fetchAdminData();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the account.');
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (window.confirm('Are you sure you want to delete this account and all its users?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/accounts/${accountId}`, config);
                // Refresh the data after a successful delete
                fetchAdminData();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the account.');
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
                                {user.firstName} {user.lastName} ({user.email}) - Role: {user.role}
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