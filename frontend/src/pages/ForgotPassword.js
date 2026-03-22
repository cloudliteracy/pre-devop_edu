import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetUrl, setResetUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setResetUrl('');

    try {
      const { data } = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      setMessage(data.message);
      
      if (!data.emailSent && data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetUrl);
    alert('Reset link copied to clipboard!');
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.description}>
          Enter your email address and we'll generate a password reset link for you.
        </p>
        
        {message && (
          <div style={styles.success}>
            <p>{message}</p>
            {resetUrl && (
              <div style={styles.resetLinkBox}>
                <p style={styles.resetLinkLabel}>Your password reset link:</p>
                <div style={styles.resetLinkContainer}>
                  <input 
                    type="text" 
                    value={resetUrl} 
                    readOnly 
                    style={styles.resetLinkInput}
                  />
                  <button onClick={copyToClipboard} style={styles.copyButton}>
                    📋 Copy
                  </button>
                </div>
                <p style={styles.resetLinkNote}>
                  ⚠️ This link expires in 1 hour. Copy it and paste in your browser.
                </p>
              </div>
            )}
          </div>
        )}
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

          <button type="submit" style={styles.submitButton} disabled={loading}>
            {loading ? 'Processing...' : 'Generate Reset Link'}
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
    maxWidth: '550px',
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
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  resetLinkBox: {
    marginTop: '15px'
  },
  resetLinkLabel: {
    color: '#FFD700',
    fontSize: '13px',
    marginBottom: '8px',
    fontWeight: 'bold'
  },
  resetLinkContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px'
  },
  resetLinkInput: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #FFD700',
    borderRadius: '6px',
    color: '#FFD700',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  copyButton: {
    padding: '10px 15px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  resetLinkNote: {
    color: '#ff9800',
    fontSize: '12px',
    fontStyle: 'italic'
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
