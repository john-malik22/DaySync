import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { db } from './db.js';
import { classifyIntent } from './intentEngine.js';
import { detectPotentialMemory } from './memoryEngine.js';
import { generatePersonalizedSuggestion } from './suggestionEngine.js';
import { calculateEndDate, parseDuration, formatHumanDate } from '../src/services/dateUtils.js';

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

  // Safety Threshold: Confidence < 0.60 or UNKNOWN intent MUST NOT execute any action
  if (intentResult.confidence < 0.60 || intentResult.intent === 'UNKNOWN') {
    const fallbacks = [
      "I'm not quite sure what you mean. Could you say that another way?",
      "I didn't quite catch that. What would you like me to do?",
      "I'm having trouble understanding that one. Give it another try.",
      "I didn't quite understand that. Try telling me what you'd like me to do."
    ];
    replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  } else {
    switch (intentResult.intent) {
      case 'READ_EXPENSES': {
        const userExps = store.expenses.filter(e => e.userId === userId && e.type !== 'income');
        const limit = intentResult.entities.limit;
        const displayExps = limit ? userExps.slice(-limit) : userExps;

        if (displayExps.length === 0) {
          replyText = "You have no recorded expenses yet.";
        } else {
          const countText = limit ? `last ${displayExps.length}` : 'recent';
          const listText = displayExps.map((e, i) => `${i + 1}. ${e.description || e.category} — ₹${e.amount}`).join('\n');
          replyText = `Here are your ${countText} expenses:\n${listText}`;
        }
        toolData = { type: 'EXPENSES_LIST', expenses: displayExps };
        break;
      }

      case 'READ_LAST_EXPENSE': {
        const userExps = store.expenses.filter(e => e.userId === userId && e.type !== 'income');
        const lastExp = userExps[userExps.length - 1];

        if (lastExp) {
          replyText = `Your last expense was ₹${lastExp.amount} for ${lastExp.description || lastExp.category} (Category: ${lastExp.category}).`;
          toolData = { type: 'LAST_EXPENSE', expense: lastExp };
        } else {
          replyText = "You have no recorded expenses yet.";
        }
        break;
      }

      case 'READ_PENDING_TASKS': {
        const pending = store.tasks.filter(t => t.userId === userId && !t.completed);

        if (pending.length === 0) {
          replyText = "You have no pending tasks right now. Great job!";
        } else {
          const listText = pending.map((t, i) => `${i + 1}. ${t.title} (Due: ${t.dueDate === new Date().toISOString().split('T')[0] ? 'today' : t.dueDate}${t.timeBlock ? ' at ' + t.timeBlock.split(' - ')[0] : ''})`).join('\n');
          replyText = `Here are your pending tasks:\n${listText}`;
        }
        toolData = { type: 'PENDING_TASKS', tasks: pending };
        break;
      }

      case 'READ_TODAYS_TASKS': {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = store.tasks.filter(t => t.userId === userId && !t.completed && t.dueDate === today);

        if (todayTasks.length === 0) {
          replyText = "You have no tasks scheduled for today. Enjoy your day!";
        } else {
          const listText = todayTasks.map((t, i) => `${i + 1}. ${t.title}${t.timeBlock ? ' at ' + t.timeBlock.split(' - ')[0] : ''}`).join('\n');
          replyText = `Here are your tasks for today:\n${listText}`;
        }
        toolData = { type: 'TODAYS_TASKS', tasks: todayTasks };
        break;
      }

      case 'READ_PLANS': {
        const userPlans = store.expenses.filter(e => e.userId === userId && (e.isPlan || e.isRecurring || e.frequency || ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category)));
        if (userPlans.length === 0) {
          replyText = "You have no active plans or recurring payments recorded.";
        } else {
          const listText = userPlans.map((p, i) => `${i + 1}. ${p.description || p.category} — ₹${p.amount}/${p.frequency || 'month'} (Ends: ${p.endDate || 'N/A'})`).join('\n');
          replyText = `Here are your active plans & recurring commitments:\n${listText}`;
        }
        toolData = { type: 'PLANS_LIST', plans: userPlans };
        break;
      }

      case 'CREATE_PLAN': {
        const { title, amount, frequency, duration, startDate } = intentResult.entities;
        const start = startDate || new Date().toISOString().split('T')[0];
        const freq = frequency || 'Monthly';
        const parsedDur = parseDuration(duration, freq);
        const endDate = calculateEndDate(start, parsedDur, freq);

        const newPlanExp = {
          id: `exp_${Date.now()}`,
          userId,
          type: 'expense',
          isPlan: true,
          isRecurring: true,
          amount: amount || 199,
          category: 'Subscriptions',
          description: title || 'Recurring Plan',
          frequency: freq,
          duration: `${parsedDur.durationValue} ${parsedDur.durationUnit}`,
          durationValue: parsedDur.durationValue,
          durationUnit: parsedDur.durationUnit,
          startDate: start,
          endDate: endDate,
          nextDueDate: endDate,
          date: start,
          createdAt: new Date().toISOString()
        };

        store.expenses.push(newPlanExp);
        replyText = `Done — I added "${newPlanExp.description}" (₹${newPlanExp.amount}/${freq}) starting ${start} through ${endDate}.`;
        toolData = { type: 'PLAN_CREATED', plan: newPlanExp };
        break;
      }

      case 'READ_BIRTHDAYS': {
        const birthdays = store.tasks.filter(t => t.userId === userId && (t.taskType === 'birthday' || t.isBirthday || (t.title && t.title.toLowerCase().includes('birthday'))));
        if (birthdays.length === 0) {
          replyText = "You have no upcoming birthday reminders saved.";
        } else {
          const listText = birthdays.map((b, i) => `${i + 1}. 🎂 ${b.personName || b.title} (Date: ${b.dueDate || b.date || 'Upcoming'})`).join('\n');
          replyText = `Here are your upcoming birthdays:\n${listText}`;
        }
        toolData = { type: 'BIRTHDAYS_LIST', birthdays };
        break;
      }

      case 'READ_MEETINGS': {
        const meetings = store.tasks.filter(t => t.userId === userId && (t.taskType === 'meeting' || t.isMeeting || (t.title && t.title.toLowerCase().includes('meeting'))));
        if (meetings.length === 0) {
          replyText = "You have no upcoming meetings scheduled.";
        } else {
          const listText = meetings.map((m, i) => `${i + 1}. 📅 ${m.title} (Date: ${m.dueDate || m.date || 'Upcoming'})`).join('\n');
          replyText = `Here are your upcoming meetings:\n${listText}`;
        }
        toolData = { type: 'MEETINGS_LIST', meetings };
        break;
      }

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
          title: title || 'Task',
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
        userContext.pendingAction = null;

        const dateStr = dueDate === new Date().toISOString().split('T')[0] ? 'today' : 'tomorrow';
        const timeStr = timeBlock ? ` at ${timeBlock.split(' - ')[0]}` : '';
        replyText = `Done — I added "${newTask.title}" for ${dateStr}${timeStr}.`;
        toolData = { type: 'TASK_CREATED', task: newTask };
        break;
      }

      case 'CANCEL': {
        userContext.pendingAction = null;
        userContext.pendingClarification = null;
        replyText = "Cancelled — no item was created.";
        break;
      }

      case 'CONTINUE_PENDING_TASK': {
        userContext.pendingAction = intentResult.pendingAction;
        const missing = intentResult.pendingAction.missing || [];
        if (missing.includes('title')) replyText = "What should I call it?";
        else if (missing.includes('dueDate')) replyText = "When is it due?";
        else if (missing.includes('time')) {
          const title = intentResult.pendingAction.entities.title || 'it';
          replyText = `What time should I set "${title}" for?`;
        } else {
          replyText = "What time?";
        }
        break;
      }

      case 'CONTINUE_PENDING_EXPENSE': {
        userContext.pendingAction = intentResult.pendingAction;
        const missing = intentResult.pendingAction.missing || [];
        if (missing.includes('amount')) replyText = "How much did you spend?";
        else if (missing.includes('description') || missing.includes('category')) replyText = "What was it for?";
        break;
      }

      case 'CONTINUE_PENDING_HABIT': {
        userContext.pendingAction = intentResult.pendingAction;
        const missing = intentResult.pendingAction.missing || [];
        if (missing.includes('title')) replyText = "What habit would you like to create?";
        else if (missing.includes('frequency')) replyText = "How often would you like to do it?";
        break;
      }

      case 'CONTINUE_PENDING_GOAL': {
        userContext.pendingAction = intentResult.pendingAction;
        const missing = intentResult.pendingAction.missing || [];
        if (missing.includes('title')) replyText = "What goal would you like to set?";
        else if (missing.includes('deadline')) replyText = "When should you complete it?";
        break;
      }

      case 'CREATE_GOAL': {
        const { title, deadline } = intentResult.entities;
        store.goals = store.goals || [];
        const newGoal = {
          id: `gol_${Date.now()}`,
          userId,
          title: title || 'Goal',
          targetDate: deadline || 'Soon',
          completed: false,
          createdAt: new Date().toISOString()
        };
        store.goals.push(newGoal);

        userContext.lastGoal = newGoal;
        userContext.lastItem = { type: 'goal', id: newGoal.id, data: newGoal };
        userContext.pendingAction = null;
        replyText = `Done — I created the goal "${newGoal.title}" with target date ${newGoal.targetDate}.`;
        toolData = { type: 'GOAL_CREATED', goal: newGoal };
        break;
      }

      case 'UPDATE_MEMORY': {
        const { memoryId, content } = intentResult.entities;
        const mem = store.memories.find(m => m.id === memoryId && m.userId === userId) || userContext.lastMemory;
        if (mem && content) {
          mem.content = content;
          userContext.pendingAction = null;
          replyText = `Done — I updated your saved memory: "${content}".`;
          toolData = { type: 'MEMORY_UPDATED', memory: mem };
        } else {
          replyText = "I couldn't find the memory to update.";
        }
        break;
      }

      case 'ORPHAN_NUMBER': {
        replyText = `I'm not sure what ${message} refers to. What would you like me to set to ${message}?`;
        break;
      }

      case 'ORPHAN_UPDATE': {
        replyText = "I'm not sure what you'd like changed. What should I update?";
        break;
      }

      case 'INCOMPLETE_TASK': {
        userContext.pendingClarification = { intent: 'INCOMPLETE_TASK', entities: intentResult.entities };
        replyText = "What task should I add?";
        break;
      }

      case 'AMBIGUOUS_FINANCIAL': {
        userContext.pendingClarification = { intent: 'AMBIGUOUS_FINANCIAL', entities: intentResult.entities };
        replyText = `Should I record ₹${intentResult.entities.amount} as an expense or income?`;
        break;
      }

      case 'AMBIGUOUS_DELETE': {
        replyText = "Which item would you like to delete?";
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
        if (userMems.length === 0) {
          replyText = "Your Memory Center is currently empty.";
        } else {
          const listText = userMems.map((m, i) => `${i + 1}. ${m.content}`).join('\n');
          replyText = `Here are your saved memories:\n${listText}`;
        }
        toolData = { type: 'MEMORY_LIST', memories: userMems };
        break;
      }

      case 'READ_SPENDING_ANALYSIS':
      case 'GET_EXPENSE': {
        const userExpenses = store.expenses.filter(e => e.userId === userId);
        const totalIncome = userExpenses.filter(e => e.type === 'income').reduce((a, b) => a + b.amount, 0);
        const totalSpend = userExpenses.filter(e => e.type !== 'income').reduce((a, b) => a + b.amount, 0);
        const netSavings = totalIncome - totalSpend;

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
        replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        break;
      }
    }
  }

  // Development Debug Logging
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n[LUNA DEBUG] -------------------------------------');
    console.log('[LUNA DEBUG] USER MESSAGE:   ', message);
    console.log('[LUNA DEBUG] DETECTED INTENT:', intentResult.intent);
    console.log('[LUNA DEBUG] CONFIDENCE:     ', intentResult.confidence);
    console.log('[LUNA DEBUG] ENTITIES:       ', intentResult.entities);
    console.log('[LUNA DEBUG] REPLY TEXT:     ', replyText);
    console.log('[LUNA DEBUG] -------------------------------------\n');
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
  let modified = false;
  const userExps = (store.expenses || []).filter(e => e.userId === req.user.id);

  // Auto-migration & fallback for existing plan records lacking endDate
  userExps.forEach(e => {
    if ((e.isPlan || e.isRecurring || e.frequency) && !e.endDate) {
      const startDate = e.startDate || e.date || new Date().toISOString().split('T')[0];
      const parsedDur = parseDuration(e.durationValue ? { value: e.durationValue, unit: e.durationUnit } : e.duration, e.frequency);
      e.durationValue = parsedDur.durationValue;
      e.durationUnit = parsedDur.durationUnit;
      e.endDate = calculateEndDate(startDate, parsedDur, e.frequency);
      e.nextDueDate = e.endDate;
      modified = true;
    }
  });

  if (modified) db.write(store);
  res.json(userExps);
});

