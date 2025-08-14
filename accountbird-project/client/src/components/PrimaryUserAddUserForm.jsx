// client/src/components/PrimaryUserAddUserForm.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './AddUserForm.css';

const PrimaryUserAddUserForm = ({ onUserAdded, onBack, onLogout }) => {
    const [addUserData, setAddUserData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'subscriber',
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

    const handleAddUserChange = (e) => {
        setAddUserData({ ...addUserData, [e.target.name]: e.target.value });
    };

    const handleAddUserSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            await axios.post('http://localhost:5001/api/account/users', addUserData, config);
            onUserAdded('User added successfully!');
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while adding the user.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    return (
        <div className="add-user-form-container">
            <h4>Add New User</h4>
            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleAddUserSubmit}>
                <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" value={addUserData.firstName} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" value={addUserData.lastName} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={addUserData.email} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={addUserData.password} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="role">User Role</label>
                    <select id="role" name="role" value={addUserData.role} onChange={handleAddUserChange}>
                        <option value="subscriber">Subscriber</option>
                        <option value="contributor">Contributor</option>
                    </select>
                </div>
                <button type="submit" className="submit-btn">Add User</button>
            </form>
            <button onClick={onBack}>Back to Users</button>
        </div>
    );
};

export default PrimaryUserAddUserForm;