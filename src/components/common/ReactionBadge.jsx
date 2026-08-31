import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  getBalanceReaction,
  getMoneyReceivedReaction,
  getMoneySpentReaction,
  getSplitsReaction,
  getPlansReaction
} from '../../utils/reactionMessages';

export function ReactionBadge({ category, data, message, seed = 0, style = {}, className = '' }) {
  let text = message;

  if (!text && category) {
    switch (category) {
      case 'BALANCE':
        text = getBalanceReaction(data?.balance, seed);
        break;
      case 'MONEY_RECEIVED':
        text = getMoneyReceivedReaction(data?.amount, seed);
        break;
      case 'MONEY_SPENT':
        text = getMoneySpentReaction(data || {}, seed);
        break;
      case 'SPLITS':
        text = getSplitsReaction(data || {}, seed);
        break;
      case 'PLANS':
        text = getPlansReaction(data || {}, seed);
        break;
      default:
        text = null;
    }
  }

  if (!text) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '12px',
        background: 'rgba(91, 80, 230, 0.1)',
        border: '1px solid rgba(91, 80, 230, 0.25)',
        color: 'var(--accent-primary)',
        fontSize: '11px',
        fontWeight: '600',
        lineHeight: '1.2',
        ...style
      }}
      className={`daysync-reaction-badge ${className}`}
      title="DaySync Reaction"
    >
      <Sparkles size={11} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}
