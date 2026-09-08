DaySync

<p align="center">
  <strong>Your intelligent everyday life companion.</strong>
</p>

<p align="center">
  Tasks • Expenses • Plans • Splits • Notifications • Luna AI
</p>

<p align="center">
  <a href="https://github.com/john-malik22/DaySync">
    <img src="https://img.shields.io/badge/GitHub-DaySync-181717?style=for-the-badge&logo=github" alt="GitHub">
  </a>
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-API-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Capacitor-Android-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor">
</p>

📖 About DaySync

DaySync is an intelligent personal life-management application that brings everyday planning, money management, shared expenses, reminders, notifications, and AI assistance into one place.

Instead of switching between multiple apps, DaySync provides a unified experience for organizing daily tasks, tracking expenses, managing plans and subscriptions, sharing expenses with friends, receiving useful notifications, and interacting with Luna AI.

DaySync is designed as a mobile-first application and can run as a web/PWA application and as an Android application powered by Capacitor.

✨ Features

📊 Dashboard & Widgets

Customizable dashboard

S / W / T / L widget sizes

Real DaySync data

Drag/rearrange widget layouts

Reset dashboard layout

Responsive content based on widget size

Clean empty states

Live updates when underlying data changes

✅ Tasks

Add, edit, complete, and delete tasks

Due dates and times

Priority levels

Task history

Recent-first history

Fast optimistic UI updates

Task detail popup

Birthday management

Meeting management

💰 Expenses

Track spending and received money

Categories

Transaction history

Edit and delete transactions

Financial summary

Plans, subscriptions, and recharge entries

Recent-first history

Expense detail popup

Fast optimistic updates

Offline-friendly changes

🔄 Plans & Subscriptions

Create plans

Recurring items

Start dates

Next payment / expiry information

Pause and resume

Edit and delete

Instant status updates

Subscription reminders

🤝 Shared Splits

Create shared expense groups

Share and join using split codes

Join-code normalization

Member management

Shared expenses

Balance tracking

Settlement information

Split history

Individual entry edit/delete

Recent-first ordering

Immediate local updates

🔔 Notifications

Notification categories include:

Tasks & reminders

Plans & subscriptions

Splits & group expenses

Expenses & transactions

Memes & reactions

Luna AI

Birthdays / important people

Meetings & schedules

Additional capabilities:

Per-category notification preferences

Quiet hours

Test notifications

Native Android notifications

Notification grouping

Useful notification priorities

Duplicate notification prevention

🤖 Luna AI

Luna is DaySync's intelligent conversational assistant.

Luna can handle:

Greetings and casual conversation

DaySync questions

Everyday questions

Productivity requests

Natural-language actions

Multi-turn conversations

Context-aware follow-ups

Task and expense actions

Daily summaries and useful information

Examples:

Hello Luna

What tasks do I have today?

Show my recent expenses

How much did I spend this month?

Add that as a task

Change it to tomorrow

Show me that again

What should I focus on today?

Luna is designed to distinguish between normal conversation, questions, and DaySync actions.

🧠 Luna Conversation & Intent System

The backend intent system supports conversational and action-oriented intents such as:

GREETING

HOW_ARE_YOU

GRATITUDE

FAREWELL

ASSISTANT_CAPABILITIES

HELP_QUESTION

CONTEXT_FOLLOWUP

GENERAL_CHAT

READ_TODAYS_EXPENSES

READ_OVERDUE_TASKS

Task-related intents

Expense-related intents

Plan-related intents

Split-related intents

The goal is to make Luna behave like a conversational assistant instead of requiring users to enter rigid commands.

📴 Offline Support

DaySync is designed to remain useful during temporary connectivity problems.

Cached data remains available

Optimistic updates

Local changes can be queued

Automatic synchronization when online

Temporary/local ID handling

Duplicate sync prevention

Protection against stale server responses

Local state preserved during temporary API failures

Example:

No Internet
   ↓
User adds expense
   ↓
Expense appears immediately
   ↓
Saved locally
   ↓
Connection returns
   ↓
Background synchronization

🔐 Authentication

DaySync includes persistent account authentication.

Features

Login

Signup

Email verification

OTP verification

Forgot Password

Password reset

Persistent sessions

Session restoration after app restart

Secure password hashing

Account deletion

Signup Flow

Signup
  ↓
