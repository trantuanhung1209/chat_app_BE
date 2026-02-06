
import { initializeChatSocket } from './chatSocket.js';

export const initializeSocketHandlers = (io) => {
    initializeChatSocket(io);
};