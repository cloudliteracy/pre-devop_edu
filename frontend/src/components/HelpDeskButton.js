import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HelpDeskChat from './HelpDeskChat';

const HelpDeskButton = () => {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Hide button on admin dashboard
    const isAdminPage = window.location.pathname.includes('/admin');
    setIsVisible(!isAdminPage);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <button
        onClick={() => setShowChat(true)}
        style={{
          ...styles.button,
          ...(showChat ? styles.buttonHidden : {})
        }}
        title="Need help? Chat with us!"
      >
        <span style={styles.icon}>💬</span>
        {unreadCount > 0 && (
          <span style={styles.badge}>{unreadCount}</span>
        )}
      </button>

      {showChat && (
        <HelpDeskChat
          user={user}
          onClose={() => setShowChat(false)}
          onUnreadChange={setUnreadCount}
        />
      )}
    </>
  );
};

const styles = {
  button: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#FFD700',
    border: 'none',
    boxShadow: '0 4px 20px rgba(255, 215, 0, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    zIndex: 999,
    animation: 'pulse 2s infinite'
  },
  buttonHidden: {
    opacity: 0,
    pointerEvents: 'none'
  },
  icon: {
    fontSize: '28px'
  },
  badge: {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ff4444',
    color: '#fff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '2px solid #000'
  }
};

export default HelpDeskButton;
