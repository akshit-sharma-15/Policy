import React, { useState } from 'react';
import axios from 'axios';

function Chat({ userProfile, recommendation }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/user/chat', {
        userProfile,
        conversationHistory: messages,
        message: input
      });

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        sources: response.data.sources
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        error: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card">
      <h2>💬 Ask Questions About Your Policy</h2>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Have questions? I'm here to help explain insurance terms and how they apply to you.
      </p>

      <div style={{ 
        border: '2px solid #e0e0e0', 
        borderRadius: '8px', 
        padding: '1rem',
        minHeight: '300px',
        maxHeight: '400px',
        overflowY: 'auto',
        marginBottom: '1rem',
        background: '#fafafa'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
            <p>Start a conversation! Try asking:</p>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
              <li>• "What is a waiting period?"</li>
              <li>• "How does co-pay work for me?"</li>
              <li>• "What conditions are excluded?"</li>
              <li>• "Can you explain sub-limits?"</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                background: msg.role === 'user' ? '#667eea' : 'white',
                color: msg.role === 'user' ? 'white' : '#333',
                marginLeft: msg.role === 'user' ? '20%' : '0',
                marginRight: msg.role === 'user' ? '0' : '20%',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {msg.role === 'user' ? 'You' : '🤖 Assistant'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              {msg.sources && msg.sources.length > 0 && (
                <div style={{ 
                  marginTop: '0.5rem', 
                  fontSize: '0.85rem', 
                  color: '#666',
                  fontStyle: 'italic'
                }}>
                  Sources: {msg.sources.map(s => s.policyName).join(', ')}
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div style={{ textAlign: 'center', color: '#667eea' }}>
            Thinking...
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '2px solid #e0e0e0',
            borderRadius: '6px',
            fontSize: '1rem'
          }}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="btn-primary"
          style={{ width: 'auto', padding: '0.75rem 2rem' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
