/**
 * Memory Engine & Permission System for Luna AI
 * Enforces explicit memory confirmation ("Luna noticed... Would you like me to remember this?")
 */

export function detectPotentialMemory(message) {
  const text = message.toLowerCase();

  // Check if message contains implicit preferences or routines
  if (text.includes('i usually') || text.includes('i like to') || text.includes('my goal is') || text.includes('i prefer') || text.includes('i work at')) {
    let type = 'Preferences';
    if (text.includes('usually') || text.includes('routine') || text.includes('pm') || text.includes('am')) type = 'Routine';
    if (text.includes('goal') || text.includes('want to learn') || text.includes('target')) type = 'Goals';
    if (text.includes('budget') || text.includes('spend')) type = 'Financial';

    const memorySnippet = message.replace(/^i\s+(usually|like to|prefer|want to)\s+/i, '');

    return {
      shouldPrompt: true,
      proposedMemory: {
        type,
        content: `User ${type.toLowerCase()}: ${memorySnippet}`,
        confidence: 0.89
      },
      promptText: `I noticed you mentioned "${message}". Would you like me to remember this?`
    };
  }

  return { shouldPrompt: false };
}
