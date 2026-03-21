import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import DonateModal from './DonateModal';

const Footer = () => {
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(false);
  return (
    <>
      <footer style={styles.footer}>
        <div style={styles.content}>
          <div style={styles.left}>
            <Link 
              to="/privacy" 
              style={{
                ...styles.privacyLink,
                color: hoveredLink ? '#fff' : '#FFD700',
                textShadow: hoveredLink ? '0 0 10px rgba(255, 215, 0, 0.8)' : 'none'
              }}
              onMouseEnter={() => setHoveredLink(true)}
              onMouseLeave={() => setHoveredLink(false)}
            >
              Privacy Policy
            </Link>
          </div>
          
          <div style={styles.center}>
            <p style={styles.copyright}>
              © CloudLiteracy Inc. All Rights Reserved
            </p>
          </div>
          
          <div style={styles.right}>
            <button 
              style={{
                ...styles.donateButton,
                transform: hoveredButton ? 'scale(1.05)' : 'scale(1)',
                boxShadow: hoveredButton ? '0 4px 20px rgba(255, 215, 0, 0.4)' : 'none'
              }}
              title="If you like what we do, please donate"
              onClick={() => setIsDonateModalOpen(true)}
              onMouseEnter={() => setHoveredButton(true)}
              onMouseLeave={() => setHoveredButton(false)}
            >
              ❤️ Donate
            </button>
          </div>
        </div>
      </footer>
      
      <DonateModal 
        isOpen={isDonateModalOpen} 
        onClose={() => setIsDonateModalOpen(false)} 
      />
    </>
  );
};

const styles = {
  footer: {
    backgroundColor: '#0d0d0d',
    borderTop: '1px solid #333',
    padding: '25px 20px',
    marginTop: 'auto'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap: '20px'
  },
  left: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  center: {
    display: 'flex',
    justifyContent: 'center'
  },
  right: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  privacyLink: {
    color: '#FFD700',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  copyright: {
    color: '#999',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center'
  },
  donateButton: {
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    padding: '10px 25px',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }
};

export default Footer;
