// client/src/components/AdminManageAccounts.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AdminAddAccountForm from './AdminAddAccountForm'; // Import the new component
import './AdminManageAccounts.css';

const AdminManageAccounts = ({ onLogout }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('list'); // Add a view state

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'x-auth-token': token,
        },
    }), [token]);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const accountsResponse = await axios.get('http://localhost:5001/api/admin/accounts', config);
            setAccounts(accountsResponse.data);
            setError('');
        } catch (err) {
            console.error('Error fetching accounts:', err);
            setError(err.response?.data?.msg || 'Failed to fetch accounts.');
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
        fetchAccounts();
    }, [token, onLogout, fetchAccounts]);
    
    // Create a function to handle the new account creation success
    const handleAccountAdded = () => {
        setView('list');
        fetchAccounts();
    };

    if (loading) {
        return <div className="loading-container">Loading accounts...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (view === 'add') {
        return <AdminAddAccountForm onAccountAdded={handleAccountAdded} onLogout={onLogout} />;
    }

    return (
        <div className="content">
            <header className="header">
                <h2>Manage Accounts</h2>
                <button onClick={() => setView('add')} className="secondary-btn">Create New Account</button>
            </header>

            <div className="accounts-list">
                <table>
                    <tr>
                        <th>Primary User</th>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Actions</th>
                    </tr>
                    {accounts.length > 0 ? (
                        accounts.map(account => (
                            <tr key={account._id}>
                                <td>{account.primaryUser?.firstName || 'N/A'} {account.primaryUser?.lastName || ''}</td>
                                <td>{account.accountType}</td>
                                <td>{account._id}</td>
                                <td>
                                    <Link to={`/admin/accounts/${account._id}`} className="edit-btn">Manage</Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3">No accounts found.</td>
                        </tr>
                    )}
                </table>
            </div>
        </div>
    );
};

export default AdminManageAccounts;