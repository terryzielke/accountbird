// client/src/components/UserDetail.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './UserDetail.css';

const UserDetail = ({ user, onBack, onLogout }) => {
    const [userData, setUserData] = useState(user);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
    });
    const [passwordFormData, setPasswordFormData] = useState({
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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e) => {
        setPasswordFormData({ ...passwordFormData, [e.target.name]: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                role: formData.role,
            };
            const response = await axios.put(`http://localhost:5001/api/admin/users/${userData._id}`, body, config);
            setUserData(response.data);
            setMessage('User updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = {
                newPassword: passwordFormData.newPassword,
            };
            await axios.put(`http://localhost:5001/api/admin/users/${userData._id}/password`, body, config);
            setMessage('User password updated successfully!');
            setPasswordFormData({ newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the password.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    return (
        <div className="user-detail-container">
            <h3>User Details for {userData.firstName} {userData.lastName}</h3>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleUpdate}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <button type="submit" className="submit-btn">Update User</button>
            </form>

            <hr/>

            <h3>Update Password</h3>
            <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Password</button>
            </form>

            <button onClick={onBack}>Back to Users</button>
        </div>
    );
};

export default UserDetail;