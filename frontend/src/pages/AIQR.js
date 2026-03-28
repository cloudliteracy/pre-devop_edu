import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AIQR = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'knowledge'
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadConversation();
    loadDocuments();
    loadStats();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/ai-qr/chat/conversation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/ai-qr/documents', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/ai-qr/knowledge/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      deliveryStatus: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/ai-qr/chat/send',
        { message: inputMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const aiMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp,
        isOutOfScope: data.isOutOfScope,
        deliveryStatus: 'delivered'
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: error.response?.data?.message || 'Failed to get response. Please try again.',
        timestamp: new Date().toISOString(),
        deliveryStatus: 'delivered',
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearConversation = async () => {
    if (!window.confirm('Clear entire conversation history?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:5000/api/ai-qr/chat/conversation', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
    } catch (error) {
      alert('Failed to clear conversation');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', file);

      const { data } = await axios.post(
        'http://localhost:5000/api/ai-qr/documents/upload',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      alert(data.message);
      loadDocuments();
      loadStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const downloadDocument = async (id, fileName) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/ai-qr/documents/${id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to download document');
    }
  };

  const deleteDocument = async (id) => {
    if (!window.confirm('Delete this document? You must refresh knowledge after deletion.')) return;

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.delete(
        `http://localhost:5000/api/ai-qr/documents/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(data.message);
      loadDocuments();
      loadStats();
    } catch (error) {
      alert('Failed to delete document');
    }
  };

  const refreshKnowledge = async () => {
    if (!window.confirm('Refresh AI knowledge base with current documents and entire project codebase?')) return;

    setRefreshing(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        'http://localhost:5000/api/ai-qr/knowledge/refresh',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(
        `Knowledge base refreshed!\n\n` +
        `Project Files: ${data.projectFiles}\n` +
        `Uploaded PDFs: ${data.uploadedDocuments}\n` +
        `Total Documents: ${data.totalDocuments}\n` +
        `Total Size: ${formatBytes(data.totalTextLength)}\n` +
        `Duration: ${data.duration}ms`
      );
      loadStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to refresh knowledge base');
    } finally {
      setRefreshing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const badges = {
      indexed: { color: '#4CAF50', text: 'Indexed' },
      pending: { color: '#FF9800', text: 'Pending' },
      failed: { color: '#f44336', text: 'Failed' }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span style={{ ...styles.statusBadge, backgroundColor: badge.color }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🤖 AI QR - Platform Assistant</h1>
          <p style={styles.subtitle}>Ask questions about CloudLiteracy infrastructure and operations</p>
        </div>
        <div style={styles.tabButtons}>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'chat' ? styles.tabButtonActive : {})
            }}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setActiveTab('knowledge')}
            style={{
              ...styles.tabButton,
              ...(activeTab === 'knowledge' ? styles.tabButtonActive : {})
            }}
          >
            📚 Knowledge Base
          </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <div style={styles.chatContainer}>
          <div style={styles.chatHeader}>
            <div style={styles.chatHeaderInfo}>
              <span style={styles.statusDot}></span>
              <span style={styles.chatHeaderText}>AI Assistant Online</span>
            </div>
            <button onClick={clearConversation} style={styles.clearButton}>
              🗑️ Clear Chat
            </button>
          </div>

          <div style={styles.messagesContainer}>
            {messages.length === 0 && (
              <div style={styles.emptyState}>
                <span style={styles.emptyIcon}>🤖</span>
                <p style={styles.emptyText}>
                  Hello! I'm your AI assistant for CloudLiteracy platform.
                </p>
                <p style={styles.emptySubtext}>
                  I have access to the entire project codebase, documentation, and uploaded PDFs.
                  Ask me about features, code implementation, architecture, or operations.
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  ...styles.messageWrapper,
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div
                  style={{
                    ...styles.message,
                    ...(msg.role === 'user' ? styles.userMessage : styles.aiMessage),
                    ...(msg.isOutOfScope ? styles.outOfScopeMessage : {}),
                    ...(msg.isError ? styles.errorMessage : {})
                  }}
                >
                  <div style={styles.messageContent}>{msg.content}</div>
                  <div style={styles.messageFooter}>
                    <span style={styles.messageTime}>
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.role === 'user' && (
                      <span style={styles.deliveryStatus}>
                        {msg.deliveryStatus === 'read' ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div style={styles.messageWrapper}>
                <div style={{ ...styles.message, ...styles.aiMessage }}>
                  <div style={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div style={styles.inputContainer}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about platform features, infrastructure, operations..."
              style={styles.input}
              disabled={isTyping}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isTyping}
              style={{
                ...styles.sendButton,
                opacity: !inputMessage.trim() || isTyping ? 0.5 : 1
              }}
            >
              ➤
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.knowledgeContainer}>
          <div style={styles.statsCard}>
            <h3 style={styles.statsTitle}>Knowledge Base Status</h3>
            <div style={styles.statsGrid}>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Project Files</div>
                <div style={styles.statValue}>Auto-Indexed</div>
                <div style={styles.statNote}>All code & docs</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Uploaded PDFs</div>
                <div style={styles.statValue}>{stats?.activeDocuments || 0}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Total Documents</div>
                <div style={styles.statValue}>{stats?.totalDocuments || 0}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Indexed PDFs</div>
                <div style={styles.statValue}>{stats?.indexedDocuments || 0}</div>
              </div>
              <div style={styles.statItem}>
                <div style={styles.statLabel}>Pending PDFs</div>
                <div style={styles.statValue}>{stats?.pendingDocuments || 0}</div>
              </div>
            </div>
            <div style={styles.statsInfo}>
              <div>
                <strong>Last Refreshed:</strong> {formatDate(stats?.lastRefreshedAt)}
              </div>
              {stats?.refreshedBy && (
                <div>
                  <strong>By:</strong> {stats.refreshedBy.name}
                </div>
              )}
              <div style={styles.knowledgeNote}>
                💡 AI has access to entire project codebase + uploaded PDFs
              </div>
              {stats?.needsRefresh && (
                <div style={styles.refreshWarning}>
                  ⚠️ New PDFs uploaded - click Refresh to update AI knowledge
                </div>
              )}
            </div>
          </div>

          <div style={styles.actionsBar}>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={styles.uploadButton}
            >
              {uploading ? '⏳ Uploading...' : '📄 Upload PDF'}
            </button>
            <button
              onClick={refreshKnowledge}
              disabled={refreshing}
              style={styles.refreshButton}
            >
              {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Knowledge'}
            </button>
          </div>

          <div style={styles.documentsTable}>
            <div style={styles.tableHeader}>
              <h3 style={styles.tableTitle}>Uploaded PDF Documents</h3>
              <p style={styles.tableSubtitle}>
                Upload additional PDFs to supplement the auto-indexed project files
              </p>
            </div>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>File Name</th>
                  <th style={styles.th}>Size</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Pages</th>
                  <th style={styles.th}>Uploaded</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={styles.emptyTableCell}>
                      No documents uploaded yet. Upload PDFs to build the knowledge base.
                    </td>
                  </tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id} style={styles.tr}>
                      <td style={styles.td}>{doc.fileName}</td>
                      <td style={styles.td}>{formatBytes(doc.fileSize)}</td>
                      <td style={styles.td}>{getStatusBadge(doc.status)}</td>
                      <td style={styles.td}>{doc.pageCount || '-'}</td>
                      <td style={styles.td}>{formatDate(doc.uploadedAt)}</td>
                      <td style={styles.td}>
                        <button
                          onClick={() => downloadDocument(doc.id, doc.fileName)}
                          style={styles.actionButton}
                          title="Download"
                        >
                          ⬇️
                        </button>
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          style={{ ...styles.actionButton, ...styles.deleteActionButton }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)',
    padding: '20px'
  },
  header: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px'
  },
  title: {
    color: '#FFD700',
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  subtitle: {
    color: '#999',
    fontSize: '16px'
  },
  tabButtons: {
    display: 'flex',
    gap: '10px'
  },
  tabButton: {
    padding: '10px 20px',
    backgroundColor: '#1a1a1a',
    color: '#FFD700',
    border: '1px solid #333',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  tabButtonActive: {
    backgroundColor: '#FFD700',
    color: '#000',
    border: '1px solid #FFD700'
  },
  chatContainer: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    height: 'calc(100vh - 180px)',
    display: 'flex',
    flexDirection: 'column'
  },
  chatHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  chatHeaderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50',
    animation: 'pulse 2s infinite'
  },
  chatHeaderText: {
    color: '#FFD700',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  clearButton: {
    padding: '8px 16px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#999'
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '20px'
  },
  emptyText: {
    fontSize: '18px',
    color: '#FFD700',
    marginBottom: '10px'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#999'
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '10px'
  },
  message: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '12px',
    wordWrap: 'break-word'
  },
  userMessage: {
    backgroundColor: '#FFD700',
    color: '#000',
    borderBottomRightRadius: '4px'
  },
  aiMessage: {
    backgroundColor: '#2d2d2d',
    color: '#fff',
    borderBottomLeftRadius: '4px'
  },
  outOfScopeMessage: {
    backgroundColor: '#4a2d2d',
    border: '1px solid #ff4444'
  },
  errorMessage: {
    backgroundColor: '#4a2d2d',
    border: '1px solid #ff4444'
  },
  messageContent: {
    fontSize: '15px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap'
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    fontSize: '11px',
    opacity: 0.7
  },
  messageTime: {
    fontSize: '11px'
  },
  deliveryStatus: {
    fontSize: '12px',
    color: '#4CAF50'
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    padding: '5px 0'
  },
  inputContainer: {
    padding: '15px 20px',
    borderTop: '1px solid #333',
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    backgroundColor: '#0d0d0d',
    border: '1px solid #333',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none'
  },
  sendButton: {
    width: '50px',
    height: '50px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  knowledgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  statsCard: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    padding: '25px'
  },
  statsTitle: {
    color: '#FFD700',
    fontSize: '20px',
    marginBottom: '20px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '15px',
    marginBottom: '20px'
  },
  statItem: {
    backgroundColor: '#0d0d0d',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statLabel: {
    color: '#999',
    fontSize: '13px',
    marginBottom: '8px'
  },
  statValue: {
    color: '#FFD700',
    fontSize: '28px',
    fontWeight: 'bold'
  },
  statsInfo: {
    color: '#999',
    fontSize: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  refreshWarning: {
    color: '#FF9800',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#2d2416',
    borderRadius: '6px'
  },
  knowledgeNote: {
    color: '#4CAF50',
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#1a2d1a',
    borderRadius: '6px',
    fontSize: '13px'
  },
  statNote: {
    color: '#666',
    fontSize: '11px',
    marginTop: '4px'
  },
  actionsBar: {
    display: 'flex',
    gap: '10px'
  },
  uploadButton: {
    padding: '12px 24px',
    backgroundColor: '#FFD700',
    color: '#000',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  refreshButton: {
    padding: '12px 24px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  documentsTable: {
    backgroundColor: '#1a1a1a',
    border: '1px solid #333',
    borderRadius: '15px',
    overflow: 'hidden'
  },
  tableHeader: {
    padding: '20px',
    borderBottom: '1px solid #333',
    backgroundColor: '#0d0d0d'
  },
  tableTitle: {
    color: '#FFD700',
    fontSize: '18px',
    marginBottom: '5px'
  },
  tableSubtitle: {
    color: '#999',
    fontSize: '13px',
    margin: 0
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    color: '#FFD700',
    fontSize: '14px',
    fontWeight: 'bold',
    borderBottom: '1px solid #333',
    backgroundColor: '#0d0d0d'
  },
  tr: {
    borderBottom: '1px solid #333'
  },
  td: {
    padding: '15px',
    color: '#ccc',
    fontSize: '14px'
  },
  emptyTableCell: {
    padding: '40px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px'
  },
  statusBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#fff'
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '16px',
    cursor: 'pointer',
    marginRight: '5px',
    transition: 'all 0.3s'
  },
  deleteActionButton: {
    backgroundColor: '#ff4444'
  }
};

// Add CSS animation for typing indicator
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .typing-indicator span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #999;
    display: inline-block;
    animation: typing 1.4s infinite;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .typing-indicator span:nth-child(2) {
    animation-delay: 0.2s;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  .typing-indicator span:nth-child(3) {
    animation-delay: 0.4s;
  }
`, styleSheet.cssRules.length);

styleSheet.insertRule(`
  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
  }
`, styleSheet.cssRules.length);

export default AIQR;
