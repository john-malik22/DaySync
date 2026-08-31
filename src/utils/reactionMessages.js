/**
 * DAYSYNC V2 — REUSABLE CONTEXTUAL FUNNY REACTION MESSAGES SYSTEM
 * Situation-based Hinglish/meme reaction messages generated from real DaySync data.
 */

export const REACTION_DICTIONARY = {
  BALANCE: {
    negative: [
      "Haye ye garibi 😭",
      "Bhai balance minus mein chala gaya 💀",
      "Paisa gaya, sukoon bhi gaya 😭"
    ],
    very_low: [
      "Bas itna hi paisa bacha hai 🥲",
      "Wallet ki halat serious hai 💀",
      "Month abhi baaki hai bhai 😭"
    ],
    healthy: [
      "Sab control mein hai 😎",
      "Budget zinda hai, tension nahi.",
      "Financial scene sorted ✨"
    ],
    high: [
      "Paisa hi paisa 💰",
      "Aaj toh account nawab hai 👑",
      "Ameer vibes detected 💸"
    ]
  },
  MONEY_RECEIVED: {
    normal: [
      "Oho! Paisa aaya 😎",
      "Incoming! 💸",
      "Thoda thoda karke empire banega."
    ],
    large: [
      "Paisa barsa hai boss 💰",
      "Aaj toh account full khush hai 😂",
      "Cash entry 🔥"
    ]
  },
  MONEY_SPENT: {
    small: [
      "Chalta hai 😌",
      "Itna toh banta hai."
    ],
    medium: [
      "Bhai, paisa gaya 👀",
      "Ek aur kharcha register ho gaya."
    ],
    large: [
      "Areee bhai itna bada kharcha 😭",
      "Wallet ko ICU bhejna padega 💀",
      "Paisa gaya on a world tour 😂"
    ],
    many: [
      "Aaj kharcha kuch zyada hi energetic hai 💀"
    ],
    no_spending: [
      "Aaj toh paisa bach raha hai 😎"
    ]
  },
  SPLITS: {
    user_owes_normal: [
      "Bhai udhaar ka reminder aa gaya 😭",
      "Paisa dena hai boss 😂",
      "Karz ka chapter abhi baaki hai."
    ],
    user_owes_large: [
      "Ye split nahi, loan ban gaya 💀",
      "Wallet already stressed hai 😭"
    ],
    owed_to_user_normal: [
      "Paisa wapas aana baaki hai 👀",
      "Apne paise lene ka time aa gaya 💰",
      "Udhar diya tha, charity nahi 😭"
    ],
    owed_to_user_large: [
      "Bhai paisa kaafi serious amount hai 💰",
      "Recovery department activate karo 😂"
    ],
    everything_settled: [
      "Sab hisaab clear 😎",
      "Split khatam, dosti safe 😂",
      "No udhaar, no tension ✨"
    ]
  },
  PLANS: {
    payment_coming_soon: [
      "Kal paisa katega 👀",
      "Ek aur auto-debit ki taiyaari 😭",
      "Payment date aa rahi hai boss."
    ],
    payment_today: [
      "Aaj paisa jaane wala hai 💸",
      "Auto-debit incoming 💀",
      "Aaj account halka hoga."
    ],
    payment_completed: [
      "Paisa gaya, service milti rahe 😌",
      "Subscription ne apna hissa le liya 😂"
    ],
    plan_expiring_soon: [
      "Plan bol raha hai: bye bye 👋",
      "Renew karna hai ya alvida bolna hai? 😂"
    ],
    plan_expired: [
      "Bhai plan toh chala gaya 💀",
      "Subscription ne retirement le li 😂"
    ],
    too_many_plans: [
      "Kitne subscriptions hain bhai? 😭",
      "Paisa plans mein hi ja raha hai 😂"
    ],
    expensive_plan: [
      "Ye plan wallet ko personally attack kar raha hai 💀",
      "Premium hai bhai, bill bhi premium 😂"
    ]
  }
};

/**
 * Helper to pick a reaction message given an array and an optional seed for consistent rendering.
 */
