import React from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>⚠️</div>
        <h2 style={styles.title}>Payment Cancelled</h2>
        <p style={styles.text}>
          Your payment was cancelled. No charges were made to your account.
        </p>
        <button onClick={() => navigate('/modules')} style={styles.button}>
          Back to Modules
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
  icon: {
    fontSize: '64px',
    marginBottom: '20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  text: {
    color: '#ccc',
    fontSize: '16px',
    lineHeight: '1.6',
    marginBottom: '30px'
  },
  button: {
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

export default PaymentCancel;
