// client/src/components/RegistrationForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './RegistrationForm.css';

const RegistrationForm = () => {
    // State to hold form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        accountType: 'subscriber', // Default to subscriber
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { firstName, lastName, email, password, accountType } = formData;

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
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
            const body = JSON.stringify({ firstName, lastName, email, password, accountType });

            // Post the new user data to the backend registration endpoint
            const response = await axios.post('http://localhost:5001/api/users/register', body, config);
            
            // On success, store the token and user data for automatic login
            localStorage.setItem('token', response.data.token);
            
            setMessage(response.data.msg);
            
            // Redirect the user after a brief delay
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (err) {
            // Display error message from the backend
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };

    return (
        <div className="registration-container">
            <h2>New User Registration</h2>
            <p>Create a new account to get started with AccountBird.</p>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={firstName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={lastName} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={email} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={password} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select id="accountType" name="accountType" value={accountType} onChange={handleChange}>
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Register</button>
            </form>
        </div>
    );
};

export default RegistrationForm;