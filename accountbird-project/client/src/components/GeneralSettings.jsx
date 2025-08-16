// client/src/components/GeneralSettings.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const GeneralSettings = ({ onLogout }) => {
    const [settings, setSettings] = useState(null);
    const [formData, setFormData] = useState({ siteName: '' });
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

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            setSettings(response.data);
            setFormData({ siteName: response.data.siteName });
            setError('');
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err.response?.data?.msg || 'Failed to fetch settings.');
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
        fetchSettings();
    }, [token, onLogout, fetchSettings]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.put('http://localhost:5001/api/admin/settings', formData, config);
            setMessage('Settings updated successfully!');
            fetchSettings();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="settings-page">
            <h3>General Settings</h3>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="siteName">Site Name</label>
                    <input type="text" id="siteName" name="siteName" value={formData.siteName} onChange={handleChange} />
                </div>
                <button type="submit" className="submit-btn">Update</button>
            </form>
        </div>
    );
};

export default GeneralSettings;