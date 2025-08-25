// client/src/components/PrimaryUserAccountSettings.jsx
import React, { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import PrimaryUserGeneralSettings from './PrimaryUserGeneralSettings';
import PrimaryUserSubscriptionType from './PrimaryUserSubscriptionType';
import PrimaryUserBillingAndPayments from './PrimaryUserBillingAndPayments';
import './PrimaryUserAccountSettingsLayout.css';

const PrimaryUserAccountSettingsLayout = ({ user, onLogout }) => {
    const [activeLink, setActiveLink] = useState('subscription');

    return (
        <div className="user-account-settings-container">
            <div className="user-account-settings-sidebar">
                <nav>
                    <ul>
                        <li>
                            <Link to="/settings/general" className={activeLink === 'general' ? 'active' : ''} onClick={() => setActiveLink('general')}>
                                General Settings
                            </Link>
                        </li>
                        <li>
                            <Link to="/settings/subscription" className={activeLink === 'subscription' ? 'active' : ''} onClick={() => setActiveLink('subscription')}>
                                Subscription Type
                            </Link>
                        </li>
                        <li>
                            <Link to="/settings/billing" className={activeLink === 'billing' ? 'active' : ''} onClick={() => setActiveLink('billing')}>
                                Billing & Payments
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
            <div className="user-account-settings-content">
                <Routes>
                    <Route path="/" element={<Navigate to="subscription" />} />
                    <Route path="general" element={<PrimaryUserGeneralSettings user={user} onLogout={onLogout} />} />
                    <Route path="subscription" element={<PrimaryUserSubscriptionType user={user} onLogout={onLogout} />} />
                    <Route path="billing" element={<PrimaryUserBillingAndPayments user={user} onLogout={onLogout} />} />
                </Routes>
            </div>
        </div>
    );
};

export default PrimaryUserAccountSettingsLayout;