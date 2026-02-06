// User Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  role?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Message Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM';
  replyToId?: string | null;
  attachments?: Array<{
    filename: string;
    url: string;
    fileType: string;
    fileSize: number;
  }>;
  isEdited: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  sender: User;
  reactions?: Reaction[];
  readBy?: ReadReceipt[];
}

// Reaction Types
export interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  reactionType: string;
  createdAt: string;
  user: User;
}

// Read Receipt Types
export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
  user: User;
}

// Friend Types
export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend: User;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
  sender: User;
  receiver: User;
}

// Conversation Types
export interface Conversation {
  id: string;
  name?: string | null;
  type?: 'direct' | 'group';
  isGroup?: boolean;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  participants: Participant[];
  lastMessage?: Message;
  messages?: Message[];
  unreadCount?: number;
  _count?: { messages: number };
}

// Participant Types
export interface Participant {
  id: string;
  conversationId: string;
  userId: string;
  role?: 'admin' | 'member' | 'ADMIN' | 'MEMBER';
  joinedAt: string;
  leftAt?: string | null;
  lastReadAt?: string | null;
  user: User;
}

// Socket Events Types
export interface TypingEvent {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: Date;
}

export interface OnlineStatusEvent {
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface NewMessageEvent {
  message: Message;
  conversationId: string;
}

export interface MessageUpdatedEvent {
  message: Message;
}

export interface MessageDeletedEvent {
  messageId: string;
  conversationId: string;
}

export interface ReactionEvent {
  reaction: Reaction;
  messageId: string;
}

export interface ReadReceiptEvent {
  readReceipt: ReadReceipt;
  messageId: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
