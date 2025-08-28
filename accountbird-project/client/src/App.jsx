// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import InitializationForm from './components/InitializationForm';
import LoginPage from './components/LoginPage';
import RegistrationForm from './components/RegistrationForm';
import RegistrationConfirmation from './components/RegistrationConfirmation';
import RemoveAccount from './components/RemoveAccount';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';

import './App.css';

function App() {
    const [isInitialized, setIsInitialized] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkInitializationStatus = async () => {
            try {
                const response = await axios.get('http://localhost:5001/api/init/check');
                setIsInitialized(response.data.initialized);
            } catch (error) {
                console.error('Error checking initialization status:', error);
                setIsInitialized(false);
            } finally {
                setLoading(false);
            }
        };

        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            setUser(JSON.parse(storedUser));
            setIsInitialized(true);
            setLoading(false);
        } else {
            checkInitializationStatus();
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleUserUpdate = (updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    if (!isInitialized) {
        return <InitializationForm onInitializationSuccess={() => setIsInitialized(true)} />;
    }

    if (user) {
        if (user.role === 'admin') {
            return <AdminLayout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
        } else {
            return <UserLayout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
        }
    }

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
                <Route path="/register" element={<RegistrationForm />} />
                <Route path="/confirmation" element={<RegistrationConfirmation />} />
                <Route path="/remove-account" element={<RemoveAccount />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;