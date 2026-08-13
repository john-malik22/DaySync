import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { ChatBubble } from '../../components/chat/ChatBubble';

export function ChatPage() {
  const { conversations, sendMessage, loading } = useLuna();
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const promptSuggestions = [
    "What tasks do I have pending?",
    "I spent ₹400 on food.",
    "Received ₹5000 salary today.",
    "Remember I prefer dark theme.",
    "Show my financial summary."
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <div className="page-container" style={{
      height: 'calc(100vh - 60px)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Page Header */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={14} /> Central AI Workspace
        </div>
        <h1>Chat with Luna AI</h1>
        <p>Log transactions, manage tasks, or save memory context naturally.</p>
      </div>

      {/* Prompt Chips - Controlled Horizontal Scroll ONLY */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-sm)', flexShrink: 0 }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background-color 0.15s ease'
            }}
          >
            💬 "{prompt}"
          </button>
        ))}
      </div>

      {/* Conversation Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '4px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {conversations.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', margin: '8px 0' }}>
            Luna is thinking & processing intent...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} style={{
        marginTop: 'var(--space-sm)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        width: '100%',
        flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="Message Luna AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            minHeight: '44px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '14px',
            padding: '0 14px',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            width: '44px',
            height: '44px',
            minHeight: '44px',
            borderRadius: 'var(--radius-md)',
            padding: 0,
            justifyContent: 'center',
            flexShrink: 0,
            opacity: input.trim() ? 1 : 0.6
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
