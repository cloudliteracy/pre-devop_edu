import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [draggedText, setDraggedText] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text', 'cloudliteracy');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text');
    if (text === 'cloudliteracy') {
      setDraggedText(text);
      setCaptchaVerified(true);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaVerified) {
      setError('Please complete the captcha verification');
      return;
    }
    try {
      const { data } = await authAPI.login(formData);
      login(data.token, data.user);
      
      if (data.user.mustChangePassword && data.user.role === 'admin') {
        navigate('/admin/change-password-required');
      } else {
        navigate('/modules');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h2 style={styles.title}>Login to CloudLiteracy</h2>
        {error && <p style={styles.error}>{error}</p>}
        
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                style={styles.passwordInput}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.captchaContainer}>
            <p style={styles.captchaLabel}>Verify you're human:</p>
            <div style={styles.captchaBox}>
              <div
                draggable
                onDragStart={handleDragStart}
                style={styles.draggableText}
              >
                cloudliteracy
              </div>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                style={{
                  ...styles.dropZone,
                  backgroundColor: captchaVerified ? '#2d5016' : '#1a1a1a',
                  border: captchaVerified ? '2px solid #FFD700' : '2px dashed #FFD700'
                }}
              >
                {captchaVerified ? '✓ Verified' : 'Drag "cloudliteracy" here'}
              </div>
            </div>
          </div>

          <button type="submit" style={styles.submitButton}>
            Login
          </button>
        </form>

        <div style={styles.links}>
          <Link to="/forgot-password" style={styles.link}>Forgot Password?</Link>
        </div>
        
        <p style={styles.footer}>
          Don't have an account? <Link to="/register" style={styles.link}>Register</Link>
        </p>
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
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: 'bold'
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
    marginBottom: '20px'
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
    transition: 'border 0.3s',
    boxSizing: 'border-box'
  },
  passwordContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  passwordInput: {
    width: '100%',
    padding: '12px',
    paddingRight: '45px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
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
  captchaContainer: {
    marginBottom: '25px'
  },
  captchaLabel: {
    color: '#FFD700',
    marginBottom: '10px',
    fontSize: '14px'
  },
  captchaBox: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  draggableText: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'move',
    fontWeight: 'bold',
    userSelect: 'none'
  },
  dropZone: {
    flex: 1,
    minWidth: '200px',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    color: '#FFD700',
    fontSize: '14px',
    minHeight: '50px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
    transition: 'all 0.3s',
    marginBottom: '15px'
  },
  links: {
    textAlign: 'center',
    marginBottom: '15px'
  },
  link: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'color 0.3s'
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px'
  }
};

export default Login;
