// client/src/components/AdminAccountDetail.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AdminAccountSettings from './AdminAccountSettings';
import AdminAccountUsers from './AdminAccountUsers';
import './AdminAccountDetail.css';

const AdminAccountDetail = ({ onLogout }) => {
    const { accountId } = useParams();
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [view, setView] = useState('users');
    const [usersView, setUsersView] = useState('list'); // New state for managing the internal view of the AccountUsers component

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

    // This function will be passed down to the AdminAccountUsers component
    const handleSetUsersView = (newView) => {
        setUsersView(newView);
    };

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
        <div className="content account-content has-secondary-nav">
            <nav className="secondary-nav">
                <h4>{account._id}</h4>
                <button onClick={() => { setView('users'); handleSetUsersView('list'); }} className={view === 'users' ? 'active' : ''}>
                    Users
                </button>
                <button onClick={() => setView('settings')} className={view === 'settings' ? 'active' : ''}>
                    Account Settings
                </button>
            </nav>
            
            <div className="account-detail-content">
                {view === 'users' && <AdminAccountUsers accountId={accountId} onLogout={onLogout} usersView={usersView} setUsersView={handleSetUsersView} />}
                {view === 'settings' && <AdminAccountSettings account={account} onLogout={onLogout} />}
            </div>

        </div>
    );
};

export default AdminAccountDetail;