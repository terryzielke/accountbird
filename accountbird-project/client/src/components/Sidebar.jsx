// client/src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ userRole }) => {

    const [openSubmenu, setOpenSubmenu] = useState(null);
    const location = useLocation();

    // Close the submenu if the current path does not start with "/admin/settings" or "/settings"
    useEffect(() => {
        if (userRole === 'admin') {
            if (!location.pathname.startsWith('/admin/settings')) {
                setOpenSubmenu(null);
            }
        } else {
            if (!location.pathname.startsWith('/settings')) {
                setOpenSubmenu(null);
            }
        }
    }, [location.pathname, userRole]);

    const toggleSubmenu = (menu) => {
        setOpenSubmenu(openSubmenu === menu ? null : menu);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <div className="sidebar">
            <nav>
                <ul>
                    {userRole === 'admin' ? (
                        <>
                            <li>
                                <NavLink to="/admin/dashboard">Dashboard</NavLink>
                            </li>
                            <li>
                                <NavLink to="/admin/users">All Users</NavLink>
                            </li>
                            <li>
                                <NavLink to="/admin/accounts">Accounts</NavLink>
                            </li>
                            <li className={location.pathname.startsWith('/admin/settings') ? 'active-parent' : ''}>
                                <div onClick={() => toggleSubmenu('settings')}>Settings</div>
                                {openSubmenu === 'settings' && (
                                    <ul className="submenu">
                                        <li>
                                            <NavLink to="/admin/settings/general">General Settings</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/settings/subscription" state={{ view: 'list' }}>Subscription Types</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/settings/email">Email Settings</NavLink>
                                        </li>
                                        <li>
                                            <NavLink to="/admin/settings/billing">Billing & Payments</NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <NavLink to="/dashboard">Dashboard</NavLink>
                            </li>
                            <li>
                                <NavLink to="/profile">Profile</NavLink>
                            </li>
                            {userRole === 'primary_user' && (
                                <li>
                                    <NavLink to="/users" state={{ view: 'list' }}>Users</NavLink>
                                </li>
                            )}
                            {userRole === 'primary_user' && (
                                <li className={location.pathname.startsWith('/settings') ? 'active-parent' : ''}>
                                    <div onClick={() => toggleSubmenu('settings')}>Settings</div>
                                    {openSubmenu === 'settings' && (
                                        <ul className="submenu">
                                            <li>
                                                <NavLink to="/settings/general">General Settings</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/settings/subscription">Subscription Type</NavLink>
                                            </li>
                                            <li>
                                                <NavLink to="/settings/billing">Billing & Payments</NavLink>
                                            </li>
                                        </ul>
                                    )}
                                </li>
                            )}
                        </>
                    )}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;