// client/src/components/PrimaryUserSubscriptionType.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import iconDown from '../assets/icons/down.svg';
import './PrimaryUserSubscriptionType.css';

const PrimaryUserSubscriptionType = ({ user, onLogout }) => {
    const [accountData, setAccountData] = useState(null);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [formData, setFormData] = useState({ accountType: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const fetchSubscriptionTypes = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/users/subscription-types', config);
            setSubscriptionTypes(response.data || []);
        } catch (err) {
            console.error('Error fetching subscription types:', err);
            setError(err.response?.data?.msg || 'Failed to fetch subscription types.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    }, [onLogout, config]);

    const fetchAccountData = useCallback(async () => {
        try {
            const response = await axios.get(`http://localhost:5001/api/account/details`, config);
            setAccountData(response.data);
            setFormData({ accountType: response.data.accountType._id });
        } catch (err) {
            console.error('Error fetching account data:', err);
            setError(err.response?.data?.msg || 'Failed to fetch account data.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [onLogout, config]);

    useEffect(() => {
        fetchSubscriptionTypes();
        fetchAccountData();
    }, [fetchSubscriptionTypes, fetchAccountData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { accountTypeId: formData.accountType };
            await axios.put(`http://localhost:5001/api/account/${user.accountId}`, body, config);
            setMessage('Account type updated successfully!');
            fetchAccountData(); // Refresh data after update
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the account type.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading subscription types...</div>;
    }

    return (
        <div className="content">
            <header className="header">
                <h2>Subscription Type</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="accountType">Select Subscription Type</label>
                    <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange} style={{ backgroundImage: `url(${iconDown})` }}>
                        {subscriptionTypes.map(sub => (
                            <option key={sub._id} value={sub._id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update</button>
            </form>
        </div>
    );
};

export default PrimaryUserSubscriptionType;