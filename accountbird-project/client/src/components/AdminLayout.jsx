// client/src/components/AdminLayout.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import AdminDashboard from './AdminDashboard';
import ManageAccounts from './ManageAccounts';
import ManageUsers from './ManageUsers';
import AccountDetail from './AccountDetail';

const AdminLayout = ({ user, onLogout }) => {
    return (
        <Router>
            <div className="layout-container">
                <Toolbar user={user} onLogout={onLogout} />
                <div className="main-content-container">
                    <Sidebar userRole={user.role} />
                    <div className="content-area">
                        <Routes>
                            <Route path="/" element={<Navigate to="/admin-dashboard" />} />
                            <Route path="/admin-dashboard" element={<AdminDashboard onLogout={onLogout} />} />
                            <Route path="/admin/accounts" element={<ManageAccounts onLogout={onLogout} />} />
                            <Route path="/admin/users" element={<ManageUsers onLogout={onLogout} />} />
                            <Route path="/admin/accounts/:accountId" element={<AccountDetail onLogout={onLogout} />} />
                            <Route path="*" element={<div>Page Not Found</div>} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default AdminLayout;