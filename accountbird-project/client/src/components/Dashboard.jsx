// client/src/components/Dashboard.jsx
import React from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    // Determine the user's name for the welcome message
    const displayName = user.firstName || user.userName || user.email;

    return (
        <div className="dashboard-container">
            <h2>Welcome to your Dashboard, {displayName}!</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <button onClick={onLogout} className="logout-btn">Log Out</button>
        </div>
    );
};

export default Dashboard;