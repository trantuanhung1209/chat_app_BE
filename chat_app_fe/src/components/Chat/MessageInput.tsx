import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';

const MessageInput: React.FC = () => {
  const { activeConversation, sendMessage, sendTyping, sendStopTyping, replyToMessage, setReplyToMessage } = useChat();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (!activeConversation) return;

    // Send typing event
    if (!isTypingRef.current && e.target.value.length > 0) {
      isTypingRef.current = true;
      sendTyping(activeConversation.id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        sendStopTyping(activeConversation.id);
      }
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !activeConversation || isSending) return;

    const messageToSend = message.trim();
    setMessage('');
    setIsSending(true);

    // Stop typing indicator
    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendStopTyping(activeConversation.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      await sendMessage(messageToSend, activeConversation.id, replyToMessage?.id);
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!activeConversation) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {/* Reply Preview */}
      {replyToMessage && (
        <div className="px-4 pt-3 pb-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  Phản hồi {replyToMessage.sender.fullName}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {replyToMessage.content}
              </p>
            </div>
            <button
              onClick={() => setReplyToMessage(null)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-full resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              style={{
                minHeight: '40px',
                maxHeight: '120px',
              }}
              disabled={isSending}
            />
          </div>

          <button
            type="submit"
            disabled={!message.trim() || isSending}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              message.trim() && !isSending
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Gửi'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
