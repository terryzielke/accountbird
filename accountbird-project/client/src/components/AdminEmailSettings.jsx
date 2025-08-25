import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminEmailSettings = ({ onLogout }) => {
    const [formData, setFormData] = useState({
        emailHost: '',
        emailPort: '',
        emailUser: '',
        emailPass: '',
        registrationEmailHtml: '',
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

    const fetchEmailSettings = async () => {
        try {
            const response = await axios.get('http://localhost:5001/api/admin/settings', config);
            const { emailSettings, emailTemplates } = response.data;
            setFormData({
                emailHost: emailSettings.host || '',
                emailPort: emailSettings.port || '',
                emailUser: emailSettings.user || '',
                emailPass: emailSettings.pass || '',
                registrationEmailHtml: emailTemplates.registrationEmail || '',
            });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching email settings:', err);
            setError(err.response?.data?.msg || 'Failed to fetch email settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    useEffect(() => {
        fetchEmailSettings();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const response = await axios.put('http://localhost:5001/api/admin/settings/email', formData, config);
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating settings.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    if (loading) {
        return <div>Loading email settings...</div>;
    }

    return (
        <div className="content">
            <header className='header'>
                <h2>Email Settings</h2>
            </header>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                    <h4>SMTP Settings</h4>
                    <div className="form-group">
                        <label htmlFor="emailHost">SMTP Host</label>
                        <input type="text" id="emailHost" name="emailHost" value={formData.emailHost} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailPort">SMTP Port</label>
                        <input type="number" id="emailPort" name="emailPort" value={formData.emailPort} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailUser">SMTP Username</label>
                        <input type="text" id="emailUser" name="emailUser" value={formData.emailUser} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="emailPass">SMTP Password</label>
                        <input type="password" id="emailPass" name="emailPass" value={formData.emailPass} onChange={handleChange} />
                    </div>

                    <hr />
                    
                    <h4>Email Templates</h4>
                    <div className="form-group">
                        <label htmlFor="registrationEmailHtml">Registration Email HTML</label>
                        <textarea id="registrationEmailHtml" name="registrationEmailHtml" value={formData.registrationEmailHtml} onChange={handleChange} rows="10" />
                    </div>
                
                <button type="submit" className="submit-btn">Save Email Settings</button>
            </form>
        </div>
    );
};

export default AdminEmailSettings;