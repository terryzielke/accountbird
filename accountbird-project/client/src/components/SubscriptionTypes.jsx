// client/src/components/SubscriptionTypes.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import AddSubscriptionType from './AddSubscriptionType';
import EditSubscriptionType from './EditSubscriptionType';
import './SubscriptionTypes.css';

const SubscriptionTypes = ({ onLogout }) => {
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [view, setView] = useState('list');
    const [selectedSub, setSelectedSub] = useState(null);

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const fetchSubscriptionTypes = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            setSubscriptionTypes(response.data.subscriptionTypes || []);
            setError('');
        } catch (err) {
            console.error('Error fetching subscription types:', err);
            setError(err.response?.data?.msg || 'Failed to fetch subscription types.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        } finally {
            setLoading(false);
        }
    }, [onLogout, config]);

    useEffect(() => {
        if (!token) {
            onLogout();
            return;
        }
        fetchSubscriptionTypes();
    }, [token, onLogout, fetchSubscriptionTypes]);

    const handleTypeUpdated = (msg) => {
        setMessage(msg);
        setView('list');
        fetchSubscriptionTypes();
    };

    const handleDelete = async (subId) => {
        if (window.confirm('Are you sure you want to delete this subscription type?')) {
            setMessage('');
            setError('');
            try {
                await axios.delete(`http://localhost:5001/api/admin/settings/subscriptions/${subId}`, config);
                setMessage('Subscription type deleted successfully!');
                fetchSubscriptionTypes();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the subscription type.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    const handleEditClick = (sub) => {
        setSelectedSub(sub);
        setView('edit');
    };

    const handleBackClick = () => {
        setSelectedSub(null);
        setView('list');
        fetchSubscriptionTypes();
    };

    if (loading) {
        return <div>Loading subscription types...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }
    
    if (view === 'add') {
        return <AddSubscriptionType onTypeAdded={handleTypeUpdated} onBack={handleBackClick} onLogout={onLogout} />;
    }

    if (view === 'edit') {
        return <EditSubscriptionType subscription={selectedSub} onTypeUpdated={handleTypeUpdated} onBack={handleBackClick} onLogout={onLogout} />;
    }

    return (
        <div className="settings-page">
            <h3>Subscription Types</h3>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="subscription-list">
                <ul>
                    {subscriptionTypes.length > 0 ? (
                        subscriptionTypes.map(sub => (
                            <li key={sub._id}>
                                {sub.name}
                                <button onClick={() => handleEditClick(sub)}>Edit</button>
                                <button onClick={() => handleDelete(sub._id)}>Delete</button>
                            </li>
                        ))
                    ) : (
                        <p>No subscription types found.</p>
                    )}
                </ul>
            </div>
            <button onClick={() => setView('add')}>Add New Subscription</button>
        </div>
    );
};

export default SubscriptionTypes;