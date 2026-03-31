import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const MoMoTest = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentId, setPaymentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const id = searchParams.get('paymentId');
    if (id) {
      setPaymentId(id);
    }
  }, [searchParams]);

  const handleCompletePayment = async () => {
    if (!paymentId) {
      alert('Payment ID is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const referralCode = localStorage.getItem('referralCode');
      const { data } = await axios.post(
        'http://localhost:5000/api/payments/complete-mobile-money',
        { paymentId, referralCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage('Payment completed successfully! Redirecting...');
      
      // Clear referral code after successful payment
      localStorage.removeItem('referralCode');
      
      setTimeout(() => {
        if (data.isPartnerPurchase) {
          navigate('/partner-dashboard');
        } else if (data.isDonation) {
          navigate('/');
        } else {
          navigate(`/module/${data.moduleId}`);
        }
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Payment completion failed');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Mobile Money Payment Test</h1>
        <p style={styles.subtitle}>
          This is a test page to simulate MTN MoMo / Orange Money payment completion
        </p>

        <div style={styles.infoBox}>
          <p style={styles.infoText}>
            ℹ️ In production, this would be handled automatically by the mobile money provider's callback.
          </p>
          <p style={styles.infoText}>
            For testing purposes, click the button below to simulate a successful payment.
          </p>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Payment ID:</label>
          <input
            type="text"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
            placeholder="Enter payment ID"
            style={styles.input}
          />
        </div>

        {message && (
          <div style={{
            ...styles.message,
            backgroundColor: message.includes('success') ? '#4CAF50' : '#ff4444'
          }}>
            {message}
          </div>
        )}

        <button
          onClick={handleCompletePayment}
          disabled={loading || !paymentId}
          style={{
            ...styles.button,
            ...(loading || !paymentId ? styles.buttonDisabled : {})
          }}
        >
          {loading ? 'Processing...' : '✓ Complete Payment (Test)'}
        </button>

        <button
          onClick={() => navigate('/modules')}
          style={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  infoBox: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #FFD700',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '30px'
  },
  infoText: {
    color: '#FFD700',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '10px 0'
  },
  formGroup: {
    marginBottom: '25px'
  },
  label: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  message: {
    padding: '15px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: '20px'
  },
  button: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginBottom: '15px'
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  cancelButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: 'transparent',
    color: '#FFD700',
    border: '2px solid #FFD700',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default MoMoTest;
