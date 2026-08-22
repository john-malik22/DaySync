import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from './db.js';
import { classifyIntent } from './intentEngine.js';
import { detectPotentialMemory } from './memoryEngine.js';
import { generatePersonalizedSuggestion } from './suggestionEngine.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'daysync_companion_super_secret_jwt_key_2026';

app.use(cors());
app.use(express.json());

// --- Authentication Middleware ---
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Token required.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid authentication session.' });
  }
}

// --- AUTHENTICATION ENDPOINTS (PASSWORD-BASED) ---

// 1. Strict Password Signup Route
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, Email, and Password are all required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const store = db.read();
  
  const existingUser = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({
      error: 'An account with this email address already exists. Please Log In.',
      code: 'USER_EXISTS'
    });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: passwordHash,
    preferences: { theme: 'dark', currency: '₹' },
    createdAt: new Date().toISOString()
  };

  store.users.push(newUser);
  db.write(store);

  console.log(`[SIGNUP SUCCESS] Created new user: ${normalizedEmail}`);

  const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: newUser.id, name: newUser.name, email: newUser.email, preferences: newUser.preferences }
  });
});

// 2. Strict Password Login Route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and Password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const store = db.read();

  const user = store.users.find(u => u.email.toLowerCase() === normalizedEmail);
  if (!user) {
    return res.status(404).json({
      error: 'Account does not exist. No user found with this email address.',
      code: 'USER_NOT_FOUND'
    });
  }

  const isMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({
      error: 'Incorrect password. Please enter the valid password created during signup.',
      code: 'INVALID_PASSWORD'
    });
  }

  console.log(`[LOGIN SUCCESS] User authenticated: ${normalizedEmail}`);

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences }
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const store = db.read();
  const user = store.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences } });
});

// 3. Permanent Account Deletion Route
app.delete('/api/auth/delete-account', authenticate, (req, res) => {
  const userId = req.user.id;
  const store = db.read();

  // Remove user record
  store.users = store.users.filter(u => u.id !== userId);

  // Cascade delete all associated user data from database
  store.conversations = store.conversations.filter(c => c.userId !== userId);
  store.memories = store.memories.filter(m => m.userId !== userId);
  store.tasks = store.tasks.filter(t => t.userId !== userId);
  store.expenses = store.expenses.filter(e => e.userId !== userId);
  store.notices = store.notices.filter(n => n.userId !== userId);
  store.summaries = store.summaries.filter(s => s.userId !== userId);

  db.write(store);
  console.log(`[PERMANENT ACCOUNT DELETION SUCCESS] Permanently deleted user ID: ${userId} and all associated data from DB.`);

  res.json({ success: true, message: 'Account and all associated data permanently deleted from database.' });
});


// --- AI CHAT & INTENT ROUTE & CONVERSATION CONTEXT ---
const userContexts = new Map();

function getUserContext(userId) {
  if (!userContexts.has(userId)) {
    userContexts.set(userId, {
      lastExpense: null,
      lastTask: null,
      lastMemory: null,
      lastItem: null,
      pendingClarification: null
    });
  }
  return userContexts.get(userId);
}

