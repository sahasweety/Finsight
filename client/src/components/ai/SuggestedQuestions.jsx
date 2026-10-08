import React from 'react';

const SuggestedQuestions = ({ onSelect, disabled }) => {
  const questions = [
    "Where did I spend the most this month?",
    "Am I over budget?",
    "How much did I spend on food?",
    "What are my biggest expenses?",
    "How can I reduce my spending?",
    "How much did I save this month?"
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
      {questions.map((q, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(q)}
          disabled={disabled}
          style={{
            backgroundColor: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
            borderRadius: '16px',
            padding: '0.5rem 0.75rem',
            fontSize: '0.875rem',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            transition: 'all 0.2s'
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;
