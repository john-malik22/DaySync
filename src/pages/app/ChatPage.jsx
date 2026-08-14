import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { ChatBubble } from '../../components/chat/ChatBubble';

export function ChatPage() {
  const { conversations, sendMessage, loading } = useLuna();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const chatEndRef = useRef(null);

  const promptSuggestions = [
    "What tasks do I have pending?",
    "I spent ₹400 on food.",
    "Received ₹5000 salary today.",
    "Remember I prefer dark theme."
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

  const filteredConversations = conversations.filter(msg => !search || msg.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container" style={{
      height: 'calc(100vh - 40px)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '900px',
      margin: '0 auto'
    }}>
      {/* Top Header Row: Page Title on Left | Search on Right */}
      <PageHeaderRow title="Chat with Luna AI" onSearch={setSearch} />

      {/* Prompt Chips Row */}
      <div className="scroll-row" style={{ marginBottom: 'var(--space-sm)', flexShrink: 0 }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            [ {prompt} ]
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
        {filteredConversations.map((msg) => (
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
        gap: 'var(--space-xs)',
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
            padding: '0 14px'
          }}
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            padding: '0 20px',
            minHeight: '44px',
            opacity: input.trim() ? 1 : 0.6
          }}
        >
          <Send size={16} /> Send
        </button>
      </form>
    </div>
  );
}
