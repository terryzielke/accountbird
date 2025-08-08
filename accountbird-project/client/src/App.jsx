// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InitializationForm from './components/InitializationForm';
import LoginPage from './components/LoginPage';
import './App.css';

function App() {
    // State to track if the system has been initialized
    const [isInitialized, setIsInitialized] = useState(null);
    const [loading, setLoading] = useState(true);
    // State to track login status
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

        // Check for a token in local storage on initial load
        const token = localStorage.getItem('token');
        if (token) {
            // In a real app, you'd verify the token with the server
            // For now, we'll just assume a token means the user is logged in
            setUser({ userName: 'Admin User' }); // Placeholder for now
            setIsInitialized(true); // If a token exists, the app must be initialized
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
        setUser(null);
        window.location.reload();
    };

    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }
    
    // Render logic
    if (isInitialized) {
        if (user) {
            return (
                <div className="App">
                    <header className="App-header">
                        <h1>AccountBird</h1>
                    </header>
                    <main>
                        <h2>Welcome {user.userName}!</h2>
                        <button onClick={handleLogout}>Log Out</button>
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
                        <LoginPage />
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