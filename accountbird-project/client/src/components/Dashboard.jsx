// client/src/components/Dashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
    const displayName = user.firstName || user.userName || user.email;

    return (
        <div className="dashboard-container">
            <h2>Welcome to your Dashboard, {displayName}!</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            {user.role === 'primary_user' && (
                <Link to="/users" className="secondary-btn">Manage Users</Link>
            )}
            <button onClick={onLogout} className="logout-btn">Log Out</button>
        </div>
    );
};

export default Dashboard;