import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ReferralDashboard = () => {
  const [referralData, setReferralData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [giftingCoupon, setGiftingCoupon] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [giftError, setGiftError] = useState('');
  const [giftSuccess, setGiftSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchReferralData();
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/referrals/my-coupons', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const fetchReferralData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/referrals/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Referral data received:', response.data);
      setReferralData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      // Set default empty state
      setReferralData({ clicks: 0, conversions: 0, revenue: 0, referrals: [], code: null });
      setLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/referrals/generate-code', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(response.data.message);
      fetchReferralData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate code');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = `Join CloudLiteracy and get 10% off your first purchase! Use my referral code: ${referralData.code}\n\nSign up here: ${window.location.origin}/register?ref=${referralData.code}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const message = `Join me on @CloudLiteracy and get 10% off! Use code: ${referralData.code}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${window.location.origin}/register?ref=${referralData.code}`, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Join CloudLiteracy - Get 10% Off!';
    const body = `Hi!\n\nI've been learning DevOps on CloudLiteracy and thought you might be interested.\n\nUse my referral code "${referralData.code}" to get 10% off your first purchase!\n\nSign up here: ${window.location.origin}/register?ref=${referralData.code}\n\nHappy learning!`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleGiftCoupon = async (couponId) => {
    setGiftError('');
    setGiftSuccess('');

    if (!recipientEmail) {
      setGiftError('Please enter recipient email');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/referrals/gift-coupon', 
        { couponId, recipientEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setGiftSuccess(response.data.message);
      setGiftingCoupon(null);
      setRecipientEmail('');
      
      // Refresh coupons list
      fetchCoupons();
      
      // Clear success message after 5 seconds
      setTimeout(() => setGiftSuccess(''), 5000);
    } catch (error) {
      setGiftError(error.response?.data?.message || 'Failed to gift coupon');
    }
  };

  const cancelGift = () => {
    setGiftingCoupon(null);
    setRecipientEmail('');
    setGiftError('');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p style={{ color: '#FFD700', fontSize: '20px' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#FFD700', textAlign: 'center', marginBottom: '40px', fontSize: '36px' }}>
          💰 Referral Dashboard
        </h1>

        {!referralData || !referralData.code ? (
          <div style={{ background: '#1a1a1a', padding: '40px', borderRadius: '15px', border: '2px solid #FFD700', textAlign: 'center' }}>
            <h2 style={{ color: '#FFD700', marginBottom: '20px' }}>Start Earning Rewards!</h2>
            <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '18px' }}>
              Generate your unique referral code and earn rewards when your friends join CloudLiteracy.
            </p>
            <button
              onClick={generateCode}
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#000',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '50px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 5px 20px rgba(255, 215, 0, 0.4)'
              }}
            >
              Generate My Referral Code
            </button>
          </div>
        ) : (
          <>
            {/* Referral Code Card */}
            <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', marginBottom: '30px' }}>
              <h2 style={{ color: '#FFD700', marginBottom: '20px', textAlign: 'center' }}>Your Referral Code</h2>
              <div style={{ background: '#000', padding: '20px', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#FFD700', fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px', fontFamily: 'monospace', margin: 0 }}>
                  {referralData.code}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyToClipboard(referralData.code)}
                  style={{
                    background: copied ? '#4CAF50' : '#FFD700',
                    color: '#000',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Code'}
                </button>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/register?ref=${referralData.code}`)}
                  style={{
                    background: '#FFD700',
                    color: '#000',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📎 Copy Link
                </button>
                <button
                  onClick={shareOnWhatsApp}
                  style={{
                    background: '#25D366',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  📱 WhatsApp
                </button>
                <button
                  onClick={shareOnTwitter}
                  style={{
                    background: '#1DA1F2',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  🐦 Twitter
                </button>
                <button
                  onClick={shareViaEmail}
                  style={{
                    background: '#EA4335',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  ✉️ Email
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', textAlign: 'center' }}>
                <p style={{ color: '#FFD700', fontSize: '48px', fontWeight: 'bold', margin: 0 }}>{referralData.clicks || 0}</p>
                <p style={{ color: '#ccc', fontSize: '18px', marginTop: '10px' }}>Clicks</p>
              </div>
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', textAlign: 'center' }}>
                <p style={{ color: '#FFD700', fontSize: '48px', fontWeight: 'bold', margin: 0 }}>{referralData.conversions || 0}</p>
                <p style={{ color: '#ccc', fontSize: '18px', marginTop: '10px' }}>Conversions</p>
              </div>
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', textAlign: 'center' }}>
                <p style={{ color: '#FFD700', fontSize: '48px', fontWeight: 'bold', margin: 0 }}>${(referralData.revenue || 0).toFixed(2)}</p>
                <p style={{ color: '#ccc', fontSize: '18px', marginTop: '10px' }}>Revenue Generated</p>
              </div>
            </div>

            {/* Affiliate Section */}
            {referralData.isAffiliate ? (
              <div style={{ background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 215, 0, 0.05) 100%)', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', marginBottom: '30px' }}>
                <h2 style={{ color: '#FFD700', marginBottom: '20px' }}>💎 Affiliate Earnings</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                  <div>
                    <p style={{ color: '#ccc', marginBottom: '5px' }}>Total Earnings</p>
                    <p style={{ color: '#FFD700', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                      ${referralData.affiliateEarnings.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#ccc', marginBottom: '5px' }}>Pending</p>
                    <p style={{ color: '#FFA500', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                      ${referralData.affiliateEarnings.pending.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#ccc', marginBottom: '5px' }}>Paid Out</p>
                    <p style={{ color: '#4CAF50', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                      ${referralData.affiliateEarnings.paid.toFixed(2)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/affiliate-dashboard')}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginTop: '20px'
                  }}
                >
                  View Affiliate Dashboard →
                </button>
              </div>
            ) : (
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700', marginBottom: '30px', textAlign: 'center' }}>
                <h2 style={{ color: '#FFD700', marginBottom: '15px' }}>💼 Become an Affiliate</h2>
                <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '16px' }}>
                  Earn 25% commission on every sale! Join our affiliate program and turn your referrals into income.
                </p>
                <button
                  onClick={() => navigate('/affiliate-apply')}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    border: 'none',
                    padding: '12px 30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Apply Now →
                </button>
              </div>
            )}

            {/* My Coupons Section */}
            {coupons.length > 0 && (
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #4CAF50', marginBottom: '30px' }}>
                <h2 style={{ color: '#4CAF50', marginBottom: '20px' }}>🎟️ My Reward Coupons</h2>
                <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '14px' }}>
                  Use these coupons on your next purchase to get discounts, or gift them to friends!
                </p>
                
                {giftSuccess && (
                  <div style={{ background: '#2d5016', border: '1px solid #4CAF50', color: '#4CAF50', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                    ✓ {giftSuccess}
                  </div>
                )}
                
                <div style={{ display: 'grid', gap: '15px' }}>
                  {coupons.map((coupon, index) => (
                    <div key={index} style={{
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      border: '2px dashed #4CAF50',
                      borderRadius: '10px',
                      padding: '20px'
                    }}>
                      {giftingCoupon === coupon._id ? (
                        // Gift Form
                        <div>
                          <h3 style={{ color: '#4CAF50', marginBottom: '15px', fontSize: '18px' }}>🎁 Gift This Coupon</h3>
                          <p style={{ color: '#ccc', marginBottom: '15px', fontSize: '14px' }}>
                            Enter the email of the person you want to gift this {coupon.discountPercent}% discount coupon to:
                          </p>
                          
                          {giftError && (
                            <div style={{ background: '#2d1a1a', border: '1px solid #ff4444', color: '#ff4444', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
                              {giftError}
                            </div>
                          )}
                          
                          <input
                            type="email"
                            placeholder="recipient@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            style={{
                              width: '100%',
                              padding: '12px',
                              background: '#0d0d0d',
                              border: '1px solid #4CAF50',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '16px',
                              marginBottom: '15px',
                              boxSizing: 'border-box'
                            }}
                          />
                          
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleGiftCoupon(coupon._id)}
                              style={{
                                flex: 1,
                                background: '#4CAF50',
                                color: '#fff',
                                border: 'none',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              💌 Send Gift
                            </button>
                            <button
                              onClick={cancelGift}
                              style={{
                                flex: 1,
                                background: 'transparent',
                                color: '#ccc',
                                border: '1px solid #666',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Coupon Display
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <p style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold', margin: 0, fontFamily: 'monospace' }}>
                              {coupon.code}
                            </p>
                            <p style={{ color: '#ccc', fontSize: '14px', marginTop: '5px' }}>
                              {coupon.discountPercent}% OFF • Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                            </p>
                            {coupon.isGifted && (
                              <p style={{ color: '#FFD700', fontSize: '12px', marginTop: '5px' }}>
                                🎁 Received as gift
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => {
                                copyToClipboard(coupon.code);
                              }}
                              style={{
                                background: '#4CAF50',
                                color: '#fff',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              {copied ? '✓ Copied!' : '📋 Copy'}
                            </button>
                            <button
                              onClick={() => setGiftingCoupon(coupon._id)}
                              style={{
                                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                                color: '#000',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              🎁 Gift
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Referrals List */}
            {referralData.referrals && referralData.referrals.length > 0 && (
              <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '15px', border: '2px solid #FFD700' }}>
                <h2 style={{ color: '#FFD700', marginBottom: '20px' }}>Your Referrals</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #FFD700' }}>
                        <th style={{ color: '#FFD700', padding: '15px', textAlign: 'left' }}>Name</th>
                        <th style={{ color: '#FFD700', padding: '15px', textAlign: 'left' }}>Email</th>
                        <th style={{ color: '#FFD700', padding: '15px', textAlign: 'left' }}>Date</th>
                        <th style={{ color: '#FFD700', padding: '15px', textAlign: 'left' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralData.referrals.map((referral, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                          <td style={{ color: '#fff', padding: '15px' }}>{referral.referredUserId?.name || 'N/A'}</td>
                          <td style={{ color: '#ccc', padding: '15px' }}>{referral.referredUserId?.email || 'N/A'}</td>
                          <td style={{ color: '#ccc', padding: '15px' }}>
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              background: referral.status === 'completed' ? '#4CAF50' : '#FFA500',
                              color: '#fff',
                              padding: '5px 15px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {referral.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReferralDashboard;
