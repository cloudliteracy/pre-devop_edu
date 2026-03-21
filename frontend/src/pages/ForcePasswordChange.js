import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const ForcePasswordChange = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (form.newPassword !== form.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    if (form.newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/auth/change-password', 
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const updatedUser = { ...user, mustChangePassword: false };
      updateUser(updatedUser);
      
      setMessage({ text: 'Password changed successfully! Redirecting...', type: 'success' });
      setTimeout(() => navigate('/admin'), 2000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to change password', 
        type: 'error' 
      });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>⚠️ Password Change Required</h1>
          <p style={styles.subtitle}>
            You must change your temporary password before accessing the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Current Password (Temporary)</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm({...form, currentPassword: e.target.value})}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                style={styles.eyeButton}
              >
                {showPasswords.current ? '👁️' : '👁️🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({...form, newPassword: e.target.value})}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                style={styles.eyeButton}
              >
                {showPasswords.new ? '👁️' : '👁️🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={styles.inputWrapper}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                style={styles.eyeButton}
              >
                {showPasswords.confirm ? '👁️' : '👁️🗨️'}
              </button>
            </div>
          </div>

          {message.text && (
            <div style={{
              ...styles.message,
              backgroundColor: message.type === 'success' ? '#4CAF50' : '#ff4444'
            }}>
              {message.text}
            </div>
          )}

          <button type="submit" style={styles.submitButton}>
            Change Password & Continue
          </button>
        </form>
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
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '40px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 32px rgba(255, 215, 0, 0.3)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  subtitle: {
    color: '#999',
    fontSize: '16px',
    lineHeight: '1.5'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  input: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none'
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '5px'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500'
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '10px'
  }
};

export default ForcePasswordChange;