export function pickReaction(list, seed) {
  if (!list || list.length === 0) return null;
  if (seed !== undefined && seed !== null) {
    const idx = Math.abs(Number(seed)) % list.length;
    return list[idx];
  }
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Evaluate BALANCE situation
 */
export function getBalanceReaction(balance, seed = 0) {
  if (balance === undefined || balance === null || isNaN(balance)) return null;
  const num = Number(balance);
  if (num < 0) return pickReaction(REACTION_DICTIONARY.BALANCE.negative, seed);
  if (num < 500) return pickReaction(REACTION_DICTIONARY.BALANCE.very_low, seed);
  if (num > 20000) return pickReaction(REACTION_DICTIONARY.BALANCE.high, seed);
  return pickReaction(REACTION_DICTIONARY.BALANCE.healthy, seed);
}

/**
 * Evaluate MONEY RECEIVED situation
 */
export function getMoneyReceivedReaction(amount, seed = 0) {
  if (!amount || isNaN(amount) || Number(amount) <= 0) return null;
  const num = Number(amount);
  if (num >= 5000) return pickReaction(REACTION_DICTIONARY.MONEY_RECEIVED.large, seed);
  return pickReaction(REACTION_DICTIONARY.MONEY_RECEIVED.normal, seed);
}

/**
 * Evaluate MONEY SPENT situation
 */
export function getMoneySpentReaction({ amount, dailyCount = 1, isNoSpending = false }, seed = 0) {
  if (isNoSpending) return pickReaction(REACTION_DICTIONARY.MONEY_SPENT.no_spending, seed);
  if (dailyCount >= 5) return pickReaction(REACTION_DICTIONARY.MONEY_SPENT.many, seed);
  
  if (!amount || isNaN(amount)) return null;
  const num = Number(amount);
  if (num < 200) return pickReaction(REACTION_DICTIONARY.MONEY_SPENT.small, seed);
  if (num < 2000) return pickReaction(REACTION_DICTIONARY.MONEY_SPENT.medium, seed);
  return pickReaction(REACTION_DICTIONARY.MONEY_SPENT.large, seed);
}

/**
 * Evaluate SPLITS situation
 */
export function getSplitsReaction({ netAmount, isSettled = false }, seed = 0) {
  if (isSettled || netAmount === 0) return pickReaction(REACTION_DICTIONARY.SPLITS.everything_settled, seed);
  if (netAmount === undefined || netAmount === null || isNaN(netAmount)) return null;
  
  const num = Number(netAmount);
  if (num < 0) {
    // User owes money
    if (Math.abs(num) > 1000) return pickReaction(REACTION_DICTIONARY.SPLITS.user_owes_large, seed);
    return pickReaction(REACTION_DICTIONARY.SPLITS.user_owes_normal, seed);
  } else {
    // Someone owes user
    if (num > 1000) return pickReaction(REACTION_DICTIONARY.SPLITS.owed_to_user_large, seed);
    return pickReaction(REACTION_DICTIONARY.SPLITS.owed_to_user_normal, seed);
  }
}

/**
 * Evaluate PLANS / SUBSCRIPTIONS situation
 */
export function getPlansReaction({ daysRemaining, isExpired, activePlansCount, planAmount }, seed = 0) {
  if (planAmount && Number(planAmount) >= 999) {
    return pickReaction(REACTION_DICTIONARY.PLANS.expensive_plan, seed);
  }
  if (activePlansCount && activePlansCount >= 5) {
    return pickReaction(REACTION_DICTIONARY.PLANS.too_many_plans, seed);
  }
  if (isExpired || (daysRemaining !== undefined && daysRemaining < 0)) {
    return pickReaction(REACTION_DICTIONARY.PLANS.plan_expired, seed);
  }
  if (daysRemaining === 0) {
    return pickReaction(REACTION_DICTIONARY.PLANS.payment_today, seed);
  }
  if (daysRemaining === 1) {
    return pickReaction(REACTION_DICTIONARY.PLANS.payment_coming_soon, seed);
  }
  if (daysRemaining !== undefined && daysRemaining <= 3 && daysRemaining > 0) {
    return pickReaction(REACTION_DICTIONARY.PLANS.plan_expiring_soon, seed);
  }
  return null;
}
