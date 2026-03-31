import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setCurrentUser(user);
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/admin/users/query?limit=1000', 
        { role: 'partner' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Partners API response:', data);
      console.log('Total partners found:', data.users?.length || 0);
      
      if (data.users && data.users.length > 0) {
        console.log('Partner details:', data.users.map(p => ({
          name: p.name,
          email: p.email,
          tier: p.partnerTier,
          code: p.partnerAccessCode
        })));
      }
      
      setPartners(data.users || []);
    } catch (err) {
      console.error('Fetch partners error:', err);
      const errorMsg = err.response?.data?.message || 'Failed to load partners data';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id, name, isSuspended) => {
    const action = isSuspended ? 'unsuspend' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${action} partner "${name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/users/${id}/suspend`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPartners();
    } catch (err) {
      alert('Failed to update partner status');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`⚠️ PERMANENTLY DELETE PARTNER: ${name}?\n\nThis action cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/users/${id}/delete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPartners();
    } catch (err) {
      alert('Failed to delete partner');
    }
  };

  const handleGenerateCode = async (id, name) => {
    if (!window.confirm(`Generate lifetime access code for partner "${name}"?`)) return;

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`http://localhost:5000/api/admin/partners/${id}/generate-code`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Access code generated: ${data.partner.partnerAccessCode}`);
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate access code');
    }
  };

  const handleRevokeCode = async (id, name) => {
    if (!window.confirm(`Revoke access code for partner "${name}"?\n\nThis will invalidate their lifetime access code.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/admin/partners/${id}/revoke-code`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Access code revoked successfully');
      fetchPartners();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to revoke access code');
    }
  };

  if (loading) return <div style={{ color: '#FFD700', padding: '20px' }}>Loading partners...</div>;
  if (error) return <div style={{ color: '#ff4444', padding: '20px' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Partner Directory</h2>
      <p style={styles.subtitle}>Manage integrated CSR partners and review tier assignments.</p>
      
      {partners.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#ccc', fontSize: '18px', marginBottom: '20px' }}>
            No partners have registered yet.
          </p>
          <p style={{ color: '#888', fontSize: '14px' }}>
            Partners are created when users purchase a partner package (Gold, Platinum, or Diamond) from the Partner Packages page.
          </p>
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.cell}>Name</div>
            <div style={styles.cell}>Email</div>
            <div style={styles.cell}>Country</div>
            <div style={styles.cell}>Tier</div>
            <div style={styles.cell}>Lifetime Access Code</div>
            <div style={styles.cell}>Joined</div>
            <div style={styles.cell}>Status</div>
            <div style={styles.cell}>Actions</div>
          </div>
          {partners.map(partner => (
            <div key={partner._id} style={styles.tableRow}>
              <div style={styles.cell}>{partner.name}</div>
              <div style={styles.cell}>{partner.email}</div>
              <div style={styles.cell}>{partner.country || 'N/A'}</div>
              <div style={styles.cell}>
                <span style={{
                  ...styles.tierBadge,
                  backgroundColor: 
                    partner.partnerTier === 'Diamond' ? '#b9f2ff' :
                    partner.partnerTier === 'Platinum' ? '#E5E4E2' :
                    partner.partnerTier === 'Gold' ? '#FFD700' : '#C0C0C0',
                  color: '#000'
                }}>
                  {partner.partnerTier || 'Unknown'}
                </span>
              </div>
              <div style={styles.cell}>
                {partner.partnerAccessCode ? (
                  <code style={styles.codeBadge}>{partner.partnerAccessCode}</code>
                ) : (
                  <span style={{ color: '#666', fontSize: '12px' }}>Not Generated</span>
                )}
              </div>
              <div style={styles.cell}>{new Date(partner.createdAt).toLocaleDateString()}</div>
              <div style={styles.cell}>
                {partner.isSuspended ? (
                  <span style={styles.suspendedBadge}>SUSPENDED</span>
                ) : (
                  <span style={styles.activeBadge}>Active</span>
                )}
              </div>
              <div style={styles.cell}>
                <div style={styles.actionGroup}>
                  {currentUser?.isPrimarySuperAdmin && (
                    <>
                      {!partner.partnerAccessCode ? (
                        <button 
                          onClick={() => handleGenerateCode(partner._id, partner.name)}
                          style={{...styles.actionBtn, backgroundColor: '#4CAF50'}}
                          title="Generate Access Code"
                        >
                          🔑
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleRevokeCode(partner._id, partner.name)}
                          style={{...styles.actionBtn, backgroundColor: '#ff9800'}}
                          title="Revoke Access Code"
                        >
                          🚫
                        </button>
                      )}
                      <button 
                        onClick={() => handleSuspend(partner._id, partner.name, partner.isSuspended)}
                        style={{
                          ...styles.actionBtn,
                          backgroundColor: partner.isSuspended ? '#4CAF50' : '#ff9800'
                        }}
                        title={partner.isSuspended ? 'Unsuspend' : 'Suspend'}
                      >
                        {partner.isSuspended ? '✓' : '⏸'}
                      </button>
                      <button 
                        onClick={() => handleDelete(partner._id, partner.name)}
                        style={{...styles.actionBtn, backgroundColor: '#ff4444'}}
                        title="Delete Partner"
                      >
                        🗑️
                      </button>
                    </>
                  )}
                  {!currentUser?.isPrimarySuperAdmin && (
                    <span style={{ color: '#666', fontSize: '12px' }}>View Only</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#1a1a1a',
    padding: '30px',
    borderRadius: '15px',
    border: '1px solid #333'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '10px'
  },
  subtitle: {
    color: '#aaa',
    fontSize: '16px',
    marginBottom: '30px'
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1.8fr 0.8fr 0.8fr 1.5fr 0.8fr 0.8fr 0.8fr',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1.8fr 0.8fr 0.8fr 1.5fr 0.8fr 0.8fr 0.8fr',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '8px',
    border: '1px solid #333',
    alignItems: 'center',
    color: '#ccc'
  },
  cell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingRight: '10px'
  },
  tierBadge: {
    padding: '5px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'inline-block'
  },
  codeBadge: {
    backgroundColor: '#333',
    padding: '8px 12px',
    borderRadius: '6px',
    letterSpacing: '1px',
    color: '#4CAF50',
    fontWeight: 'bold'
  },
  actionGroup: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: 'opacity 0.2s'
  },
  suspendedBadge: {
    backgroundColor: '#8B0000',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  activeBadge: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: '13px'
  }
};

export default PartnerManagement;
