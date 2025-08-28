// client/src/components/AdminAddUserForm.jsx
import React, { useState, useMemo } from 'react';
import axios from 'axios';
import './AdminAddUserForm.css';

const AdminAddUserForm = ({ accountId, onUserAdded, onBack, onLogout }) => {
    const [addUserData, setAddUserData] = useState({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        role: 'user',
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
            const response = await axios.post(`http://localhost:5001/api/admin/accounts/${accountId}/users`, addUserData, config);
            setMessage(`User ${response.data.firstName} added successfully!`);
            setAddUserData({ firstName: '', lastName: '', email: '', password: '', role: 'user' });
            onUserAdded();
        } catch (err) {
            setError(err.response?.data?.msg || 'An error occurred while adding the user.');
            if (err.response?.status === 401 || err.response?.status === 403) {
                onLogout();
            }
        }
    };

    return (
        <div className="section">
            <header className='header'>
                <h2>Add User</h2>
            </header>
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
                    <label htmlFor="userName">Username</label>
                    <input type="text" id="userName" name="userName" value={addUserData.userName} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input type="email" id="email" name="email" value={addUserData.email} onChange={handleAddUserChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" name="password" value={addUserData.password} onChange={handleAddUserChange} required />
                </div>
                <button type="submit" className="submit-btn">Add User</button>
            </form>
        </div>
    );
};

export default AdminAddUserForm;