app.post('/api/expenses', authenticate, (req, res) => {
  const store = db.read();
  const txType = req.body.type === 'income' ? 'income' : 'expense';
  const isPlan = Boolean(req.body.isPlan || req.body.isRecurring || req.body.frequency);
  const startDate = req.body.startDate || req.body.date || new Date().toISOString().split('T')[0];

  let durationVal = req.body.durationValue;
  let durationUnit = req.body.durationUnit;
  let endDate = req.body.endDate;

  if (isPlan) {
    const parsedDur = parseDuration(
      req.body.durationValue ? { value: req.body.durationValue, unit: req.body.durationUnit } : req.body.duration,
      req.body.frequency
    );
    durationVal = parsedDur.durationValue;
    durationUnit = parsedDur.durationUnit;
    endDate = calculateEndDate(startDate, parsedDur, req.body.frequency);
  }

  const newExp = {
    id: `exp_${Date.now()}`,
    userId: req.user.id,
    type: txType,
    amount: parseFloat(req.body.amount),
    category: req.body.category || (txType === 'income' ? 'Other Income' : 'Other'),
    description: req.body.description || (txType === 'income' ? 'Income Received' : 'Expense'),
    date: startDate,
    startDate: isPlan ? startDate : null,
    isPlan,
    isRecurring: isPlan,
    frequency: isPlan ? (req.body.frequency || 'Monthly') : null,
    duration: isPlan ? (req.body.duration || `${durationVal} ${durationUnit}`) : null,
    durationValue: isPlan ? durationVal : null,
    durationUnit: isPlan ? durationUnit : null,
    endDate: isPlan ? endDate : null,
    nextDueDate: isPlan ? endDate : null,
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
    const existing = store.expenses[index];
    const isPlan = Boolean(req.body.isPlan ?? existing.isPlan ?? existing.isRecurring ?? existing.frequency);
    const startDate = req.body.startDate || req.body.date || existing.startDate || existing.date || new Date().toISOString().split('T')[0];
    const freq = req.body.frequency || existing.frequency || 'Monthly';

    let durationVal = req.body.durationValue || existing.durationValue;
    let durationUnit = req.body.durationUnit || existing.durationUnit;
    let endDate = req.body.endDate;

    if (isPlan) {
      const parsedDur = parseDuration(
        req.body.durationValue ? { value: req.body.durationValue, unit: req.body.durationUnit } : (req.body.duration || existing.duration),
        freq
      );
      durationVal = parsedDur.durationValue;
      durationUnit = parsedDur.durationUnit;
      endDate = calculateEndDate(startDate, parsedDur, freq);
    }

    store.expenses[index] = {
      ...existing,
      ...req.body,
      type: req.body.type || existing.type || 'expense',
      amount: req.body.amount !== undefined ? parseFloat(req.body.amount) : existing.amount,
      startDate: isPlan ? startDate : null,
      isPlan,
      isRecurring: isPlan,
      frequency: isPlan ? freq : null,
      durationValue: isPlan ? durationVal : null,
      durationUnit: isPlan ? durationUnit : null,
      endDate: isPlan ? endDate : null,
      nextDueDate: isPlan ? endDate : null
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

// --- NOTIFICATION SYSTEM BACKEND ---
function generateUserNotifications(userId, store) {
  store.notifications = store.notifications || [];
  const todayStr = new Date().toISOString().split('T')[0];
  const userTasks = (store.tasks || []).filter(t => t.userId === userId);
  const userExpenses = (store.expenses || []).filter(e => e.userId === userId);

  const addIfNew = (notif) => {
    const exists = store.notifications.some(n => n.userId === userId && n.eventKey === notif.eventKey);
    if (!exists) {
      store.notifications.push({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId,
        read: false,
        createdAt: new Date().toISOString(),
        ...notif
      });
    }
  };

  // 1. Task Due & Overdue Notifications
  userTasks.forEach(task => {
    if (!task.completed) {
      if (task.dueDate === todayStr) {
        addIfNew({
          type: 'TASK',
          title: 'Task due today',
          message: `"${task.title}" is scheduled for today.`,
          priority: task.priority === 'High' ? 'HIGH' : 'NORMAL',
          relatedType: 'task',
          relatedId: task.id,
          actionUrl: '/app/task',
          eventKey: `task-due:${task.id}:${todayStr}`
        });
      } else if (task.dueDate < todayStr) {
        addIfNew({
          type: 'TASK',
          title: 'Task overdue',
          message: `"${task.title}" was due on ${task.dueDate}.`,
          priority: 'HIGH',
          relatedType: 'task',
          relatedId: task.id,
          actionUrl: '/app/task',
          eventKey: `task-overdue:${task.id}:${todayStr}`
        });
      }
    }
  });

  // 2. Budget Alert Notifications
  const currentMonth = todayStr.substring(0, 7);
  const monthlyExpenses = userExpenses.filter(e => e.type !== 'income' && e.date && e.date.startsWith(currentMonth));
  const totalSpent = monthlyExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const budgetTarget = 10000;

  if (totalSpent >= budgetTarget) {
    addIfNew({
      type: 'BUDGET',
      title: 'Budget exceeded',
      message: `You've spent ₹${totalSpent.toLocaleString()} this month.`,
      priority: 'HIGH',
      relatedType: 'expense',
      actionUrl: '/app/expenses',
      eventKey: `budget-exceeded:${userId}:${currentMonth}`
    });
  } else if (totalSpent >= budgetTarget * 0.8) {
    addIfNew({
      type: 'BUDGET',
      title: 'Approaching budget limit',
      message: `You've spent ₹${totalSpent.toLocaleString()} (over 80% of monthly budget).`,
      priority: 'NORMAL',
      relatedType: 'expense',
      actionUrl: '/app/expenses',
      eventKey: `budget-warning:${userId}:${currentMonth}`
    });
  }

  // 3. Luna Daily Focus Notification
  const pendingCount = userTasks.filter(t => !t.completed).length;
  if (pendingCount >= 3) {
    addIfNew({
      type: 'LUNA',
      title: 'Luna Daily Plan',
      message: `You have ${pendingCount} pending tasks. Ask Luna to organize your day!`,
      priority: 'NORMAL',
      relatedType: 'luna',
      actionUrl: '/app/chat',
      eventKey: `luna-tasks-notice:${userId}:${todayStr}`
    });
  }

  // 4. PLAN NOTIFICATIONS (Category PLAN — 5 days prior notification)
  const userPlans = userExpenses.filter(e => e.isPlan || e.isRecurring || e.frequency || ['Recharges', 'Subscriptions', 'Electricity Bill'].includes(e.category));
  userPlans.forEach(plan => {
    const targetDateStr = plan.endDate || plan.nextDueDate || calculateEndDate(plan.startDate || plan.date, plan.durationValue || plan.duration, plan.frequency);
    if (targetDateStr) {
      try {
        const targetTime = new Date(targetDateStr).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));
        if (diffDays <= 5 && diffDays >= 0) {
          addIfNew({
            type: 'PLAN',
            title: `${plan.category || 'Plan'} Expiry / Due Soon`,
            message: `"${plan.description || plan.category}" (₹${plan.amount}) is due/expiring on ${targetDateStr}.`,
            priority: 'NORMAL',
            relatedType: 'expense',
            relatedId: plan.id,
            actionUrl: '/app/plans',
            eventKey: `plan:${plan.id}:${targetDateStr}:5day`
          });
        }
      } catch(e) {}
    }
  });

  // 5. BIRTHDAY NOTIFICATIONS (5 days prior notification)
  const userBirthdays = userTasks.filter(t => t.taskType === 'birthday' || t.isBirthday || (t.title && t.title.toLowerCase().includes('birthday')));
  userBirthdays.forEach(bday => {
    const targetDateStr = bday.dueDate || bday.date;
    if (targetDateStr) {
      try {
        const targetTime = new Date(targetDateStr).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));
        if (diffDays <= 5 && diffDays >= 0) {
          addIfNew({
            type: 'TASK',
            title: '🎂 Upcoming Birthday',
            message: `🎂 ${bday.personName || bday.title}'s birthday is in ${diffDays} day${diffDays === 1 ? '' : 's'}.`,
            priority: 'NORMAL',
            relatedType: 'task',
            relatedId: bday.id,
            actionUrl: '/app/task',
            eventKey: `birthday:${bday.id}:${targetDateStr}:5day`
          });
        }
      } catch(e) {}
    }
  });

  // 6. DAILY BASELINE FALLBACK NOTIFICATION (Category 9: DAILY)
  const dbUser = (store.users || []).find(u => u.id === userId);
  const isDailyEnabled = dbUser?.preferences?.daily !== false && dbUser?.preferences?.dailyNotification !== false;

  if (isDailyEnabled) {
    // Check if user has ALREADY received any notification created today
    const hasNotificationToday = (store.notifications || []).some(n => {
      return n.userId === userId && n.createdAt && n.createdAt.startsWith(todayStr);
    });

    // If NO notification exists today, create exactly ONE DAILY fallback notification
    if (!hasNotificationToday) {
      const dailyMessages = [
        "☀️ Good morning! Ready to make today productive?",
        "✨ New day, fresh start. What would you like to accomplish today?",
        "🧠 Luna is ready whenever you need help planning your day.",
        "🌱 Small progress every day adds up. What will you work on today?",
        "💡 No plans yet? Start with one small task."
      ];

      const dayOfMonth = new Date().getDate();
      const selectedMessage = dailyMessages[dayOfMonth % dailyMessages.length];

      addIfNew({
        type: 'DAILY',
        title: '☀️ DayStart Greeting',
        message: selectedMessage,
        priority: 'NORMAL',
        relatedType: 'system',
        actionUrl: '/app/dashboard',
        eventKey: `daily:${userId}:${todayStr}`
      });
    }
  }
}

