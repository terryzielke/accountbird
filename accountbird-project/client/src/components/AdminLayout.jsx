// client/src/components/AdminLayout.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import AdminDashboard from './AdminDashboard';
import AdminManageAccounts from './AdminManageAccounts';
import AdminManageUsers from './AdminManageUsers';
import AdminAccountDetail from './AdminAccountDetail';
// Settings components
import AdminGeneralSettings from './AdminGeneralSettings';
import SubscriptionTypes from './AdminSubscriptionTypes';
import AdminEmailSettings from './AdminEmailSettings';
import BillingAndPayments from './AdminBillingAndPayments';

const AdminLayout = ({ user, onLogout }) => {
    return (
        <Router>
            <div className="layout-container">
                <Toolbar user={user} onLogout={onLogout} />
                <div className="main-content-container">
                    <Sidebar userRole={user.role} />
                    <div className="content-area">
                        <Routes>
                            <Route path="/" element={<Navigate to="/admin/dashboard" />} />
                            <Route path="/admin/dashboard" element={<AdminDashboard onLogout={onLogout} />} />
                            <Route path="/admin/accounts" element={<AdminManageAccounts onLogout={onLogout} />} />
                            <Route path="/admin/users" element={<AdminManageUsers onLogout={onLogout} />} />
                            <Route path="/admin/accounts/:accountId" element={<AdminAccountDetail onLogout={onLogout} />} />
                            <Route path="/admin/settings/general" element={<AdminGeneralSettings onLogout={onLogout} />} />
                            <Route path="/admin/settings/subscription" element={<SubscriptionTypes onLogout={onLogout} />} />
                            <Route path="/admin/settings/email" element={<AdminEmailSettings onLogout={onLogout} />} />
                            <Route path="/admin/settings/billing" element={<BillingAndPayments onLogout={onLogout} />} />
                            <Route path="*" element={<div>Page Not Found</div>} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default AdminLayout;