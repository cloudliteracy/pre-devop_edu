import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReferralManagement = () => {
  const [referralCodes, setReferralCodes] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [stats, setStats] = useState({ totalReferrals: 0, totalRevenue: 0, pendingPayouts: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [affiliatesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/referrals/admin/affiliates', { headers })
      ]);

      setAffiliates(affiliatesRes.data);

      // Calculate stats
      const totalRevenue = affiliatesRes.data.reduce((sum, a) => sum + a.totalEarnings, 0);
      const pendingPayouts = affiliatesRes.data.reduce((sum, a) => sum + a.pendingEarnings, 0);

      setStats({
        totalReferrals: affiliatesRes.data.length,
        totalRevenue,
        pendingPayouts
      });

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
      setLoading(false);
    }
  };

  const handleApproveAffiliate = async (affiliateId, approved) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.put(
        `http://localhost:5000/api/referrals/admin/affiliates/${affiliateId}/approve`,
        { approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ text: data.message, type: 'success' });
      fetchData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to update affiliate', 
        type: 'error' 
      });
    }
  };

  const handleProcessPayout = async (affiliateId) => {
    const affiliate = affiliates.find(a => a._id === affiliateId);
    const amount = prompt(`Enter payout amount (Max: $${affiliate.pendingEarnings.toFixed(2)}):`);
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert('Invalid amount');
      return;
    }

    if (parseFloat(amount) > affiliate.pendingEarnings) {
      alert('Amount exceeds pending earnings');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `http://localhost:5000/api/referrals/admin/affiliates/${affiliateId}/payout`,
        { amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ text: data.message, type: 'success' });
      fetchData();
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ 
        text: error.response?.data?.message || 'Failed to process payout', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p style={{ color: '#FFD700', fontSize: '18px' }}>Loading referral data...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>💰 Referral & Affiliate Management</h2>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#4CAF50' : '#ff4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'overview' ? '#FFD700' : '#1a1a1a',
            color: activeTab === 'overview' ? '#000' : '#FFD700'
          }}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('affiliates')}
          style={{
            ...styles.tab,
            backgroundColor: activeTab === 'affiliates' ? '#FFD700' : '#1a1a1a',
            color: activeTab === 'affiliates' ? '#000' : '#FFD700'
          }}
        >
          Affiliates ({affiliates.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>👥</div>
              <div style={styles.statValue}>{stats.totalReferrals}</div>
              <div style={styles.statLabel}>Total Affiliates</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💰</div>
              <div style={styles.statValue}>${stats.totalRevenue.toFixed(2)}</div>
              <div style={styles.statLabel}>Total Revenue Generated</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⏳</div>
              <div style={styles.statValue}>${stats.pendingPayouts.toFixed(2)}</div>
              <div style={styles.statLabel}>Pending Payouts</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statValue}>
                {affiliates.filter(a => a.isApproved).length}
              </div>
              <div style={styles.statLabel}>Approved Affiliates</div>
            </div>
          </div>

          <div style={styles.infoBox}>
            <h3 style={styles.infoTitle}>📊 Program Overview</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Commission Rate:</span>
                <span style={styles.infoValue}>25%</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Minimum Payout:</span>
                <span style={styles.infoValue}>$50 USD</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Referrer Reward:</span>
                <span style={styles.infoValue}>20% Discount Coupon</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Referred User Discount:</span>
                <span style={styles.infoValue}>10% Off First Purchase</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Affiliates Tab */}
      {activeTab === 'affiliates' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Affiliate Applications</h3>
          
          {affiliates.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ color: '#999', fontSize: '16px' }}>No affiliate applications yet</p>
            </div>
          ) : (
            <div style={styles.affiliatesGrid}>
              {affiliates.map((affiliate) => (
                <div key={affiliate._id} style={styles.affiliateCard}>
                  <div style={styles.affiliateHeader}>
                    <div>
                      <div style={styles.affiliateName}>{affiliate.userId?.name || 'N/A'}</div>
                      <div style={styles.affiliateEmail}>{affiliate.userId?.email || 'N/A'}</div>
                    </div>
                    <div style={{
                      ...styles.statusBadge,
                      backgroundColor: affiliate.isApproved ? '#4CAF50' : '#ff9800'
                    }}>
                      {affiliate.isApproved ? 'APPROVED' : 'PENDING'}
                    </div>
                  </div>

                  <div style={styles.affiliateBody}>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Commission Rate:</span>
                      <span style={styles.affiliateValue}>{affiliate.commissionRate}%</span>
                    </div>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Total Earnings:</span>
                      <span style={styles.affiliateValue}>${affiliate.totalEarnings.toFixed(2)}</span>
                    </div>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Pending:</span>
                      <span style={{ ...styles.affiliateValue, color: '#FFA500' }}>
                        ${affiliate.pendingEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Paid Out:</span>
                      <span style={{ ...styles.affiliateValue, color: '#4CAF50' }}>
                        ${affiliate.paidEarnings.toFixed(2)}
                      </span>
                    </div>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Payment Method:</span>
                      <span style={styles.affiliateValue}>{affiliate.paymentMethod}</span>
                    </div>
                    <div style={styles.affiliateInfo}>
                      <span style={styles.affiliateLabel}>Applied:</span>
                      <span style={styles.affiliateValue}>
                        {new Date(affiliate.appliedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {affiliate.applicationMessage && (
                    <div style={styles.applicationMessage}>
                      <strong style={{ color: '#FFD700' }}>Message:</strong>
                      <p style={{ color: '#ccc', marginTop: '5px', fontSize: '14px' }}>
                        {affiliate.applicationMessage}
                      </p>
                    </div>
                  )}

                  <div style={styles.affiliateActions}>
                    {!affiliate.isApproved ? (
                      <>
                        <button
                          onClick={() => handleApproveAffiliate(affiliate._id, true)}
                          style={{ ...styles.actionButton, backgroundColor: '#4CAF50' }}
                        >
                          ✓ Approve
                        </button>
                        <button
                          onClick={() => handleApproveAffiliate(affiliate._id, false)}
                          style={{ ...styles.actionButton, backgroundColor: '#ff4444' }}
                        >
                          ✗ Reject
                        </button>
                      </>
                    ) : (
                      <>
                        {affiliate.pendingEarnings >= affiliate.minimumPayout && (
                          <button
                            onClick={() => handleProcessPayout(affiliate._id)}
                            style={{ ...styles.actionButton, backgroundColor: '#FFD700', color: '#000' }}
                          >
                            💸 Process Payout
                          </button>
                        )}
                        <button
                          onClick={() => handleApproveAffiliate(affiliate._id, false)}
                          style={{ ...styles.actionButton, backgroundColor: '#ff9800' }}
                        >
                          🚫 Revoke Access
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '25px',
    fontWeight: 'bold'
  },
  loading: {
    textAlign: 'center',
    padding: '40px'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: '20px'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 24px',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #FFD700',
    borderRadius: '15px',
    padding: '30px',
    textAlign: 'center'
  },
  statIcon: {
    fontSize: '48px',
    marginBottom: '15px'
  },
  statValue: {
    color: '#FFD700',
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '10px'
  },
  statLabel: {
    color: '#999',
    fontSize: '16px'
  },
  infoBox: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px'
  },
  infoTitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    border: '1px solid #333'
  },
  infoLabel: {
    color: '#999',
    fontSize: '14px'
  },
  infoValue: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  section: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '25px'
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '22px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#1a1a1a',
    borderRadius: '10px',
    border: '1px solid #333'
  },
  affiliatesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  affiliateCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px'
  },
  affiliateHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  },
  affiliateName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  affiliateEmail: {
    color: '#999',
    fontSize: '14px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  affiliateBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '15px'
  },
  affiliateInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  affiliateLabel: {
    color: '#999',
    fontSize: '14px'
  },
  affiliateValue: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: '500'
  },
  applicationMessage: {
    backgroundColor: '#0d0d0d',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid #333'
  },
  affiliateActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  actionButton: {
    flex: 1,
    padding: '10px',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s',
    minWidth: '120px'
  }
};

export default ReferralManagement;
