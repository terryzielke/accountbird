// client/src/components/RemoveAccount.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const RemoveAccount = () => {
    const [message, setMessage] = useState('Processing your request...');
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const removeAccount = async () => {
            try {
                // 1. Extract the token from the URL query parameters
                const params = new URLSearchParams(location.search);
                const token = params.get('token');

                if (!token) {
                    setError('Invalid removal link. No token found.');
                    return;
                }

                // 2. Send the token to the back-end
                const config = {
                    headers: { 'Content-Type': 'application/json' },
                };
                const body = { token };

                const response = await axios.post('http://localhost:5000/api/users/remove-account', body, config);
                setMessage(response.data.msg);
                
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.msg || 'An error occurred while trying to remove the account.');
                setMessage(null);
            }
        };

        removeAccount();
    }, [location]);

    return (
        <div className="removal-container">
            <div className="removal-message">
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default RemoveAccount;