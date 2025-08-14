// client/src/components/AccountUsers.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AccountUsers.css';

const AccountUsers = ({ accountId, onLogout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
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

    if (loading) {
        return <div className="loading-container">Loading users...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="account-users-container">
            <h4>Users in this Account</h4>
            <ul>
                {users.length > 0 ? (
                    users.map(user => (
                        <li key={user._id}>
                            <strong>Name:</strong> {user.firstName} {user.lastName}<br />
                            <strong>Email:</strong> {user.email}<br />
                            <strong>Role:</strong> {user.role}
                        </li>
                    ))
                ) : (
                    <p>No users found for this account.</p>
                )}
            </ul>
        </div>
    );
};

export default AccountUsers;