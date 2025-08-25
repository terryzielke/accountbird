// client/src/components/UserLayout.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Toolbar from './Toolbar';
import Sidebar from './Sidebar';
import UserDashboard from './UserDashboard';
import UserProfile from './UserProfile';
import PrimaryUserManageUsers from './PrimaryUserManageUsers';
//import PrimaryUserAccountSettingsLayout from './PrimaryUserAccountSettingsLayout';

// Settings components
import PrimaryUserGeneralSettings from './PrimaryUserGeneralSettings';
import PrimaryUserSubscriptionType from './PrimaryUserSubscriptionType';
import PrimaryUserBillingAndPayments from './PrimaryUserBillingAndPayments';

const UserLayout = ({ user, onLogout }) => {
    return (
        <Router>
            <div className="layout-container">
                <Toolbar user={user} onLogout={onLogout} />
                <div className="main-content-container">
                    <Sidebar userRole={user.role} />
                    <div className="content-area">
                        <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" />} />
                            <Route path="/dashboard" element={<UserDashboard user={user} onLogout={onLogout} />} />
                            <Route path="/profile" element={<UserProfile user={user} onLogout={onLogout} />} />
                            <Route path="/users" element={<PrimaryUserManageUsers user={user} onLogout={onLogout} />} />
                            {/*<Route path="/settings/*" element={<PrimaryUserAccountSettingsLayout user={user} onLogout={onLogout} />} />*/}
                            <Route path="/settings/general" element={<PrimaryUserGeneralSettings user={user} onLogout={onLogout} />} />
                            <Route path="/settings/subscription" element={<PrimaryUserSubscriptionType user={user} onLogout={onLogout} />} />
                            <Route path="/settings/billing" element={<PrimaryUserBillingAndPayments user={user} onLogout={onLogout} />} />
                            <Route path="*" element={<div>Page Not Found</div>} />
                        </Routes>
                    </div>
                </div>
            </div>
        </Router>
    );
};

export default UserLayout;