// client/src/components/SubscriptionTypes.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
    const location = useLocation();

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
        
        // Check if we are coming from a navigation state that wants to reset the view
        if (location.state?.view) {
            setView(location.state.view);
        }

        fetchSubscriptionTypes();
    }, [token, onLogout, fetchSubscriptionTypes, location.state]);

    const handleTypeUpdated = (msg) => {
        setMessage(msg);
        setView('list');
        fetchSubscriptionTypes();
    };

    const handleEditClick = (sub) => {
        setSelectedSub(sub);
        setView('edit');
    };

    if (loading) {
        return <div>Loading subscription types...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }
    
    if (view === 'add') {
        return <AddSubscriptionType onTypeAdded={handleTypeUpdated} onBack={() => setView('list')} onLogout={onLogout} />;
    }

    if (view === 'edit') {
        return <EditSubscriptionType subscription={selectedSub} onTypeUpdated={handleTypeUpdated} onBack={() => setView('list')} onLogout={onLogout} />;
    }

    return (
        <div className="content">
            <header className="header">
                <h2>Subscription Types</h2>
                <button onClick={() => setView('add')} className='secondary-btn'>Add New Subscription</button>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="subscription-list">
                <table>
                    <tr>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                    {subscriptionTypes.map(sub => (
                        <tr key={sub._id}>
                            <td>{sub.name}</td>
                            <td></td>
                            <td>
                                <button onClick={() => handleEditClick(sub)} className='edit-btn'>Edit</button>
                            </td>
                        </tr>
                    ))}
                </table>
            </div>
        </div>
    );
};

export default SubscriptionTypes;