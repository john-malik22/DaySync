/**
 * Upgraded Intent Engine for Luna AI in DaySync
 * Semantic Pipeline: Normalize -> Read vs Create Category Detection -> Entity Extraction -> Confidence Scoring
 */

export function normalizeInput(text) {
  if (!text) return '';
  let str = text.trim();
  let lower = str.toLowerCase();

  // 1. Convert word numbers to digits for consistency
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

  // 2. Format 'k' numbers (e.g. 2k -> 2000, 5k -> 5000)
  lower = lower.replace(/\b(\d+(?:\.\d+)?)\s*k\b/gi, (_, p1) => {
    return String(Math.round(parseFloat(p1) * 1000));
  });

  // 3. Common abbreviations, contractions & typos
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

  // 4. Hinglish / Mixed Hindi-English normalization
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

  // Time parsing (e.g., at 7 pm, at 7, 7:00, 8 pm, 7 o'clock)
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

export function classifyIntent(message, context = {}) {
  const normalized = normalizeInput(message);
  const lower = normalized.toLowerCase().trim();

  // 0. Handle pending clarification follow-ups
  if (context.pendingClarification) {
    const pending = context.pendingClarification;

    if (pending.intent === 'AMBIGUOUS_FINANCIAL') {
      if (/expense|spend|spent|kharch|paid/i.test(lower)) {
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
      } else if (/income|received|got|earn|salary/i.test(lower)) {
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

    if (pending.intent === 'INCOMPLETE_TASK') {
      const dateTime = parseDateTime(message);
      return {
        intent: 'CREATE_TASK',
        confidence: 0.95,
        entities: {
          title: message.trim(),
          priority: 'Medium',
          dueDate: pending.entities.dueDate || dateTime.dueDate,
          timeBlock: dateTime.timeBlock,
          category: 'Personal'
        }
      };
    }
  }

  // ----------------------------------------------------
  // CATEGORY 1: READ / SEARCH / QUERY INTENTS (HIGH PRIORITY)
  // Queries MUST NEVER trigger item creation!
  // ----------------------------------------------------
  const queryVerbs = /show|display|view|see|tell me|what|which|where|how much|how many|history|list|recent|pending|remaining|overdue|left|summary|analytics|focus|agenda|unfinished|need to do|still need|what do i|where am i/i;
  const isQueryPhrase = queryVerbs.test(lower) || /expenses history|task history|my expenses|my tasks/i.test(lower);

  if (isQueryPhrase) {
    // 1a. READ_EXPENSES & READ_LAST_EXPENSE & ANALYZE_EXPENSES
    if (lower.includes('expense') || lower.includes('spend') || lower.includes('spent') || lower.includes('spending') || lower.includes('money')) {
      if (lower.includes('where i spent last time') || lower.includes('last time') || lower.includes('where did i spend') || lower.includes('last expense')) {
        return { intent: 'READ_LAST_EXPENSE', confidence: 0.95, entities: {} };
      }

      if (lower.includes('how much') || lower.includes('spending this month') || lower.includes('total spend') || lower.includes('where is my money going') || lower.includes('spending the most') || lower.includes('biggest expense')) {
        return { intent: 'READ_SPENDING_ANALYSIS', confidence: 0.95, entities: {} };
      }

      let limit = null;
      const limitMatch = lower.match(/last\s+(\d+)\s+expense/i) || lower.match(/(\d+)\s+last\s+expense/i) || lower.match(/last\s+(\d+)/i);
      if (limitMatch) {
        limit = parseInt(limitMatch[1], 10);
      }

      return { intent: 'READ_EXPENSES', confidence: 0.95, entities: { limit } };
    }

    // 1b. READ_TASKS (READ_PENDING_TASKS vs READ_TODAYS_TASKS vs READ_TODAYS_AGENDA)
    if (lower.includes('task') || lower.includes('todo') || lower.includes('pending') || lower.includes('left') || lower.includes('unfinished') || lower.includes('focus') || lower.includes('agenda') || lower.includes('need to do') || lower.includes('still need')) {
      if (lower.includes('today')) {
        return { intent: 'READ_TODAYS_TASKS', confidence: 0.95, entities: { date: 'today' } };
      }
      return { intent: 'READ_PENDING_TASKS', confidence: 0.95, entities: {} };
    }

    // 1c. READ_MEMORIES
    if (lower.includes('memory') || lower.includes('memories') || lower.includes('remember')) {
      return { intent: 'READ_MEMORIES', confidence: 0.95, entities: {} };
    }

    // 1d. READ_SUMMARY
    if (lower.includes('summary') || lower.includes('report') || lower.includes('productivity')) {
      return { intent: 'READ_SUMMARY', confidence: 0.95, entities: {} };
    }
  }

  // ----------------------------------------------------
  // CATEGORY 2: NAVIGATION INTENTS
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // CATEGORY 3: CONTROL INTENTS (MARK COMPLETE / POSTPONE)
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // CATEGORY 4: CONTEXTUAL UPDATE INTENTS ("make that expense 700")
  // ----------------------------------------------------
  if (/^make it\b|^make that\b|^actually make it\b|^change it to\b|^change the\b/i.test(lower)) {
    const amount = parseNumberAndCurrency(lower);
    if (amount !== null) {
      return {
        intent: 'UPDATE_EXPENSE',
        confidence: 0.92,
        entities: { amount }
      };
    }
    if (lower.includes('task') || lower.includes('reminder')) {
      const dateTime = parseDateTime(normalized);
      return {
        intent: 'UPDATE_TASK',
        confidence: 0.92,
        entities: { timeBlock: dateTime.timeBlock, dueDate: dateTime.dueDate }
      };
    }
  }

  // ----------------------------------------------------
  // CATEGORY 5: DESTRUCTIVE / DELETE INTENTS
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // CATEGORY 6: CREATE INTENTS (STRICT ENTITY VALIDATION)
  // ----------------------------------------------------

  // 6a. CREATE_INCOME ("received 2000 from rahul", "got 2k from rahul", "rahul gave me 2000")
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

  // 6b. CREATE_EXPENSE ("spent 50 on travelling", "spent 500 on dinner", "500 went on dinner", "paid 500 for dinner")
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

  // 6c. AMBIGUOUS FINANCIAL ("add 500")
  if (/^add\s+\d+$|^500$|^\d+$/i.test(lower) && numAmount !== null) {
    return {
      intent: 'AMBIGUOUS_FINANCIAL',
      confidence: 0.70,
      entities: { amount: numAmount }
    };
  }

  // 6d. CREATE_HABIT ("add habit study daily", "add habit to read")
  if (lower.includes('habit') || (lower.includes('daily') && !lower.includes('task'))) {
    let title = message
      .replace(/^(add habit to|add habit|create habit to|create habit|every morning|every day|daily|kal se)\s*/gi, '')
      .replace(/\bdaily\b/gi, '')
      .trim();

    if (title) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    return {
      intent: 'CREATE_HABIT',
      confidence: 0.92,
      entities: {
        title: title || 'Habit',
        frequency: 'Daily'
      }
    };
  }

  // 6e. CREATE_MEMORY ("remember to buy vegetables", "remember that Rahul owes me 500")
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

  // 6f. CREATE_TASK ("add study at 7 pm", "study java tomorrow at 7", "remind me to study java")
  if (/remind|task|todo|need to|study|schedule|class|padhna/i.test(lower) || /^add\s+[a-z]+/i.test(lower)) {
    const dateTime = parseDateTime(normalized);

    // Clean title extraction
    let cleanTitle = message
      .replace(/^(remind me to|add task to|add task|create task for|add|remind me|schedule)\s*/i, '')
      .replace(/at\s+\d{1,2}(?::\d{2})?\s*(am|pm|o'clock)?/gi, '')
      .replace(/\d{1,2}\s*(am|pm|o'clock)/gi, '')
      .replace(/tomorrow|today|yesterday|kal|7 baje|tmrw/gi, '')
      .replace(/\bpm\b|\bam\b/gi, '')
      .trim();

    if (cleanTitle) {
      cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
    }

    if (!cleanTitle && lower.includes('remind me')) {
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
        title: cleanTitle || 'Study',
        priority: 'Medium',
        dueDate: dateTime.dueDate,
        timeBlock: dateTime.timeBlock,
        category: 'Personal'
      }
    };
  }

  // ----------------------------------------------------
  // CATEGORY 7: UNKNOWN / LOW CONFIDENCE FALLBACK
  // ----------------------------------------------------
  return {
    intent: 'UNKNOWN',
    confidence: 0.10,
    raw: message
  };
}
