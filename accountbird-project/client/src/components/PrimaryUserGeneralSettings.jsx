import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';

const PrimaryUserGeneralSettings = ({ user, onLogout }) => {
    // State to hold and manage account data and form state
    const [accountStatus, setAccountStatus] = useState('Active');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');

    // UseMemo for stable headers
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    // Fetch the account's current status
    const fetchAccountStatus = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/account/details', config);
            setAccountStatus(response.data.status);
        } catch (err) {
            console.error('Error fetching account status:', err);
            setError(err.response?.data?.msg || 'Failed to fetch account status.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [config, onLogout]);

    // Fetch account status on component mount
    useEffect(() => {
        fetchAccountStatus();
    }, [fetchAccountStatus]);

    const handleChange = (e) => {
        setAccountStatus(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const body = { status: accountStatus };
            const response = await axios.put('http://localhost:5001/api/account/status', body, config);
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the status.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading general settings...</div>;
    }

    return (
        <div className="content">
            <header className='header'>
                <h2>General Settings</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="status">Account Status</label>
                    <select id="status" name="status" value={accountStatus} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update Status</button>
            </form>
        </div>
    );
};

export default PrimaryUserGeneralSettings;