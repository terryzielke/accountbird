// client/src/components/Sidebar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ userRole }) => {
    return (
        <div className="sidebar">
            <nav>
                <ul>
                    {userRole === 'admin' ? (
                        <>
                            <li>
                                <Link to="/admin/dashboard">Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/admin/users">All Users</Link>
                            </li>
                            <li>
                                <Link to="/admin/accounts">Accounts</Link>
                            </li>
                            <li>
                                <Link to="/admin/settings">Settings</Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/dashboard">Dashboard</Link>
                            </li>
                            <li>
                                <Link to="/profile">Profile</Link>
                            </li>
                            {userRole === 'primary_user' && (
                                <li>
                                    <Link to="/users">Users</Link>
                                </li>
                            )}
                            {userRole === 'primary_user' && (
                                <li>
                                    <Link to="/settings">Settings</Link>
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