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
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '900px',
      margin: '0 auto',
      padding: 'var(--space-5) var(--space-6)'
    }}>
      {/* Chat Header */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Sparkles size={15} /> Central AI Workspace
        </div>
        <h1 style={{ fontSize: 'clamp(1.3rem, 2vw, 1.6rem)', margin: '4px 0' }}>Chat with Luna AI</h1>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Ask questions, log income/expenses, track tasks, or save memory context naturally.
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-3)', justifyContent: 'center' }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            💬 "{prompt}"
          </button>
        ))}
      </div>

      {/* Message Feed Container */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '6px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {conversations.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '8px 0' }}>
            Luna is thinking & processing intent...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Message Composer */}
      <form onSubmit={handleSend} style={{
        marginTop: 'var(--space-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)'
      }}>
        <input
          type="text"
          placeholder="Message Luna AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            minHeight: '46px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '0.94rem',
            padding: '0 16px',
            outline: 'none'
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            width: '46px',
            height: '46px',
            minHeight: '46px',
            borderRadius: 'var(--radius-lg)',
            padding: 0,
            justifyContent: 'center',
            opacity: input.trim() ? 1 : 0.6
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
