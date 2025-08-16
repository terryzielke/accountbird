// client/src/components/AdminAccountDetail.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AccountSettings from './AdminAccountSettings';
import AccountUsers from './AdminAccountUsers';
import './AdminAccountDetail.css';

const AdminAccountDetail = ({ onLogout }) => {
    const { accountId } = useParams();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('users');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'x-auth-token': token,
        },
    }), [token]);

    const fetchAccountDetails = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:5001/api/admin/accounts/${accountId}`, config);
            setAccount(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching account details:', err);
            setError(err.response?.data?.msg || 'Failed to fetch account details.');
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
        fetchAccountDetails();
    }, [token, onLogout, fetchAccountDetails]);

    if (loading) {
        return <div className="loading-container">Loading account details...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!account) {
        return <div>Account not found.</div>;
    }

    return (
        <div className="account-detail-container">
            <div className="account-detail-header">
                <h3>Account Details for ID: {account._id}</h3>
                <div className="secondary-nav">
                    <button onClick={() => setView('users')} className={view === 'users' ? 'active' : ''}>
                        Users
                    </button>
                    <button onClick={() => setView('settings')} className={view === 'settings' ? 'active' : ''}>
                        Account Settings
                    </button>
                </div>
            </div>
            
            <div className="account-detail-content">
                {view === 'users' && <AccountUsers accountId={accountId} onLogout={onLogout} />}
                {view === 'settings' && <AccountSettings account={account} onLogout={onLogout} />}
            </div>

            <Link to="/admin/accounts" className="back-link">Back to Accounts</Link>
        </div>
    );
};

export default AdminAccountDetail;