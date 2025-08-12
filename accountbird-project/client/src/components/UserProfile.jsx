// client/src/components/UserProfile.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = ({ user, onLogout }) => {
    const [userData, setUserData] = useState(user);
    const [profileFormData, setProfileFormData] = useState({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        userName: user.userName || '',
        email: user.email || '',
    });
    const [passwordFormData, setPasswordFormData] = useState({
        oldPassword: '',
        newPassword: '',
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

    // Handler for profile form changes
    const handleProfileChange = (e) => {
        setProfileFormData({ ...profileFormData, [e.target.name]: e.target.value });
    };

    // Handler for password form changes
    const handlePasswordChange = (e) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };

    // Handle profile form submission
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.put('http://localhost:5001/api/profile', profileFormData, config);
            setUserData(response.data);
            localStorage.setItem('user', JSON.stringify(response.data)); // Update local storage
            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
        }
    };

    // Handle password form submission
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        try {
            await axios.put('http://localhost:5001/api/profile/password', passwordFormData, config);
            setMessage('Password updated successfully!');
            setPasswordFormData({ oldPassword: '', newPassword: '' }); // Clear the form
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
        }
    };
    
    // Determine which fields to display based on user role
    const isRegularUser = userData.role !== 'admin';

    return (
        <div className="profile-container">
            <h2>User Profile</h2>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="profile-details">
                <p><strong>Email:</strong> {userData.email}</p>
                <p><strong>Role:</strong> {userData.role}</p>
            </div>

            <hr />

            <h3>Update Profile Information</h3>
            <form onSubmit={handleProfileSubmit}>
                {isRegularUser ? (
                    <>
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" value={profileFormData.firstName} onChange={handleProfileChange} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" value={profileFormData.lastName} onChange={handleProfileChange} />
                        </div>
                    </>
                ) : (
                    <div className="form-group">
                        <label htmlFor="userName">User Name</label>
                        <input type="text" id="userName" name="userName" value={profileFormData.userName} onChange={handleProfileChange} />
                    </div>
                )}
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={profileFormData.email} onChange={handleProfileChange} />
                </div>
                <button type="submit" className="submit-btn">Update Profile</button>
            </form>

            <hr />

            <h3>Change Password</h3>
            <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                    <label htmlFor="oldPassword">Old Password</label>
                    <input type="password" id="oldPassword" name="oldPassword" value={passwordFormData.oldPassword} onChange={handlePasswordChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Password</button>
            </form>
        </div>
    );
};

export default UserProfile;