app.post('/api/chat', authenticate, (req, res) => {
  const { message } = req.body;
  const store = db.read();
  const userId = req.user.id;

  const userMsg = {
    id: `msg_${Date.now()}_u`,
    userId,
    role: 'user',
    message,
    createdAt: new Date().toISOString()
  };
  store.conversations.push(userMsg);

  const userContext = getUserContext(userId);
  const intentResult = classifyIntent(message, userContext);
  let replyText = '';
  let toolData = null;
  let memoryPrompt = null;

  switch (intentResult.intent) {
    case 'CREATE_EXPENSE':
    case 'ADD_EXPENSE': {
      const { type, amount, category, description } = intentResult.entities;
      const txType = type || 'expense';
      const newExp = {
        id: `exp_${Date.now()}`,
        userId,
        type: txType,
        amount: amount || 0,
        category: category || 'Other',
        description: description || category || 'Expense',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      store.expenses.push(newExp);

      userContext.lastExpense = newExp;
      userContext.lastItem = { type: 'expense', id: newExp.id, data: newExp };
      userContext.pendingClarification = null;

      replyText = `Done — I added ₹${amount} for ${description || category || 'expense'}.`;
      toolData = { type: 'EXPENSE_ADDED', expense: newExp };
      break;
    }

    case 'CREATE_INCOME': {
      const { amount, category, description } = intentResult.entities;
      const newExp = {
        id: `exp_${Date.now()}`,
        userId,
        type: 'income',
        amount: amount || 0,
        category: category || 'Other Income',
        description: description || category || 'Income',
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      store.expenses.push(newExp);

      userContext.lastExpense = newExp;
      userContext.lastItem = { type: 'expense', id: newExp.id, data: newExp };
      userContext.pendingClarification = null;

      replyText = `Done — I recorded an income entry of ₹${amount} (${description || category}).`;
      toolData = { type: 'EXPENSE_ADDED', expense: newExp };
      break;
    }

    case 'UPDATE_EXPENSE': {
      const { amount } = intentResult.entities;
      const userExps = store.expenses.filter(e => e.userId === userId);
      const targetExp = userContext.lastExpense || userExps[userExps.length - 1];

      if (targetExp && amount !== null && amount !== undefined) {
        targetExp.amount = amount;
        userContext.pendingClarification = null;
        replyText = `Done — I updated your ${targetExp.description || 'expense'} to ₹${amount}.`;
        toolData = { type: 'EXPENSE_UPDATED', expense: targetExp };
      } else {
        replyText = "Which expense would you like to update?";
      }
      break;
    }

    case 'CREATE_TASK': {
      const { title, priority, dueDate, timeBlock, category } = intentResult.entities;
      const newTask = {
        id: `tsk_${Date.now()}`,
        userId,
        title: title || 'New Task',
        priority: priority || 'Medium',
        dueDate: dueDate || new Date().toISOString().split('T')[0],
        timeBlock: timeBlock || '19:00 - 20:00',
        category: category || 'Personal',
        completed: false,
        createdAt: new Date().toISOString()
      };
      store.tasks.push(newTask);

      userContext.lastTask = newTask;
      userContext.lastItem = { type: 'task', id: newTask.id, data: newTask };
      userContext.pendingClarification = null;

      const dateStr = dueDate === new Date().toISOString().split('T')[0] ? 'today' : 'tomorrow';
      const timeStr = timeBlock ? ` at ${timeBlock.split(' - ')[0]}` : '';
      replyText = `Done — I added "${newTask.title}" for ${dateStr}${timeStr}.`;
      toolData = { type: 'TASK_CREATED', task: newTask };
      break;
    }

    case 'INCOMPLETE_TASK': {
      userContext.pendingClarification = { intent: 'INCOMPLETE_TASK', entities: intentResult.entities };
      replyText = "What task should I add?";
      break;
    }

    case 'AMBIGUOUS_FINANCIAL': {
      userContext.pendingClarification = { intent: 'AMBIGUOUS_FINANCIAL', entities: intentResult.entities };
      replyText = `Should I add ₹${intentResult.entities.amount} as an expense or income?`;
      break;
    }

    case 'UPDATE_TASK': {
      const { query, timeBlock, dueDate } = intentResult.entities;
      const targetTask = userContext.lastTask || store.tasks.find(t => t.userId === userId && t.title.toLowerCase().includes((query || '').toLowerCase()));

      if (targetTask) {
        if (timeBlock) targetTask.timeBlock = timeBlock;
        if (dueDate) targetTask.dueDate = dueDate;
        userContext.pendingClarification = null;
        replyText = `Done — I updated "${targetTask.title}" time to ${targetTask.timeBlock.split(' - ')[0]}.`;
        toolData = { type: 'TASK_UPDATED', task: targetTask };
      } else {
        replyText = "I couldn't find that task. Which task would you like to change?";
      }
      break;
    }

    case 'COMPLETE_TASK': {
      const { query } = intentResult.entities;
      const userTasks = store.tasks.filter(t => t.userId === userId && !t.completed);
      const targetTask = userTasks.find(t => t.title.toLowerCase().includes((query || '').toLowerCase())) || userContext.lastTask || userTasks[0];

      if (targetTask) {
        targetTask.completed = true;
        replyText = `Done — I marked "${targetTask.title}" as completed.`;
        toolData = { type: 'TASK_COMPLETED', task: targetTask };
      } else {
        replyText = "I couldn't find an incomplete task matching that description.";
      }
      break;
    }

    case 'POSTPONE_TASK': {
      const userTasks = store.tasks.filter(t => t.userId === userId && !t.completed);
      const targetTask = userContext.lastTask || userTasks[0];

      if (targetTask) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        targetTask.dueDate = tomorrow;
        replyText = `Done — I moved "${targetTask.title}" to tomorrow.`;
        toolData = { type: 'TASK_POSTPONED', task: targetTask };
      } else {
        replyText = "You have no pending tasks to postpone.";
      }
      break;
    }

    case 'DELETE_TASK': {
      const { query } = intentResult.entities;
      const index = store.tasks.findIndex(t => t.userId === userId && t.title.toLowerCase().includes((query || '').toLowerCase()));
      if (index !== -1) {
        const deleted = store.tasks.splice(index, 1)[0];
        replyText = `Done — I deleted the task "${deleted.title}".`;
        toolData = { type: 'TASK_DELETED', taskId: deleted.id };
      } else {
        replyText = "I couldn't find that task to delete.";
      }
      break;
    }

    case 'CREATE_HABIT': {
      const { title, frequency } = intentResult.entities;
      store.habits = store.habits || [];
      const newHabit = {
        id: `hbt_${Date.now()}`,
        userId,
        title: title || 'Habit',
        frequency: frequency || 'Daily',
        streak: 0,
        completedToday: false,
        createdAt: new Date().toISOString()
      };
      store.habits.push(newHabit);

      userContext.lastHabit = newHabit;
      userContext.lastItem = { type: 'habit', id: newHabit.id, data: newHabit };
      replyText = `Done — I created the habit "${title || 'Habit'}".`;
      toolData = { type: 'HABIT_CREATED', habit: newHabit };
      break;
    }

    case 'COMPLETE_HABIT': {
      const { query } = intentResult.entities;
      store.habits = store.habits || [];
      const userHabits = store.habits.filter(h => h.userId === userId);
      const targetHabit = userHabits.find(h => h.title.toLowerCase().includes((query || '').toLowerCase())) || userHabits[0];

      if (targetHabit) {
        targetHabit.completedToday = true;
        targetHabit.streak = (targetHabit.streak || 0) + 1;
        replyText = `Great job! I've marked "${targetHabit.title}" as completed. (Streak: ${targetHabit.streak} days)`;
        toolData = { type: 'HABIT_COMPLETED', habit: targetHabit };
      } else {
        replyText = "I couldn't find that habit. What habit would you like to mark as done?";
      }
      break;
    }

    case 'BULK_POSTPONE_TASKS': {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const pendingToday = store.tasks.filter(t => t.userId === userId && !t.completed && t.dueDate <= today);
      pendingToday.forEach(t => { t.dueDate = tomorrow; });

      replyText = `Done — I moved ${pendingToday.length} unfinished task(s) to tomorrow.`;
      toolData = { type: 'BULK_ACTION_DONE', count: pendingToday.length };
      break;
    }

    case 'BULK_COMPLETE_TASKS': {
      const today = new Date().toISOString().split('T')[0];
      const pendingToday = store.tasks.filter(t => t.userId === userId && !t.completed && t.dueDate === today);
      pendingToday.forEach(t => { t.completed = true; });

      replyText = `Done — I marked all ${pendingToday.length} task(s) for today as complete.`;
      toolData = { type: 'BULK_ACTION_DONE', count: pendingToday.length };
      break;
    }

    case 'BULK_DELETE_COMPLETED_TASKS': {
      const initialLen = store.tasks.length;
      store.tasks = store.tasks.filter(t => !(t.userId === userId && t.completed));
      const deletedCount = initialLen - store.tasks.length;

      replyText = `Done — I deleted ${deletedCount} completed task(s).`;
      toolData = { type: 'BULK_ACTION_DONE', count: deletedCount };
      break;
    }

    case 'CREATE_MEMORY':
    case 'SAVE_MEMORY': {
      const { type, content, confidence } = intentResult.entities;
      const newMem = {
        id: `mem_${Date.now()}`,
        userId,
        type: type || 'Preferences',
        content,
        confidence: confidence || 0.95,
        approved: true,
        createdAt: new Date().toISOString()
      };
      store.memories.push(newMem);
      userContext.lastMemory = newMem;

      replyText = `Saved to your Memory Center: "${content}".`;
      toolData = { type: 'MEMORY_SAVED', memory: newMem };
      break;
    }

    case 'READ_MEMORIES':
    case 'GET_MEMORY': {
      const userMems = store.memories.filter(m => m.userId === userId);
      replyText = `I currently remember ${userMems.length} key item(s) in your Memory Center.`;
      toolData = { type: 'MEMORY_LIST', memories: userMems };
      break;
    }

    case 'READ_SPENDING_ANALYSIS':
    case 'GET_EXPENSE': {
      const userExpenses = store.expenses.filter(e => e.userId === userId);
      const totalIncome = userExpenses.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
      const totalSpend = userExpenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
      const netSavings = totalIncome - totalSpend;

      // Category breakdown
      const categories = {};
      userExpenses.filter(e => e.type !== 'income').forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + e.amount;
      });
      let topCategory = 'None';
      let topAmount = 0;
      for (const [cat, amt] of Object.entries(categories)) {
        if (amt > topAmount) {
          topAmount = amt;
          topCategory = cat;
        }
      }

      replyText = `Financial Analysis: You've spent ₹${totalSpend.toLocaleString()} this month (Top: ${topCategory} at ₹${topAmount.toLocaleString()}). Total Income: ₹${totalIncome.toLocaleString()} | Net Balance: ₹${netSavings.toLocaleString()}.`;
      toolData = { type: 'EXPENSE_ANALYTICS', totalIncome, totalSpend, netSavings, topCategory, topAmount };
      break;
    }

    case 'READ_TODAYS_AGENDA':
    case 'CREATE_PLAN': {
      const today = new Date().toISOString().split('T')[0];
      const userTasks = store.tasks.filter(t => t.userId === userId && !t.completed && t.dueDate === today);
      const highPriority = userTasks.filter(t => t.priority === 'High');
      store.habits = store.habits || [];
      const pendingHabits = store.habits.filter(h => h.userId === userId && !h.completedToday);

      const focusTask = highPriority[0] || userTasks[0];
      const focusText = focusTask ? `Your top focus is "${focusTask.title}".` : 'All tasks for today are clear!';

      replyText = `Today's Overview: You have ${userTasks.length} pending task(s) for today and ${pendingHabits.length} habit(s) to check off. ${focusText}`;
      toolData = { type: 'TODAYS_AGENDA', pendingTasks: userTasks, habits: pendingHabits };
      break;
    }

    case 'READ_PENDING_TASKS': {
      const today = new Date().toISOString().split('T')[0];
      const userTasks = store.tasks.filter(t => t.userId === userId && !t.completed);
      const overdue = userTasks.filter(t => t.dueDate < today);

      replyText = `You have ${userTasks.length} pending task(s) in total. ${overdue.length > 0 ? `${overdue.length} task(s) are overdue.` : 'All tasks are up to date!'}`;
      toolData = { type: 'PENDING_TASKS', pendingCount: userTasks.length, overdueCount: overdue.length };
      break;
    }

    case 'READ_SUMMARY':
    case 'GET_SUMMARY': {
      const userTasks = store.tasks.filter(t => t.userId === userId);
      const userExp = store.expenses.filter(e => e.userId === userId);
      const totalSpent = userExp.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
      const totalIncome = userExp.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
      const completedTasks = userTasks.filter(t => t.completed).length;

      replyText = `Summary Report: Completed ${completedTasks} task(s), received ₹${totalIncome.toLocaleString()}, and spent ₹${totalSpent.toLocaleString()}.`;
      toolData = { type: 'SUMMARY_REPORT', completedTasks, pendingTasks: userTasks.length - completedTasks, totalSpent, totalIncome };
      break;
    }

    case 'OPEN_EXPENSES':
    case 'OPEN_TASKS':
    case 'OPEN_HABITS':
    case 'OPEN_MEMORIES':
    case 'OPEN_SUMMARY':
    case 'OPEN_SETTINGS':
    case 'OPEN_DASHBOARD':
    case 'OPEN_CHAT': {
      replyText = `Navigating to ${intentResult.entities.route.replace('/app/', '')}...`;
      toolData = { type: 'NAVIGATE', route: intentResult.entities.route };
      break;
    }

    default: {
      const fallbacks = [
        "I'm not quite sure what you mean. Could you say that another way?",
        "I didn't quite catch that. What would you like me to do?",
        "I'm having trouble understanding that one. Give it another try.",
        "I didn't quite understand that. Try telling me what you'd like me to do."
      ];
      const randomIndex = Math.floor(Math.random() * fallbacks.length);
      replyText = fallbacks[randomIndex];
      break;
    }
  }

  const assistantMsg = {
    id: `msg_${Date.now()}_a`,
    userId,
    role: 'assistant',
    message: replyText,
    intent: intentResult.intent,
    data: toolData,
    memoryPrompt,
    createdAt: new Date().toISOString()
  };
  store.conversations.push(assistantMsg);

  db.write(store);
  res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

app.get('/api/chat/history', authenticate, (req, res) => {
  const store = db.read();
  const history = store.conversations.filter(c => c.userId === req.user.id);
  res.json(history);
});

// --- MEMORIES ENDPOINTS ---
app.get('/api/memories', authenticate, (req, res) => {
  const store = db.read();
  res.json(store.memories.filter(m => m.userId === req.user.id));
});

app.post('/api/memories', authenticate, (req, res) => {
  const { type, content, confidence, approved } = req.body;
  const store = db.read();
  const newMem = {
    id: `mem_${Date.now()}`,
    userId: req.user.id,
    type: type || 'Preferences',
    content,
    confidence: confidence || 0.90,
    approved: approved !== undefined ? approved : true,
    createdAt: new Date().toISOString()
  };
  store.memories.push(newMem);
  db.write(store);
  res.json(newMem);
});

app.put('/api/memories/:id', authenticate, (req, res) => {
  const store = db.read();
  const index = store.memories.findIndex(m => m.id === req.params.id && m.userId === req.user.id);
  if (index !== -1) {
    store.memories[index] = { ...store.memories[index], ...req.body };
    db.write(store);
    return res.json(store.memories[index]);
  }
  res.status(404).json({ error: 'Memory not found' });
});

app.delete('/api/memories/:id', authenticate, (req, res) => {
  const store = db.read();
  store.memories = store.memories.filter(m => !(m.id === req.params.id && m.userId === req.user.id));
  db.write(store);
  res.json({ success: true });
});

// --- TASKS ENDPOINTS ---
app.get('/api/tasks', authenticate, (req, res) => {
  const store = db.read();
  res.json(store.tasks.filter(t => t.userId === req.user.id));
});

app.post('/api/tasks', authenticate, (req, res) => {
  const store = db.read();
  const newTask = {
    id: `tsk_${Date.now()}`,
    userId: req.user.id,
    title: req.body.title,
    priority: req.body.priority || 'Medium',
    dueDate: req.body.dueDate || new Date().toISOString().split('T')[0],
    timeBlock: req.body.timeBlock || '18:00 - 19:00',
    category: req.body.category || 'General',
    completed: false,
    createdAt: new Date().toISOString()
  };
  store.tasks.push(newTask);
  db.write(store);
  res.json(newTask);
});

app.put('/api/tasks/:id', authenticate, (req, res) => {
  const store = db.read();
  const index = store.tasks.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (index !== -1) {
    store.tasks[index] = { ...store.tasks[index], ...req.body };
    db.write(store);
    return res.json(store.tasks[index]);
  }
  res.status(404).json({ error: 'Task not found' });
});

app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const store = db.read();
  store.tasks = store.tasks.filter(t => !(t.id === req.params.id && t.userId === req.user.id));
  db.write(store);
  res.json({ success: true });
});

