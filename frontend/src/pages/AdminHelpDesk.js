import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import E2EEncryption from '../utils/e2eEncryption';

const AdminHelpDesk = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [encryption] = useState(new E2EEncryption());
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'

  useEffect(() => {
    initializeEncryption();
    fetchActiveSessions();
    fetchChatHistory();
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

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/helpdesk/sessions/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatHistory(data.sessions || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
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

    socketService.socket?.on('helpdesk:key-exchange', async (data) => {
      if (selectedSession && data.sessionId === selectedSession.sessionId) {
        console.log('Received public key from guest');
        await encryption.importPublicKey(data.publicKey);
        setRecipientPublicKey(data.publicKey);
      }
    });
  };

  const joinSession = async (session) => {
    try {
      const token = localStorage.getItem('token');
      
      // If viewing history, just load messages without joining
      if (session.status === 'closed') {
        setSelectedSession(session);
        // Decrypt messages for display
        const decryptedMessages = await Promise.all(
          (session.messages || []).map(async (msg) => {
            try {
              const decrypted = await encryption.decrypt(msg.encryptedContent);
              return { ...msg, content: decrypted };
            } catch (err) {
              return { ...msg, content: '[Encrypted message]' };
            }
          })
        );
        setMessages(decryptedMessages);
        return;
      }

      const { data } = await axios.post(
        `http://localhost:5000/api/helpdesk/session/${session.sessionId}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedSession(data);
      
      // Decrypt existing messages
      const decryptedMessages = await Promise.all(
        (data.messages || []).map(async (msg) => {
          try {
            const decrypted = await encryption.decrypt(msg.encryptedContent);
            return { ...msg, content: decrypted };
          } catch (err) {
            return { ...msg, content: '[Encrypted message]' };
          }
        })
      );
      setMessages(decryptedMessages);
      
      socketService.socket?.emit('join-helpdesk', session.sessionId);
      
      const myPublicKey = await encryption.exportPublicKey();
      socketService.socket?.emit('helpdesk:exchange-key', {
        sessionId: session.sessionId,
        publicKey: myPublicKey
      });
      
      // Set a temporary flag to allow sending after key exchange
      setTimeout(() => {
        if (!recipientPublicKey) {
          console.warn('Recipient public key not received yet');
        }
      }, 2000);

      fetchActiveSessions();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to join session');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedSession) return;

    if (!recipientPublicKey) {
      alert('Waiting for encryption keys to be exchanged. Please wait a moment and try again.');
      return;
    }

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
      console.error('Send message error:', error);
      alert(error.response?.data?.message || 'Failed to send message: ' + error.message);
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
      fetchChatHistory();
    } catch (error) {
      alert('Failed to close session');
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this chat history? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/helpdesk/session/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
        setMessages([]);
      }
      fetchChatHistory();
    } catch (error) {
      alert('Failed to delete session');
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Help Desk Management</h2>
      
      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'active' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('active')}
        >
          Active Sessions ({activeSessions.length})
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'history' ? styles.tabActive : {})
          }}
          onClick={() => setActiveTab('history')}
        >
          Chat History ({chatHistory.length})
        </button>
      </div>
      
      <div style={styles.layout}>
        <div style={styles.sidebar}>
          <h3 style={styles.sidebarTitle}>
            {activeTab === 'active' ? 'Active Sessions' : 'Chat History'}
          </h3>
          {(activeTab === 'active' ? activeSessions : chatHistory).length === 0 ? (
            <p style={styles.noSessions}>
              {activeTab === 'active' ? 'No active sessions' : 'No chat history'}
            </p>
          ) : (
            (activeTab === 'active' ? activeSessions : chatHistory).map(session => (
              <div
                key={session._id}
                style={{
                  ...styles.sessionCard,
                  ...(selectedSession?._id === session._id ? styles.sessionCardActive : {})
                }}
              >
                <div
                  onClick={() => activeTab === 'active' 
                    ? (session.status === 'waiting' && joinSession(session))
                    : joinSession(session)
                  }
                  style={{ cursor: 'pointer', flex: 1 }}
                >
                  <div style={styles.sessionUser}>
                    {session.userType === 'guest' ? session.guestName : session.userId?.name}
                  </div>
                  <div style={styles.sessionStatus}>
                    {activeTab === 'active' 
                      ? (session.status === 'waiting' ? '⏳ Waiting' : `✅ ${session.adminId?.name}`)
                      : `✅ Closed by ${session.closedBy?.name || 'Admin'}`
                    }
                  </div>
                  <div style={styles.sessionTime}>
                    {activeTab === 'active'
                      ? new Date(session.startedAt).toLocaleString()
                      : new Date(session.closedAt).toLocaleString()
                    }
                  </div>
                </div>
                {activeTab === 'history' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.sessionId);
                    }}
                    style={styles.deleteButton}
                    title="Delete chat history"
                  >
                    🗑️
                  </button>
                )}
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
                  disabled={selectedSession?.status === 'closed'}
                />
                <button 
                  onClick={sendMessage} 
                  style={{
                    ...styles.sendButton,
                    ...(selectedSession?.status === 'closed' ? { opacity: 0.5, cursor: 'not-allowed' } : {})
                  }}
                  disabled={selectedSession?.status === 'closed'}
                >
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
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px'
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    color: '#999',
    border: '1px solid #333',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s'
  },
  tabActive: {
    backgroundColor: '#FFD700',
    color: '#000',
    borderColor: '#FFD700'
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
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
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
  },
  deleteButton: {
    padding: '6px 10px',
    backgroundColor: '#ff4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'all 0.3s'
  }
};

export default AdminHelpDesk;
