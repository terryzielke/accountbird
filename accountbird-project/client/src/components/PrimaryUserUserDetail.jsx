// client/src/components/PrimaryUserUserDetail.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './PrimaryUserUserDetail.css';

const PrimaryUserUserDetail = ({ user, onBack, onLogout }) => {
    const [userData, setUserData] = useState(user);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
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
                userName: formData.userName,
                email: formData.email,
                role: formData.role,
            };
            const response = await axios.put(`http://localhost:5001/api/account/users/${userData._id}`, body, config);
            setUserData(response.data);
            setMessage('User updated successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleStatusUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const body = {
                status: formData.status,
            };
            // Call the dedicated status update endpoint
            const response = await axios.put(`http://localhost:5001/api/account/users/${userData._id}/status`, body, config);
            setUserData(prevData => ({ ...prevData, status: formData.status }));
            setMessage(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the user status.');
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
            await axios.put(`http://localhost:5001/api/account/users/${userData._id}/password`, body, config);
            setMessage('User password updated successfully!');
            setPasswordFormData({ newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while updating the password.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    const handleDeleteUser = async () => {
        if (window.confirm(`Are you sure you want to delete ${userData.firstName} ${userData.lastName}?`)) {
            try {
                await axios.delete(`http://localhost:5001/api/account/users/${userData._id}`, config);
                setMessage('User deleted successfully!');
                onBack();
            } catch (err) {
                setError(err.response?.data?.msg || 'An error occurred while deleting the user.');
                if (err.response?.status === 401 || err.response?.status === 403) {
                    onLogout();
                }
            }
        }
    };

    return (
        <div className="content">
            <header className="header">
                <h2>User Details for {userData.firstName} {userData.lastName}</h2>
            </header>

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
                    <label htmlFor="userName">Username</label>
                    <input type="text" id="userName" name="userName" value={formData.userName} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <button type="submit" className="submit-btn">Update User</button>
            </form>

            <hr/>
            
            <form onSubmit={handleStatusUpdate}>
                <div className="form-group">
                    <label htmlFor="status">User Status</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange}>
                        <option value="Active">Active</option>
                        <option value="Deactivated">Deactivated</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Update Status</button>
            </form>

            <hr/>

            <form onSubmit={handlePasswordUpdate}>
                <div className="form-group">
                    <label htmlFor="newPassword">Change Password</label>
                    <input type="password" id="newPassword" name="newPassword" value={passwordFormData.newPassword} onChange={handlePasswordChange} required />
                </div>
                <button type="submit" className="submit-btn">Update Password</button>
            </form>
            <hr />
            <button onClick={handleDeleteUser} className="delete-btn">Delete User</button>
        </div>
    );
};

export default PrimaryUserUserDetail;