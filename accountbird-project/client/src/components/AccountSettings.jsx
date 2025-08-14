// client/src/components/AccountSettings.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import './AccountSettings.css';

const AccountSettings = ({ account, onLogout }) => {
    const [accountData, setAccountData] = useState(account);
    const [formData, setFormData] = useState({
        accountType: account.accountType,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate(); // Initialize useNavigate

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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { accountType: formData.accountType };
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
                navigate('/admin/accounts'); // Redirect to the accounts list
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the account.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    return (
        <div className="account-settings-container">
            <h4>Account Settings</h4>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleUpdate}>
                <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select id="accountType" name="accountType" value={formData.accountType} onChange={handleChange}>
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update Settings</button>
            </form>
            <button onClick={handleDeleteAccount} className="delete-btn">Delete Account</button>
        </div>
    );
};

export default AccountSettings;