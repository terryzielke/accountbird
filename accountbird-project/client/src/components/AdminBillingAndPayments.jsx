// client/src/components/AdminBillingAndPayments.jsx
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import './AdminBillingAndPayments.css';

const AdminBillingAndPayments = () => {
  const { authToken } = useContext(AuthContext);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const location = useLocation();

  useEffect(() => {
    // Check for query parameters after a redirect from Stripe
    const params = new URLSearchParams(location.search);
    if (params.get('stripe_success')) {
      setMessage('Stripe account connected successfully!');
    } else if (params.get('stripe_error')) {
      setError('Stripe connection failed. Please try again.');
    }

    const checkStripeConnection = async () => {
      if (!authToken) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stripe/status`, {
          headers: {
            'x-auth-token': authToken,
          },
        });
        setStripeConnected(res.data.connected);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.msg || "Could not check Stripe connection status.");
        setLoading(false);
      }
    };
    checkStripeConnection();
  }, [authToken, location.search]);

  const handleStripeConnect = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/admin/stripe/connect`, {
        headers: {
          'x-auth-token': authToken,
        },
      });
      window.location.href = res.data.redirectUrl;
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to initiate Stripe Connect. Please try again.");
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="content">
      <header className='header'>
        <h2>Billing & Payments</h2>
      </header>
      <p>Manage site-wide billing settings, including Stripe integration.</p>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="stripe-integration">
        <h3>Stripe Integration</h3>
        {stripeConnected ? (
          <>
            <p>Stripe account is successfully connected.</p>
            <Link to="https://dashboard.stripe.com/dashboard" target="_blank" rel="noopener noreferrer">
              <button className="btn btn-green" style={{ backgroundColor: '#3CCF73' }}>Go to Stripe Dashboard</button>
            </Link>
          </>
        ) : (
          <>
            <p>Stripe is not yet connected. Click the button below to connect your Stripe account.</p>
            <button
              onClick={handleStripeConnect}
              className="btn btn-purple"
              style={{ backgroundColor: '#9946FF' }}
            >
              Connect with Stripe
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBillingAndPayments;