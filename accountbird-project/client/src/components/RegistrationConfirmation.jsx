// client/src/components/RegistrationConfirmation.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const RegistrationConfirmation = () => {
    return (
        <div className="confirmation-container">
            <div className="confirmation">
                <h2>Registration Successful!</h2>
                <p>
                    Thank you for creating an account with AccountBird.
                    An email has been sent to your inbox to confirm your registration.
                </p>
                <p>
                    Please log in to continue.
                </p>
                <Link to="/login" className="login-link">Go to Login Page</Link>
            </div>
        </div>
    );
};

export default RegistrationConfirmation;