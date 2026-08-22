/**
 * Upgraded Intent Engine for Luna AI in DaySync with Conversational Context
 * Semantic Pipeline: Normalize -> Context Inspection -> Category Classification -> Entity Extraction -> Confidence Scoring
 */

export function normalizeInput(text) {
  if (!text) return '';
  let str = text.trim();
  let lower = str.toLowerCase();

  const wordNumbers = {
    'one': '1', 'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
    'one thousand': '1000', 'two thousand': '2000', 'three thousand': '3000',
    'five thousand': '5000', 'ten thousand': '10000',
    'one hundred': '100', 'two hundred': '200', 'five hundred': '500'
  };

  for (const [word, numStr] of Object.entries(wordNumbers)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    lower = lower.replace(regex, numStr);
  }

  lower = lower.replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (_, p1) => {
    return String(Math.round(parseFloat(p1) * 1000));
  });

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
    .replace(/\bwat\b/g, 'what')
    .replace(/\bhv\b/g, 'have')
    .replace(/\bpls\b/g, '')
    .replace(/\bplz\b/g, '');

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

  return lower;
}

export function parseNumberAndCurrency(text) {
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
  if (/travel|travelling|cab|uber|ola|bus|train|metro|auto|fuel|petrol|diesel|commute/i.test(lower)) return 'Daily Travelling';
  if (/food|lunch|dinner|breakfast|snack|coffee|cafe|restaurant|eat/i.test(lower)) return 'Food';
  if (/recharge|dth|mobile plan|jio|airtel|vi\b/i.test(lower)) return 'Recharges';
  if (/electricity|power bill|light bill|utility|water bill/i.test(lower)) return 'Electricity Bill';
  if (/subscription|netflix|spotify|youtube|prime|cloud|software|membership/i.test(lower)) return 'Subscriptions';
  if (/grocery|groceries|supermarket|vegetables|milk|fruits/i.test(lower)) return 'Groceries';
  if (/shop|buy|bought|clothes|book|amazon|flipkart|gadget/i.test(lower)) return 'Shopping';
  if (/doctor|medicine|hospital|clinic|health|pharmacy/i.test(lower)) return 'Healthcare';
  if (/movie|cinema|game|ticket|event|show/i.test(lower)) return 'Entertainment';
  return 'Other';
}

