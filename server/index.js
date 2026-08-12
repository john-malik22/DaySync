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
const JWT_SECRET = process.env.JWT_SECRET;

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

// --- AI CHAT & INTENT ROUTE ---
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

  const intentResult = classifyIntent(message);
  let replyText = '';
  let toolData = null;
  let memoryPrompt = null;

  switch (intentResult.intent) {
    case 'ADD_EXPENSE': {
      const { type, amount, category, description } = intentResult.entities;
      const txType = type || 'expense';
      const newExp = {
        id: `exp_${Date.now()}`,
        userId,
        type: txType,
        amount,
        category,
        description,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      store.expenses.push(newExp);
      replyText = txType === 'income'
        ? `I've recorded an income entry of ₹${amount} under ${category} (${description}).`
        : `I've recorded an expense of ₹${amount} under ${category} (${description}).`;
      toolData = { type: 'EXPENSE_ADDED', expense: newExp };
      break;
    }

    case 'GET_EXPENSE': {
      const userExpenses = store.expenses.filter(e => e.userId === userId);
      const totalIncome = userExpenses.filter(e => e.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const totalSpend = userExpenses.filter(e => e.type !== 'income').reduce((acc, curr) => acc + curr.amount, 0);
      const netSavings = totalIncome - totalSpend;
      replyText = `Financial Summary: Income Received ₹${totalIncome.toLocaleString()} | Expenses Spent ₹${totalSpend.toLocaleString()} | Net Balance ₹${netSavings.toLocaleString()}.`;
      toolData = { type: 'EXPENSE_ANALYTICS', totalIncome, totalSpend, netSavings, count: userExpenses.length };
      break;
    }

    case 'CREATE_TASK': {
      const { title, priority, dueDate, category } = intentResult.entities;
      const newTask = {
        id: `tsk_${Date.now()}`,
        userId,
        title,
        priority,
        dueDate,
        category: category || 'Personal',
        completed: false,
        createdAt: new Date().toISOString()
      };
      store.tasks.push(newTask);
      replyText = `Added "${title}" to your tasks (Priority: ${priority}, Due: ${dueDate}).`;
      toolData = { type: 'TASK_CREATED', task: newTask };
      break;
    }

    case 'SAVE_MEMORY': {
      const { type, content, confidence } = intentResult.entities;
      const newMem = {
        id: `mem_${Date.now()}`,
        userId,
        type,
        content,
        confidence,
        approved: true,
        createdAt: new Date().toISOString()
      };
      store.memories.push(newMem);
      replyText = `Saved to your Memory Center: "${content}".`;
      toolData = { type: 'MEMORY_SAVED', memory: newMem };
      break;
    }

    case 'GET_MEMORY': {
      const userMems = store.memories.filter(m => m.userId === userId);
      replyText = `I currently remember ${userMems.length} key facts about you.`;
      toolData = { type: 'MEMORY_LIST', memories: userMems };
      break;
    }

    case 'CREATE_PLAN': {
      const userTasks = store.tasks.filter(t => t.userId === userId && !t.completed);
      replyText = `Here is your customized agenda for today: Complete your high-priority tasks and focus sessions.`;
      toolData = { type: 'PLAN_GENERATED', tasks: userTasks };
      break;
    }

    case 'GET_SUMMARY': {
      const userTasks = store.tasks.filter(t => t.userId === userId);
      const userExp = store.expenses.filter(e => e.userId === userId);
      const totalSpent = userExp.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
      const totalIncome = userExp.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
      const completedTasks = userTasks.filter(t => t.completed).length;
      replyText = `Daily Summary: Completed ${completedTasks} task(s), received ₹${totalIncome}, and spent ₹${totalSpent}.`;
      toolData = { type: 'SUMMARY_REPORT', completedTasks, pendingTasks: userTasks.length - completedTasks, totalSpent, totalIncome };
      break;
    }

    default: {
      const memCheck = detectPotentialMemory(message);
      if (memCheck.shouldPrompt) {
        memoryPrompt = memCheck;
        replyText = `I hear you! ${memCheck.promptText}`;
      } else {
        replyText = `I understand. I'm keeping track of your daily agenda and expenses so you can focus on what matters most. What would you like to log or plan right now?`;
      }
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
