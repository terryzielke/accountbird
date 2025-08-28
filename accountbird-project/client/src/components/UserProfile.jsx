// client/src/components/UserProfile.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './UserProfile.css';

const UserProfile = ({ user, onLogout, onUserUpdate }) => {
    const [userData, setUserData] = useState(user);
    const [passwordFormData, setPasswordFormData] = useState({
        oldPassword: '',
        newPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const token = localStorage.getItem('token');
    const config = useMemo(() => ({
        headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token,
        },
    }), [token]);

    const handleProfileChange = (e) => {
        setUserData({ ...userData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            const response = await axios.put('http://localhost:5001/api/profile', userData, config);
            
            // Call the callback function from the parent
            onUserUpdate(response.data);

            setMessage('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        try {
            await axios.put('http://localhost:5001/api/profile/password', passwordFormData, config);
            setMessage('Password updated successfully!');
            setPasswordFormData({ oldPassword: '', newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'An unexpected error occurred.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };
    
    //const isRegularUser = userData.role !== 'admin';

    return (
        <div className="content">
            <header className="header">
                <h2>{userData.role}: {userData.firstName} {userData.lastName}</h2>
            </header>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <h3>Update Profile Information</h3>
            <form onSubmit={handleProfileSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={userData.firstName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={userData.lastName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="userName">User Name</label>
                    <input type="text" id="userName" name="userName" value={userData.userName} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={userData.email} onChange={handleProfileChange} />
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