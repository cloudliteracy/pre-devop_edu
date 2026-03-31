import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');
      const token = searchParams.get('token');
      const referralCode = localStorage.getItem('referralCode');
      
      if (sessionId) {
        // Stripe payment
        try {
          const authToken = localStorage.getItem('token');
          const response = await axios.post(
            'http://localhost:5000/api/payments/verify-stripe',
            { sessionId, referralCode },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          if (response.data.success) {
            setStatus('success');
            // Clear referral code after successful payment
            localStorage.removeItem('referralCode');
            if (response.data.isDonation) {
              setMessage('Thank you for your generous donation!');
              setTimeout(() => navigate('/'), 3000);
            } else {
              setMessage('Payment successful! Redirecting to your module...');
              setTimeout(() => navigate(`/module/${response.data.moduleId}`), 3000);
            }
          } else {
            setStatus('error');
            setMessage('Payment verification failed');
          }
        } catch (error) {
          setStatus('error');
          setMessage(error.response?.data?.message || 'Payment verification failed');
        }
      } else if (token) {
        // PayPal payment - token is the order ID
        try {
          const authToken = localStorage.getItem('token');
          const response = await axios.post(
            'http://localhost:5000/api/payments/verify-paypal',
            { orderId: token, referralCode },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );

          if (response.data.success) {
            setStatus('success');
            // Clear referral code after successful payment
            localStorage.removeItem('referralCode');
            if (response.data.isDonation) {
              setMessage('Thank you for your generous donation!');
              setTimeout(() => navigate('/'), 3000);
            } else {
              setMessage('Payment successful! Redirecting to your module...');
              setTimeout(() => navigate(`/module/${response.data.moduleId}`), 3000);
            }
          } else {
            setStatus('error');
            setMessage('Payment verification failed');
          }
        } catch (error) {
          setStatus('error');
          setMessage(error.response?.data?.message || 'Payment verification failed');
        }
      } else {
        setStatus('error');
        setMessage('No payment session found');
      }
    };

    verifyPayment();
  }, [searchParams, navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {status === 'verifying' && (
          <>
            <div style={styles.loader}></div>
            <h2 style={styles.title}>Verifying Payment...</h2>
            <p style={styles.text}>Please wait while we confirm your payment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={styles.successIcon}>✓</div>
            <h2 style={styles.successTitle}>Payment Successful!</h2>
            <p style={styles.text}>{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={styles.errorIcon}>✗</div>
            <h2 style={styles.errorTitle}>Payment Failed</h2>
            <p style={styles.text}>{message}</p>
            <button onClick={() => navigate('/modules')} style={styles.button}>
              Back to Modules
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '50px',
    textAlign: 'center',
    maxWidth: '500px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
  },
  loader: {
    border: '4px solid #333',
    borderTop: '4px solid #FFD700',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 30px'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '15px'
  },
  text: {
    color: '#ccc',
    fontSize: '16px',
    lineHeight: '1.6'
  },
  successIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#fff',
    margin: '0 auto 30px',
    fontWeight: 'bold'
  },
  successTitle: {
    color: '#4CAF50',
    fontSize: '32px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  errorIcon: {
    width: '80px',
    height: '80px',
    backgroundColor: '#ff4444',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#fff',
    margin: '0 auto 30px',
    fontWeight: 'bold'
  },
  errorTitle: {
    color: '#ff4444',
    fontSize: '32px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  button: {
    marginTop: '30px',
    padding: '15px 40px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default PaymentSuccess;
