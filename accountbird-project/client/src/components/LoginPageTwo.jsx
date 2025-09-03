// client/src/components/LoginPageTwo.jsx

import React, { useState } from 'react';
import axios from 'axios';
// We are removing useNavigate from this component.
// import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Reusing the same styles

// The component now accepts a new prop: `onTwoStepSuccess`
const LoginPageTwo = ({ email, onLoginSuccess, onTwoStepSuccess }) => {
    const [code, setCode] = useState('');
    const [rememberDevice, setRememberDevice] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    // navigate is no longer used here.
    // const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            const body = JSON.stringify({
                email,
                code,
                rememberDevice,
            });

            const response = await axios.post('http://localhost:5001/api/auth/two-step-verify', body, config);

            // On successful verification, call the new callback from the parent.
            if (onTwoStepSuccess) {
                onTwoStepSuccess(response.data.token, response.data.user);
            }
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <div className="login">
                <h2>Two-Step Verification</h2>
                <p>A verification code has been sent to your email address: {email}.</p>
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="code">Verification Code</label>
                        <input
                            type="text"
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group checkbox-group">
                        <input
                            type="checkbox"
                            id="rememberDevice"
                            checked={rememberDevice}
                            onChange={(e) => setRememberDevice(e.target.checked)}
                        />
                        <label htmlFor="rememberDevice">Remember this device for 30 days</label>
                    </div>
                    <button type="submit" className="submit-btn">Verify</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPageTwo;