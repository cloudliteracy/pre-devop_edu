import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as commentService from '../services/comments';
import socketService from '../services/socket';
import './CommunityChat.css';

const CommunityChat = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newCommentFiles, setNewCommentFiles] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyFiles, setReplyFiles] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [showReactions, setShowReactions] = useState(null);
  const chatEndRef = useRef(null);

  const emojiCategories = {
    emotions: [
      { name: 'smile', icon: '😀' },
      { name: 'laugh', icon: '😂' },
      { name: 'love', icon: '😍' },
      { name: 'heart_eyes', icon: '🤩' },
      { name: 'sad', icon: '😢' },
      { name: 'angry', icon: '😡' },
      { name: 'wow', icon: '😮' },
      { name: 'thinking', icon: '🤔' },
      { name: 'cool', icon: '😎' },
      { name: 'party', icon: '🥳' }
    ],
    gestures: [
      { name: 'thumbs_up', icon: '👍' },
      { name: 'thumbs_down', icon: '👎' },
      { name: 'clap', icon: '👏' },
      { name: 'raised_hands', icon: '🙌' },
      { name: 'handshake', icon: '🤝' },
      { name: 'muscle', icon: '💪' },
      { name: 'pray', icon: '🙏' },
      { name: 'ok_hand', icon: '👌' }
    ],
    symbols: [
      { name: 'heart', icon: '❤️' },
      { name: 'fire', icon: '🔥' },
      { name: 'star', icon: '⭐' },
      { name: 'check', icon: '✅' },
      { name: 'cross', icon: '❌' },
      { name: 'hundred', icon: '💯' },
      { name: 'party_popper', icon: '🎉' },
      { name: 'rocket', icon: '🚀' }
    ],
    objects: [
      { name: 'bulb', icon: '💡' },
      { name: 'books', icon: '📚' },
      { name: 'target', icon: '🎯' },
      { name: 'trophy', icon: '🏆' },
      { name: 'lightning', icon: '⚡' },
      { name: 'medal', icon: '🏅' },
      { name: 'brain', icon: '🧠' }
    ]
  };

  const [activeEmojiCategory, setActiveEmojiCategory] = useState('emotions');

  useEffect(() => {
    loadChatSettings();
    loadComments();
    setupSocketListeners();
    return () => socketService.offCommentEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadChatSettings = async () => {
    try {
      const settings = await commentService.getChatSettings();
      setChatEnabled(settings.isEnabled);
    } catch (error) {
      console.error('Error loading chat settings:', error);
    }
  };

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.getComments(currentPage);
      setComments(data.comments);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketListeners = () => {
    socketService.onNewComment((comment) => {
      if (currentPage === 1) {
        setComments(prev => [comment, ...prev]);
      }
    });

    socketService.onNewReply(({ reply, parentCommentId }) => {
      setComments(prev => prev.map(comment => {
        if (comment._id === parentCommentId) {
          return { ...comment, replies: [...(comment.replies || []), reply] };
        }
        return comment;
      }));
    });

    socketService.onCommentEdited((editedComment) => {
      setComments(prev => prev.map(comment => {
        if (comment._id === editedComment._id) {
          return editedComment;
        }
        if (comment.replies) {
          comment.replies = comment.replies.map(reply =>
            reply._id === editedComment._id ? editedComment : reply
          );
        }
        return comment;
      }));
    });

    socketService.onCommentDeleted(({ commentId, parentCommentId }) => {
      if (parentCommentId) {
        setComments(prev => prev.map(comment => {
          if (comment._id === parentCommentId) {
            return { ...comment, replies: comment.replies.filter(r => r._id !== commentId) };
          }
          return comment;
        }));
      } else {
        setComments(prev => prev.filter(c => c._id !== commentId));
      }
    });

    socketService.onCommentReaction((updatedComment) => {
      console.log('Socket received comment reaction:', updatedComment);
      setComments(prev => prev.map(comment => {
        if (comment._id === updatedComment._id) {
          console.log('Updating parent comment reactions');
          return { ...comment, reactions: updatedComment.reactions };
        }
        if (comment.replies) {
          const updatedReplies = comment.replies.map(reply => {
            if (reply._id === updatedComment._id) {
              console.log('Updating reply reactions');
              return { ...reply, reactions: updatedComment.reactions };
            }
            return reply;
          });
          return { ...comment, replies: updatedReplies };
        }
        return comment;
      }));
    });

    socketService.onChatStatusChanged(({ isEnabled }) => {
      setChatEnabled(isEnabled);
      if (!isEnabled) {
        alert('Chat has been disabled by an administrator');
      }
    });
  };

  const handleToggleChat = async () => {
    if (!window.confirm(`Are you sure you want to ${chatEnabled ? 'disable' : 'enable'} the chat?`)) return;
    
    try {
      const settings = await commentService.toggleChat();
      setChatEnabled(settings.isEnabled);
      alert(`Chat ${settings.isEnabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error toggling chat');
    }
  };

  const handleReaction = async (commentId, emoji) => {
    if (!user) {
      alert('Please login to react');
      return;
    }

    try {
      const response = await commentService.addReaction(commentId, emoji);
      console.log('Reaction added, response:', response);
      setShowReactions(null);
    } catch (error) {
      console.error('Error adding reaction:', error);
      alert(error.response?.data?.message || 'Error adding reaction');
    }
  };

  const handleRemoveReaction = async (commentId) => {
    try {
      await commentService.removeReaction(commentId);
    } catch (error) {
      alert(error.response?.data?.message || 'Error removing reaction');
    }
  };

  const getUserReaction = (comment) => {
    if (!user || !comment.reactions) return null;
    const userId = user.userId || user.id || user._id;
    if (!userId) return null;
    console.log('getUserReaction check:', { userId, reactions: comment.reactions });
    return comment.reactions.find(r => r.user && (r.user._id === userId || r.user === userId));
  };

  const getReactionCounts = (reactions) => {
    if (!reactions || reactions.length === 0) return {};
    
    const counts = {};
    reactions.forEach(r => {
      counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    });
    return counts;
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to post a comment');
      return;
    }
    if (!newComment.trim() && newCommentFiles.length === 0) {
      alert('Please add content or attach files');
      return;
    }

    try {
      await commentService.createComment(newComment, newCommentFiles);
      setNewComment('');
      setNewCommentFiles([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Error posting comment');
    }
  };

  const handleReply = async (e, commentId) => {
    e.preventDefault();
    if (!user) {
      alert('Please login to reply');
      return;
    }
    if (!replyContent.trim() && replyFiles.length === 0) {
      alert('Please add content or attach files');
      return;
    }

    try {
      await commentService.replyToComment(commentId, replyContent, replyFiles);
      setReplyingTo(null);
      setReplyContent('');
      setReplyFiles([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Error posting reply');
    }
  };

  const handleEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await commentService.editComment(commentId, editContent);
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      alert(error.response?.data?.message || 'Error editing comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await commentService.deleteComment(commentId);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting comment');
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  const handleFileSelect = (e, isReply = false) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert('Maximum 5 files allowed');
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    const invalidFiles = files.filter(f => f.size > maxSize);
    if (invalidFiles.length > 0) {
      alert('Each file must be less than 10MB');
      return;
    }

    if (isReply) {
      setReplyFiles(files);
    } else {
      setNewCommentFiles(files);
    }
  };

  const removeFile = (index, isReply = false) => {
    if (isReply) {
      setReplyFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setNewCommentFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'audio': return '🎵';
      case 'document': return '📄';
      default: return '📎';
    }
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="attachments-container">
        {attachments.map((file, index) => (
          <div key={index} className="attachment-item">
            {file.fileType === 'image' && (
              <a href={`http://localhost:5000${file.fileUrl}`} target="_blank" rel="noopener noreferrer">
                <img 
                  src={`http://localhost:5000${file.fileUrl}`} 
                  alt={file.originalName}
                  className="attachment-image"
                  onError={(e) => {
                    console.error('Image load error:', file.fileUrl);
                    e.target.style.display = 'none';
                  }}
                />
              </a>
            )}
            {file.fileType === 'video' && (
              <video controls className="attachment-video">
                <source src={`http://localhost:5000${file.fileUrl}`} type={file.mimeType} />
              </video>
            )}
            {file.fileType === 'audio' && (
              <audio controls className="attachment-audio">
                <source src={`http://localhost:5000${file.fileUrl}`} type={file.mimeType} />
              </audio>
            )}
            {file.fileType === 'document' && (
              <a 
                href={`http://localhost:5000${file.fileUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="attachment-document"
              >
                <span className="file-icon">{getFileIcon(file.fileType)}</span>
                <div className="file-info">
                  <span className="file-name">{file.originalName}</span>
                  <span className="file-size">{formatFileSize(file.fileSize)}</span>
                </div>
                <span className="download-icon">⬇️</span>
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderReactions = (comment) => {
    if (!comment) return null;
    
    const reactionCounts = getReactionCounts(comment.reactions);
    const userReaction = getUserReaction(comment);

    // Get all emojis from all categories
    const allEmojis = [
      ...emojiCategories.emotions,
      ...emojiCategories.gestures,
      ...emojiCategories.symbols,
      ...emojiCategories.objects
    ];

    return (
      <div className="reactions-section">
        <div className="reactions-display">
          {Object.entries(reactionCounts).map(([emoji, count]) => {
            const emojiObj = allEmojis.find(e => e.name === emoji);
            return (
              <span key={emoji} className="reaction-count">
                {emojiObj?.icon} {count}
              </span>
            );
          })}
        </div>
        
        {user && (
          <div className="reaction-controls">
            <button 
              className="react-btn"
              onClick={() => setShowReactions(showReactions === comment._id ? null : comment._id)}
            >
              😊 React
            </button>
            
            {showReactions === comment._id && (
              <div className="emoji-picker">
                <div className="emoji-categories">
                  <button
                    className={`category-tab ${activeEmojiCategory === 'emotions' ? 'active' : ''}`}
                    onClick={() => setActiveEmojiCategory('emotions')}
                  >
                    😊
                  </button>
                  <button
                    className={`category-tab ${activeEmojiCategory === 'gestures' ? 'active' : ''}`}
                    onClick={() => setActiveEmojiCategory('gestures')}
                  >
                    👍
                  </button>
                  <button
                    className={`category-tab ${activeEmojiCategory === 'symbols' ? 'active' : ''}`}
                    onClick={() => setActiveEmojiCategory('symbols')}
                  >
                    ❤️
                  </button>
                  <button
                    className={`category-tab ${activeEmojiCategory === 'objects' ? 'active' : ''}`}
                    onClick={() => setActiveEmojiCategory('objects')}
                  >
                    💡
                  </button>
                </div>
                <div className="emoji-grid">
                  {emojiCategories[activeEmojiCategory].map(emoji => (
                    <button
                      key={emoji.name}
                      className="emoji-btn"
                      onClick={() => handleReaction(comment._id, emoji.name)}
                      title={emoji.name.replace('_', ' ')}
                    >
                      {emoji.icon}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {userReaction && (
              <button 
                className="remove-reaction-btn"
                onClick={() => handleRemoveReaction(comment._id)}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const getRoleBadge = (role) => {
    if (role === 'super_admin') return 'SUPER ADMIN';
    if (role === 'admin') return 'ADMIN';
    return 'LEARNER';
  };

  const getRoleBadgeClass = (role) => {
    if (role === 'super_admin') return 'role-badge-super-admin';
    if (role === 'admin') return 'role-badge-admin';
    return 'role-badge-user';
  };

  const canEdit = (comment) => {
    if (!user || !comment.user) return false;
    const userId = user.userId || user.id || user._id;
    if (!userId) return false;
    return comment.user._id === userId;
  };

  const canDelete = (comment) => {
    if (!user || !comment.user) return false;
    const isAdmin = user.role === 'admin' || user.role === 'super_admin';
    const userId = user.userId || user.id || user._id;
    const isOwner = userId && comment.user._id === userId;
    console.log('canDelete check:', { isAdmin, isOwner, userRole: user.role, userId, commentUserId: comment.user._id });
    return isAdmin || isOwner;
  };

  if (!chatEnabled) {
    return (
      <div className="community-chat">
        <h2 className="chat-title">CloudLiteracy Learners Community Chat</h2>
        <div className="chat-disabled">
          <p>💬 Chat is currently disabled by administrators</p>
          {user && (user.role === 'admin' || user.role === 'super_admin') && (
            <button onClick={handleToggleChat} className="enable-chat-btn">
              ✅ Enable Chat
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="community-chat">
      <div className="chat-header">
        <h2 className="chat-title">CloudLiteracy Learners Community Chat</h2>
        {user && (user.role === 'admin' || user.role === 'super_admin') && (
          <button onClick={handleToggleChat} className="disable-chat-btn">
            🔒 Disable Chat
          </button>
        )}
      </div>
      
      {user && (
        <form onSubmit={handlePostComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts with the community..."
            maxLength={500}
            rows={3}
          />
          <div className="file-upload-section">
            <label className="file-upload-btn">
              📎 Attach Files (Max 5, 10MB each)
              <input 
                type="file" 
                multiple 
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                onChange={(e) => handleFileSelect(e, false)}
                style={{ display: 'none' }}
              />
            </label>
            {newCommentFiles.length > 0 && (
              <div className="selected-files">
                {newCommentFiles.map((file, index) => (
                  <div key={index} className="file-tag">
                    <span>{file.name} ({formatFileSize(file.size)})</span>
                    <button type="button" onClick={() => removeFile(index, false)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-footer">
            <span className="char-count">{newComment.length}/500</span>
            <button type="submit" disabled={!newComment.trim() && newCommentFiles.length === 0}>Post Comment</button>
          </div>
        </form>
      )}

      {!user && (
        <div className="login-prompt">
          Please login to join the conversation
        </div>
      )}

      {loading && currentPage === 1 ? (
        <div className="loading">Loading comments...</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => {
            if (!comment || !comment.user) return null;
            
            return (
            <div key={comment._id} className="comment-card">
              <div className="comment-header">
                <div className="user-info">
                  <span className="user-name">{comment.user.name || 'Unknown User'}</span>
                  <span className={`role-badge ${getRoleBadgeClass(comment.user.role)}`}>
                    {getRoleBadge(comment.user.role)}
                  </span>
                </div>
                <span className="comment-time">{formatTime(comment.createdAt)}</span>
              </div>

              {editingComment === comment._id ? (
                <div className="edit-form">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                  <div className="edit-actions">
                    <button onClick={() => handleEdit(comment._id)}>Save</button>
                    <button onClick={() => setEditingComment(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="comment-content">
                    {comment.content}
                    {comment.isEdited && <span className="edited-badge">edited</span>}
                  </p>
                  {renderAttachments(comment.attachments)}
                  {renderReactions(comment)}

                  <div className="comment-actions">
                    {user && (
                      <button onClick={() => setReplyingTo(comment._id)}>Reply</button>
                    )}
                    {canEdit(comment) && (
                      <button onClick={() => {
                        setEditingComment(comment._id);
                        setEditContent(comment.content);
                      }}>Edit</button>
                    )}
                    {canDelete(comment) && (
                      <button onClick={() => handleDelete(comment._id)} className="delete-btn">Delete</button>
                    )}
                  </div>
                </>
              )}

              {replyingTo === comment._id && (
                <form onSubmit={(e) => handleReply(e, comment._id)} className="reply-form">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write your reply..."
                    maxLength={500}
                    rows={2}
                  />
                  <div className="file-upload-section">
                    <label className="file-upload-btn">
                      📎 Attach Files
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                        onChange={(e) => handleFileSelect(e, true)}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {replyFiles.length > 0 && (
                      <div className="selected-files">
                        {replyFiles.map((file, index) => (
                          <div key={index} className="file-tag">
                            <span>{file.name} ({formatFileSize(file.size)})</span>
                            <button type="button" onClick={() => removeFile(index, true)}>×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="reply-actions">
                    <span className="char-count">{replyContent.length}/500</span>
                    <button type="submit" disabled={!replyContent.trim() && replyFiles.length === 0}>Post Reply</button>
                    <button type="button" onClick={() => { setReplyingTo(null); setReplyFiles([]); }}>Cancel</button>
                  </div>
                </form>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="replies-list">
                  {comment.replies.map((reply) => {
                    if (!reply || !reply.user) return null;
                    
                    return (
                    <div key={reply._id} className="reply-card">
                      <div className="comment-header">
                        <div className="user-info">
                          <span className="user-name">{reply.user.name || 'Unknown User'}</span>
                          <span className={`role-badge ${getRoleBadgeClass(reply.user.role)}`}>
                            {getRoleBadge(reply.user.role)}
                          </span>
                        </div>
                        <span className="comment-time">{formatTime(reply.createdAt)}</span>
                      </div>

                      {editingComment === reply._id ? (
                        <div className="edit-form">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            maxLength={500}
                            rows={2}
                          />
                          <div className="edit-actions">
                            <button onClick={() => handleEdit(reply._id)}>Save</button>
                            <button onClick={() => setEditingComment(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="comment-content">
                            {reply.content}
                            {reply.isEdited && <span className="edited-badge">edited</span>}
                          </p>
                          {renderAttachments(reply.attachments)}
                          {renderReactions(reply)}

                          <div className="comment-actions">
                            {canEdit(reply) && (
                              <button onClick={() => {
                                setEditingComment(reply._id);
                                setEditContent(reply.content);
                              }}>Edit</button>
                            )}
                            {canDelete(reply) && (
                              <button onClick={() => handleDelete(reply._id)} className="delete-btn">Delete</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}

      <div ref={chatEndRef} />
    </div>
  );
};

export default CommunityChat;
