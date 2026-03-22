import React from 'react';
import CommunityChat from '../components/CommunityChat';

const Chat = () => {
  return (
    <div style={styles.container}>
      <CommunityChat />
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    paddingTop: '80px',
    paddingBottom: '40px'
  }
};

export default Chat;
