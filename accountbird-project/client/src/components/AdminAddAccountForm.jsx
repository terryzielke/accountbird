// client/src/components/AdminAddAccountForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import './AdminAddAccountForm.css';

const AdminAddAccountForm = ({ onAccountAdded, onLogout }) => {
    // State to hold form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        accountType: '', // Initial state is an empty string
    });
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
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

    const { firstName, lastName, userName, email, password, accountType } = formData;

    // Fetch subscription types from the back end
    const fetchSubscriptionTypes = useCallback(async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            const fetchedTypes = response.data.subscriptionTypes || [];
            setSubscriptionTypes(fetchedTypes);
            
            // Set the first available subscription type as the default selected value
            if (fetchedTypes.length > 0) {
                setFormData(prevFormData => ({
                    ...prevFormData,
                    accountType: fetchedTypes[0]._id,
                }));
            }
        } catch (err) {
            console.error('Error fetching subscription types:', err);
            setError('Failed to load available account types.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [config, onLogout]);

    // Fetch the subscription types when the component mounts
    useEffect(() => {
        fetchSubscriptionTypes();
    }, [fetchSubscriptionTypes]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        // Ensure an account type is selected before submission
        if (!accountType) {
            return setError('Please select an account type.');
        }

        try {
            // The back-end expects accountTypeId, so we'll use a new object
            const body = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                userName: formData.userName,
                email: formData.email,
                password: formData.password,
                accountTypeId: formData.accountType, // Send the ID
            };
            
            await axios.post('http://localhost:5001/api/admin/accounts', body, config);
            setMessage('Account and primary user created successfully!');
            setFormData({
                firstName: '',
                lastName: '',
                userName: '',
                email: '',
                password: '',
                accountType: subscriptionTypes.length > 0 ? subscriptionTypes[0]._id : '', // Reset to the first option
            });
            onAccountAdded();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while creating the account.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading account types...</div>;
    }

    if (subscriptionTypes.length === 0) {
        return <div>No account types are currently available.</div>;
    }

    return (
        <div className="content">
            <header className="header">
                <h2>Create New Account</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={lastName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="userName">Username</label>
                    <input type="text" id="userName" name="userName" value={userName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select id="accountType" name="accountType" value={accountType} onChange={handleChange} required>
                        <option value="">Select an account type</option>
                        {subscriptionTypes.map(sub => (
                            <option key={sub._id} value={sub._id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" className="submit-btn">Create Account</button>
            </form>
        </div>
    );
};

export default AdminAddAccountForm;