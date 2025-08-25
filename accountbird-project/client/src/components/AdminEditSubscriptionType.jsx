// client/src/components/AdminEditSubscriptionType.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './AdminEditSubscriptionType.css';

const AdminEditSubscriptionType = ({ subscription, onTypeUpdated, onBack, onLogout }) => {
    const [formData, setFormData] = useState({ name: subscription.name });
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

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = { name: formData.name };
            await axios.put(`http://localhost:5001/api/admin/settings/subscriptions/${subscription._id}`, body, config);
            onTypeUpdated('Subscription type updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the subscription type.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this subscription type?')) {
            try {
                await axios.delete(`http://localhost:5001/api/admin/settings/subscriptions/${subscription._id}`, config);
                onTypeUpdated('Subscription type deleted successfully!');
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the subscription type.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    return (
        <div className="content">
            <header className="header">
                <h2>Edit Subscription Type</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleUpdate}>
                <div className="form-group">
                    <label htmlFor="name">Subscription Name</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Subscription</button>
            </form>
            <hr />
            <button onClick={handleDelete} className="delete-btn">Delete Subscription</button>
        </div>
    );
};

export default AdminEditSubscriptionType;