app.get('/api/notifications', authenticate, (req, res) => {
  const store = db.read();
  const userId = req.user.id;

  generateUserNotifications(userId, store);
  db.write(store);

  const userNotifications = (store.notifications || [])
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(userNotifications);
});

app.post('/api/notifications', authenticate, (req, res) => {
  const store = db.read();
  store.notifications = store.notifications || [];
  const userId = req.user.id;

  const { type, title, message, priority, relatedType, relatedId, actionUrl, eventKey } = req.body;

  if (eventKey) {
    const exists = store.notifications.some(n => n.userId === userId && n.eventKey === eventKey);
    if (exists) {
      return res.json(store.notifications.find(n => n.userId === userId && n.eventKey === eventKey));
    }
  }

  const newNotif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId,
    type: type || 'SYSTEM',
    title: title || 'Notification',
    message: message || '',
    read: false,
    createdAt: new Date().toISOString(),
    priority: priority || 'NORMAL',
    relatedType: relatedType || 'system',
    relatedId: relatedId || null,
    actionUrl: actionUrl || '/app/dashboard',
    eventKey: eventKey || null
  };

  store.notifications.push(newNotif);
  db.write(store);
  res.json(newNotif);
});

app.put('/api/notifications/:id/read', authenticate, (req, res) => {
  const store = db.read();
  store.notifications = store.notifications || [];
  const notif = store.notifications.find(n => n.id === req.params.id && n.userId === req.user.id);

  if (notif) {
    notif.read = true;
    db.write(store);
    return res.json(notif);
  }
  res.status(404).json({ error: 'Notification not found' });
});

