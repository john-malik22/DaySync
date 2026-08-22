import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { ChatBubble } from '../../components/chat/ChatBubble';

export function ChatPage() {
  const { conversations, sendMessage, loading, errors } = useLuna();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [lastFailedMsg, setLastFailedMsg] = useState(null);
  const chatEndRef = useRef(null);

  const promptSuggestions = [
    "What tasks do I have pending?",
    "I spent ₹400 on food.",
    "Received ₹5000 salary today.",
    "Remember I prefer dark theme."
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, loading]);

  const navigate = useNavigate();

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const text = input;
    setInput('');
    setLastFailedMsg(null);

    try {
      const res = await sendMessage(text);
      if (res?.assistantMessage?.data?.type === 'NAVIGATE' && res.assistantMessage.data.route) {
        setTimeout(() => {
          navigate(res.assistantMessage.data.route);
        }, 400);
      }
    } catch (err) {
      setLastFailedMsg(text);
    }
  };

  const handleRetryLast = async () => {
    if (!lastFailedMsg || loading) return;
    const text = lastFailedMsg;
    setLastFailedMsg(null);
    try {
      const res = await sendMessage(text);
      if (res?.assistantMessage?.data?.type === 'NAVIGATE' && res.assistantMessage.data.route) {
        setTimeout(() => {
          navigate(res.assistantMessage.data.route);
        }, 400);
      }
    } catch (err) {
      setLastFailedMsg(text);
    }
  };

  const filteredConversations = conversations.filter(msg => !search || msg.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container chat-page-layout">
      {/* Top Header Row */}
      <PageHeaderRow title="Chat with Luna AI" onSearch={setSearch} />

      {/* Prompt Chips Row */}
      <div className="scroll-row" style={{ flexShrink: 0, paddingBottom: '4px' }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => {
              setInput(prompt);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            💬 {prompt}
          </button>
        ))}
      </div>

      {/* Independent Scrollable Conversation Feed */}
      <div className="chat-conversation-feed">
        {filteredConversations.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}

        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic', margin: '8px 0' }}>
            Luna is thinking & processing intent...
          </div>
        )}

        {/* Failed Chat Request Retry Banner */}
        {lastFailedMsg && (
          <div
            role="alert"
            style={{
              margin: '12px 0',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-highlight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              color: 'var(--text-primary)',
              fontSize: '0.85rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} color="var(--color-pink)" />
              <span>Sorry, I couldn't process that right now. Please try again.</span>
            </div>
            <button
              type="button"
              onClick={handleRetryLast}
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.78rem', minHeight: '32px' }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Sticky Bottom Message Composer Bar */}
      <form onSubmit={handleSend} className="chat-composer-bar">
        <input
          type="text"
          placeholder="Message Luna AI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            flex: 1,
            minHeight: '42px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
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
            padding: '0 18px',
            minHeight: '42px',
            opacity: input.trim() ? 1 : 0.6,
            flexShrink: 0
          }}
        >
          <Send size={16} /> Send
        </button>
      </form>
    </div>
  );
}
