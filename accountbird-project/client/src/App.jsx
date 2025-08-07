// client/src/App.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // We'll need to install this library
import InitializationForm from './components/InitializationForm'; // We'll create this next
import LoginPage from './components/LoginPage';           // And this one too
import './App.css';

function App() {
    // State to track if the system has been initialized
    const [isInitialized, setIsInitialized] = useState(null);
    const [loading, setLoading] = useState(true);

    // useEffect hook to run a check when the component mounts
    useEffect(() => {
        const checkInitializationStatus = async () => {
            try {
                // Call the backend endpoint we created
                const response = await axios.get('http://localhost:5001/api/init/check');
                setIsInitialized(response.data.initialized);
            } catch (error) {
                console.error('Error checking initialization status:', error);
                // Handle potential network or server errors
                setIsInitialized(false);
            } finally {
                setLoading(false);
            }
        };

        checkInitializationStatus();
    }, []); // Empty dependency array ensures this runs only once

    // Function to handle successful initialization from the form
    const handleInitializationSuccess = () => {
        setIsInitialized(true);
    };

    // Render logic
    if (loading) {
        return <div className="loading-container">Loading...</div>;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>AccountBird</h1>
            </header>
            <main>
                {isInitialized ? (
                    // If initialized, show the login page
                    <LoginPage />
                ) : (
                    // If not initialized, show the initialization form
                    <InitializationForm onInitializationSuccess={handleInitializationSuccess} />
                )}
            </main>
        </div>
    );
}

export default App;