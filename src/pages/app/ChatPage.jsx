import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, RefreshCw, AlertCircle, Sparkles, HelpCircle, Zap } from 'lucide-react';
import { PageHeaderRow } from '../../components/common/PageHeaderRow';
import { useLuna } from '../../context/LunaContext';
import { useToast } from '../../context/ToastContext';
import { ChatBubble } from '../../components/chat/ChatBubble';

export function ChatPage() {
  const { conversations, sendMessage, loading, errors } = useLuna();
  const { showToast } = useToast();
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [lastFailedMsg, setLastFailedMsg] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const quickQuestions = [
    "What tasks do I have pending?",
    "What do I have to do today?",
    "Show my recent expenses",
    "How much did I spend this month?",
    "Show my habits",
    "What goals am I working on?",
    "Show my reminders",
    "What should I focus on today?",
    "Give me a summary",
    "Show my recent memories",
    "Plan my day",
    "Review my spending"
  ];

  const quickActionTemplates = [
    "Spend ₹___ on ___",
    "Received ₹___ from ___",
    "Add task: ___ at ___",
    "Add habit: ___",
    "Create goal: ___",
    "Remind me to ___ at ___",
    "Remember: ___",
    "Postpone ___ to ___",
    "Change ___ to ___"
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, loading]);

  const navigate = useNavigate();

  const handleShortcutClick = (text) => {
    setInput(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    if (!navigator.onLine) {
      if (showToast) showToast("You're offline. Connect to the internet to chat with Luna.", 'error');
      return;
    }

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
      setInput(text);
      setLastFailedMsg(text);
    }
  };

  const handleRetryLast = async () => {
    if (!lastFailedMsg || loading) return;
    if (!navigator.onLine) {
      if (showToast) showToast("You're offline right now.", 'error');
      return;
    }

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
      setInput(text);
      setLastFailedMsg(text);
    }
  };

  const filteredConversations = conversations.filter(msg => !search || msg.message.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="page-container chat-page-layout">
      {/* Top Header Row */}
      <PageHeaderRow title="Chat with Luna AI" onSearch={setSearch} />

      {/* Categorized Horizontally Scrollable Prompt Chips Container */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '4px' }}>
        {/* Row 1: Quick Questions */}
        <div className="scroll-row" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HelpCircle size={12} color="var(--accent-primary)" /> Questions:
          </span>
          {quickQuestions.map((q, i) => (
            <button
              key={`q_${i}`}
              type="button"
              onClick={() => handleShortcutClick(q)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Row 2: Quick Action Templates */}
        <div className="scroll-row" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={12} color="var(--accent-warning)" /> Actions:
          </span>
          {quickActionTemplates.map((act, i) => (
            <button
              key={`act_${i}`}
              type="button"
              onClick={() => handleShortcutClick(act)}
              style={{
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--accent-primary)',
                background: 'var(--color-primary-soft)',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ {act}
            </button>
          ))}
        </div>
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
              <span>I'm unable to reach Luna right now. Please check your connection and try again.</span>
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
          ref={inputRef}
          type="text"
          placeholder="Message Luna AI or select a quick shortcut..."
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
