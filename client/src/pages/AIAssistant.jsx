import React from 'react';
import Navbar from '../components/Navbar';
import AIInsights from '../components/ai/AIInsights';
import ChatWindow from '../components/ai/ChatWindow';

const AIAssistant = () => {
  return (
    <div>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-heading">
          <h2>AI Assistant 🤖</h2>
          <p className="dashboard-subtitle">
            Get intelligent answers about your spending habits and financial health.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* AI Insights panel */}
          <AIInsights />

          {/* Chat panel */}
          <div>
            <h3 style={{ marginBottom: '1rem', color: '#374151' }}>💬 Chat with your finance assistant</h3>
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
