/**
 * Suggestion Engine for Luna AI
 * Combines Memory + Tasks + Expenses + Activity to construct personalized recommendations.
 */

export function generatePersonalizedSuggestion({ memories, tasks, expenses }) {
  const pendingTasks = tasks.filter(t => !t.completed);

  if (pendingTasks.length > 0) {
    const topTask = pendingTasks.find(t => t.priority === 'High') || pendingTasks[0];
    return {
      recommendation: `You have an unfinished task: "${topTask.title}". Consider spending 30-45 minutes on it now.`,
      why: `Task "${topTask.title}" is due today with priority ${topTask.priority}.`,
      action: { type: 'FOCUS_MODE', taskTitle: topTask.title }
    };
  }

  return {
    recommendation: `All key tasks for today are completed! Take a 15-minute break or plan your agenda for tomorrow.`,
    why: `Your daily tasks are up to date and your spending is well within budget.`,
    action: { type: 'PLANNER' }
  };
}
