// client/src/components/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ManageUsers from './ManageUsers'; // Import the new component
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    const [userData, setUserData] = useState(user);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('main'); // Add state to manage views

    const fetchUserData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            onLogout();
            return;
        }
        
        try {
            const config = {
                headers: {
                    'x-auth-token': token,
                },
            };
            
            const response = await axios.get('http://localhost:5001/api/profile', config);
            setUserData(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching user data:', err);
            setError(err.response?.data?.msg || 'Failed to fetch user data. Please log in again.');
            onLogout();
        }
    }, [onLogout]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    if (loading) {
        return <div className="dashboard-container">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="dashboard-container error-message">{error}</div>;
    }

    const displayName = userData?.firstName || userData?.userName || userData?.email;

    return (
        <div className="dashboard-container">
            <h2>Welcome to your Dashboard, {displayName}!</h2>
            <p><strong>Email:</strong> {userData?.email}</p>
            <p><strong>Role:</strong> {userData?.role}</p>
            {/* Add a button to navigate to the user management page */}
            {user.role === 'primary_user' && (
                <button className="secondary-btn" onClick={() => setView('manage-users')}>
                    Manage Users
                </button>
            )}
            <button onClick={onLogout} className="logout-btn">Log Out</button>

            {view === 'manage-users' && <ManageUsers user={user} />}
        </div>
    );
};

export default Dashboard;