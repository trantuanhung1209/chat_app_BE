export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  GET_ME: '/auth/me',
  GOOGLE_AUTH: '/auth/google',
  
  // User
  ME: '/users/me',
  USERS: '/users',
  SEARCH_USERS: '/users/search',
  
  // Friends
  FRIENDS: '/friends',
  // FRIEND_REQUESTS: '/friends/requests', // Deprecated - API không tồn tại
  FRIEND_REQUESTS_INCOMING: '/friends/requests/incoming',
  FRIEND_REQUESTS_OUTGOING: '/friends/requests/outgoing',
  SEND_REQUEST: '/friends/request',
  ACCEPT_REQUEST: '/friends/accept',
  REJECT_REQUEST: '/friends/reject',
  REMOVE_FRIEND: '/friends/unfriend',
  
  // Chat
  CONVERSATIONS: '/chat/conversations',
  CONVERSATION_BY_ID: '/chat/conversations/:id',
  MESSAGES: '/chat/conversations/:conversationId/messages',
  SEND_MESSAGE: '/chat/conversations/:conversationId/messages',
  EDIT_MESSAGE: '/chat/messages/:messageId',
  DELETE_MESSAGE: '/chat/messages/:messageId',
  ADD_REACTION: '/chat/messages/:messageId/reactions',
  REMOVE_REACTION: '/chat/messages/:messageId/reactions/:reactionId',
  MARK_AS_READ: '/chat/messages/:messageId/read',
  MARK_CONVERSATION_AS_READ: '/chat/conversations/:conversationId/read',
  SEARCH_MESSAGES: '/chat/search/messages',
  PIN_MESSAGE: '/chat/messages/:messageId/pin',
  UNPIN_MESSAGE: '/chat/messages/:messageId/pin',
  GET_PINNED_MESSAGES: '/chat/conversations/:conversationId/pinned-messages',
} as const;

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  
  // User status
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  
  // Chat
  JOIN_CONVERSATIONS: 'chat:join_conversations',
  CONVERSATIONS_JOINED: 'chat:conversations_joined',
  NEW_MESSAGE: 'chat:new_message',
  MESSAGE_UPDATED: 'chat:message_updated',
  MESSAGE_DELETED: 'chat:message_deleted',
  MESSAGE_PINNED: 'chat:message_pinned',
  MESSAGE_UNPINNED: 'chat:message_unpinned',
  TYPING: 'chat:typing',
  STOP_TYPING: 'chat:stop_typing',
  USER_TYPING: 'chat:user_typing',
  USER_STOP_TYPING: 'chat:user_stop_typing',
  
  // Reactions
  REACTION_ADDED: 'chat:reaction_added',
  REACTION_REMOVED: 'chat:reaction_removed',
  
  // Read receipts
  MESSAGE_READ: 'chat:message_read',
  
  // Errors
  ERROR: 'chat:error',
} as const;
