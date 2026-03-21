import React, { useState, useContext } from 'react';
import { paymentAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const DonateModal = ({ isOpen, onClose }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  const predefinedAmounts = [5, 10, 25, 50, 100];

  const handleDonate = async () => {
    if (!isAuthenticated) {
      alert('Please login to make a donation');
      onClose();
      return;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!paymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if ((paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && !phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      // Create a donation payment (moduleId will be null for donations)
      const { data } = await paymentAPI.initiate({
        moduleId: null,
        amount: parseFloat(amount),
        paymentMethod,
        phoneNumber,
        isDonation: true
      });

      if ((paymentMethod === 'stripe' || paymentMethod === 'paypal') && data.url) {
        window.location.href = data.url;
      } else {
        alert('Donation initiated: ' + JSON.stringify(data));
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Donation failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>❤️ Support CloudLiteracy</h2>
          <button style={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <p style={styles.subtitle}>
          Your donation helps us provide quality education to aspiring DevOps professionals
        </p>

        {error && <div style={styles.errorMessage}>{error}</div>}

        {/* Amount Selection */}
        <div style={styles.section}>
          <label style={styles.label}>Donation Amount (USD)</label>
          <div style={styles.amountButtons}>
            {predefinedAmounts.map((amt) => (
              <button
                key={amt}
                onClick={() => setAmount(amt.toString())}
                style={{
                  ...styles.amountButton,
                  backgroundColor: amount === amt.toString() ? '#FFD700' : '#1a1a1a',
                  color: amount === amt.toString() ? '#000' : '#FFD700',
                  border: amount === amt.toString() ? '2px solid #FFD700' : '1px solid #333'
                }}
              >
                ${amt}
              </button>
            ))}
          </div>
          <input
            type="number"
            placeholder="Or enter custom amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={styles.amountInput}
            min="1"
          />
        </div>

        {/* Payment Methods */}
        <div style={styles.section}>
          <label style={styles.label}>Payment Method</label>
          <div style={styles.paymentMethods}>
            {/* MTN Mobile Money */}
            <div
              onClick={() => setPaymentMethod('mtn_momo')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'mtn_momo' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'mtn_momo' ? '#2d2d1a' : '#0d0d0d'
              }}
            >
              <div style={styles.mtnLogo}>MTN</div>
              <span style={styles.paymentName}>MTN MoMo</span>
              {paymentMethod === 'mtn_momo' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* Orange Money */}
            <div
              onClick={() => setPaymentMethod('orange_money')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'orange_money' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'orange_money' ? '#2d2d1a' : '#0d0d0d'
              }}
            >
              <div style={styles.orangeLogo}>Orange</div>
              <span style={styles.paymentName}>Orange Money</span>
              {paymentMethod === 'orange_money' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* Visa/Mastercard */}
            <div
              onClick={() => setPaymentMethod('stripe')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'stripe' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'stripe' ? '#2d2d1a' : '#0d0d0d'
              }}
            >
              <div style={styles.cardLogos}>
                <div style={styles.visaLogo}>VISA</div>
                <div style={styles.mastercardContainer}>
                  <div style={styles.mcCircleRed}></div>
                  <div style={styles.mcCircleYellow}></div>
                </div>
              </div>
              <span style={styles.paymentName}>Card</span>
              {paymentMethod === 'stripe' && <span style={styles.checkmark}>✓</span>}
            </div>

            {/* PayPal */}
            <div
              onClick={() => setPaymentMethod('paypal')}
              style={{
                ...styles.paymentOption,
                border: paymentMethod === 'paypal' ? '2px solid #FFD700' : '1px solid #333',
                backgroundColor: paymentMethod === 'paypal' ? '#2d2d1a' : '#0d0d0d'
              }}
            >
              <div style={styles.paypalLogo}>PayPal</div>
              <span style={styles.paymentName}>PayPal</span>
              {paymentMethod === 'paypal' && <span style={styles.checkmark}>✓</span>}
            </div>
          </div>
        </div>

        {/* Phone Number for Mobile Money */}
        {(paymentMethod === 'mtn_momo' || paymentMethod === 'orange_money') && (
          <div style={styles.section}>
            <label style={styles.label}>Phone Number</label>
            <input
              type="tel"
              placeholder="e.g., 237XXXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              style={styles.phoneInput}
            />
          </div>
        )}

        {/* Donate Button */}
        <button
          onClick={handleDonate}
          disabled={!amount || !paymentMethod || processing}
          style={{
            ...styles.donateButton,
            opacity: !amount || !paymentMethod || processing ? 0.5 : 1,
            cursor: !amount || !paymentMethod || processing ? 'not-allowed' : 'pointer'
          }}
        >
          {processing ? 'Processing...' : `Donate $${amount || '0'}`}
        </button>

        <p style={styles.secureNote}>🔒 Secure payment • Tax-deductible</p>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '40px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 50px rgba(255, 215, 0, 0.3)',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    margin: 0,
    fontWeight: 'bold'
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#999',
    fontSize: '32px',
    cursor: 'pointer',
    padding: '0',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.3s'
  },
  subtitle: {
    color: '#999',
    fontSize: '16px',
    marginBottom: '30px',
    lineHeight: '1.6'
  },
  errorMessage: {
    backgroundColor: '#2d1a1a',
    color: '#ff4444',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  section: {
    marginBottom: '25px'
  },
  label: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: '500',
    display: 'block',
    marginBottom: '12px'
  },
  amountButtons: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    marginBottom: '15px'
  },
  amountButton: {
    padding: '12px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  amountInput: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  paymentMethods: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px'
  },
  paymentOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    position: 'relative'
  },
  mtnLogo: {
    width: '50px',
    height: '50px',
    backgroundColor: '#FFCC00',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#000',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  orangeLogo: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #FF6600 0%, #FF8800 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  cardLogos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    alignItems: 'center'
  },
  visaLogo: {
    backgroundColor: '#1A1F71',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    letterSpacing: '1px'
  },
  mastercardContainer: {
    position: 'relative',
    width: '40px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  mcCircleRed: {
    position: 'absolute',
    left: '0',
    width: '25px',
    height: '25px',
    borderRadius: '50%',
    backgroundColor: '#EB001B',
    opacity: 0.9
  },
  mcCircleYellow: {
    position: 'absolute',
    right: '0',
    width: '25px',
    height: '25px',
    borderRadius: '50%',
    backgroundColor: '#F79E1B',
    opacity: 0.9
  },
  paypalLogo: {
    width: '50px',
    height: '50px',
    background: 'linear-gradient(135deg, #003087 0%, #0070BA 100%)',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold'
  },
  paymentName: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  checkmark: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  phoneInput: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  donateButton: {
    width: '100%',
    padding: '18px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '10px',
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '15px',
    transition: 'all 0.3s'
  },
  secureNote: {
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    margin: 0
  }
};

export default DonateModal;
