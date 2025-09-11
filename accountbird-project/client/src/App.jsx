// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
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
    const checkAppStatus = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const res = await axios.get('http://localhost:5001/api/profile', {
            headers: { 'x-auth-token': token },
          });
          setUser(res.data);
          setIsInitialized(true);
        } catch (error) {
          console.error('Error fetching user profile:', error);
          handleLogout();
          try {
            const response = await axios.get('http://localhost:5001/api/init/check');
            setIsInitialized(response.data.initialized);
          } catch (initError) {
            console.error('Error checking initialization status:', initError);
            setIsInitialized(false);
          }
        }
      } else {
        try {
          const response = await axios.get('http://localhost:5001/api/init/check');
          setIsInitialized(response.data.initialized);
        } catch (error) {
          console.error('Error checking initialization status:', error);
          setIsInitialized(false);
        }
      }
      setLoading(false);
    };

    checkAppStatus();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const handleLoginSuccess = async (token, userData) => {
    try {
      localStorage.setItem('token', token);
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user data after login:', error);
      handleLogout();
    }
  };

  const handleUserUpdate = (updatedUserData) => {
    setUser(updatedUserData);
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <AuthProvider>
      <>
        {isInitialized === false ? (
          <InitializationForm onInitializationSuccess={() => setIsInitialized(true)} />
        ) : user ? (
          user.role === 'admin' ? (
            <AdminLayout user={user} onLogout={handleLogout}>
              <Routes>
                <Route path="/admin/dashboard" element={<div className="content"><h2>Admin Dashboard</h2><p>Welcome, {user.userName}!</p></div>} />
                <Route path="/admin/manage-users" element={<div className="content"><h2>Manage Users</h2><p>User management here.</p></div>} />
                <Route path="*" element={<Navigate to="/admin/dashboard" />} />
              </Routes>
            </AdminLayout>
          ) : (
            <UserLayout user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate}>
              <Routes>
                <Route path="/user/dashboard" element={<div className="content"><h2>User Dashboard</h2><p>Welcome, {user.firstName}!</p></div>} />
                <Route path="*" element={<Navigate to="/user/dashboard" />} />
              </Routes>
            </UserLayout>
          )
        ) : (
          <Routes>
            <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
            <Route path="/register" element={<RegistrationForm />} />
            <Route path="/confirmation" element={<RegistrationConfirmation />} />
            <Route path="/remove-account" element={<RemoveAccount />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </>
    </AuthProvider>
  );
}

export default App;