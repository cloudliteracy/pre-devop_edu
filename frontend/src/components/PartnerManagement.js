import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PartnerManagement = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/admin/users/query?limit=100', 
        { role: 'partner' }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPartners(data.users || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load partners data');
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

  if (loading) return <div style={{ color: '#FFD700', padding: '20px' }}>Loading partners...</div>;
  if (error) return <div style={{ color: '#ff4444', padding: '20px' }}>{error}</div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Partner Directory</h2>
      <p style={styles.subtitle}>Manage integrated CSR partners and review tier assignments.</p>
      
      {partners.length === 0 ? (
        <p style={{ color: '#ccc' }}>No partners have registered yet.</p>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <div style={styles.cell}>Name</div>
            <div style={styles.cell}>Email</div>
            <div style={styles.cell}>Country</div>
            <div style={styles.cell}>Tier</div>
            <div style={styles.cell}>Lifetime Access Code</div>
            <div style={styles.cell}>Joined</div>
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
                <code style={styles.codeBadge}>{partner.partnerAccessCode || 'N/A'}</code>
              </div>
              <div style={styles.cell}>{new Date(partner.createdAt).toLocaleDateString()}</div>
              <div style={styles.cell}>
                <div style={styles.actionGroup}>
                  <button 
                    onClick={() => handleSuspend(partner._id, partner.name, partner.isSuspended)}
                    style={{
                      ...styles.actionBtn,
                      backgroundColor: partner.isSuspended ? '#4CAF50' : '#ff9800'
                    }}
                  >
                    {partner.isSuspended ? '✓' : '⏸'}
                  </button>
                  <button 
                    onClick={() => handleDelete(partner._id, partner.name)}
                    style={{...styles.actionBtn, backgroundColor: '#ff4444'}}
                  >
                    🗑️
                  </button>
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
    gridTemplateColumns: '1.5fr 2fr 1fr 0.8fr 1.5fr 1fr 1fr',
    padding: '15px',
    backgroundColor: '#0d0d0d',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#FFD700'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr 1fr 0.8fr 1.5fr 1fr 1fr',
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
  }
};

export default PartnerManagement;
