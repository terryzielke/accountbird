// client/src/components/LoginPage.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './LoginPage.css';

const LoginPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { email, password } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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
            const body = JSON.stringify({ email, password });
            
            const response = await axios.post('http://localhost:5001/api/auth/login', body, config);
            
            // Store the token and the complete user object, including the role
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            // Get the user's name for the welcome message, handling different user types
            const displayName = response.data.user.firstName || response.data.user.userName || response.data.user.email;
            setMessage(`Welcome, ${displayName}! You are logged in.`);
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };

    return (
        <div className="login-container">
            <h2>User Login</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
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
        </div>
    );
};

export default LoginPage;