// --- EXPENSES & INCOME ENDPOINTS ---
app.get('/api/expenses', authenticate, (req, res) => {
  const store = db.read();
  res.json(store.expenses.filter(e => e.userId === req.user.id));
});

app.post('/api/expenses', authenticate, (req, res) => {
  const store = db.read();
  const txType = req.body.type === 'income' ? 'income' : 'expense';
  const newExp = {
    id: `exp_${Date.now()}`,
    userId: req.user.id,
    type: txType,
    amount: parseFloat(req.body.amount),
    category: req.body.category || (txType === 'income' ? 'Other Income' : 'Other'),
    description: req.body.description || (txType === 'income' ? 'Income Received' : 'Expense'),
    date: req.body.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString()
  };
  store.expenses.push(newExp);
  db.write(store);
  res.json(newExp);
});

app.put('/api/expenses/:id', authenticate, (req, res) => {
  const store = db.read();
  const index = store.expenses.findIndex(e => e.id === req.params.id && e.userId === req.user.id);
  if (index !== -1) {
    store.expenses[index] = {
      ...store.expenses[index],
      ...req.body,
      type: req.body.type || store.expenses[index].type || 'expense',
      amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : store.expenses[index].amount
    };
    db.write(store);
    return res.json(store.expenses[index]);
  }
  res.status(404).json({ error: 'Expense not found' });
});

