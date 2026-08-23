import jsPDF from 'jspdf';
import 'jspdf-autotable';
import pkg from '../../package.json';

export function exportDataToPdf(data) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [47, 111, 115]; // DaySync brand cyan/violet teal #2F6F73
  const secondaryColor = [108, 99, 255];
  const textColor = [40, 44, 52];

  let currentY = 16;

  // --- HEADER BANNER ---
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('DaySync', 14, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Personal Data Export Report', 14, 20);

  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 15, { align: 'right' });
  doc.text(`App Version: v${pkg.version || '1.1.9'}`, 196, 20, { align: 'right' });

  currentY = 32;

  // --- USER INFORMATION SECTION ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('User Information', 14, currentY);

  doc.setLineWidth(0.5);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(14, currentY + 2, 196, currentY + 2);

  currentY += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Name: ${data.user?.name || 'User'}`, 14, currentY);
  doc.text(`Email: ${data.user?.email || 'N/A'}`, 90, currentY);
  doc.text(`Account Status: Active`, 150, currentY);

  currentY += 12;

  // --- 1. TASKS SECTION ---
  const tasks = data.tasks || [];
  if (tasks.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Tasks & Reminders (${tasks.length})`, 14, currentY);
    currentY += 4;

    const taskRows = tasks.map(t => [
      t.title || 'Untitled Task',
      t.priority || 'Medium',
      t.category || 'General',
      t.completed ? 'Completed' : 'Pending',
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'N/A'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Task Title', 'Priority', 'Category', 'Status', 'Date']],
      body: taskRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // Check page break safety
  const checkPageBreak = (neededSpace = 30) => {
    if (currentY + neededSpace > 280) {
      doc.addPage();
      currentY = 16;
    }
  };

  // --- 2. EXPENSES SECTION ---
  const expenses = data.expenses || [];
  if (expenses.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Financial Expenses & Income (${expenses.length})`, 14, currentY);
    currentY += 4;

    const expenseRows = expenses.map(e => [
      e.description || e.category || 'Transaction',
      `${e.type === 'income' ? '+' : '-'}Rs ${parseFloat(e.amount || 0).toLocaleString()}`,
      e.category || 'General',
      e.type === 'income' ? 'Income' : 'Expense',
      e.date || 'N/A'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Description', 'Amount', 'Category', 'Type', 'Date']],
      body: expenseRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 3. HABITS SECTION ---
  const habits = data.habits || [];
  if (habits.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Habit Tracker (${habits.length})`, 14, currentY);
    currentY += 4;

    const habitRows = habits.map(h => [
      h.title || 'Habit',
      h.frequency || 'Daily',
      `${h.streak || 0} days streak`,
      h.completedToday ? 'Done Today' : 'Pending'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Habit Name', 'Frequency', 'Streak', 'Today Status']],
      body: habitRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 4. GOALS SECTION ---
  const goals = data.goals || [];
  if (goals.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Goal Deadlines (${goals.length})`, 14, currentY);
    currentY += 4;

    const goalRows = goals.map(g => [
      g.title || 'Goal',
      g.category || 'General',
      g.deadline || 'N/A',
      `${g.progress || 0}%`
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Goal Name', 'Category', 'Deadline', 'Progress']],
      body: goalRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 5. MEMORIES SECTION ---
  const memories = data.memories || [];
  if (memories.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Saved Memories (${memories.length})`, 14, currentY);
    currentY += 4;

    const memoryRows = memories.map(m => [
      m.content || '',
      m.type || 'Preferences',
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : 'N/A'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Memory Content', 'Category', 'Date Saved']],
      body: memoryRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: { 0: { cellWidth: 120 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

  // --- 6. CONVERSATIONS SECTION ---
  const conversations = data.conversations || [];
  if (conversations.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`Luna Chat History (${conversations.length} messages)`, 14, currentY);
    currentY += 4;

    const chatRows = conversations.slice(-50).map(c => [
      c.sender === 'user' ? 'User' : 'Luna AI',
      c.message || '',
      c.timestamp ? new Date(c.timestamp).toLocaleString() : 'N/A'
    ]);

    doc.autoTable({
      startY: currentY,
      head: [['Sender', 'Message', 'Timestamp']],
      body: chatRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8.5, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 115 }, 2: { cellWidth: 40 } },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 10;
  }

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
