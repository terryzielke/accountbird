// client/src/components/AdminSettingsLayout.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminGeneralSettings from './AdminGeneralSettings';
import SubscriptionTypes from './AdminSubscriptionTypes';
import AdminEmailSettings from './AdminEmailSettings';
import BillingAndPayments from './AdminBillingAndPayments';
import './AdminSettingsLayout.css';

const AdminSettingsLayout = () => {
    const [activeLink, setActiveLink] = useState('general');

    return (
        <div className="admin-settings-container">
            <div className="admin-settings-sidebar">
                <nav>
                    <ul>
                        <li>
                            <Link to="/admin/settings/general" className={activeLink === 'general' ? 'active' : ''} onClick={() => setActiveLink('general')}>
                                General Settings
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/settings/subscription" className={activeLink === 'subscription' ? 'active' : ''} onClick={() => setActiveLink('subscription')}>
                                Subscription Types
                            </Link>
                        </li>
                        <li>
                            <Link to="/admin/settings/email" className={activeLink === 'email' ? 'active' : ''} onClick={() => setActiveLink('email')}>
                                Email Settings
                            </Link>
                        <li>
                            <Link to="/admin/settings/billing" className={activeLink === 'billing' ? 'active' : ''} onClick={() => setActiveLink('billing')}>
                                Billing & Payments
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="admin-settings-content">
                <Routes>
                    <Route path="/" element={<Navigate to="general" />} />
                    <Route path="general" element={<AdminGeneralSettings />} />
                    <Route path="subscription" element={<SubscriptionTypes />} />
                    <Route path="email" element={<AdminEmailSettings />} />
                    <Route path="billing" element={<BillingAndPayments />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminSettingsLayout;