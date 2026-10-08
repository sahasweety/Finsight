import React from 'react';

const ChatMessage = ({ message, isUser }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem'
    }}>
      <div style={{
        maxWidth: '80%',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: isUser ? '#3b82f6' : '#f3f4f6',
        color: isUser ? '#ffffff' : '#111827',
        borderBottomRightRadius: isUser ? '0' : '8px',
        borderBottomLeftRadius: isUser ? '8px' : '0',
        lineHeight: '1.5'
      }}>
        {message}
      </div>
    </div>
  );
};

export default ChatMessage;
