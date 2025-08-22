// client/src/components/AddSubscriptionType.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './AddSubscriptionType.css';

const AddSubscriptionType = ({ onTypeAdded, onBack, onLogout }) => {
    const [newSubName, setNewSubName] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { name: newSubName };
            await axios.post('http://localhost:5001/api/admin/settings/subscriptions', body, config);
            onTypeAdded('Subscription type added successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while adding the subscription type.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    return (
        <div className="content">
            <header className="header">
                <h2>Add Subscription Type</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleAddSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Subscription Name</label>
                    <input type="text" id="name" name="name" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
                </div>
                <button type="submit" className="submit-btn">Add Subscription</button>
            </form>
        </div>
    );
};

export default AddSubscriptionType;