app.post('/api/notifications/mark-all-read', authenticate, (req, res) => {
  const store = db.read();
  store.notifications = store.notifications || [];

  store.notifications.forEach(n => {
    if (n.userId === req.user.id) {
      n.read = true;
    }
  });

  db.write(store);
  res.json({ success: true });
});

app.delete('/api/notifications/clear-all', authenticate, (req, res) => {
  const store = db.read();
  store.notifications = store.notifications || [];
  store.notifications = store.notifications.filter(n => n.userId !== req.user.id);

  db.write(store);
  res.json({ success: true });
});

app.delete('/api/notifications/:id', authenticate, (req, res) => {
  const store = db.read();
  store.notifications = store.notifications || [];
  store.notifications = store.notifications.filter(n => !(n.id === req.params.id && n.userId === req.user.id));

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
  const dbUser = (store.users || []).find(u => u.id === userId);

  // Construct explicitly safe user object (removing passwordHash, tokens, secrets)
  const safeUser = {
    name: dbUser?.name || 'DaySync User',
    email: dbUser?.email || '',
    preferences: dbUser?.preferences || {},
    createdAt: dbUser?.createdAt || null
  };

  const exportData = {
    user: safeUser,
    tasks: (store.tasks || []).filter(t => t.userId === userId),
    expenses: (store.expenses || []).filter(e => e.userId === userId),
    habits: (store.habits || []).filter(h => h.userId === userId),
    goals: (store.goals || []).filter(g => g.userId === userId),
    memories: (store.memories || []).filter(m => m.userId === userId),
    notifications: (store.notifications || []).filter(n => n.userId === userId),
    conversations: (store.conversations || []).filter(c => c.userId === userId),
    summaries: (store.summaries || []).filter(s => s.userId === userId),
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
