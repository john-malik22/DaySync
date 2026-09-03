/**
 * Suggestion Engine for Luna AI
 * Combines Memory + Tasks + Expenses + Activity to construct personalized recommendations.
 */

export function generatePersonalizedSuggestion({ memories = [], tasks = [], expenses = [] } = {}) {
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const pendingTasks = safeTasks.filter(t => t && !t.completed);

  if (pendingTasks.length > 0) {
    const topTask = pendingTasks.find(t => t.priority === 'High') || pendingTasks[0];
    return {
      recommendation: `You have an unfinished task: "${topTask.title || 'Task'}". Consider spending 30-45 minutes on it now.`,
      why: `Task "${topTask.title || 'Task'}" is scheduled with priority ${topTask.priority || 'Normal'}.`,
      action: { type: 'FOCUS_MODE', taskTitle: topTask.title || 'Task' }
    };
  }

  return {
    recommendation: `All key tasks for today are completed! Take a 15-minute break or plan your agenda for tomorrow.`,
    why: `Your daily tasks are up to date and your schedule is organized.`,
    action: { type: 'PLANNER' }
  };
}
