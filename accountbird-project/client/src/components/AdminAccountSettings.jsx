// client/src/components/AdminAccountSettings.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminAccountSettings = ({ account, onLogout }) => {
    const [accountData, setAccountData] = useState(account);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [formData, setFormData] = useState({
        accountType: account.accountType ? account.accountType._id : '',
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const fetchSubscriptionTypes = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            setSubscriptionTypes(response.data.subscriptionTypes || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching subscription types:', err);
            setError(err.response?.data?.msg || 'Failed to fetch subscription types.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    }, [onLogout, config]);

    useEffect(() => {
        fetchSubscriptionTypes();
    }, [fetchSubscriptionTypes]);

    useEffect(() => {
        if (accountData && subscriptionTypes.length > 0) {
            const currentSub = subscriptionTypes.find(sub => String(sub._id) === String(accountData.accountType._id));
            if (currentSub) {
                setFormData({ accountType: currentSub._id });
            }
        }
    }, [accountData, subscriptionTypes]);


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { accountTypeId: formData.accountType };
            const response = await axios.put(`http://localhost:5001/api/admin/accounts/${accountData._id}`, body, config);
            setAccountData(response.data);
            setMessage('Account settings updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm('Are you sure you want to delete this account and all its users? This action cannot be undone.')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/accounts/${accountData._id}`, config);
                setMessage('Account and users deleted successfully!');
                navigate('/admin/accounts');
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the account.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    if (loading) {
        return <div>Loading account settings...</div>;
    }
    
    return (
        <div className="section">
            <header className='header'>
                <h2>Account Settings</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleUpdate}>
                <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange}>
                        {subscriptionTypes.map(sub => (
                            <option key={sub._id} value={sub._id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update Settings</button>
            </form>
            <hr />
            <button onClick={handleDeleteAccount} className="delete-btn">Delete Account</button>
        </div>
    );
};

export default AdminAccountSettings;