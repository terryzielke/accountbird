// client/src/components/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import LoginPageTwo from './LoginPageTwo';
import './LoginPage.css';

// A simple utility to generate a unique ID
const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
};

const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
};

const LoginPage = ({ onLoginSuccess }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [twoFactorRequired, setTwoFactorRequired] = useState(false);
    const [emailForTwoStep, setEmailForTwoStep] = useState('');
    const navigate = useNavigate();

    const { email, password } = formData;

    // We'll use a deviceId to track the "remember me" functionality
    const [deviceId, setDeviceId] = useState('');
    useEffect(() => {
        let currentDeviceId = getCookie('deviceId');
        if (!currentDeviceId) {
            currentDeviceId = Math.random().toString(36).substring(2, 15);
            setCookie('deviceId', currentDeviceId, 30);
        }
        setDeviceId(currentDeviceId);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginSubmit = async (e) => {
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
                password,
                deviceId,
            });

            const response = await axios.post('http://localhost:5001/api/auth/login', body, config);

            if (response.data.twoFactorRequired) {
                setTwoFactorRequired(true);
                setEmailForTwoStep(email);
                setMessage(response.data.msg);
            } else {
                localStorage.setItem('token', response.data.token);
                onLoginSuccess(response.data.user);
                navigate('/');
            }

        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };
    
    // This is the new callback function that handles the success of the 2FA form
    const handleTwoStepSuccess = (token, user) => {
        localStorage.setItem('token', token);
        onLoginSuccess(user);
        navigate('/');
    };

    if (twoFactorRequired) {
        return <LoginPageTwo email={emailForTwoStep} onTwoStepSuccess={handleTwoStepSuccess} />;
    }

    return (
        <div className="login-container">
            <div className="login">
                <h2>Login</h2>
                {message && <div className="success-message">{message}</div>}
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleLoginSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input type="email" id="email" name="email" value={email} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input type="password" id="password" name="password" value={password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="submit-btn">Login</button>
                </form>
                <a href="/register" className="login-link">Register</a>
            </div>
        </div>
    );
};

export default LoginPage;