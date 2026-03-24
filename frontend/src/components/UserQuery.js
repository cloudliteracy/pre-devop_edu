import React, { useState } from 'react';
import axios from 'axios';
import './UserQuery.css';

const UserQuery = () => {
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    role: 'all',
    isCsrUser: 'all',
    dateFrom: '',
    dateTo: '',
    hasPurchased: 'all',
    completionRange: 'all'
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [totalResults, setTotalResults] = useState(0);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleSearch = async () => {
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post('http://localhost:5000/api/admin/users/query', filters, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setResults(data.users);
      setTotalResults(data.total);
      setMessage({ text: `Found ${data.users.length} users`, type: 'success' });
    } catch (error) {
      setMessage({ text: error.response?.data?.message || 'Failed to query users', type: 'error' });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFilters({
      name: '',
      email: '',
      role: 'all',
      isCsrUser: 'all',
      dateFrom: '',
      dateTo: '',
      hasPurchased: 'all',
      completionRange: 'all'
    });
    setResults([]);
    setMessage({ text: '', type: '' });
    setTotalResults(0);
  };

  const getProgressColor = (percentage) => {
    if (percentage < 30) return '#ff4444';
    if (percentage < 70) return '#FFD700';
    return '#4CAF50';
  };

  return (
    <div className="user-query">
      <h2>🔍 User Query System</h2>

      <div className="query-form">
        <h3>Search Filters</h3>
        <div className="query-form-grid">
          <div className="query-form-group">
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={filters.name}
              onChange={handleInputChange}
              placeholder="Search by name..."
            />
          </div>

          <div className="query-form-group">
            <label>Email</label>
            <input
              type="text"
              name="email"
              value={filters.email}
              onChange={handleInputChange}
              placeholder="Search by email..."
            />
          </div>

          <div className="query-form-group">
            <label>Role</label>
            <select name="role" value={filters.role} onChange={handleInputChange}>
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="query-form-group">
            <label>CSR User</label>
            <select name="isCsrUser" value={filters.isCsrUser} onChange={handleInputChange}>
              <option value="all">All Users</option>
              <option value="yes">CSR Users Only</option>
              <option value="no">Regular Users Only</option>
            </select>
          </div>

          <div className="query-form-group">
            <label>Registration From</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleInputChange}
            />
          </div>

          <div className="query-form-group">
            <label>Registration To</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleInputChange}
            />
          </div>

          <div className="query-form-group">
            <label>Has Purchased Modules</label>
            <select name="hasPurchased" value={filters.hasPurchased} onChange={handleInputChange}>
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="query-form-group">
            <label>Completion Status</label>
            <select name="completionRange" value={filters.completionRange} onChange={handleInputChange}>
              <option value="all">All</option>
              <option value="low">Low (&lt;30%)</option>
              <option value="medium">Medium (30-70%)</option>
              <option value="high">High (&gt;70%)</option>
            </select>
          </div>
        </div>

        <div className="query-form-actions">
          <button className="query-search-btn" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : '🔍 Search'}
          </button>
          <button className="query-reset-btn" onClick={handleReset}>
            🔄 Reset
          </button>
        </div>
      </div>

      {message.text && (
        <div className={`query-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {results.length > 0 && (
        <div className="query-results">
          <div className="query-results-header">
            <h3>Query Results</h3>
            <span className="query-results-count">Total: {totalResults} users</span>
          </div>

          <table className="query-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Type</th>
                <th>Modules</th>
                <th>Progress</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {results.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.isCsrUser ? (
                      <span className="query-badge csr">CSR</span>
                    ) : (
                      <span className="query-badge regular">Regular</span>
                    )}
                  </td>
                  <td>{user.purchasedModules}</td>
                  <td>
                    <span
                      className="query-progress"
                      style={{ backgroundColor: getProgressColor(user.overallProgress) }}
                    >
                      {user.overallProgress}%
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && results.length === 0 && message.type === 'success' && (
        <div className="query-results">
          <div className="query-no-results">
            No users found matching your criteria
          </div>
        </div>
      )}
    </div>
  );
};

export default UserQuery;
