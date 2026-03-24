import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CSRCodeEntry.css';

const CSRCodeEntry = ({ onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await axios.post('http://localhost:5000/api/csr/verify', { code });
      
      if (data.valid) {
        navigate(`/register?csr=true&code=${data.code}`);
        onClose();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csr-modal-overlay" onClick={onClose}>
      <div className="csr-modal" onClick={(e) => e.stopPropagation()}>
        <button className="csr-modal-close" onClick={onClose}>✕</button>
        
        <div className="csr-modal-header">
          <h2>🎓 CSR Access Code</h2>
          <p>Enter your Corporate Social Responsibility access code</p>
        </div>

        <form onSubmit={handleSubmit} className="csr-form">
          <div className="csr-input-group">
            <label>Access Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CSR-XXXX-XXXX"
              maxLength={13}
              required
              autoFocus
            />
          </div>

          {error && <div className="csr-error">{error}</div>}

          <button type="submit" className="csr-submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="csr-info">
          <p>✓ Free access to all modules</p>
          <p>✓ No payment required</p>
          <p>✓ Full course content</p>
        </div>
      </div>
    </div>
  );
};

export default CSRCodeEntry;
