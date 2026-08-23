import jsPDF from 'jspdf';
import 'jspdf-autotable';
import pkg from '../../package.json';

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
}

export function exportDataToPdf(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [47, 111, 115]; // DaySync cyan/violet brand teal #2F6F73
  const secondaryColor = [108, 99, 255];
  const textColor = [40, 44, 52];
  const mutedColor = [120, 125, 135];

  let currentY = 16;

  // --- HEADER BANNER ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('DaySync', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Personal Data Export', 14, 22);

  const formattedExportDate = formatDateTime(new Date());
  doc.setFontSize(8.5);
  doc.text(`Exported: ${formattedExportDate}`, 196, 15, { align: 'right' });
  doc.text(`DaySync Version: v${pkg.version || '1.1.9'}`, 196, 21, { align: 'right' });

  currentY = 34;

  // --- SECTION 1: USER INFORMATION & COVER BLOCK ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('User Information', 14, currentY);

  doc.setLineWidth(0.5);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.setFont('helvetica', 'bold');
  doc.text('Exported for:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.user?.name || 'DaySync User', 42, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', 110, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(data.user?.email || 'N/A', 126, currentY);

  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Account Status:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text('Active User', 45, currentY);

  doc.setFont('helvetica', 'bold');
  doc.text('Export Date:', 110, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(formattedExportDate, 134, currentY);

  currentY += 12;

  // Helper for page break checks
  const checkPageBreak = (neededSpace = 30) => {
    if (currentY + neededSpace > 275) {
      doc.addPage();
      currentY = 18;
    }
  };

  const renderSectionHeading = (title, count = null) => {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const headingText = count !== null ? `${title} (${count})` : title;
    doc.text(headingText, 14, currentY);

    doc.setLineWidth(0.3);
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.line(14, currentY + 2, 196, currentY + 2);

    currentY += 8;
  };

  const renderEmptyMessage = (message) => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2]);
    doc.text(message, 14, currentY);
    currentY += 10;
  };

  // --- SECTION 2: TASKS ---
  const tasks = data.tasks || [];
  renderSectionHeading('Tasks', tasks.length);

  if (tasks.length === 0) {
    renderEmptyMessage('No tasks recorded.');
  } else {
    const taskRows = tasks.map(t => [
      t.title || 'Untitled Task',
      formatDate(t.date || t.createdAt),
      t.time || 'All Day',
      t.priority || 'Medium',
      t.completed ? 'Completed' : 'Pending'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Task Title', 'Date', 'Time', 'Priority', 'Status']],
      body: taskRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 3: EXPENSES ---
  const expenses = data.expenses || [];
  renderSectionHeading('Expenses', expenses.length);

  if (expenses.length === 0) {
    renderEmptyMessage('No expenses recorded.');
  } else {
    let totalExpenses = 0;
    let totalIncome = 0;

    const expenseRows = expenses.map(e => {
      const amt = parseFloat(e.amount || 0);
      if (e.type === 'income') {
        totalIncome += amt;
      } else {
        totalExpenses += amt;
      }

      return [
        e.description || e.category || 'Transaction',
        `Rs. ${amt.toLocaleString('en-IN')}`,
        e.type === 'income' ? 'Income' : 'Expense',
        e.category || 'General',
        formatDate(e.date)
      ];
    });

    doc.autoTable({
      startY: currentY,
      head: [['Description', 'Amount', 'Type', 'Category', 'Date']],
      body: expenseRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 6;

    // Financial Totals Summary Box
    checkPageBreak(18);
    doc.setFillColor(245, 247, 250);
    doc.setDrawColor(220, 225, 230);
    doc.roundedRect(14, currentY, 182, 12, 1.5, 1.5, 'FD');

    const netDiff = totalIncome - totalExpenses;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);

    doc.text(`Total Expenses: Rs. ${totalExpenses.toLocaleString('en-IN')}`, 18, currentY + 7.5);
    doc.text(`Total Income: Rs. ${totalIncome.toLocaleString('en-IN')}`, 82, currentY + 7.5);
    doc.text(`Net Balance: Rs. ${netDiff.toLocaleString('en-IN')}`, 144, currentY + 7.5);

    currentY += 18;
  }

  // --- SECTION 4: HABITS ---
  const habits = data.habits || [];
  renderSectionHeading('Habits', habits.length);

  if (habits.length === 0) {
    renderEmptyMessage('No habits recorded.');
  } else {
    const habitRows = habits.map(h => [
      h.title || 'Habit',
      h.frequency || 'Daily',
      `${h.streak || 0} days streak`,
      h.completedToday ? 'Completed Today' : 'Pending'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Habit Name', 'Frequency', 'Streak', 'Today Status']],
      body: habitRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 5: GOALS ---
  const goals = data.goals || [];
  renderSectionHeading('Goals', goals.length);

  if (goals.length === 0) {
    renderEmptyMessage('No goals recorded.');
  } else {
    const goalRows = goals.map(g => [
      g.title || 'Goal',
      g.category || 'General',
      formatDate(g.deadline),
      `${g.progress || 0}%`,
      g.progress >= 100 ? 'Achieved' : 'In Progress'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Goal Name', 'Category', 'Deadline', 'Progress', 'Status']],
      body: goalRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 6: MEMORIES ---
  const memories = data.memories || [];
  renderSectionHeading('Memories', memories.length);

  if (memories.length === 0) {
    renderEmptyMessage('No memories recorded.');
  } else {
    const memoryRows = memories.map(m => [
      m.content || '',
      m.type || 'Preferences',
      formatDate(m.createdAt)
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Memory Content', 'Category', 'Date Saved']],
      body: memoryRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 120 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 7: NOTIFICATIONS ---
  const notifications = data.notifications || [];
  renderSectionHeading('Notifications', notifications.length);

  if (notifications.length === 0) {
    renderEmptyMessage('No stored notifications recorded.');
  } else {
    const notifRows = notifications.map(n => [
      n.title || 'Notification',
      n.message || '',
      n.category || n.priority || 'Alert',
      formatDateTime(n.createdAt)
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Title', 'Message', 'Category', 'Timestamp']],
      body: notifRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 1: { cellWidth: 85 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 8: LUNA CONVERSATIONS ---
  const conversations = data.conversations || [];
  renderSectionHeading('Luna Conversations', conversations.length);

  if (conversations.length === 0) {
    renderEmptyMessage('No conversation history recorded.');
  } else {
    const chatRows = conversations.slice(-50).map(c => [
      c.sender === 'user' ? 'User' : 'Luna AI',
      c.message || '',
      formatDateTime(c.timestamp || c.createdAt)
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Sender', 'Message Content', 'Timestamp']],
      body: chatRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 115 }, 2: { cellWidth: 42 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 9: SUMMARIES ---
  const summaries = data.summaries || [];
  renderSectionHeading('Summaries', summaries.length);

  if (summaries.length === 0) {
    renderEmptyMessage('No stored summaries recorded.');
  } else {
    const summaryRows = summaries.map(s => [
      s.title || 'Executive Summary',
      s.content || '',
      formatDate(s.createdAt)
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Title', 'Summary Content', 'Date']],
      body: summaryRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      columnStyles: { 1: { cellWidth: 115 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- SECTION 10: EXPORT INFORMATION ---
  renderSectionHeading('Export Information');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  doc.text(
    'This file contains the personal data currently available in your DaySync account at the time of export.',
    14,
    currentY
  );
  currentY += 5;
  doc.text(
    `Export Timestamp: ${formattedExportDate} • Version: v${pkg.version || '1.1.9'}`,
    14,
    currentY
  );

  // --- PAGE NUMBERS & FOOTER ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `DaySync Confidential Personal Data Export • Page ${i} of ${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save('DaySync_Data_Export.pdf');
}
