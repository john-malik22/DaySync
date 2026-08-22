/**
 * Upgraded Intent Engine for Luna AI in DaySync
 * Multi-layer NLP Pipeline: Normalize -> Detect Intent -> Extract Entities -> Score Confidence
 */

export function normalizeInput(text) {
  if (!text) return '';
  let str = text.trim();
  let lower = str.toLowerCase();

  // 1. Common contractions, abbreviations & typos
  lower = lower
    .replace(/\btmrw\b/g, 'tomorrow')
    .replace(/\btom\b/g, 'tomorrow')
    .replace(/\btdy\b/g, 'today')
    .replace(/\btonite\b/g, 'tonight')
    .replace(/\beve\b/g, 'evening')
    .replace(/\bmorn\b/g, 'morning')
    .replace(/\bspnd\b/g, 'spend')
    .replace(/\bspnding\b/g, 'spending')
    .replace(/\bfr\b/g, 'for')
    .replace(/\bdiner\b/g, 'dinner')
    .replace(/\blunck\b/g, 'lunch')
    .replace(/\bremnd\b/g, 'remind')
    .replace(/\bchg\b/g, 'change')
    .replace(/\bdel\b/g, 'delete')
    .replace(/\brm\b/g, 'remove')
    .replace(/\bpls\b/g, '')
    .replace(/\bplz\b/g, '');

  // 2. Hinglish / Mixed Hindi-English normalization
  lower = lower
    .replace(/\bpadhna\b/g, 'study')
    .replace(/\bpadhai\b/g, 'study')
    .replace(/\bkharch\b/g, 'spent')
    .replace(/\bkharcha\b/g, 'expense')
    .replace(/\bkharch kiye\b/g, 'spent')
    .replace(/\bdiye\b/g, 'gave')
    .replace(/\bbheje\b/g, 'sent')
    .replace(/\bmile\b/g, 'received')
    .replace(/\bkal\b/g, 'tomorrow')
    .replace(/\baaj\b/g, 'today')
    .replace(/\bbaje\b/g, "o'clock")
    .replace(/\bkarna hai\b/g, 'do')
    .replace(/\bkar do\b/g, 'complete');

  // 3. Format numbers: 2k -> 2000, 2.5k -> 2500, 10k -> 10000
  lower = lower.replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (_, p1) => {
    return String(Math.round(parseFloat(p1) * 1000));
  });

  // 4. Word number conversion
  const wordNumbers = {
    'one thousand': '1000',
    'two thousand': '2000',
    'three thousand': '3000',
    'five thousand': '5000',
    'ten thousand': '10000',
    'one hundred': '100',
    'two hundred': '200',
    'three hundred': '300',
    'four hundred': '400',
    'five hundred': '500',
    'six hundred': '600',
    'seven hundred': '700',
    'eight hundred': '800',
    'nine hundred': '900'
  };

  for (const [word, numStr] of Object.entries(wordNumbers)) {
    if (lower.includes(word)) {
      lower = lower.replace(new RegExp(word, 'g'), numStr);
    }
  }

  return lower;
}

export function parseNumberAndCurrency(text) {
  // Matches 500, ₹500, rs 500, 500 rupees, etc.
  const numRegex = /(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:rupees|rs|inr|bucks)?/i;
  const match = text.match(numRegex);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val)) return val;
  }
  return null;
}

export function parseDateTime(text) {
  const lower = text.toLowerCase();
  let dueDate = new Date().toISOString().split('T')[0];
  let timeBlock = '19:00 - 20:00';
  let isExplicitDate = false;
  let isExplicitTime = false;

  // Date parsing
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date(Date.now() + 86400000);
    dueDate = tomorrow.toISOString().split('T')[0];
    isExplicitDate = true;
  } else if (lower.includes('yesterday')) {
    const yesterday = new Date(Date.now() - 86400000);
    dueDate = yesterday.toISOString().split('T')[0];
    isExplicitDate = true;
  } else if (lower.includes('today')) {
    dueDate = new Date().toISOString().split('T')[0];
    isExplicitDate = true;
  }

  // Time parsing (e.g., at 7, at 7 pm, 7:00, 8 pm, 7 o'clock, 7 baje)
  const timeMatch = lower.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|o'clock)?/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : '';

    if (meridian === 'pm' && hour < 12) hour += 12;
    else if (meridian === 'am' && hour === 12) hour = 0;
    else if (!meridian && hour >= 1 && hour <= 11) {
      if (lower.includes('morning') || lower.includes('am')) {
        // AM
      } else {
        hour += 12;
      }
    }

    const startFormatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const endFormatted = `${String((hour + 1) % 24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    timeBlock = `${startFormatted} - ${endFormatted}`;
    isExplicitTime = true;
  }

  return { dueDate, timeBlock, isExplicitDate, isExplicitTime };
}

export function detectExpenseCategory(text) {
  const lower = text.toLowerCase();
  if (/recharge|dth|mobile plan|jio|airtel|vi\b/i.test(lower)) return 'Recharges';
  if (/electricity|power bill|light bill|utility|water bill/i.test(lower)) return 'Electricity Bill';
  if (/travel|travelling|cab|uber|ola|bus|train|metro|auto|fuel|petrol|diesel|commute/i.test(lower)) return 'Daily Travelling';
  if (/subscription|netflix|spotify|youtube|prime|cloud|software|membership/i.test(lower)) return 'Subscriptions';
  if (/grocery|groceries|supermarket|vegetables|milk|fruits/i.test(lower)) return 'Groceries';
  if (/food|lunch|dinner|breakfast|snack|coffee|cafe|restaurant|eat/i.test(lower)) return 'Food';
  if (/shop|buy|bought|clothes|book|amazon|flipkart|gadget/i.test(lower)) return 'Shopping';
  if (/doctor|medicine|hospital|clinic|health|pharmacy/i.test(lower)) return 'Healthcare';
  if (/movie|cinema|game|ticket|event|show/i.test(lower)) return 'Entertainment';
  return 'Other';
}

export function classifyIntent(message, context = {}) {
  const normalized = normalizeInput(message);
  const lower = normalized.toLowerCase().trim();

  // 0. Handle pending clarification follow-ups
  if (context.pendingClarification) {
    const pending = context.pendingClarification;

    // Financial ambiguity follow-up (expense vs income)
    if (pending.intent === 'AMBIGUOUS_FINANCIAL') {
      if (lower.includes('expense') || lower.includes('spend') || lower.includes('kharch')) {
        return {
          intent: 'CREATE_EXPENSE',
          confidence: 0.95,
          entities: {
            type: 'expense',
            amount: pending.entities.amount,
            category: 'Other',
            description: 'Expense'
          }
        };
      } else if (lower.includes('income') || lower.includes('received') || lower.includes('got') || lower.includes('earn')) {
        return {
          intent: 'CREATE_INCOME',
          confidence: 0.95,
          entities: {
            type: 'income',
            amount: pending.entities.amount,
            category: 'Other Income',
            description: 'Income'
          }
        };
      }
    }

    // Task title missing follow-up ("remind me tomorrow" -> "what task?" -> "study java" or "7")
    if (pending.intent === 'INCOMPLETE_TASK' || pending.intent === 'CREATE_TASK') {
      const dateTime = parseDateTime(message);
      const title = pending.entities.title || (dateTime.isExplicitTime || dateTime.isExplicitDate ? 'Task' : message.trim());
      return {
        intent: 'CREATE_TASK',
        confidence: 0.95,
        entities: {
          title,
          priority: 'Medium',
          dueDate: pending.entities.dueDate || dateTime.dueDate,
          timeBlock: dateTime.isExplicitTime ? dateTime.timeBlock : (pending.entities.timeBlock || dateTime.timeBlock),
          category: 'Personal'
        }
      };
    }
  }

  // 1. Navigation Intents
  if (/open|go to|take me to|show page/i.test(lower)) {
    if (lower.includes('expense')) return { intent: 'OPEN_EXPENSES', confidence: 0.98, entities: { route: '/app/expenses' } };
    if (lower.includes('task') || lower.includes('todo')) return { intent: 'OPEN_TASKS', confidence: 0.98, entities: { route: '/app/task' } };
    if (lower.includes('habit')) return { intent: 'OPEN_HABITS', confidence: 0.98, entities: { route: '/app/habits' } };
    if (lower.includes('memory') || lower.includes('memories')) return { intent: 'OPEN_MEMORIES', confidence: 0.98, entities: { route: '/app/memories' } };
    if (lower.includes('summary')) return { intent: 'OPEN_SUMMARY', confidence: 0.98, entities: { route: '/app/summary' } };
    if (lower.includes('setting')) return { intent: 'OPEN_SETTINGS', confidence: 0.98, entities: { route: '/app/settings' } };
    if (lower.includes('dashboard')) return { intent: 'OPEN_DASHBOARD', confidence: 0.98, entities: { route: '/app/dashboard' } };
    if (lower.includes('chat')) return { intent: 'OPEN_CHAT', confidence: 0.98, entities: { route: '/app/chat' } };
  }

  // 2. Relative Contextual Update Intents ("make it 650", "actually make it 700", "change the Java task to 8")
  if (/^make it\b|^actually make it\b|^change it to\b/i.test(lower)) {
    const amount = parseNumberAndCurrency(lower);
    if (amount !== null && context.lastExpense) {
      return {
        intent: 'UPDATE_EXPENSE',
        confidence: 0.92,
        entities: {
          expenseId: context.lastExpense.id,
          amount
        }
      };
    }
  }

  if (lower.includes('change') && (lower.includes('task') || context.lastTask)) {
    const dateTime = parseDateTime(lower);
    let titleMatch = lower.replace(/change (the )?/i, '').split(/task|to/i)[0]?.trim();
    return {
      intent: 'UPDATE_TASK',
      confidence: 0.90,
      entities: {
        query: titleMatch || 'task',
        timeBlock: dateTime.timeBlock,
        dueDate: dateTime.dueDate
      }
    };
  }

  // 3. Bulk & Action Control Intents
  if (lower.includes('move all unfinished tasks') || lower.includes('move unfinished tasks')) {
    return { intent: 'BULK_POSTPONE_TASKS', confidence: 0.95, entities: { targetDate: 'tomorrow' } };
  }
  if (lower.includes('mark all today\'s tasks complete') || lower.includes('complete all tasks')) {
    return { intent: 'BULK_COMPLETE_TASKS', confidence: 0.95 };
  }
  if (lower.includes('delete all completed tasks') || lower.includes('delete completed tasks')) {
    return { intent: 'BULK_DELETE_COMPLETED_TASKS', confidence: 0.95 };
  }

  // 4. Task Completion / Habit Completion / Postpone Intents
  if (lower.includes('postpone that task') || lower.includes('postpone task')) {
    return { intent: 'POSTPONE_TASK', confidence: 0.92, entities: { query: 'last' } };
  }

  if (/mark|complete|done/i.test(lower)) {
    if (lower.includes('gym') || lower.includes('habit')) {
      let query = lower.replace(/mark|complete|done|habit|done/gi, '').trim() || 'gym';
      return { intent: 'COMPLETE_HABIT', confidence: 0.92, entities: { query } };
    }
    if (lower.includes('task') || lower.includes('java') || lower.includes('complete')) {
      let query = lower.replace(/mark|complete|done|task|kar do/gi, '').trim();
      return { intent: 'COMPLETE_TASK', confidence: 0.92, entities: { query: query || 'task' } };
    }
  }

  // 5. Delete Item Intents
  if (/delete|remove|cancel/i.test(lower)) {
    if (lower.includes('task')) {
      let query = lower.replace(/delete|remove|cancel|my|the|task/gi, '').trim();
      return { intent: 'DELETE_TASK', confidence: 0.92, entities: { query } };
    }
    if (lower.includes('expense')) {
      return { intent: 'DELETE_EXPENSE', confidence: 0.92, entities: { query: 'expense' } };
    }
    if (lower.includes('memory') || lower.includes('remember')) {
      let query = lower.replace(/delete|remove|cancel|the|memory|about/gi, '').trim();
      return { intent: 'DELETE_MEMORY', confidence: 0.92, entities: { query } };
    }
  }

  // 6. Income Detection ("rahul gave me 2k", "received 2000 from rahul", "got 2k from rahul", "rahul sent me two thousand", "rahul ne mujhe 2000 diye")
  const incomeKeywords = /received|got|earned|credited|salary|pocket money|allowance|cashback|refund|gave me|sent me|diye|bheje|mile/i;
  const amount = parseNumberAndCurrency(lower);

  if (incomeKeywords.test(lower) && amount !== null) {
    let category = 'Salary';
    if (/salary|paycheck|stipend|wages/i.test(lower)) category = 'Salary';
    else if (/freelance|project|client|work/i.test(lower)) category = 'Freelance';
    else if (/pocket money|allowance|family|parent|friend|rahul/i.test(lower)) category = 'Pocket Money';
    else if (/cashback|reward|bonus|discount/i.test(lower)) category = 'Cashback & Rewards';
    else if (/refund|return/i.test(lower)) category = 'Refunds';
    else category = 'Other Income';

    let description = message;
    if (lower.includes('from ')) description = message.split(/from /i)[1];
    else if (lower.includes('for ')) description = message.split(/for /i)[1];
    else if (lower.includes('gave me')) description = `Received from ${message.split(/gave me/i)[0].trim() || 'friend'}`;
    else if (lower.includes('sent me')) description = `Received from ${message.split(/sent me/i)[0].trim() || 'friend'}`;

    return {
      intent: 'CREATE_INCOME',
      confidence: 0.95,
      entities: {
        type: 'income',
        amount,
        category,
        description: description || 'Income'
      }
    };
  }

  // 7. Expense Detection ("spent 500 food", "i spent 500 on food", "500 gone for dinner", "paid 500 for lunch", "i spend 500 today for dinner", "spnd 250 on diner", "maine 500 kharch kiye dinner pe")
  const expenseKeywords = /spent|spend|kharch|paid|cost|bought|expense|recharge|bill|gone for|pay/i;
  if ((expenseKeywords.test(lower) || /dinner|lunch|food|coffee|cab|grocery/i.test(lower)) && amount !== null) {
    const category = detectExpenseCategory(lower);
    let description = message;
    if (lower.includes('on ')) description = message.split(/on /i)[1];
    else if (lower.includes('for ')) description = message.split(/for /i)[1];
    else if (lower.includes('pe ')) description = message.split(/pe /i)[0];

    return {
      intent: 'CREATE_EXPENSE',
      confidence: 0.95,
      entities: {
        type: 'expense',
        amount,
        category,
        description: description || category
      }
    };
  }

  // 8. Ambiguous Financial Check ("add 500")
  if (/^add\s+\d+|^500$|^\d+$/i.test(lower) && amount !== null) {
    return {
      intent: 'AMBIGUOUS_FINANCIAL',
      confidence: 0.60,
      entities: { amount }
    };
  }

  // 9. Habit / Routine Creation ("gym every morning", "gym kal se daily karna hai", "create habit drink 2L water")
  if (lower.includes('habit') || lower.includes('daily') || lower.includes('every morning') || lower.includes('every day')) {
    let title = message.replace(/create habit|add habit|every morning|every day|daily|kal se/gi, '').trim();
    return {
      intent: 'CREATE_HABIT',
      confidence: 0.90,
      entities: {
        title: title || 'Daily Activity',
        frequency: 'Daily'
      }
    };
  }

  // 10. Memory Save Intent ("remember that Rahul owes me 500", "remember I study best at night")
  if (/^remember\b|^save memory\b|^keep in mind\b/i.test(lower)) {
    const content = message.replace(/^(remember that|remember|save memory|keep in mind)\s*/i, '').trim();
    return {
      intent: 'CREATE_MEMORY',
      confidence: 0.95,
      entities: {
        type: 'Preferences',
        content: content || message,
        confidence: 0.95
      }
    };
  }

  // 11. Task / Reminder Intent ("study java tomorrow 7", "remind me to study java tomorrow at 7", "remnd me java tmrw 7", "java padhna hai kal 7 baje", "create task for rahul")
  if (/remind|task|todo|need to|study|class|padhna|remnd/i.test(lower)) {
    let priority = 'Medium';
    if (lower.includes('urgent') || lower.includes('important') || lower.includes('high')) priority = 'High';

    const dateTime = parseDateTime(normalized);
    let title = message
      .replace(/^(remind me to|add task to|add task|remind me|create task for|remnd me)\s*/i, '')
      .replace(/tomorrow|today|yesterday|at \d+|\d+ pm|\d+ am|kal|7 baje|tmrw/gi, '')
      .trim();

    if (!title && lower.includes('remind me')) {
      return {
        intent: 'INCOMPLETE_TASK',
        confidence: 0.60,
        entities: { dueDate: dateTime.dueDate, timeBlock: dateTime.timeBlock },
        missing: ['title']
      };
    }

    return {
      intent: 'CREATE_TASK',
      confidence: 0.92,
      entities: {
        title: title || 'New Task',
        priority,
        dueDate: dateTime.dueDate,
        timeBlock: dateTime.timeBlock,
        category: 'Personal'
      }
    };
  }

  // 12. Analytical & Question Answering Queries
  if (lower.includes('how much did i spend') || lower.includes('where am i spending') || lower.includes('over budget') || lower.includes('how much did i save') || lower.includes('spending this month')) {
    return { intent: 'READ_SPENDING_ANALYSIS', confidence: 0.95 };
  }

  if (lower.includes('what do i have today') || lower.includes("today's plan") || lower.includes('what to focus on') || lower.includes('what should i do today') || lower.includes('what should i do first') || lower.includes('overview')) {
    return { intent: 'READ_TODAYS_AGENDA', confidence: 0.95 };
  }

  if (lower.includes('what\'s pending') || lower.includes('pending') || lower.includes('overdue')) {
    return { intent: 'READ_PENDING_TASKS', confidence: 0.95 };
  }

  if (lower.includes('summary') || lower.includes('weekly summary') || lower.includes('how productive')) {
    return { intent: 'READ_SUMMARY', confidence: 0.95 };
  }

  if (lower.includes('memories') || lower.includes('remember')) {
    return { intent: 'READ_MEMORIES', confidence: 0.92 };
  }

  // 13. Low Confidence / Nonsense Fallback
  return {
    intent: 'UNKNOWN',
    confidence: 0.20,
    raw: message
  };
}
