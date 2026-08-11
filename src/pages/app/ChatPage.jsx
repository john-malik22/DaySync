import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Sparkles, CornerDownLeft } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { voice } from '../../services/voice';

export function ChatPage() {
  const { conversations, sendMessage, loading } = useLuna();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const chatEndRef = useRef(null);

  const promptSuggestions = [
    "What should I do today?",
    "I spent ₹400 on food.",
    "Remember I have class at 10 tomorrow.",
    "Why am I spending so much this month?",
    "Plan my evening."
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

  const handleVoiceListen = () => {
    if (!voice.isSupported()) {
      alert('Speech recognition is not supported in this browser environment.');
      return;
    }
    setIsListening(true);
    voice.listen(
      (transcript) => {
        setIsListening(false);
        sendMessage(transcript, true);
      },
      (err) => {
        setIsListening(false);
        console.error('Voice error:', err);
      }
    );
  };

  return (
    <div style={{
      height: 'calc(100vh - 64px)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '900px',
      margin: '0 auto',
      padding: '20px 24px'
    }}>
      {/* Header Title */}
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontWeight: '700', fontSize: '0.85rem' }}>
          <Sparkles size={16} /> CENTRAL INTERFACE
        </div>
        <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>Talk to Luna</h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
          Luna detects your intent and connects your memories, routines, expenses, and tasks automatically.
        </p>
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '12px'
      }}>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => sendMessage(prompt)}
            style={{
              padding: '6px 14px', borderRadius: '99px', border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
              fontSize: '0.82rem', whiteSpace: 'nowrap', cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            💬 "{prompt}"
          </button>
        ))}
      </div>

      {/* Message Feed */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingRight: '8px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {conversations.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: '8px 0' }}>
            Luna is thinking & classifying intent...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box Bar */}
      <form onSubmit={handleSend} style={{
        marginTop: '16px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-glow)',
          borderRadius: '16px',
          padding: '4px 16px',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <input
            type="text"
            placeholder={isListening ? "Listening..." : "Ask Luna anything..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: '0.96rem',
              outline: 'none'
            }}
          />

          <button
            type="button"
            onClick={handleVoiceListen}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
              color: isListening ? 'var(--accent-danger)' : 'var(--text-muted)'
            }}
            title="Speak to Luna"
          >
            <Mic size={20} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '16px',
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