function sanitizeTitle(str) {
  if (!str) return '';
  let cleaned = str
    .replace(/^(create a task to|add a task to|create a task for|add a task|create task|add task|remind me to|remind me|schedule|create a habit to|create habit to|add habit to|create habit|add habit|create a goal to|create goal to|add goal|create goal)\s*/gi, '')
    .replace(/at\s+\d{1,2}(?::\d{2})?\s*(am|pm|o'clock)?/gi, '')
    .replace(/\d{1,2}\s*(am|pm|o'clock)/gi, '')
    .replace(/tomorrow|today|yesterday|kal|7 baje|tmrw/gi, '')
    .replace(/\bpm\b|\bam\b/gi, '')
    .replace(/[.\,\!\?]+$/g, '')
    .trim();

  if (cleaned) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return '';
}

export function classifyIntent(message, context = {}) {
  const normalized = normalizeInput(message);
  const lower = normalized.toLowerCase().trim().replace(/[.\,\!\?]+$/g, '');

  // 1. CANCELLATION ("cancel", "never mind", "forget it", "stop", "don't add it")
  if (/^cancel\b|^never mind\b|^forget it\b|^stop\b|^don't add\b|^cancel that\b/i.test(lower)) {
    return { intent: 'CANCEL', confidence: 0.98, entities: {} };
  }

  // 2. EXPLICIT QUERY / READ / SEARCH INTENTS (HIGH PRIORITY OVER PENDING CONTEXT!)
  const queryVerbs = /show|display|view|see|tell me|what|which|where|how much|how many|history|list|recent|pending|remaining|overdue|left|summary|analytics|focus|agenda|unfinished|need to do|still need|what do i|where am i/i;
  const isQueryPhrase = queryVerbs.test(lower) || /expenses history|task history|my expenses|my tasks/i.test(lower);

  if (isQueryPhrase) {
    if (lower.includes('expense') || lower.includes('spend') || lower.includes('spent') || lower.includes('spending') || lower.includes('money')) {
      if (lower.includes('where i spent last time') || lower.includes('last time') || lower.includes('where did i spend') || lower.includes('last expense')) {
        return { intent: 'READ_LAST_EXPENSE', confidence: 0.95, entities: {} };
      }

      if (lower.includes('how much') || lower.includes('this month') || lower.includes('total spend') || lower.includes('where is my money going') || lower.includes('spending the most') || lower.includes('biggest expense')) {
        return { intent: 'READ_SPENDING_ANALYSIS', confidence: 0.95, entities: {} };
      }

      let limit = null;
      const limitMatch = lower.match(/last\s+(\d+)\s+expense/i) || lower.match(/(\d+)\s+last\s+expense/i) || lower.match(/last\s+(\d+)/i);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
      }

      return { intent: 'READ_EXPENSES', confidence: 0.95, entities: { limit } };
    }

    if (lower.includes('task') || lower.includes('todo') || lower.includes('pending') || lower.includes('left') || lower.includes('unfinished') || lower.includes('focus') || lower.includes('agenda') || lower.includes('need to do') || lower.includes('still need')) {
      if (lower.includes('today')) {
        return { intent: 'READ_TODAYS_TASKS', confidence: 0.95, entities: { date: 'today' } };
      }
      return { intent: 'READ_PENDING_TASKS', confidence: 0.95, entities: {} };
    }

    if (lower.includes('memory') || lower.includes('memories') || lower.includes('remember')) {
      return { intent: 'READ_MEMORIES', confidence: 0.95, entities: {} };
    }

    if (lower.includes('summary') || lower.includes('report') || lower.includes('productivity')) {
      return { intent: 'READ_SUMMARY', confidence: 0.95, entities: {} };
    }
  }

  // 3. MULTI-TURN PENDING ACTION FOLLOW-UP (context.pendingAction)
  if (context && context.pendingAction) {
    const pending = context.pendingAction;

    // 3a. Pending CREATE_TASK / CREATE_REMINDER
    if (pending.intent === 'CREATE_TASK' || pending.intent === 'CREATE_REMINDER') {
      const dateTime = parseDateTime(normalized);
      const isPureNumber = /^\d+$/.test(lower);
      const isTimeMention = dateTime.isExplicitTime || isPureNumber || /am|pm|o'clock|evening|morning|night/i.test(lower);
      const isDateMention = dateTime.isExplicitDate || /september|october|november|december|january|february|march|april|may|june|july|august/i.test(lower);

      let updatedEntities = { ...pending.entities };
      let missing = [...(pending.missing || [])];

      if (missing.includes('title') && !isTimeMention && !isDateMention && !isPureNumber) {
        updatedEntities.title = sanitizeTitle(message);
        missing = missing.filter(m => m !== 'title');
      }

      if (isDateMention) {
        updatedEntities.dueDate = dateTime.dueDate;
        missing = missing.filter(m => m !== 'dueDate');
      }

      if (isTimeMention) {
        updatedEntities.timeBlock = dateTime.timeBlock;
        missing = missing.filter(m => m !== 'time');
      }

      if (missing.length === 0 || (missing.length === 1 && missing[0] === 'time' && updatedEntities.timeBlock)) {
        return {
          intent: 'CREATE_TASK',
          confidence: 0.95,
          entities: {
            title: updatedEntities.title || 'Task',
            priority: updatedEntities.priority || 'Medium',
            dueDate: updatedEntities.dueDate || dateTime.dueDate,
            timeBlock: updatedEntities.timeBlock || dateTime.timeBlock,
            category: 'Personal'
          }
        };
      } else {
        return {
          intent: 'CONTINUE_PENDING_TASK',
          confidence: 0.90,
          pendingAction: {
            intent: pending.intent,
            entities: updatedEntities,
            missing
          }
        };
      }
    }

    // 3b. Pending CREATE_EXPENSE
    if (pending.intent === 'CREATE_EXPENSE') {
      const num = parseNumberAndCurrency(lower);
      let updatedEntities = { ...pending.entities };
      let missing = [...(pending.missing || [])];

      if (num !== null && missing.includes('amount')) {
        updatedEntities.amount = num;
        missing = missing.filter(m => m !== 'amount');
      } else if (missing.includes('description') || missing.includes('category')) {
        const cleanDesc = message.trim().replace(/[.\,\!\?]+$/g, '');
        updatedEntities.description = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
        updatedEntities.category = detectExpenseCategory(lower);
        missing = missing.filter(m => m !== 'description' && m !== 'category');
      }

      if (missing.length === 0 && updatedEntities.amount && updatedEntities.description) {
        return {
          intent: 'CREATE_EXPENSE',
          confidence: 0.95,
          entities: {
            type: 'expense',
            amount: updatedEntities.amount,
            category: updatedEntities.category || 'Other',
            description: updatedEntities.description || 'Expense'
          }
        };
      } else {
        return {
          intent: 'CONTINUE_PENDING_EXPENSE',
          confidence: 0.90,
          pendingAction: {
            intent: 'CREATE_EXPENSE',
            entities: updatedEntities,
            missing
          }
        };
      }
    }

    // 3c. Pending CREATE_HABIT
    if (pending.intent === 'CREATE_HABIT') {
      let updatedEntities = { ...pending.entities };
      let missing = [...(pending.missing || [])];

      if (missing.includes('title') && !/daily|every day|weekly/i.test(lower)) {
        updatedEntities.title = sanitizeTitle(message);
        missing = missing.filter(m => m !== 'title');
      } else if (missing.includes('frequency') || /daily|every day|weekly/i.test(lower)) {
        updatedEntities.frequency = 'Daily';
        missing = missing.filter(m => m !== 'frequency');
      }

      if (missing.length === 0 || (updatedEntities.title && updatedEntities.frequency)) {
        return {
          intent: 'CREATE_HABIT',
          confidence: 0.95,
          entities: {
            title: updatedEntities.title || 'Habit',
            frequency: updatedEntities.frequency || 'Daily'
          }
        };
      } else {
        return {
          intent: 'CONTINUE_PENDING_HABIT',
          confidence: 0.90,
          pendingAction: {
            intent: 'CREATE_HABIT',
            entities: updatedEntities,
            missing
          }
        };
      }
    }

    // 3d. Pending CREATE_GOAL
    if (pending.intent === 'CREATE_GOAL') {
      let updatedEntities = { ...pending.entities };
      let missing = [...(pending.missing || [])];

      if (missing.includes('title') && !/september|october|november|december|january|february|march|april|may|june|july|august|by\s|deadline/i.test(lower)) {
        updatedEntities.title = sanitizeTitle(message);
        missing = missing.filter(m => m !== 'title');
      } else if (missing.includes('deadline') || /september|october|november|december|january|february|march|april|may|june|july|august|\d+/i.test(lower)) {
        updatedEntities.deadline = message.trim();
        missing = missing.filter(m => m !== 'deadline');
      }

      if (missing.length === 0 || (updatedEntities.title && updatedEntities.deadline)) {
        return {
          intent: 'CREATE_GOAL',
          confidence: 0.95,
          entities: {
            title: updatedEntities.title || 'Goal',
            deadline: updatedEntities.deadline || 'Soon'
          }
        };
      } else {
        return {
          intent: 'CONTINUE_PENDING_GOAL',
          confidence: 0.90,
          pendingAction: {
            intent: 'CREATE_GOAL',
            entities: updatedEntities,
            missing
          }
        };
      }
    }
  }

  // 4. CORRECTIONS & FOLLOW-UP UPDATES ("actually make it 700", "make it 700", "change that to 8 PM")
  if (/^actually\b|^no,?\s*make\b|^make it\b|^make that\b|^change\b|^not\b|^i meant\b/i.test(lower)) {
    const num = parseNumberAndCurrency(lower);
    if (num !== null) {
      if (context.lastMemory) {
        const updatedContent = context.lastMemory.content.replace(/\d+/, String(num));
        return {
          intent: 'UPDATE_MEMORY',
          confidence: 0.95,
          entities: { memoryId: context.lastMemory.id, content: updatedContent }
        };
      } else if (context.lastExpense) {
        return {
          intent: 'UPDATE_EXPENSE',
          confidence: 0.95,
          entities: { expenseId: context.lastExpense.id, amount: num }
        };
      } else {
        return { intent: 'ORPHAN_UPDATE', confidence: 0.50, entities: {} };
      }
    }
  }

  // 5. EXACT PROMPT STARTERS FOR MULTI-TURN CREATION
  if (lower === 'create a task' || lower === 'create task' || lower === 'add a task' || lower === 'add task') {
    return {
      intent: 'CONTINUE_PENDING_TASK',
      confidence: 0.90,
      pendingAction: { intent: 'CREATE_TASK', entities: {}, missing: ['title', 'dueDate', 'time'] }
    };
  }

  if (lower === 'add an expense' || lower === 'add expense' || lower === 'create expense' || lower === 'create an expense') {
    return {
      intent: 'CONTINUE_PENDING_EXPENSE',
      confidence: 0.90,
      pendingAction: { intent: 'CREATE_EXPENSE', entities: {}, missing: ['amount', 'description'] }
    };
  }

  if (lower === 'create a habit' || lower === 'create habit' || lower === 'add a habit' || lower === 'add habit') {
    return {
      intent: 'CONTINUE_PENDING_HABIT',
      confidence: 0.90,
      pendingAction: { intent: 'CREATE_HABIT', entities: {}, missing: ['title', 'frequency'] }
    };
  }

  // 6. NAVIGATION INTENTS
  if (/^open\b|^go to\b|^take me to\b|^show page\b/i.test(lower)) {
    if (lower.includes('expense')) return { intent: 'OPEN_EXPENSES', confidence: 0.98, entities: { route: '/app/expenses' } };
    if (lower.includes('task') || lower.includes('todo')) return { intent: 'OPEN_TASKS', confidence: 0.98, entities: { route: '/app/task' } };
    if (lower.includes('habit')) return { intent: 'OPEN_HABITS', confidence: 0.98, entities: { route: '/app/habits' } };
    if (lower.includes('memory') || lower.includes('memories')) return { intent: 'OPEN_MEMORIES', confidence: 0.98, entities: { route: '/app/memories' } };
    if (lower.includes('summary')) return { intent: 'OPEN_SUMMARY', confidence: 0.98, entities: { route: '/app/summary' } };
    if (lower.includes('setting')) return { intent: 'OPEN_SETTINGS', confidence: 0.98, entities: { route: '/app/settings' } };
    if (lower.includes('dashboard')) return { intent: 'OPEN_DASHBOARD', confidence: 0.98, entities: { route: '/app/dashboard' } };
    if (lower.includes('chat')) return { intent: 'OPEN_CHAT', confidence: 0.98, entities: { route: '/app/chat' } };
  }

  // 7. CONTROL INTENTS
  if (/mark|complete|finish|done|postpone|delay|move/i.test(lower)) {
    if (lower.includes('postpone') || lower.includes('move') || lower.includes('delay')) {
      return { intent: 'POSTPONE_TASK', confidence: 0.92, entities: {} };
    }
    if (lower.includes('habit')) {
      let query = lower.replace(/mark|complete|done|habit|my|the/gi, '').trim();
      return { intent: 'COMPLETE_HABIT', confidence: 0.92, entities: { query } };
    }
    if (lower.includes('task') || lower.includes('gym') || lower.includes('java') || lower.includes('done')) {
      let query = lower.replace(/mark|complete|finish|done|my|the|task/gi, '').trim();
      return { intent: 'COMPLETE_TASK', confidence: 0.92, entities: { query: query || 'task' } };
    }
  }

  // 8. DESTRUCTIVE / DELETE INTENTS
  if (/delete|remove|cancel/i.test(lower)) {
    if (lower === 'delete that' || lower === 'remove that' || lower === 'cancel that') {
      return { intent: 'AMBIGUOUS_DELETE', confidence: 0.70, entities: {} };
    }
    if (lower.includes('task')) {
      let query = lower.replace(/delete|remove|cancel|my|the|task/gi, '').trim();
      return { intent: 'DELETE_TASK', confidence: 0.92, entities: { query } };
    }
    if (lower.includes('expense')) {
      return { intent: 'DELETE_EXPENSE', confidence: 0.92, entities: { query: 'expense' } };
    }
  }

  // 9. CREATE INTENTS
  // 9a. CREATE_GOAL ("create a goal to learn react")
  if (lower.includes('goal')) {
    let rawTitle = message.replace(/^(create a goal to|create goal to|create goal|add goal|goal)\s*/gi, '').trim();
    let cleanTitle = sanitizeTitle(rawTitle);
    if (!cleanTitle) {
      return {
        intent: 'CONTINUE_PENDING_GOAL',
        confidence: 0.90,
        pendingAction: { intent: 'CREATE_GOAL', entities: {}, missing: ['title', 'deadline'] }
      };
    }
    return {
      intent: 'CONTINUE_PENDING_GOAL',
      confidence: 0.90,
      pendingAction: { intent: 'CREATE_GOAL', entities: { title: cleanTitle }, missing: ['deadline'] }
    };
  }

  const incomeKeywords = /received|got|earned|credited|salary|pocket money|allowance|cashback|refund|gave me|sent me|diye|bheje|mile/i;
  const numAmount = parseNumberAndCurrency(lower);

  if (incomeKeywords.test(lower) && numAmount !== null) {
    let category = 'Salary';
    if (/salary|paycheck|stipend|wages/i.test(lower)) category = 'Salary';
    else if (/freelance|project|client|work/i.test(lower)) category = 'Freelance';
    else if (/pocket money|allowance|family|parent|friend|rahul/i.test(lower)) category = 'Pocket Money';
    else category = 'Other Income';

    let description = message;
    if (lower.includes('from ')) description = message.split(/from /i)[1];
    else if (lower.includes('gave me')) description = `Received from ${message.split(/gave me/i)[0].trim() || 'friend'}`;
    else if (lower.includes('sent me')) description = `Received from ${message.split(/sent me/i)[0].trim() || 'friend'}`;

    return {
      intent: 'CREATE_INCOME',
      confidence: 0.95,
      entities: {
        type: 'income',
        amount: numAmount,
        category,
        description: description || 'Income'
      }
    };
  }

  const expenseVerbs = /spent|spend|kharch|paid|cost|bought|expense|recharge|bill|went on|pay/i;
  if (expenseVerbs.test(lower) && numAmount !== null) {
    const category = detectExpenseCategory(lower);
    let description = message;
    if (lower.includes('on ')) description = message.split(/on /i)[1];
    else if (lower.includes('for ')) description = message.split(/for /i)[1];
    else if (lower.includes('went on ')) description = message.split(/went on /i)[1];

    return {
      intent: 'CREATE_EXPENSE',
      confidence: 0.95,
      entities: {
        type: 'expense',
        amount: numAmount,
        category,
        description: description || category
      }
    };
  }

  if (/^add\s+\d+$/i.test(lower) && numAmount !== null && (!context || !context.pendingAction)) {
    return {
      intent: 'AMBIGUOUS_FINANCIAL',
      confidence: 0.70,
      entities: { amount: numAmount }
    };
  }

  // 9b. CREATE_HABIT ("add habit study daily", "add habit to read")
  if (lower.includes('habit') || (lower.includes('daily') && !lower.includes('task'))) {
    let cleanTitle = sanitizeTitle(message);
    if (!cleanTitle) {
      return {
        intent: 'CONTINUE_PENDING_HABIT',
        confidence: 0.90,
        pendingAction: { intent: 'CREATE_HABIT', entities: {}, missing: ['title', 'frequency'] }
      };
    }

    return {
      intent: 'CREATE_HABIT',
      confidence: 0.92,
      entities: {
        title: cleanTitle,
        frequency: 'Daily'
      }
    };
  }

  // 9c. CREATE_MEMORY ("remember to buy vegetables", "remember that Rahul owes me 500")
  if (/^remember\b|^save memory\b|^keep in mind\b/i.test(lower)) {
    let content = message.replace(/^(remember to|remember that|remember|save memory|keep in mind)\s*/i, '').trim();
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

  // 9d. CREATE_TASK / CREATE_REMINDER ("add study at 7 pm", "remind me to study")
  if (/remind|task|todo|need to|study|schedule|class|padhna/i.test(lower) || /^add\s+[a-z]+/i.test(lower)) {
    const dateTime = parseDateTime(normalized);
    let cleanTitle = sanitizeTitle(message);

    if (!cleanTitle && lower.includes('remind me')) {
      return {
        intent: 'CONTINUE_PENDING_TASK',
        confidence: 0.90,
        pendingAction: {
          intent: 'CREATE_REMINDER',
          entities: { title: 'Study' },
          missing: ['time']
        }
      };
    }

    if (!dateTime.isExplicitTime) {
      return {
        intent: 'CONTINUE_PENDING_TASK',
        confidence: 0.90,
        pendingAction: {
          intent: 'CREATE_TASK',
          entities: {
            title: cleanTitle || 'Study',
            priority: 'Medium',
            dueDate: dateTime.dueDate,
            category: 'Personal'
          },
          missing: ['time']
        }
      };
    }

    return {
      intent: 'CREATE_TASK',
      confidence: 0.92,
      entities: {
        title: cleanTitle || 'Study',
        priority: 'Medium',
        dueDate: dateTime.dueDate,
        timeBlock: dateTime.timeBlock,
        category: 'Personal'
      }
    };
  }

  // 10. ORPHAN NUMBER OR UNKNOWN
  if (/^\d+$/.test(lower)) {
    return { intent: 'ORPHAN_NUMBER', confidence: 0.50, raw: message };
  }

  return {
    intent: 'UNKNOWN',
    confidence: 0.10,
    raw: message
  };
}
