// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InitializationForm from './components/InitializationForm';
import LoginPage from './components/LoginPage';
import RegistrationForm from './components/RegistrationForm';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
    const [isInitialized, setIsInitialized] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showRegistration, setShowRegistration] = useState(false);

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

    const handleInitializationSuccess = () => {
        setIsInitialized(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }
    
    if (isInitialized) {
        if (user) {
            return (
                <div className="App">
                    <header className="App-header">
                        <h1>AccountBird</h1>
                    </header>
                    <main>
                        {/* Pass the user object to the Dashboard component */}
                        <Dashboard user={user} onLogout={handleLogout} />
                    </main>
                </div>
            );
        } else {
            return (
                <div className="App">
                    <header className="App-header">
                        <h1>AccountBird</h1>
                    </header>
                    <main>
                        {showRegistration ? (
                            <RegistrationForm />
                        ) : (
                            <>
                                <LoginPage />
                                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    <p>Don't have an account?</p>
                                    <button className="secondary-btn" onClick={() => setShowRegistration(true)}>
                                        Register Here
                                    </button>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            );
        }
    } else {
        return (
            <div className="App">
                <header className="App-header">
                    <h1>AccountBird</h1>
                </header>
                <main>
                    <InitializationForm onInitializationSuccess={handleInitializationSuccess} />
                </main>
            </div>
        );
    }
}

export default App;