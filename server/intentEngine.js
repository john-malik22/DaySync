/**
 * Intent Engine for Luna AI
 * Classifies user text into intent types and extracts structured entities.
 */

export function classifyIntent(message) {
  const text = message.toLowerCase().trim();

  // 1. Income Detection (e.g. "received ₹5000 salary", "got ₹500 cashback", "earned ₹1200 from freelance", "credited 2000")
  const incomeRegex = /(?:received|got|earned|credited|added income|salary|pocket money|allowance|cashback|refund)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)|(?:₹|\$|rs\.?)\s*(\d+(?:\.\d+)?)\s*(?:received|got|earned|credited)/i;
  if (incomeRegex.test(text)) {
    let amount = 0;
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1]);
    }

    let category = 'Salary';
    if (/salary|paycheck|stipend|wages/i.test(text)) category = 'Salary';
    else if (/freelance|project|client|work/i.test(text)) category = 'Freelance';
    else if (/pocket money|allowance|family|parent|friend/i.test(text)) category = 'Pocket Money';
    else if (/cashback|reward|bonus|discount/i.test(text)) category = 'Cashback & Rewards';
    else if (/refund|return/i.test(text)) category = 'Refunds';
    else if (/invest|dividend|interest|stock/i.test(text)) category = 'Investments';
    else category = 'Other Income';

    let description = message;
    if (text.includes('from ')) description = message.split(/from /i)[1];
    else if (text.includes('for ')) description = message.split(/for /i)[1];

    return {
      intent: 'ADD_EXPENSE', // Route through unified financial transaction handler
      raw: message,
      entities: {
        type: 'income',
        amount,
        category,
        description: description || category
      }
    };
  }

  // 2. Expense Detection (e.g., "spent ₹300 on lunch", "paid 500 for coffee", "jio recharge 299", "electricity bill 1500")
  const expenseRegex = /(?:spent|pay|paid|cost|bought|expense|recharge|bill)\s*(?:₹|\$|rs\.?|inr)?\s*(\d+(?:\.\d+)?)|(?:₹|\$|rs\.?)\s*(\d+(?:\.\d+)?)\s*(?:on|for)?/i;
  if (expenseRegex.test(text) || text.includes('how much spent') || text.includes('spending this month')) {
    if (text.includes('why') || text.includes('how much') || text.includes('total') || text.includes('analytics')) {
      return { intent: 'GET_EXPENSE', raw: message };
    }
    
    // Extract amount, category, description
    let amount = 0;
    const amountMatch = text.match(/(\d+(?:\.\d+)?)/);
    if (amountMatch) {
      amount = parseFloat(amountMatch[1]);
    }

    let category = 'Other';
    if (/recharge|dth|mobile plan|jio|airtel|vi\b/i.test(text)) category = 'Recharges';
    else if (/electricity|power bill|light bill|utility|water bill/i.test(text)) category = 'Electricity Bill';
    else if (/travel|travelling|cab|uber|ola|bus|train|metro|auto|fuel|petrol|diesel|commute/i.test(text)) category = 'Daily Travelling';
    else if (/subscription|netflix|spotify|youtube|prime|cloud|software|membership/i.test(text)) category = 'Subscriptions';
    else if (/grocery|groceries|supermarket|vegetables|milk|fruits/i.test(text)) category = 'Groceries';
    else if (/food|lunch|dinner|breakfast|snack|coffee|cafe|restaurant|eat/i.test(text)) category = 'Food';
    else if (/shop|buy|bought|clothes|book|amazon|flipkart|gadget/i.test(text)) category = 'Shopping';
    else if (/doctor|medicine|hospital|clinic|health|pharmacy/i.test(text)) category = 'Healthcare';
    else if (/movie|cinema|game|ticket|event|show/i.test(text)) category = 'Entertainment';

    let description = message;
    if (text.includes('on ')) description = message.split(/on /i)[1];
    else if (text.includes('for ')) description = message.split(/for /i)[1];

    return {
      intent: 'ADD_EXPENSE',
      raw: message,
      entities: {
        type: 'expense',
        amount,
        category,
        description: description || category
      }
    };
  }

  // 3. Memory Save Intent ("Remember that...", "Remember I study...")
  if (/^remember\b/i.test(text) || text.includes('save memory') || text.includes('keep in mind')) {
    const memoryContent = message.replace(/^remember\s+(that\s+)?/i, '').trim();
    let type = 'Preferences';
    if (/study|work|wake|sleep|night|morning|routine/i.test(text)) type = 'Routine';
    else if (/budget|spend|money|save/i.test(text)) type = 'Financial';
    else if (/goal|learn|complete|master/i.test(text)) type = 'Goals';

    return {
      intent: 'SAVE_MEMORY',
      raw: message,
      entities: {
        type,
        content: memoryContent,
        confidence: 0.95
      }
    };
  }

  // 4. Memory Retrieval Intent ("What do you remember?", "Show memories")
  if (text.includes('what do you remember') || text.includes('my memories') || text.includes('memory list')) {
    return { intent: 'GET_MEMORY', raw: message };
  }

  // 5. Task & Reminder Intent ("Remind me to...", "Add task...", "Class at 10 tomorrow")
  if (/remind me|add task|todo|need to|class at|have class/i.test(text)) {
    let priority = 'Medium';
    if (text.includes('urgent') || text.includes('important') || text.includes('high')) priority = 'High';

    let title = message.replace(/^(remind me to|add task to|add task|remind me)\s+/i, '');
    let dueDate = new Date().toISOString().split('T')[0];

    if (text.includes('tomorrow')) {
      const tomorrow = new Date(Date.now() + 86400000);
      dueDate = tomorrow.toISOString().split('T')[0];
    }

    return {
      intent: 'CREATE_TASK',
      raw: message,
      entities: {
        title,
        priority,
        dueDate,
        category: 'Personal'
      }
    };
  }

  // 6. Daily Planner Intent ("What should I do today?", "Plan my evening", "What to work on")
  if (/what should i do|plan my|schedule for|what to focus on|today's plan|planner/i.test(text)) {
    return { intent: 'CREATE_PLAN', raw: message };
  }

  // 7. Routine Intent ("What is my routine?", "When do I study?")
  if (text.includes('routine') || text.includes('my pattern') || text.includes('when do i')) {
    return { intent: 'GET_ROUTINE', raw: message };
  }

  // 8. Summary Intent ("Summarize my day", "Weekly summary", "What have I been working on")
  if (/summarize|summary|what have i been working on|my week|my day|my month/i.test(text)) {
    return { intent: 'GET_SUMMARY', raw: message };
  }

  // 9. General Conversational Fallback
  return { intent: 'GENERAL_CHAT', raw: message };
}
