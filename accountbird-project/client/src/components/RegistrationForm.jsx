// client/src/components/RegistrationForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './RegistrationForm.css';

const RegistrationForm = () => {
    // useNavigate hook for programmatic navigation
    const navigate = useNavigate();

    // State to hold form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        accountType: '', // Default to subscriber
    });
    const [subscriptionTypes, setSubscriptionTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const { firstName, lastName, userName, email, password, accountType } = formData;

    // Fetch subscription types from the back end
    const fetchSubscriptionTypes = useCallback(async () => {
        try {
            // Note: The port is changed to 5001 to match your server configuration.
            const response = await axios.get('http://localhost:5001/api/users/subscription-types');
            setSubscriptionTypes(response.data || []);
            
            // Set the first available subscription type as the default selected value
            if (response.data && response.data.length > 0) {
                setFormData(prevFormData => ({
                    ...prevFormData,
                    accountType: response.data[0].name,
                }));
            }
        } catch (err) {
            console.error('Error fetching subscription types:', err);
            setError('Failed to load available account types.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch the subscription types when the component mounts
    useEffect(() => {
        fetchSubscriptionTypes();
    }, [fetchSubscriptionTypes]);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        // Ensure a type is selected before submission
        if (!accountType) {
            return setError('Please select an account type.');
        }

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            //const body = JSON.stringify({ firstName, lastName, email, password, accountType });

            // Post the new user data to the backend registration endpoint
            const response = await axios.post('http://localhost:5001/api/users/register', formData, config);
            
            // On successful registration, remove the token to prevent automatic login
            localStorage.removeItem('token');
            // On successful registration, store the token and user data for automatic login
            //localStorage.setItem('token', response.data.token);
            
            setMessage(response.data.msg);
            
            // Redirect the user to the confirmation page
            // The state object can be used to pass data between components if needed
            navigate('/confirmation', { state: { msg: response.data.msg } });
            
        } catch (err) {
            // Display error message from the backend
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            console.error(err);
        }
    };
    
    // Display loading state while fetching subscription types
    if (loading) {
        return <div>Loading account types...</div>;
    }

    // Display error if no subscription types were found
    if (subscriptionTypes.length === 0) {
        return <div>No account types are currently available for registration.</div>;
    }

    return (
        <div className="registration-container">
            <div className="registration">
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
                        <label htmlFor="userName">Username</label>
                        <input type="text" id="userName" name="userName" value={userName} onChange={handleChange} required />
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
                        <select id="accountType" name="accountType" value={accountType} onChange={handleChange} required>
                            <option value="">Select an account type</option>
                            {subscriptionTypes.map(sub => (
                                <option key={sub._id} value={sub._id}>
                                    {sub.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="submit-btn">Register</button>
                </form>
                <a href="/login" className="login-link">Already have an account? Login here</a>
            </div>
        </div>
    );
};

export default RegistrationForm;