app.delete('/api/expenses/:id', authenticate, (req, res) => {
  const store = db.read();
  store.expenses = store.expenses.filter(e => !(e.id === req.params.id && e.userId === req.user.id));
  db.write(store);
  res.json({ success: true });
});

// --- NOTICES & SUGGESTIONS ---
app.get('/api/notices', authenticate, (req, res) => {
  const store = db.read();
  res.json(store.notices.filter(n => n.userId === req.user.id));
});

app.get('/api/suggestions/current', authenticate, (req, res) => {
  const store = db.read();
  const userId = req.user.id;
  const userMems = store.memories.filter(m => m.userId === userId);
  const userTasks = store.tasks.filter(t => t.userId === userId);
  const userExpenses = store.expenses.filter(e => e.userId === userId);

  const suggestion = generatePersonalizedSuggestion({
    memories: userMems,
    tasks: userTasks,
    expenses: userExpenses
  });

  res.json(suggestion);
});

// --- SUMMARIES ---
app.get('/api/summaries', authenticate, (req, res) => {
  const store = db.read();
  res.json(store.summaries.filter(s => s.userId === req.user.id));
});

// --- PRIVACY CONTROLS ---
app.post('/api/privacy/export', authenticate, (req, res) => {
  const store = db.read();
  const userId = req.user.id;
  const exportData = {
    user: store.users.find(u => u.id === userId),
    memories: store.memories.filter(m => m.userId === userId),
    tasks: store.tasks.filter(t => t.userId === userId),
    expenses: store.expenses.filter(e => e.userId === userId),
    conversations: store.conversations.filter(c => c.userId === userId),
    exportDate: new Date().toISOString()
  };
  res.json(exportData);
});

app.post('/api/privacy/clear-history', authenticate, (req, res) => {
  const store = db.read();
  store.conversations = store.conversations.filter(c => c.userId !== req.user.id);
  db.write(store);
  res.json({ success: true, message: 'Chat history cleared successfully.' });
});

db.ready
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Luna Engine Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });
