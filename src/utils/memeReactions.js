/**
 * DaySync Activity Meme Reaction Engine
 * Reusable, non-repetitive Hinglish/meme reactions for successful user actions.
 */

const MEME_REACTION_DICTIONARY = {
  // Expenses & Money
  EXPENSE_ADDED: [
    "Paisa gaya, sukoon bhi gaya 😭",
    "Kharcha hi kharcha! Wallet crying in corner 📉",
    "Account balance: 'Mujhe kyun toda?' 💔",
    "Chota sa kharcha, bada sa sadma 💸"
  ],
  MONEY_RECEIVED: [
    "Oho! Paisa aaya 💸",
    "Laxmi aayi hai 🤑",
    "Bank balance stonks! 🚀",
    "Paisa hi paisa hoga 💰"
  ],
  BALANCE_ADDED: [
    "Ameer lag rahe ho aaj 🤑",
    "Account refuelled! Ready to spend 🚀",
    "Paisa load ho gaya boss 💳"
  ],
  REFUND_RECEIVED: [
    "Wapas aaya paisa! Pure magic 🪄",
    "Refund success! Party time 🎉"
  ],

  // Tasks & Productivity
  TASK_ADDED: [
    "Ek aur task list mein add 📝",
    "Kaam badhta hua, par aapan nahi darte 💪",
    "Target locked! Target set 🔥"
  ],
  TASK_COMPLETED: [
    "Boss level task defeated 🔥",
    "Task done! Time to relax ☕",
    "Ek aur task khatam, full swag 😎",
    "Productivity 1000%! 🚀"
  ],
  TASK_OVERDUE: [
    "Kal kare so aaj kar, aaj kare so ab ⏰",
    "Deadlines are closer than they appear ⚠️"
  ],

  // Plans & Subscriptions
  PLAN_ADDED: [
    "Naya plan active! Bye bye money 👋",
    "Plan locked & loaded ⚡",
    "Recharge done boss ⚡"
  ],
  PLAN_PAID: [
    "Plan renewed successfully! 💳",
    "Recharge done boss! ⚡",
    "Subscribed! No break in service 🚀"
  ],
  PLAN_EXPIRING: [
    "Plan bol raha hai: bye bye 👋",
    "Expiry date pass mein hai boss ⏳"
  ],

  // Reminders
  REMINDER_ADDED: [
    "Yaad dila diya boss! ⏰",
    "No memory loss this time 🧠"
  ],
  REMINDER_COMPLETED: [
    "Reminder clear! Bullet dodged 🎯",
    "Time pe kaam khatam 😎"
  ],

  // Splits & Shared Expenses
  SPLIT_ADDED: [
    "Naya split group ready! 🤝",
    "Hisab kitab shuru 📊"
  ],
  SPLIT_OWED: [
    "Paisa maangne ka time aaya 💸",
    "Remind them nicely before they forget 😉"
  ],
  SPLIT_SETTLED: [
    "Sab hisaab clear 😎",
    "Paisa settled! Friendships saved 🤝",
    "Hisab 100% clean & clear ✨"
  ],

  // Meetings
  MEETING_ADDED: [
    "Calendar entry set! Prepare yourself 📅",
    "Nayi meeting locked 🤝"
  ],
  MEETING_COMPLETED: [
    "Meeting survived 🫡",
    "Meeting done! Time for chai ☕",
    "Survived another meeting without muted mic drama 🎉"
  ],

  // Birthdays
  BIRTHDAY_ADDED: [
    "Birthday locked in radar 🎈",
    "Party date marked 🥳"
  ],
  BIRTHDAY_TODAY: [
    "Cake ka time 🎂",
    "Party kab de rahe ho? 🎉"
  ],

  // Luna & System
  LUNA_ACTION: [
    "Luna is on it 🤖✨",
    "Luna smart mode activated 🧠",
    "Luna AI: 'Aapka order sar aankhon par!' 🔮"
  ],

  // Settings & Profile
  THEME_CHANGED: [
    "Dark mode activated 🌙",
    "Naya look, naya swag 😎✨"
  ],
  PROFILE_UPDATED: [
    "Profile looking sharp 🔥",
    "Nayi identity unlocked 🌟"
  ]
};

const lastPickedMap = {};

export function getRandomMemeReaction(category) {
  const options = MEME_REACTION_DICTIONARY[category] || [
    "Kaam ho gaya boss! ✨",
    "Done & Dusted 😎"
  ];

  const lastPicked = lastPickedMap[category];
  const available = options.filter(msg => msg !== lastPicked);
  const pool = available.length > 0 ? available : options;
  const picked = pool[Math.floor(Math.random() * pool.length)];

  lastPickedMap[category] = picked;
  return picked;
}
