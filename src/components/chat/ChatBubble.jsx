import React from 'react';
import { Sparkles, User, Brain, Check, X } from 'lucide-react';
import { useLuna } from '../../context/LunaContext';

export function ChatBubble({ msg }) {
  const { addMemory } = useLuna();
  const isAssistant = msg.role === 'assistant';

  const handleRememberConsent = (memoryData) => {
    addMemory({
      type: memoryData.proposedMemory.type,
      content: memoryData.proposedMemory.content,
      confidence: memoryData.proposedMemory.confidence,
      approved: true
    });
    alert('Saved memory to your Memory Center!');
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      gap: '12px',
      marginBottom: '16px',
      flexDirection: isAssistant ? 'row' : 'row-reverse'
    }}>
      {/* Avatar Icon */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: 'var(--radius-md)',
        background: isAssistant ? 'var(--accent-gradient)' : 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: isAssistant ? 'var(--shadow-glow)' : 'none',
        border: isAssistant ? 'none' : '1px solid var(--border-color)'
      }}>
        {isAssistant ? <Sparkles size={18} color="#fff" /> : <User size={18} color="var(--accent-primary)" />}
      </div>

      {/* Bubble Content Container */}
      <div style={{
        maxWidth: '82%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAssistant ? 'flex-start' : 'flex-end'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>{isAssistant ? 'Luna AI' : 'You'}</span>
          {msg.intent && isAssistant && (
            <span style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontSize: '0.68rem',
              fontWeight: '600'
            }}>
              Intent: {msg.intent}
            </span>
          )}
        </div>

        <div className="glass-card" style={{
          padding: '12px 16px',
          borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
          background: isAssistant ? 'var(--bg-card)' : 'var(--accent-primary)',
          color: isAssistant ? 'var(--text-primary)' : '#ffffff',
          fontSize: '0.92rem',
          lineHeight: '1.5',
          wordBreak: 'break-word'
        }}>
          {msg.message}

          {/* Tool Receipts / Data Output */}
          {msg.data && (
            <div style={{
              marginTop: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem'
            }}>
              {msg.data.type === 'EXPENSE_ADDED' && (
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong style={{ color: 'var(--accent-success)' }}>✓ Expense Logged:</strong> ₹{msg.data.expense.amount} ({msg.data.expense.category})
                </div>
              )}
              {msg.data.type === 'TASK_CREATED' && (
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong style={{ color: 'var(--accent-primary)' }}>✓ Task Scheduled:</strong> {msg.data.task.title} (Priority: {msg.data.task.priority})
                </div>
              )}
              {msg.data.type === 'MEMORY_SAVED' && (
                <div style={{ color: 'var(--text-primary)' }}>
                  <strong style={{ color: 'var(--accent-secondary)' }}>✓ Saved Fact:</strong> {msg.data.memory.content}
                </div>
              )}
            </div>
          )}

          {/* Memory Permission System Prompt */}
          {msg.memoryPrompt && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid var(--accent-secondary)',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: 'var(--accent-secondary)', marginBottom: '4px' }}>
                <Brain size={15} /> Memory Confirmation Requested
              </div>
              <p style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>
                {msg.memoryPrompt.promptText}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleRememberConsent(msg.memoryPrompt)}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px' }}
                >
                  <Check size={14} /> Remember
                </button>
                <button
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '34px' }}
                >
                  <X size={14} /> Not Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
