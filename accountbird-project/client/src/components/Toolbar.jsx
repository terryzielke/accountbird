// client/src/components/Toolbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './Toolbar.css';

const Toolbar = ({ user, onLogout }) => {
    const displayName = user.firstName || user.userName || user.email;

    return (
        <div className="toolbar">
            <div className="toolbar-left">
                <Link to="/" className="site-name">AccountBird</Link>
            </div>
            <div className="toolbar-right">
                <span>Welcome, {displayName}!</span>
                <button onClick={onLogout} className="logout-btn">Log Out</button>
            </div>
        </div>
    );
};

export default Toolbar;