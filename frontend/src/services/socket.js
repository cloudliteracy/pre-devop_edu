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
}

export default new SocketService();
