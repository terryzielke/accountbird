// client/src/components/AdminLayout.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import AdminDashboard from './AdminDashboard';
import AdminManageAccounts from './AdminManageAccounts';
import AdminManageUsers from './AdminManageUsers';
import AdminAccountDetail from './AdminAccountDetail';
import AdminSettingsLayout from './AdminSettingsLayout';

const AdminLayout = ({ user, onLogout }) => {
    return (
        <Router>
            <div className="layout-container">
                <Toolbar user={user} onLogout={onLogout} />
                <div className="main-content-container">
                    <Sidebar userRole={user.role} />
                    <div className="content-area">
                        <Routes>
                            <Route path="/admin/" element={<Navigate to="/admin/dashboard" />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard onLogout={onLogout} />} />
                            <Route path="/admin/accounts" element={<AdminManageAccounts onLogout={onLogout} />} />
                            <Route path="/admin/users" element={<AdminManageUsers onLogout={onLogout} />} />
                            <Route path="/admin/accounts/:accountId" element={<AdminAccountDetail onLogout={onLogout} />} />
                            <Route path="/admin/settings/*" element={<AdminSettingsLayout />} />
                            <Route path="*" element={<div>Page Not Found</div>} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default AdminLayout;