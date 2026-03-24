import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userData) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to socket server');
        if (userData) {
          this.socket.emit('user-online', userData);
        }
      });
    }
    return this.socket;
  }

  updateActivity(currentModule) {
    if (this.socket) {
      this.socket.emit('update-activity', { currentModule });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  onOnlineUsersUpdate(callback) {
    if (this.socket) {
      this.socket.on('online-users-update', callback);
    }
  }

  offOnlineUsersUpdate() {
    if (this.socket) {
      this.socket.off('online-users-update');
    }
  }

  onAdminSuspended(callback) {
    if (this.socket) {
      this.socket.on('admin-suspended', callback);
    }
  }

  offAdminSuspended() {
    if (this.socket) {
      this.socket.off('admin-suspended');
    }
  }

  onUserSuspended(callback) {
    if (this.socket) {
      this.socket.on('user-suspended', callback);
    }
  }

  offUserSuspended() {
    if (this.socket) {
      this.socket.off('user-suspended');
    }
  }

  onNewComment(callback) {
    if (this.socket) {
      this.socket.on('new-comment', callback);
    }
  }

  onNewReply(callback) {
    if (this.socket) {
      this.socket.on('new-reply', callback);
    }
  }

  onCommentEdited(callback) {
    if (this.socket) {
      this.socket.on('comment-edited', callback);
    }
  }

  onCommentDeleted(callback) {
    if (this.socket) {
      this.socket.on('comment-deleted', callback);
    }
  }

  offCommentEvents() {
    if (this.socket) {
      this.socket.off('new-comment');
      this.socket.off('new-reply');
      this.socket.off('comment-edited');
      this.socket.off('comment-deleted');
      this.socket.off('comment-reaction');
      this.socket.off('chat-status-changed');
    }
  }

  onCommentReaction(callback) {
    if (this.socket) {
      this.socket.on('comment-reaction', callback);
    }
  }

  onChatStatusChanged(callback) {
    if (this.socket) {
      this.socket.on('chat-status-changed', callback);
    }
  }

  onNewPoll(callback) {
    if (this.socket) {
      this.socket.on('new-poll', callback);
    }
  }

  onPollUpdated(callback) {
    if (this.socket) {
      this.socket.on('poll-updated', callback);
    }
  }

  onPollDeleted(callback) {
    if (this.socket) {
      this.socket.on('poll-deleted', callback);
    }
  }

  offPollEvents() {
    if (this.socket) {
      this.socket.off('new-poll');
      this.socket.off('poll-updated');
      this.socket.off('poll-deleted');
    }
  }

  onNewAnnouncement(callback) {
    if (this.socket) {
      this.socket.on('new-announcement', callback);
    }
  }

  onAnnouncementUpdated(callback) {
    if (this.socket) {
      this.socket.on('announcement-updated', callback);
    }
  }

  onAnnouncementDeleted(callback) {
    if (this.socket) {
      this.socket.on('announcement-deleted', callback);
    }
  }

  offAnnouncementEvents() {
    if (this.socket) {
      this.socket.off('new-announcement');
      this.socket.off('announcement-updated');
      this.socket.off('announcement-deleted');
    }
  }
}

export default new SocketService();
