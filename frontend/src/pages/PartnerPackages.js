import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { authAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const packages = [
  { id: 'Silver', name: 'Silver Partner', price: 500, description: 'Support basic CSR initiatives.', icon: '🥈', color: '#C0C0C0' },
  { id: 'Gold', name: 'Gold Partner', price: 1000, description: 'Enhance regional CSR drives.', icon: '🥇', color: '#FFD700' },
  { id: 'Platinum', name: 'Platinum Partner', price: 2000, description: 'Sponsor dedicated learning events.', icon: '💎', color: '#E5E4E2' },
  { id: 'Diamond', name: 'Diamond Partner', price: 5000, description: 'Global CSR campaign leadership.', icon: '👑', color: '#b9f2ff' }
];

const PartnerPackages = () => {
  const [selectedTier, setSelectedTier] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', country: '' });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleBuyClick = (tier) => {
    setSelectedTier(tier);
    setError('');
  };

  const closeModal = () => {
    setSelectedTier(null);
    setError('');
  };

  const handleRegisterAndCheckout = async (e) => {
    e.preventDefault();
    if (!profilePhoto && !isAuthenticated) {
      setError('Profile photo is required for new accounts.');
      return;
    }

    setLoading(true);
    let token = localStorage.getItem('token');

    try {
      if (!isAuthenticated) {
        // Step 1: Register User
        const registrationData = new FormData();
        registrationData.append('name', formData.name);
        registrationData.append('email', formData.email);
        registrationData.append('password', formData.password);
        registrationData.append('country', formData.country);
        registrationData.append('profilePhoto', profilePhoto);

        const { data } = await authAPI.register(registrationData);
        login(data.token, data.user);
        token = data.token;
      }

      // Step 2: Initiate Payment via Stripe
      const paymentData = {
        paymentMethod: 'stripe',
        isPartnerPurchase: true,
        partnerTier: selectedTier.id
      };

      const response = await axios.post('http://localhost:5000/api/payments/initiate', paymentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.url) {
        window.location.href = response.data.url;
      } else {
        setError('Failed to securely initiate checkout session.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration or Payment initiation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Become A Partner</h1>
        <p style={styles.subtitle}>
          Invest in our Corporate Social Responsibility (CSR) initiatives by becoming a tiered partner. 
          Your contributions grant you a lifetime Access Code and help shape the future of tech education!
        </p>
      </div>

      <div style={styles.grid}>
        {packages.map((pkg) => (
          <div key={pkg.id} style={{ ...styles.card, borderColor: pkg.color }}>
            <div style={styles.icon}>{pkg.icon}</div>
            <h2 style={{ ...styles.packageName, color: pkg.color }}>{pkg.name}</h2>
            <div style={styles.price}>${pkg.price}</div>
            <p style={styles.description}>{pkg.description}</p>
            <button 
              style={{ ...styles.buyButton, backgroundColor: pkg.color, color: '#000' }}
              onClick={() => handleBuyClick(pkg)}
            >
              Buy Package
            </button>
          </div>
        ))}
      </div>

      {selectedTier && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <button onClick={closeModal} style={styles.closeButton}>×</button>
            <h2 style={styles.modalTitle}>Join as {selectedTier.name}</h2>
            <p style={styles.modalSubtitle}>Total: ${selectedTier.price}</p>
            
            {error && <p style={styles.error}>{error}</p>}

            <form onSubmit={handleRegisterAndCheckout} style={styles.form}>
              {!isAuthenticated && (
                <>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
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
                    <label style={styles.label}>Country</label>
                    <input
                      type="text"
                      placeholder="Enter your country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Password</label>
                    <input
                      type="password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Profile Photo *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setProfilePhoto(e.target.files[0])}
                      required
                      style={styles.fileInput}
                    />
                  </div>
                </>
              )}
              {isAuthenticated && (
                <p style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                  You are already logged in. Proceeding will instantly forward you to the secure checkout!
                </p>
              )}

              <button type="submit" style={styles.submitButton} disabled={loading}>
                {loading ? 'Processing...' : 'Submit & Pay via Stripe'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    padding: '60px 20px',
    backgroundColor: '#0a0a0a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    maxWidth: '800px',
    marginBottom: '60px'
  },
  title: {
    color: '#FFD700',
    fontSize: '48px',
    marginBottom: '20px'
  },
  subtitle: {
    color: '#ccc',
    fontSize: '20px',
    lineHeight: '1.6'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '30px',
    width: '100%',
    maxWidth: '1200px'
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: '15px',
    padding: '40px 30px',
    textAlign: 'center',
    border: '2px solid',
    transition: 'transform 0.3s, box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  icon: {
    fontSize: '60px',
    marginBottom: '20px'
  },
  packageName: {
    fontSize: '28px',
    marginBottom: '10px'
  },
  price: {
    color: '#fff',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  description: {
    color: '#aaa',
    fontSize: '16px',
    marginBottom: '30px',
    minHeight: '48px'
  },
  buyButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'opacity 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    padding: '40px',
    borderRadius: '15px',
    width: '100%',
    maxWidth: '500px',
    position: 'relative',
    border: '1px solid #333'
  },
  closeButton: {
    position: 'absolute',
    top: '20px',
    right: '25px',
    background: 'none',
    border: 'none',
    color: '#fff',
    fontSize: '30px',
    cursor: 'pointer'
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '10px',
    textAlign: 'center'
  },
  modalSubtitle: {
    color: '#ccc',
    fontSize: '20px',
    marginBottom: '30px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#ccc',
    fontSize: '14px'
  },
  input: {
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px'
  },
  fileInput: {
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff'
  },
  submitButton: {
    padding: '16px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  error: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '20px'
  }
};

export default PartnerPackages;
