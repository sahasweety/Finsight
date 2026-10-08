import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import { fetchApi } from '../../utils/api';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMsg = { id: Date.now(), text, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetchApi('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text }),
      });

      if (response.success) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: response.reply, isUser: false },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), text: response.message || 'Something went wrong.', isUser: false, isError: true },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), text: 'Sorry, I couldn\'t process that request right now. Please try again.', isUser: false, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card chat-container" style={{ display: 'flex', flexDirection: 'column', height: '600px', padding: '1.5rem' }}>
      
      {messages.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
          <h3 style={{ marginBottom: '1rem', color: '#111827' }}>How can I help you today?</h3>
          <SuggestedQuestions onSelect={handleSendMessage} disabled={loading} />
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column' }}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg.text} isUser={msg.isUser} />
          ))}
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ backgroundColor: '#f3f4f6', padding: '0.75rem 1rem', borderRadius: '8px', color: '#6b7280' }}>
                Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {messages.length > 0 && (
        <div style={{ marginTop: 'auto' }}>
          <SuggestedQuestions onSelect={handleSendMessage} disabled={loading} />
        </div>
      )}

      <ChatInput onSend={handleSendMessage} disabled={loading} />
    </div>
  );
};

export default ChatWindow;
