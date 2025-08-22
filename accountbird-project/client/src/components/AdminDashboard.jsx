// client/src/components/AdminDashboard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = ({ onLogout }) => {
    return (
        <div className="content">
            <header className="header">
                <h2>Admin Dashboard</h2>
            </header>
            <p>Welcome to the admin control panel. Use the sidebar to manage users and accounts.</p>
            <nav className="admin-nav">
                <ul>
                    <li>
                        <Link to="/admin/manage-users">Manage Users</Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default AdminDashboard;