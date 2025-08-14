// client/src/components/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    return (
        <div className="admin-dashboard-container">
            <h2>Admin Dashboard</h2>
            <p>Welcome to the admin control panel. Use the sidebar to manage users and accounts.</p>
            <div className="dashboard-actions">
                <Link to="/admin/accounts" className="secondary-btn">Manage Accounts</Link>
                <Link to="/admin/users" className="secondary-btn">Manage Users</Link>
            </div>
        </div>
    );
};

export default AdminDashboard;