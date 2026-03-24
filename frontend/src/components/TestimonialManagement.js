import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TestimonialManagement = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ pendingCount: 0, approvedCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTestimonials();
  }, [filter]);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/testimonials/admin/all?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTestimonials(data.testimonials);
      setStats({ pendingCount: data.pendingCount, approvedCount: data.approvedCount });
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/testimonials/admin/${id}/approve`, 
        { approve: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Testimonial approved successfully');
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve testimonial');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this testimonial?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/testimonials/admin/${id}/approve`, 
        { approve: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Testimonial rejected and deleted');
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject testimonial');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/testimonials/admin/${id}/toggle-featured`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to toggle featured status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/testimonials/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Testimonial deleted successfully');
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete testimonial');
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < rating ? '#FFD700' : '#333', fontSize: '18px' }}>
        ★
      </span>
    ));
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Testimonial Management</h2>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.pendingCount}</div>
          <div style={styles.statLabel}>Pending Approval</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.approvedCount}</div>
          <div style={styles.statLabel}>Approved</div>
        </div>
      </div>

      <div style={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...styles.filterButton,
            ...(filter === 'all' ? styles.filterButtonActive : {})
          }}
        >
          All ({testimonials.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            ...styles.filterButton,
            ...(filter === 'pending' ? styles.filterButtonActive : {})
          }}
        >
          Pending ({stats.pendingCount})
        </button>
        <button
          onClick={() => setFilter('approved')}
          style={{
            ...styles.filterButton,
            ...(filter === 'approved' ? styles.filterButtonActive : {})
          }}
        >
          Approved ({stats.approvedCount})
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : testimonials.length === 0 ? (
        <div style={styles.empty}>No testimonials found</div>
      ) : (
        <div style={styles.list}>
          {testimonials.map(testimonial => (
            <div key={testimonial._id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{testimonial.userId.name}</div>
                  <div style={styles.userEmail}>{testimonial.userId.email}</div>
                  <div style={styles.rating}>{renderStars(testimonial.rating)}</div>
                </div>
                <div style={styles.badges}>
                  {testimonial.isApproved && (
                    <span style={styles.approvedBadge}>✓ Approved</span>
                  )}
                  {!testimonial.isApproved && (
                    <span style={styles.pendingBadge}>⏳ Pending</span>
                  )}
                  {testimonial.isFeatured && (
                    <span style={styles.featuredBadge}>⭐ Featured</span>
                  )}
                </div>
              </div>

              <p style={styles.text}>{testimonial.testimonialText}</p>

              <div style={styles.meta}>
                <span style={styles.date}>
                  Submitted: {new Date(testimonial.createdAt).toLocaleDateString()}
                </span>
                {testimonial.approvedBy && (
                  <span style={styles.approver}>
                    Approved by: {testimonial.approvedBy.name}
                  </span>
                )}
              </div>

              <div style={styles.actions}>
                {!testimonial.isApproved && (
                  <>
                    <button onClick={() => handleApprove(testimonial._id)} style={styles.approveButton}>
                      ✓ Approve
                    </button>
                    <button onClick={() => handleReject(testimonial._id)} style={styles.rejectButton}>
                      ✖ Reject
                    </button>
                  </>
                )}
                {testimonial.isApproved && (
                  <button onClick={() => handleToggleFeatured(testimonial._id)} style={styles.featureButton}>
                    {testimonial.isFeatured ? '⭐ Unfeature' : '⭐ Feature'}
                  </button>
                )}
                <button onClick={() => handleDelete(testimonial._id)} style={styles.deleteButton}>
                  🗑️ Delete
                </button>
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
    padding: '20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '28px',
    marginBottom: '20px'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
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
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '8px'
  },
  statLabel: {
    color: '#999',
    fontSize: '14px'
  },
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  filterButton: {
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    color: '#FFD700',
    border: '1px solid #FFD700',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  filterButtonActive: {
    backgroundColor: '#FFD700',
    color: '#000'
  },
  loading: {
    textAlign: 'center',
    color: '#FFD700',
    fontSize: '18px',
    padding: '40px'
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
    padding: '40px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '20px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    color: '#FFD700',
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  userEmail: {
    color: '#999',
    fontSize: '14px',
    marginBottom: '8px'
  },
  rating: {
    display: 'flex',
    gap: '2px'
  },
  badges: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  approvedBadge: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  pendingBadge: {
    backgroundColor: '#ff9800',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  featuredBadge: {
    backgroundColor: '#FFD700',
    color: '#000',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  text: {
    color: '#ccc',
    fontSize: '15px',
    lineHeight: '1.6',
    marginBottom: '15px',
    whiteSpace: 'pre-wrap'
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '15px',
    paddingBottom: '15px',
    borderBottom: '1px solid #333',
    flexWrap: 'wrap',
    gap: '10px'
  },
  date: {
    color: '#666',
    fontSize: '13px'
  },
  approver: {
    color: '#4CAF50',
    fontSize: '13px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  approveButton: {
    padding: '8px 16px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  featureButton: {
    padding: '8px 16px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#8B0000',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default TestimonialManagement;
