import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_EVENTS } from '../config/constants';
import type {
  NewMessageEvent,
  MessageUpdatedEvent,
  MessageDeletedEvent,
  MessagePinnedEvent,
  MessageUnpinnedEvent,
  TypingEvent,
  OnlineStatusEvent,
  ReactionEvent,
  ReadReceiptEvent,
} from '../types';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      withCredentials: true, // Send cookies with socket connection
      transports: ['websocket', 'polling'],
    });

    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      this.socket?.emit(SOCKET_EVENTS.JOIN_CONVERSATIONS);
    });

    this.socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Socket disconnected');
    });

    this.socket.on(SOCKET_EVENTS.ERROR, (error: unknown) => {
      console.error('Socket error:', error);
    });

    // Re-register all listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        this.socket?.on(event, callback);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event listeners
  on(event: string, callback: (...args: unknown[]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (callback) {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
      this.socket?.off(event, callback);
    } else {
      this.listeners.delete(event);
      this.socket?.off(event);
    }
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }

  // Typing events
  sendTyping(conversationId: string): void {
    this.emit(SOCKET_EVENTS.TYPING, { conversationId });
  }

  sendStopTyping(conversationId: string): void {
    this.emit(SOCKET_EVENTS.STOP_TYPING, { conversationId });
  }

  // Chat event listeners
  onNewMessage(callback: (data: NewMessageEvent) => void): void {
    this.on(SOCKET_EVENTS.NEW_MESSAGE, (data: unknown) => callback(data as NewMessageEvent));
  }

  onMessageUpdated(callback: (data: MessageUpdatedEvent) => void): void {
    this.on(SOCKET_EVENTS.MESSAGE_UPDATED, (data: unknown) => callback(data as MessageUpdatedEvent));
  }

  onMessageDeleted(callback: (data: MessageDeletedEvent) => void): void {
    this.on(SOCKET_EVENTS.MESSAGE_DELETED, (data: unknown) => callback(data as MessageDeletedEvent));
  }

  onMessagePinned(callback: (data: MessagePinnedEvent) => void): void {
    this.on(SOCKET_EVENTS.MESSAGE_PINNED, (data: unknown) => callback(data as MessagePinnedEvent));
  }

  onMessageUnpinned(callback: (data: MessageUnpinnedEvent) => void): void {
    this.on(SOCKET_EVENTS.MESSAGE_UNPINNED, (data: unknown) => callback(data as MessageUnpinnedEvent));
  }

  onUserTyping(callback: (data: TypingEvent) => void): void {
    this.on(SOCKET_EVENTS.USER_TYPING, (data: unknown) => callback(data as TypingEvent));
  }

  onUserStopTyping(callback: (data: TypingEvent) => void): void {
    this.on(SOCKET_EVENTS.USER_STOP_TYPING, (data: unknown) => callback(data as TypingEvent));
  }

  onUserOnline(callback: (data: OnlineStatusEvent) => void): void {
    this.on(SOCKET_EVENTS.USER_ONLINE, (data: unknown) => callback(data as OnlineStatusEvent));
  }

  onUserOffline(callback: (data: OnlineStatusEvent) => void): void {
    this.on(SOCKET_EVENTS.USER_OFFLINE, (data: unknown) => callback(data as OnlineStatusEvent));
  }

  onReactionAdded(callback: (data: ReactionEvent) => void): void {
    this.on(SOCKET_EVENTS.REACTION_ADDED, (data: unknown) => callback(data as ReactionEvent));
  }

  onReactionRemoved(callback: (data: ReactionEvent) => void): void {
    this.on(SOCKET_EVENTS.REACTION_REMOVED, (data: unknown) => callback(data as ReactionEvent));
  }

  onMessageRead(callback: (data: ReadReceiptEvent) => void): void {
    this.on(SOCKET_EVENTS.MESSAGE_READ, (data: unknown) => callback(data as ReadReceiptEvent));
  }
}

export default new SocketService();
