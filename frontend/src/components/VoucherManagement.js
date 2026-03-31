import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VoucherManagement = ({ isPrimarySuperAdmin }) => {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('upload');
  const [singleVoucher, setSingleVoucher] = useState({ code: '', examType: '', expirationDate: '', notes: '' });
  const [bulkFile, setBulkFile] = useState(null);
  const [assignForm, setAssignForm] = useState({ voucherId: '', userId: '' });
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [vouchersRes, statsRes, logsRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/vouchers/all', { headers }),
        axios.get('http://localhost:5000/api/vouchers/stats', { headers }),
        axios.get('http://localhost:5000/api/vouchers/activity-logs', { headers }),
        axios.get('http://localhost:5000/api/admin/users', { headers })
      ]);

      setVouchers(vouchersRes.data);
      setStats(statsRes.data);
      setActivityLogs(logsRes.data);
      setUsers(usersRes.data.users);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const handleUploadSingle = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vouchers/upload-single', singleVoucher, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ text: 'Voucher uploaded successfully!', type: 'success' });
      setSingleVoucher({ code: '', examType: '', expirationDate: '', notes: '' });
      fetchData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to upload voucher', type: 'error' });
    }
  };

  const handleUploadBulk = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    if (!bulkFile) {
      setMessage({ text: 'Please select a file', type: 'error' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', bulkFile);

      const { data } = await axios.post('http://localhost:5000/api/vouchers/upload-bulk', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });

      setMessage({ text: `Successfully uploaded ${data.successCount} vouchers!`, type: 'success' });
      setBulkFile(null);
      fetchData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to upload vouchers', type: 'error' });
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/vouchers/assign', assignForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ text: 'Voucher assigned successfully!', type: 'success' });
      setAssignForm({ voucherId: '', userId: '' });
      fetchData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to assign voucher', type: 'error' });
    }
  };

  const handleRevoke = async (voucherId) => {
    if (!window.confirm('Are you sure you want to revoke this voucher?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/vouchers/${voucherId}/revoke`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage({ text: 'Voucher revoked successfully!', type: 'success' });
      fetchData();
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to revoke voucher', type: 'error' });
    }
  };

  const downloadTemplate = () => {
    const csv = 'code,examType,expirationDate,notes\nAWS-XXXX-XXXX-XXXX,AWS Solutions Architect Associate,2025-12-31,Batch 1\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voucher_template.csv';
    a.click();
  };

  const filteredVouchers = filterStatus === 'all' 
    ? vouchers 
    : vouchers.filter(v => v.status === filterStatus);

  const getStatusColor = (status) => {
    switch(status) {
      case 'unused': return '#4CAF50';
      case 'assigned': return '#FFD700';
      case 'redeemed': return '#2196F3';
      case 'expired': return '#999';
      case 'revoked': return '#ff4444';
      default: return '#999';
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎓 AWS Exam Voucher Management</h2>

      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'success' ? '#4CAF50' : '#ff4444'
        }}>
          {message.text}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statLabel}>Total Vouchers</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#4CAF50'}}>{stats.unused}</div>
            <div style={styles.statLabel}>Unused</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#FFD700'}}>{stats.assigned}</div>
            <div style={styles.statLabel}>Assigned</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#2196F3'}}>{stats.redeemed}</div>
            <div style={styles.statLabel}>Redeemed</div>
          </div>
          <div style={styles.statCard}>
            <div style={{...styles.statValue, color: '#999'}}>{stats.expired}</div>
            <div style={styles.statLabel}>Expired</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {isPrimarySuperAdmin && (
          <button onClick={() => setActiveTab('upload')} style={{
            ...styles.tab,
            backgroundColor: activeTab === 'upload' ? '#FFD700' : '#1a1a1a',
            color: activeTab === 'upload' ? '#000' : '#FFD700'
          }}>
            Upload Vouchers
          </button>
        )}
        {isPrimarySuperAdmin && (
          <button onClick={() => setActiveTab('assign')} style={{
            ...styles.tab,
            backgroundColor: activeTab === 'assign' ? '#FFD700' : '#1a1a1a',
            color: activeTab === 'assign' ? '#000' : '#FFD700'
          }}>
            Assign Vouchers
          </button>
        )}
        <button onClick={() => setActiveTab('list')} style={{
          ...styles.tab,
          backgroundColor: activeTab === 'list' ? '#FFD700' : '#1a1a1a',
          color: activeTab === 'list' ? '#000' : '#FFD700'
        }}>
          All Vouchers
        </button>
        <button onClick={() => setActiveTab('logs')} style={{
          ...styles.tab,
          backgroundColor: activeTab === 'logs' ? '#FFD700' : '#1a1a1a',
          color: activeTab === 'logs' ? '#000' : '#FFD700'
        }}>
          Activity Logs
        </button>
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && isPrimarySuperAdmin && (
        <div style={styles.section}>
          <div style={styles.uploadGrid}>
            {/* Single Upload */}
            <div style={styles.uploadCard}>
              <h3 style={styles.cardTitle}>Upload Single Voucher</h3>
              <form onSubmit={handleUploadSingle} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Voucher Code</label>
                  <input
                    type="text"
                    value={singleVoucher.code}
                    onChange={(e) => setSingleVoucher({...singleVoucher, code: e.target.value})}
                    style={styles.input}
                    placeholder="AWS-XXXX-XXXX-XXXX"
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Exam Type</label>
                  <select
                    value={singleVoucher.examType}
                    onChange={(e) => setSingleVoucher({...singleVoucher, examType: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="">Select Exam</option>
                    <option value="AWS Solutions Architect Associate">AWS Solutions Architect Associate</option>
                    <option value="AWS Developer Associate">AWS Developer Associate</option>
                    <option value="AWS SysOps Administrator Associate">AWS SysOps Administrator Associate</option>
                    <option value="AWS Solutions Architect Professional">AWS Solutions Architect Professional</option>
                    <option value="AWS DevOps Engineer Professional">AWS DevOps Engineer Professional</option>
                    <option value="AWS Cloud Practitioner">AWS Cloud Practitioner</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Expiration Date</label>
                  <input
                    type="date"
                    value={singleVoucher.expirationDate}
                    onChange={(e) => setSingleVoucher({...singleVoucher, expirationDate: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Notes (Optional)</label>
                  <input
                    type="text"
                    value={singleVoucher.notes}
                    onChange={(e) => setSingleVoucher({...singleVoucher, notes: e.target.value})}
                    style={styles.input}
                    placeholder="Batch info, source, etc."
                  />
                </div>
                <button type="submit" style={styles.submitButton}>Upload Voucher</button>
              </form>
            </div>

            {/* Bulk Upload */}
            <div style={styles.uploadCard}>
              <h3 style={styles.cardTitle}>Bulk Upload Vouchers</h3>
              <form onSubmit={handleUploadBulk} style={styles.form}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Upload CSV/Excel File</label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => setBulkFile(e.target.files[0])}
                    style={styles.fileInput}
                  />
                </div>
                <button type="button" onClick={downloadTemplate} style={styles.templateButton}>
                  📥 Download Template
                </button>
                <div style={styles.templateInfo}>
                  <p style={styles.templateText}>Template format:</p>
                  <code style={styles.code}>code,examType,expirationDate,notes</code>
                </div>
                <button type="submit" style={styles.submitButton}>Upload Bulk Vouchers</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Tab */}
      {activeTab === 'assign' && isPrimarySuperAdmin && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Assign Voucher to User</h3>
          <form onSubmit={handleAssign} style={styles.assignForm}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select Voucher</label>
              <select
                value={assignForm.voucherId}
                onChange={(e) => setAssignForm({...assignForm, voucherId: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Select Voucher</option>
                {vouchers.filter(v => v.status === 'unused').map(v => (
                  <option key={v._id} value={v._id}>
                    {v.examType} - Expires: {new Date(v.expirationDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Select User</label>
              <select
                value={assignForm.userId}
                onChange={(e) => setAssignForm({...assignForm, userId: e.target.value})}
                style={styles.input}
                required
              >
                <option value="">Select User</option>
                {users.filter(u => u.role !== 'admin' && !u.isSuperAdmin).map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <button type="submit" style={styles.submitButton}>Assign Voucher</button>
          </form>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div style={styles.section}>
          <div style={styles.filterBar}>
            <button onClick={() => setFilterStatus('all')} style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === 'all' ? '#FFD700' : '#1a1a1a',
              color: filterStatus === 'all' ? '#000' : '#FFD700'
            }}>
              All ({vouchers.length})
            </button>
            <button onClick={() => setFilterStatus('unused')} style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === 'unused' ? '#FFD700' : '#1a1a1a',
              color: filterStatus === 'unused' ? '#000' : '#FFD700'
            }}>
              Unused
            </button>
            <button onClick={() => setFilterStatus('assigned')} style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === 'assigned' ? '#FFD700' : '#1a1a1a',
              color: filterStatus === 'assigned' ? '#000' : '#FFD700'
            }}>
              Assigned
            </button>
            <button onClick={() => setFilterStatus('redeemed')} style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === 'redeemed' ? '#FFD700' : '#1a1a1a',
              color: filterStatus === 'redeemed' ? '#000' : '#FFD700'
            }}>
              Redeemed
            </button>
            <button onClick={() => setFilterStatus('expired')} style={{
              ...styles.filterButton,
              backgroundColor: filterStatus === 'expired' ? '#FFD700' : '#1a1a1a',
              color: filterStatus === 'expired' ? '#000' : '#FFD700'
            }}>
              Expired
            </button>
          </div>

          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <div>Exam Type</div>
              <div>Code</div>
              <div>Status</div>
              <div>Assigned To</div>
              <div>Expiration</div>
              <div>Actions</div>
            </div>
            {filteredVouchers.map(voucher => (
              <div key={voucher._id} style={styles.tableRow}>
                <div style={styles.tableCell}>{voucher.examType}</div>
                <div style={styles.tableCell}>
                  <code style={styles.voucherCode}>****-****-****</code>
                </div>
                <div style={styles.tableCell}>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: getStatusColor(voucher.status)
                  }}>
                    {voucher.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.tableCell}>
                  {voucher.assignedTo ? voucher.assignedTo.name : '-'}
                </div>
                <div style={styles.tableCell}>
                  {new Date(voucher.expirationDate).toLocaleDateString()}
                </div>
                <div style={styles.tableCell}>
                  {isPrimarySuperAdmin && voucher.status === 'assigned' && (
                    <button
                      onClick={() => handleRevoke(voucher._id)}
                      style={styles.revokeButton}
                    >
                      Revoke
                    </button>
                  )}
                  {!isPrimarySuperAdmin && (
                    <span style={{ color: '#999', fontSize: '12px' }}>View Only</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Activity Logs</h3>
          <div style={styles.logsList}>
            {activityLogs.map(log => (
              <div key={log._id} style={styles.logItem}>
                <div style={styles.logIcon}>
                  {log.action === 'created' && '➕'}
                  {log.action === 'assigned' && '👤'}
                  {log.action === 'redeemed' && '✅'}
                  {log.action === 'revoked' && '🚫'}
                  {log.action === 'bulk_upload' && '📤'}
                </div>
                <div style={styles.logContent}>
                  <div style={styles.logAction}>{log.action.toUpperCase()}</div>
                  <div style={styles.logDetails}>{log.details}</div>
                  <div style={styles.logMeta}>
                    By: {log.performedBy?.name} | {new Date(log.performedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  message: {
    padding: '12px',
    borderRadius: '8px',
    color: '#fff',
    marginBottom: '20px',
    textAlign: 'center'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '25px'
  },
  statCard: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px',
    textAlign: 'center'
  },
  statValue: {
    color: '#FFD700',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    color: '#999',
    fontSize: '14px'
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '10px 20px',
    border: '1px solid #FFD700',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  section: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '25px'
  },
  sectionTitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '20px',
    fontWeight: 'bold'
  },
  uploadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px'
  },
  uploadCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px'
  },
  cardTitle: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
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
  input: {
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  },
  fileInput: {
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px',
    cursor: 'pointer'
  },
  submitButton: {
    padding: '12px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  templateButton: {
    padding: '10px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  templateInfo: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '10px'
  },
  templateText: {
    color: '#999',
    fontSize: '12px',
    marginBottom: '5px'
  },
  code: {
    color: '#FFD700',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  assignForm: {
    maxWidth: '600px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  filterBar: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '8px 16px',
    border: '1px solid #FFD700',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
    gap: '15px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#FFD700',
    fontSize: '14px'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr 1fr',
    gap: '15px',
    padding: '12px',
    backgroundColor: '#1a1a1a',
    borderRadius: '8px',
    color: '#ccc',
    alignItems: 'center',
    fontSize: '14px'
  },
  tableCell: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  voucherCode: {
    color: '#999',
    fontSize: '12px',
    fontFamily: 'monospace'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '11px',
    fontWeight: 'bold',
    display: 'inline-block'
  },
  revokeButton: {
    padding: '6px 12px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  logItem: {
    display: 'flex',
    gap: '15px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    padding: '15px'
  },
  logIcon: {
    fontSize: '24px'
  },
  logContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  logAction: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  logDetails: {
    color: '#ccc',
    fontSize: '14px'
  },
  logMeta: {
    color: '#999',
    fontSize: '12px'
  }
};

export default VoucherManagement;
