// components/AdminBillingAndPayments.jsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {Link} from 'react-router-dom';

const AdminBillingAndPayments = () => {
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We can add a function here to check the connection status.
    const checkStripeConnection = async () => {
      try {
        const res = await axios.get('/api/admin/stripe/status'); // A new endpoint to check connection status.
        setStripeConnected(res.data.connected);
        setLoading(false);
      } catch (err) {
        setError("Could not check Stripe connection status.");
        setLoading(false);
      }
    };
    checkStripeConnection();
  }, []);

  const handleStripeConnect = () => {
    // This will redirect the user to the backend route, which then redirects to Stripe.
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/admin/stripe/connect`;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="content">
        <header className='header'>
            <h2>Billing & Payments</h2>
        </header>
      <p>Manage site-wide billing settings, including Stripe integration.</p>

      <div className="stripe-integration">
        <h3>Stripe Integration</h3>
        {stripeConnected ? (
          <>
            <p>Stripe account is successfully connected.</p>
            {/* Add a button to manage the account on Stripe */}
            <Link to="https://dashboard.stripe.com/dashboard" target="_blank" rel="noopener noreferrer">
              <button className="btn btn-green">Go to Stripe Dashboard</button>
            </Link>
          </>
        ) : (
          <>
            <p>Stripe is not yet connected. Click the button below to connect your Stripe account.</p>
            <button
              onClick={handleStripeConnect}
              className="btn btn-purple"
              style={{ backgroundColor: '#9946FF' }} // Use the specified purple color
            >
              Connect with Stripe
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default AdminBillingAndPayments;