Enter account details
  ↓
Verification OTP
  ↓
Verify OTP
  ↓
Create permanent user account
  ↓
Generate user ID
  ↓
Continue onboarding

Password Reset

Forgot Password
      ↓
Enter email
      ↓
OTP sent
      ↓
Verify OTP
      ↓
Reset token
      ↓
Set new password
      ↓
Login

💾 Data Management

Export

Export supported DaySync data as JSON.

Restore

Restore a previously exported JSON backup after validation.

Clear Data

Clear user-created DaySync data while keeping the authentication session active.

Account Actions

Clear Data
→ Resets DaySync data

Log Out
→ Ends the current authentication session

Delete Account
→ Deletes the account

🎨 UI & Design

DaySync uses a modern mobile-first interface.

Dark Theme

Near-black background

Dark surfaces

White/light text

Gray secondary text

DaySync blue/purple accents

Light Theme

Warm white / cream background

Light surfaces

Dark text

Gray secondary text

DaySync blue/purple accents

Design Principles

Minimal visual clutter

Responsive layouts

Compact controls

Consistent history interactions

Detail modals

Touch-friendly controls

Mobile-safe keyboard handling

Fixed bottom navigation

Smooth page transitions

📱 Mobile Navigation

Home
Tasks
Expenses
Plans
Splits
Profile

The Profile section contains Settings and account management.

🛠️ Technology Stack

Frontend

React

JavaScript / JSX

Vite

CSS

PWA support

Backend

Node.js

Express

REST API

JSON/data-store architecture

Mobile

Capacitor

Android

Native Android plugins

Android notification APIs

Native APK installer/update support

Email

Brevo Transactional Email API

Deployment

Vercel

Render

GitHub

📁 Project Structure

DaySync/
├── android/
│   └── Capacitor Android project
├── public/
│   ├── version.json
│   └── static assets
├── server/
│   ├── index.js
│   ├── db.js
│   ├── emailService.js
│   ├── intentEngine.js
│   ├── memoryEngine.js
│   ├── routineEngine.js
│   └── suggestionEngine.js
├── src/
│   ├── components/
│   ├── context/
│   ├── pages/
│   └── services/
├── capacitor.config.json
├── package.json
├── vite.config.js
└── README.md

🔄 Update System

The Android update architecture checks GitHub Releases for a newer APK.

Installed DaySync
       ↓
Check for Update
       ↓
GitHub Releases API
       ↓
Find release with APK
       ↓
Download APK
       ↓
Android Package Installer
       ↓
User confirms installation
       ↓
Updated DaySync

The updater should use the actual APK asset download URL rather than a GitHub release webpage.

⚡ Performance Guidelines

DaySync should prioritize immediate user interactions.

Preferred:

User Action
    ↓
Immediate UI Update
    ↓
Background Synchronization

Avoid:

User Action
    ↓
Wait for Server
    ↓
Refetch Everything
    ↓
Update UI

Performance work should focus on:

minimizing duplicate requests

reducing unnecessary renders

avoiding blocking background operations

preventing stale responses

stable scrolling

efficient widget rendering

responsive mobile layouts

🛡️ Security & Data Safety

DaySync should follow these principles:

Keep user data isolated by account.

Never expose API keys or secrets.

Never log passwords, tokens, or OTP values.

Keep authentication credentials separate from user-data exports.

Validate backup files before restoring.

Keep Clear Data separate from Log Out.

Keep Delete Account separate from Clear Data.

Preserve local user changes during temporary network failures.

Require confirmation for destructive operations.

🗺️ Roadmap

Potential future improvements:

Android transaction detection from financial notifications

Automatic expense suggestions

Smarter transaction categorization

Advanced Luna contextual reasoning

Improved offline conflict resolution

More intelligent notification scheduling

AI-powered daily planning

Expanded dashboard widgets

Automated daily summaries

Deeper Android integrations

More personal automation

👨‍💻 Author

John Malik

GitHub:
https://github.com/john-malik22/DaySync

⭐ Support

If you find DaySync useful:

⭐ Star the repository

🐛 Report bugs

💡 Suggest improvements

🤝 Contribute

❤️ DaySync

One app for your everyday life.

Tasks • Expenses • Plans • Splits • Notifications • Luna AI

Made to help you organize your day, manage your money, and get things done.
