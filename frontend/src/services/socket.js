import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  joinBoard(boardId) {
    if (this.socket) {
      this.socket.emit('join-board', boardId);
    }
  }

  leaveBoard(boardId) {
    if (this.socket) {
      this.socket.emit('leave-board', boardId);
    }
  }

  emitBoardUpdate(data) {
    if (this.socket) {
      this.socket.emit('board-updated', data);
    }
  }

  emitListCreated(data) {
    if (this.socket) {
      this.socket.emit('list-created', data);
    }
  }

  emitListUpdated(data) {
    if (this.socket) {
      this.socket.emit('list-updated', data);
    }
  }

  emitListDeleted(data) {
    if (this.socket) {
      this.socket.emit('list-deleted', data);
    }
  }

  emitTaskCreated(data) {
    if (this.socket) {
      this.socket.emit('task-created', data);
    }
  }

  emitTaskUpdated(data) {
    if (this.socket) {
      this.socket.emit('task-updated', data);
    }
  }

  emitTaskMoved(data) {
    if (this.socket) {
      this.socket.emit('task-moved', data);
    }
  }

  emitTaskDeleted(data) {
    if (this.socket) {
      this.socket.emit('task-deleted', data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

const socketService = new SocketService();
export default socketService;
