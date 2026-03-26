import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import socketService from '../services/socket';
import E2EEncryption from '../utils/e2eEncryption';

const HelpDeskChat = ({ user, onClose, onUnreadChange }) => {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [status, setStatus] = useState('connecting'); // connecting, waiting, active, closed
  const [adminName, setAdminName] = useState(null);
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(!user);
  const [encryption] = useState(new E2EEncryption());
  const [recipientPublicKey, setRecipientPublicKey] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    initializeEncryption();
    return () => {
      if (sessionId) {
        socketService.socket?.emit('leave-helpdesk', sessionId);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeEncryption = async () => {
    try {
      await encryption.generateKeyPair();
      const publicKey = await encryption.exportPublicKey();
      localStorage.setItem('helpdesk_public_key', publicKey);
    } catch (error) {
      console.error('Encryption initialization failed:', error);
    }
  };

  const startSession = async () => {
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      alert('Please enter your name and email');
      return;
    }

    try {
      setStatus('connecting');
      
      const payload = {
        userType: user ? (user.role === 'partner' ? 'partner' : 'learner') : 'guest'
      };

      if (!user) {
        payload.guestName = guestName;
        payload.guestEmail = guestEmail;
      }

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const { data } = await axios.post('http://localhost:5000/api/helpdesk/session', payload, { headers });
      
      setSessionId(data.sessionId);
      setStatus('waiting');
      setShowGuestForm(false);

      // Join socket room
      socketService.socket?.emit('join-helpdesk', data.sessionId);

      // Setup socket listeners
      setupSocketListeners(data.sessionId);

      // Exchange public keys
      const myPublicKey = await encryption.exportPublicKey();
      socketService.socket?.emit('helpdesk:exchange-key', {
        sessionId: data.sessionId,
        publicKey: myPublicKey
      });

    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Failed to start chat session');
      setStatus('error');
    }
  };

  const setupSocketListeners = (sid) => {
    socketService.socket?.on('helpdesk:admin-joined', async (data) => {
      setStatus('active');
      setAdminName(data.adminName);
      
      // Import admin's public key
      if (data.publicKey) {
        await encryption.importPublicKey(data.publicKey);
        setRecipientPublicKey(data.publicKey);
      }
    });

    socketService.socket?.on('helpdesk:new-message', async (data) => {
      if (data.sessionId === sid) {
        // Decrypt message
        const decryptedContent = await encryption.decrypt(data.message.encryptedContent);
        
        setMessages(prev => [...prev, {
          ...data.message,
          content: decryptedContent
        }]);
      }
    });

    socketService.socket?.on('helpdesk:session-closed', (data) => {
      if (data.sessionId === sid) {
        setStatus('closed');
      }
    });

    socketService.socket?.on('helpdesk:key-exchange', async (data) => {
      if (data.sessionId === sid && data.publicKey) {
        await encryption.importPublicKey(data.publicKey);
        setRecipientPublicKey(data.publicKey);
      }
    });

    socketService.socket?.on('helpdesk:typing', (data) => {
      if (data.sessionId === sid) {
        // Handle typing indicator
      }
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !recipientPublicKey) return;

    try {
      // Encrypt message
      const encryptedContent = await encryption.encrypt(inputMessage.trim());

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post(
        `http://localhost:5000/api/helpdesk/session/${sessionId}/message`,
        {
          encryptedContent,
          senderType: user ? 'user' : 'guest'
        },
        { headers }
      );

      // Add to local messages (already decrypted)
      setMessages(prev => [...prev, {
        senderId: user?._id,
        senderType: user ? 'user' : 'guest',
        content: inputMessage.trim(),
        timestamp: new Date()
      }]);

      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <span style={styles.headerIcon}>💬</span>
          <div>
            <h3 style={styles.headerTitle}>Help Desk</h3>
            <p style={styles.headerStatus}>
              {status === 'connecting' && '🔄 Connecting...'}
              {status === 'waiting' && '⏳ Waiting for admin...'}
              {status === 'active' && `✅ Connected with ${adminName}`}
              {status === 'closed' && '❌ Chat closed'}
            </p>
          </div>
        </div>
        <button onClick={onClose} style={styles.closeButton}>✖</button>
      </div>

      {showGuestForm ? (
        <div style={styles.guestForm}>
          <h4 style={styles.guestFormTitle}>Start Chat</h4>
          <p style={styles.guestFormSubtitle}>Please provide your details to continue</p>
          <input
            type="text"
            placeholder="Your Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Your Email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            style={styles.input}
          />
          <button onClick={startSession} style={styles.startButton}>
            Start Chat
          </button>
          <p style={styles.encryptionNote}>
            🔒 End-to-end encrypted - Your messages are private
          </p>
        </div>
      ) : (
        <>
          <div style={styles.messagesContainer}>
            {messages.length === 0 ? (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>💬</span>
                <p style={styles.emptyText}>
                  {status === 'waiting' 
                    ? 'Waiting for an admin to join...' 
                    : 'Start the conversation!'}
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = msg.senderType === (user ? 'user' : 'guest');
                return (
                  <div
                    key={index}
                    style={{
                      ...styles.message,
                      ...(isOwn ? styles.messageOwn : styles.messageOther)
                    }}
                  >
                    <div style={styles.messageContent}>{msg.content}</div>
                    <div style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {status !== 'closed' && (
            <div style={styles.inputContainer}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={status === 'active' ? 'Type your message...' : 'Waiting for admin...'}
                disabled={status !== 'active'}
                style={styles.textarea}
                rows={2}
              />
              <button
                onClick={sendMessage}
                disabled={status !== 'active' || !inputMessage.trim()}
                style={{
                  ...styles.sendButton,
                  ...(status !== 'active' || !inputMessage.trim() ? styles.sendButtonDisabled : {})
                }}
              >
                Send
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '380px',
    height: '550px',
    backgroundColor: '#1a1a1a',
    border: '2px solid #FFD700',
    borderRadius: '15px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    animation: 'slideIn 0.3s ease-out'
  },
  header: {
    backgroundColor: '#FFD700',
    padding: '15px',
    borderRadius: '13px 13px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  headerIcon: {
    fontSize: '24px'
  },
  headerTitle: {
    margin: 0,
    color: '#000',
    fontSize: '18px',
    fontWeight: 'bold'
  },
  headerStatus: {
    margin: 0,
    color: '#333',
    fontSize: '12px'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#000',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '5px'
  },
  guestForm: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    flex: 1,
    justifyContent: 'center'
  },
  guestFormTitle: {
    color: '#FFD700',
    fontSize: '20px',
    margin: 0,
    textAlign: 'center'
  },
  guestFormSubtitle: {
    color: '#999',
    fontSize: '14px',
    margin: 0,
    textAlign: 'center'
  },
  input: {
    padding: '12px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px'
  },
  startButton: {
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
  encryptionNote: {
    color: '#4CAF50',
    fontSize: '12px',
    textAlign: 'center',
    margin: 0
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: '15px'
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.3
  },
  emptyText: {
    color: '#999',
    fontSize: '14px',
    textAlign: 'center'
  },
  message: {
    maxWidth: '75%',
    padding: '10px 12px',
    borderRadius: '12px',
    wordWrap: 'break-word'
  },
  messageOwn: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFD700',
    color: '#000'
  },
  messageOther: {
    alignSelf: 'flex-start',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    color: '#fff'
  },
  messageContent: {
    fontSize: '14px',
    lineHeight: '1.4'
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
  textarea: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    resize: 'none',
    fontFamily: 'inherit'
  },
  sendButton: {
    padding: '10px 20px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  sendButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

export default HelpDeskChat;
