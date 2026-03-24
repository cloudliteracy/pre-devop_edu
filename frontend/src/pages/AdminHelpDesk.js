import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import E2EEncryption from '../utils/e2eEncryption';

const AdminHelpDesk = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [encryption] = useState(new E2EEncryption());
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);

  useEffect(() => {
    initializeEncryption();
    fetchActiveSessions();
    setupSocketListeners();
    
    return () => {
      if (selectedSession) {
        socketService.socket?.emit('leave-helpdesk', selectedSession.sessionId);
      }
    };
  }, []);

  const initializeEncryption = async () => {
    await encryption.generateKeyPair();
  };

  const fetchActiveSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/helpdesk/sessions/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActiveSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const setupSocketListeners = () => {
    socketService.socket?.on('helpdesk:new-request', (data) => {
      fetchActiveSessions();
    });

    socketService.socket?.on('helpdesk:new-message', async (data) => {
      if (selectedSession && data.sessionId === selectedSession.sessionId) {
        const decryptedContent = await encryption.decrypt(data.message.encryptedContent);
        setMessages(prev => [...prev, { ...data.message, content: decryptedContent }]);
      }
    });
  };

  const joinSession = async (session) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `http://localhost:5000/api/helpdesk/session/${session.sessionId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSession(data);
      setMessages(data.messages || []);
      
      socketService.socket?.emit('join-helpdesk', session.sessionId);
      
      const myPublicKey = await encryption.exportPublicKey();
      socketService.socket?.emit('helpdesk:exchange-key', {
        sessionId: session.sessionId,
        publicKey: myPublicKey
      });

      fetchActiveSessions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join session');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedSession) return;

    try {
      const encryptedContent = await encryption.encrypt(inputMessage.trim());
      
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/helpdesk/session/${selectedSession.sessionId}/message`,
        { encryptedContent, senderType: 'admin' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages(prev => [...prev, {
        senderType: 'admin',
        content: inputMessage.trim(),
        timestamp: new Date()
      }]);

      setInputMessage('');
    } catch (error) {
      alert('Failed to send message');
    }
  };

  const closeSession = async () => {
    if (!selectedSession) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/helpdesk/session/${selectedSession.sessionId}/close`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSession(null);
      setMessages([]);
      fetchActiveSessions();
    } catch (error) {
      alert('Failed to close session');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Help Desk Management</h2>
      
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>Active Sessions ({activeSessions.length})</h3>
          {activeSessions.length === 0 ? (
            <p style={styles.noSessions}>No active sessions</p>
          ) : (
            activeSessions.map(session => (
              <div
                key={session._id}
                style={{
                  ...styles.sessionCard,
                  ...(selectedSession?._id === session._id ? styles.sessionCardActive : {})
                }}
                onClick={() => session.status === 'waiting' && joinSession(session)}
              >
                <div style={styles.sessionUser}>
                  {session.userType === 'guest' ? session.guestName : session.userId?.name}
                </div>
                <div style={styles.sessionStatus}>
                  {session.status === 'waiting' ? '⏳ Waiting' : `✅ ${session.adminId?.name}`}
                </div>
                <div style={styles.sessionTime}>
                  {new Date(session.startedAt).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div style={styles.chatArea}>
          {selectedSession ? (
            <>
              <div style={styles.chatHeader}>
                <div>
                  <h3 style={styles.chatTitle}>
                    {selectedSession.userType === 'guest' 
                      ? selectedSession.guestName 
                      : selectedSession.userId?.name}
                  </h3>
                  <p style={styles.chatSubtitle}>
                    {selectedSession.userType === 'guest' 
                      ? selectedSession.guestEmail 
                      : selectedSession.userId?.email}
                  </p>
                </div>
                <button onClick={closeSession} style={styles.closeButton}>
                  Close Chat
                </button>
              </div>

              <div style={styles.messagesContainer}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.message,
                      ...(msg.senderType === 'admin' ? styles.messageAdmin : styles.messageUser)
                    }}
                  >
                    <div style={styles.messageContent}>{msg.content}</div>
                    <div style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>

              <div style={styles.inputContainer}>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your message..."
                  style={styles.input}
                />
                <button onClick={sendMessage} style={styles.sendButton}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>💬</span>
              <p style={styles.emptyText}>Select a session to start chatting</p>
            </div>
          )}
        </div>
      </div>
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
  layout: {
    display: 'grid',
    gridTemplateColumns: '300px 1fr',
    gap: '20px',
    height: '600px'
  },
  sidebar: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    padding: '15px',
    overflowY: 'auto'
  },
  sidebarTitle: {
    color: '#FFD700',
    fontSize: '16px',
    marginBottom: '15px'
  },
  noSessions: {
    color: '#999',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px'
  },
  sessionCard: {
    padding: '12px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '8px',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  sessionCardActive: {
    borderColor: '#FFD700',
    backgroundColor: '#2a2a2a'
  },
  sessionUser: {
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  sessionStatus: {
    color: '#999',
    fontSize: '12px',
    marginBottom: '5px'
  },
  sessionTime: {
    color: '#666',
    fontSize: '11px'
  },
  chatArea: {
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  chatHeader: {
    padding: '15px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatTitle: {
    color: '#FFD700',
    fontSize: '18px',
    margin: 0
  },
  chatSubtitle: {
    color: '#999',
    fontSize: '12px',
    margin: 0
  },
  closeButton: {
    padding: '8px 16px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  message: {
    maxWidth: '70%',
    padding: '10px 12px',
    borderRadius: '12px'
  },
  messageAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
    color: '#000'
  },
  messageUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    color: '#fff'
  },
  messageContent: {
    fontSize: '14px'
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.7,
    marginTop: '4px'
  },
  inputContainer: {
    padding: '15px',
    borderTop: '1px solid #333',
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '14px'
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px'
  },
  emptyIcon: {
    fontSize: '64px',
    opacity: 0.3
  },
  emptyText: {
    color: '#999',
    fontSize: '16px'
  }
};

export default AdminHelpDesk;
