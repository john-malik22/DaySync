/**
 * Routine Recognition & Pattern Detection Engine
 * Tracks activity timestamps and evaluates recurring patterns.
 */

export function analyzeRoutines(userActivities, currentRoutines) {
  // Simple heuristic pattern detection
  const detected = [...currentRoutines];

  // Example pattern trigger logic
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 19 && currentHour <= 22) {
    const nightStudyIndex = detected.findIndex(r => r.title.toLowerCase().includes('study'));
    if (nightStudyIndex !== -1) {
      detected[nightStudyIndex].confidence = Math.min(0.98, (detected[nightStudyIndex].confidence || 0.8) + 0.02);
      detected[nightStudyIndex].lastDetected = 'Today at ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }

  return detected;
}
