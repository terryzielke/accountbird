// client/src/components/AddAccountForm.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './AddAccountForm.css';

const AddAccountForm = ({ onAccountAdded, onLogout }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        accountType: 'subscriber',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.post('http://localhost:5001/api/admin/accounts', formData, config);
            setMessage('Account and primary user created successfully!');
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                accountType: 'subscriber',
            });
            onAccountAdded();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while creating the account.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    return (
        <div className="add-account-form-container">
            <h3>Create New Account</h3>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange}>
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Create Account</button>
            </form>
        </div>
    );
};

export default AddAccountForm;