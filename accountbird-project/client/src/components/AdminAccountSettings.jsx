// client/src/components/AdminAccountSettings.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminAccountSettings = ({ account, onLogout }) => {
    const [accountData, setAccountData] = useState(account);
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [formData, setFormData] = useState({
        accountType: account.accountType ? account.accountType._id : '',
        status: account.status || 'Active',
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // UseMemo for stable headers to prevent unnecessary re-renders
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    // Fetch subscription types and initial account data
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

    // Use a separate effect to set form data after initial fetches
    useEffect(() => {
        if (accountData && subscriptionTypes.length > 0) {
            const currentSub = subscriptionTypes.find(sub => String(sub._id) === String(accountData.accountType._id));
            if (currentSub) {
                setFormData(prevFormData => ({
                    ...prevFormData,
                    accountType: currentSub._id,
                    status: accountData.status, // Ensure status is correctly set
                }));
            }
        }
    }, [accountData, subscriptionTypes]);
    
    // Initial data fetch on component mount
    useEffect(() => {
        fetchSubscriptionTypes();
    }, [fetchSubscriptionTypes]);

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
    
    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { status: formData.status };
            const response = await axios.put(`http://localhost:5001/api/admin/accounts/${accountData._id}/status`, body, config);
            
            // Update the local state with the new status
            setAccountData(prevData => ({ ...prevData, status: formData.status }));
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the status.');
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
            <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                    <label htmlFor="status">Account Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update Status</button>
            </form>
            <hr />
            <button onClick={handleDeleteAccount} className="delete-btn">Delete Account</button>
        </div>
    );
};

export default AdminAccountSettings;