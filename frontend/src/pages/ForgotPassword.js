import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement password reset API call
    setMessage('Password reset link has been sent to your email (Feature coming soon)');
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.description}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {message && <p style={styles.success}>{message}</p>}
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.submitButton}>
            Send Reset Link
          </button>
        </form>
        
        <div style={styles.footer}>
          <Link to="/login" style={styles.link}>← Back to Login</Link>
        </div>
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
  formCard: {
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.2)',
    border: '1px solid #FFD700',
    maxWidth: '450px',
    width: '100%'
  },
  title: {
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: '15px',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  description: {
    color: '#999',
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '14px',
    lineHeight: '1.5'
  },
  success: {
    color: '#4CAF50',
    backgroundColor: '#1a2d1a',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px'
  },
  error: {
    color: '#ff4444',
    backgroundColor: '#2d1a1a',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '25px'
  },
  label: {
    color: '#FFD700',
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '20px'
  },
  footer: {
    textAlign: 'center'
  },
  link: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '14px'
  }
};

export default ForgotPassword;
