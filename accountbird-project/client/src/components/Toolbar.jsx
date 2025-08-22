// client/src/components/Toolbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Toolbar.css';

const Toolbar = ({ user, onLogout }) => {
    // State to manage the dropdown's visibility
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Ref to handle clicks outside the dropdown
    const dropdownRef = useRef(null);

    // Get the user's display name, preferring a full name if available
    const displayName = user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.userName || user.email;

    // Toggle the dropdown's open state
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    // Close the dropdown if a click occurs outside of it
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        // Add event listener for clicks
        document.addEventListener('mousedown', handleClickOutside);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="toolbar">
            <div className="toolbar-left">
                <Link to="/" className="site-name">AccountBird</Link>
            </div>
            <div className="toolbar-center"></div>
            <div className="toolbar-right">
                <div className="dropdown-container" ref={dropdownRef}>
                    <button onClick={toggleDropdown} className="dropdown-btn">
                        {displayName}
                    </button>
                    {dropdownOpen && (
                        <div className="dropdown-menu">
                            {/* Conditionally render the "Edit Profile" link for non-admin users */}
                            {user.role !== 'admin' && (
                                <Link to="/profile" className="dropdown-item" onClick={() => setDropdownOpen(false)}>
                                    Edit Profile
                                </Link>
                            )}
                            <button onClick={onLogout} className="dropdown-item logout-btn">
                                Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toolbar;