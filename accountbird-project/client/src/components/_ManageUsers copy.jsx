// client/src/components/ManageUsers.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './ManageUsers.css';

const ManageUsers = ({ user }) => {
    const [invitedUserData, setInvitedUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'contributor', // Default role for new users
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    };

    const handleInputChange = (e) => {
        setInvitedUserData({ ...invitedUserData, [e.target.name]: e.target.value });
    };

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const body = {
                ...invitedUserData,
                accountId: user.accountId,
            };

            await axios.post('http://localhost:5001/api/users/invite', body, config);

            setMessage('User invited and created successfully!');
            setInvitedUserData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: 'contributor',
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while inviting the user.');
            console.error(err);
        }
    };

    return (
        <div className="manage-users-container">
            <h3>Invite a New User to Your Account</h3>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleInviteSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={invitedUserData.firstName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={invitedUserData.lastName} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={invitedUserData.email} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Temporary Password</label>
                    <input type="password" id="password" name="password" value={invitedUserData.password} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="role">User Role</label>
                    <select id="role" name="role" value={invitedUserData.role} onChange={handleInputChange}>
                        <option value="contributor">Contributor</option>
                        <option value="subscriber">Subscriber</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Invite User</button>
            </form>
        </div>
    );
};

export default ManageUsers;