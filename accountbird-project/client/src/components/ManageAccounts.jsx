// client/src/components/ManageAccounts.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ManageAccounts.css';

const ManageAccounts = ({ onLogout }) => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) {
        return <div className="loading-container">Loading accounts...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="manage-accounts-container">
            <h3>All Accounts</h3>
            <ul>
                {accounts.length > 0 ? (
                    accounts.map(account => (
                        <li key={account._id}>
                            <Link to={`/admin/accounts/${account._id}`}>
                                <strong>ID:</strong> {account._id}<br />
                                <strong>Type:</strong> {account.accountType}<br />
                                <strong>Primary User:</strong> {account.primaryUser?.firstName || 'N/A'} {account.primaryUser?.lastName || ''}
                            </Link>
                        </li>
                    ))
                ) : (
                    <p>No accounts found.</p>
                )}
            </ul>
        </div>
    );
};

export default ManageAccounts;