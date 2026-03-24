import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Vouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  useEffect(() => {
    fetchMyVouchers();
  }, []);

  const fetchMyVouchers = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/vouchers/my-vouchers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVouchers(data);
    } catch (error) {
      console.error('Failed to fetch vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (voucherId) => {
    if (!window.confirm('Are you sure you want to mark this voucher as redeemed?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vouchers/redeem',
        { voucherId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage({ text: 'Voucher redeemed successfully!', type: 'success' });
      fetchMyVouchers();
      setSelectedVoucher(null);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to redeem voucher', 
        type: 'error' 
      });
    }
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    setMessage({ text: 'Code copied to clipboard!', type: 'success' });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loader}></div>
        <p style={styles.loadingText}>Loading vouchers...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>AWS Exam Vouchers</h1>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#4CAF50' : '#ff4444'
        }}>
          {message.text}
        </div>
      )}

      {vouchers.length === 0 ? (
        <div style={styles.noVouchers}>
          <div style={styles.noVouchersIcon}>🎫</div>
          <h2 style={styles.noVouchersTitle}>No AWS Exam Vouchers Available At This Time</h2>
          <p style={styles.noVouchersText}>
            AWS Exam Vouchers will appear here when assigned to you by the administrator.
          </p>
        </div>
      ) : (
        <div style={styles.vouchersGrid}>
          {vouchers.map((voucher) => {
            const isExpired = new Date() > new Date(voucher.expirationDate);
            const daysUntilExpiry = Math.ceil((new Date(voucher.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));

            return (
              <div key={voucher._id} style={styles.voucherCard}>
                <div style={styles.voucherHeader}>
                  <h3 style={styles.examType}>{voucher.examType}</h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: 
                      voucher.status === 'redeemed' ? '#4CAF50' :
                      voucher.status === 'expired' ? '#ff4444' :
                      isExpired ? '#ff4444' : '#FFD700'
                  }}>
                    {voucher.status === 'redeemed' ? 'Redeemed' :
                     voucher.status === 'expired' || isExpired ? 'Expired' : 'Active'}
                  </span>
                </div>

                <div style={styles.voucherBody}>
                  <div style={styles.voucherDetail}>
                    <span style={styles.label}>Voucher Code:</span>
                    <div style={styles.codeContainer}>
                      <span style={styles.code}>{voucher.code}</span>
                      <button 
                        onClick={() => copyToClipboard(voucher.code)}
                        style={styles.copyButton}
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>

                  <div style={styles.voucherDetail}>
                    <span style={styles.label}>Expires:</span>
                    <span style={{
                      ...styles.value,
                      color: daysUntilExpiry < 30 && daysUntilExpiry > 0 ? '#FFA500' : '#fff'
                    }}>
                      {new Date(voucher.expirationDate).toLocaleDateString()}
                      {daysUntilExpiry > 0 && ` (${daysUntilExpiry} days left)`}
                    </span>
                  </div>

                  {voucher.status === 'assigned' && !isExpired && (
                    <div style={styles.actions}>
                      <button 
                        onClick={() => setSelectedVoucher(voucher)}
                        style={styles.viewButton}
                      >
                        View Instructions
                      </button>
                      <button 
                        onClick={() => handleRedeem(voucher._id)}
                        style={styles.redeemButton}
                      >
                        Mark as Redeemed
                      </button>
                    </div>
                  )}

                  {voucher.status === 'redeemed' && (
                    <div style={styles.redeemedInfo}>
                      ✅ Redeemed on {new Date(voucher.redeemedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Instructions Modal */}
      {selectedVoucher && (
        <div style={styles.modalOverlay} onClick={() => setSelectedVoucher(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>How to Redeem Your AWS Exam Voucher</h2>
            
            <div style={styles.instructionsBox}>
              <h3 style={styles.instructionStep}>Step 1: Copy Your Voucher Code</h3>
              <div style={styles.codeDisplay}>
                <span style={styles.codeText}>{selectedVoucher.code}</span>
                <button 
                  onClick={() => copyToClipboard(selectedVoucher.code)}
                  style={styles.copyButtonLarge}
                >
                  📋 Copy Code
                </button>
              </div>

              <h3 style={styles.instructionStep}>Step 2: Visit AWS Certification</h3>
              <p style={styles.instructionText}>
                Go to <a href="https://aws.training" target="_blank" rel="noopener noreferrer" style={styles.link}>
                  aws.training
                </a> and log in to your AWS Training account.
              </p>

              <h3 style={styles.instructionStep}>Step 3: Schedule Your Exam</h3>
              <p style={styles.instructionText}>
                Navigate to "Certification" → "Schedule New Exam" → Select "{selectedVoucher.examType}"
              </p>

              <h3 style={styles.instructionStep}>Step 4: Apply Voucher Code</h3>
              <p style={styles.instructionText}>
                During checkout, paste your voucher code in the "Promo Code" field and click "Apply"
              </p>

              <h3 style={styles.instructionStep}>Step 5: Complete Registration</h3>
              <p style={styles.instructionText}>
                Choose your exam date, time, and location (online or test center), then complete registration.
              </p>

              <div style={styles.warningBox}>
                ⚠️ <strong>Important:</strong> This voucher expires on {new Date(selectedVoucher.expirationDate).toLocaleDateString()}. 
                Make sure to schedule your exam before this date!
              </div>
            </div>

            <button onClick={() => setSelectedVoucher(null)} style={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '40px 20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '42px',
    textAlign: 'center',
    marginBottom: '40px',
    fontWeight: 'bold'
  },
  loader: {
    border: '4px solid #333',
    borderTop: '4px solid #FFD700',
    borderRadius: '50%',
    width: '50px',
    height: '50px',
    animation: 'spin 1s linear infinite',
    margin: '100px auto'
  },
  loadingText: {
    color: '#FFD700',
    textAlign: 'center',
    fontSize: '18px'
  },
  message: {
    padding: '15px',
    borderRadius: '8px',
    color: '#fff',
    textAlign: 'center',
    marginBottom: '20px',
    maxWidth: '600px',
    margin: '0 auto 20px'
  },
  noVouchers: {
    textAlign: 'center',
    padding: '80px 20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  noVouchersIcon: {
    fontSize: '80px',
    marginBottom: '20px'
  },
  noVouchersTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '15px'
  },
  noVouchersText: {
    color: '#999',
    fontSize: '16px',
    lineHeight: '1.6'
  },
  vouchersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '30px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  voucherCard: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 4px 15px rgba(255, 215, 0, 0.2)'
  },
  voucherHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  },
  examType: {
    color: '#FFD700',
    fontSize: '20px',
    margin: 0
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#000'
  },
  voucherBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  voucherDetail: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    color: '#999',
    fontSize: '14px'
  },
  value: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: '500'
  },
  codeContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  code: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    flex: 1
  },
  copyButton: {
    padding: '8px 16px',
    backgroundColor: '#333',
    color: '#FFD700',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px'
  },
  viewButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#333',
    color: '#FFD700',
    border: '2px solid #FFD700',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  redeemButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  redeemedInfo: {
    color: '#4CAF50',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '10px',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: '6px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalTitle: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '25px',
    textAlign: 'center'
  },
  instructionsBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  instructionStep: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '10px'
  },
  instructionText: {
    color: '#ccc',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '10px'
  },
  codeDisplay: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#000',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    marginBottom: '10px'
  },
  codeText: {
    color: '#FFD700',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    flex: 1
  },
  copyButtonLarge: {
    padding: '10px 20px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  link: {
    color: '#FFD700',
    textDecoration: 'underline'
  },
  warningBox: {
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    border: '1px solid #FFA500',
    borderRadius: '8px',
    padding: '15px',
    color: '#FFA500',
    fontSize: '14px',
    marginTop: '10px'
  },
  closeButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    marginTop: '20px'
  }
};

export default Vouchers;
