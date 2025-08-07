// client/src/components/InitializationForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './InitializationForm.css';

const InitializationForm = ({ onInitializationSuccess }) => {
    const [formData, setFormData] = useState({
        siteName: '',
        adminUserName: '',
        adminEmail: '',
        adminPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        try {
            // Post the form data to our backend setup endpoint
            const response = await axios.post('http://localhost:5001/api/init/setup', formData);
            
            // On success, show a message and trigger the parent component to re-render
            setMessage(response.data.msg);
            setTimeout(() => {
                onInitializationSuccess();
            }, 2000); // Redirect after a 2-second delay
            
        } catch (err) {
            // Display error message from the backend
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };

    return (
        <div className="form-container">
            <h2>System Initialization</h2>
            <p>Please provide the site and initial admin details to set up your system.</p>
            
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="siteName">Site Name</label>
                    <input type="text" id="siteName" name="siteName" value={formData.siteName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="adminUserName">Admin User Name</label>
                    <input type="text" id="adminUserName" name="adminUserName" value={formData.adminUserName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="adminEmail">Admin Email</label>
                    <input type="email" id="adminEmail" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="adminPassword">Admin Password</label>
                    <input type="password" id="adminPassword" name="adminPassword" value={formData.adminPassword} onChange={handleChange} required />
                </div>
                <button type="submit" className="submit-btn">Initialize System</button>
            </form>
        </div>
    );
};

export default InitializationForm;