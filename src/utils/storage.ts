import { SankalpChallenge } from '../types';

export interface SankalpSystemProfile {
  id: string;
  name: string;
  challenge: SankalpChallenge;
  updatedAt: string;
}

/**
 * Fetches stored systems synchronously (or falls back to default empty state).
 * Note: Real server synchronization happens via fetch /api/systems.
 */
export const getStoredSystems = (): { activeId: string | null; systems: SankalpSystemProfile[] } => {
  return { activeId: null, systems: [] };
};

/**
 * Saves systems registry directly to the server Excel database file system via API.
 */
export const saveSystemsToStorage = (activeId: string | null, systems: SankalpSystemProfile[]): void => {
  try {
    fetch('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeId, systems }),
    }).catch((err) => {
      console.error('Failed to sync systems to Excel database file system', err);
    });
  } catch (err) {
    console.error('Failed to save systems to Excel database', err);
  }
};

export const getStoredChallenge = (): SankalpChallenge | null => {
  return null;
};

/**
 * Saves challenge directly to the server Excel database file system via API.
 */
export const saveChallenge = (challenge: SankalpChallenge): void => {
  try {
    fetch('/api/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challenge),
    }).catch((err) => {
      console.error('Failed to sync challenge to Excel database file system', err);
    });
  } catch (err) {
    console.error('Failed to save challenge to Excel database', err);
  }
};

export const clearChallengeData = (): void => {
  try {
    fetch('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeId: null, systems: [] }),
    }).catch(() => {});
  } catch {}
};

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateForDay = (startDateStr: string, dayNumber: number): string => {
  try {
    const [y, m, d] = startDateStr.split('-').map(Number);
    // Use 12:00:00 (noon) to avoid DST midnight boundary slips
    const date = new Date(y, m - 1, d, 12, 0, 0);
    date.setDate(date.getDate() + (dayNumber - 1));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return startDateStr;
  }
};

export const formatDateDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

// Compute current streak of consecutive completed days up to currentDay
export const calculateStreak = (challenge: SankalpChallenge): number => {
  if (!challenge || !challenge.history) return 0;
  let streak = 0;
  const todayNum = challenge.currentDay;

  // Check backwards from currentDay or todayNum
  for (let d = todayNum; d >= 1; d--) {
    const rec = challenge.history[d];
    if (rec && rec.isCompleted && (rec.completedSankalpIds || []).length > 0) {
      streak++;
    } else if (d === todayNum && !rec) {
      // If today has no history record yet (in progress), don't break streak yet; check yesterday
      continue;
    } else {
      break;
    }
  }

  return streak;
};

// Compute longest (max) streak achieved throughout the challenge history up to currentDay
export const calculateMaxStreak = (challenge: SankalpChallenge): number => {
  if (!challenge || !challenge.history) return 0;
  let maxStreak = 0;
  let currentRun = 0;

  for (let d = 1; d <= challenge.currentDay; d++) {
    const rec = challenge.history[d];
    if (rec && rec.isCompleted && (rec.completedSankalpIds || []).length > 0) {
      currentRun++;
      if (currentRun > maxStreak) {
        maxStreak = currentRun;
      }
    } else {
      currentRun = 0;
    }
  }

  return maxStreak;
};

// Calculate total completions across all days up to currentDay with accurate dynamic denominators and zero-allocation deduplication
export const calculateTotalCompletions = (
  challenge: SankalpChallenge
): {
  completedDays: number;
  totalChecked: number;
  completionRate: number;
  totalPossible: number;
} => {
  if (!challenge || !challenge.history || !challenge.sankalps) {
    return { completedDays: 0, totalChecked: 0, completionRate: 0, totalPossible: 0 };
  }

  const currentD = challenge.currentDay || 1;
  const totalDays = challenge.totalDays || 100;
  const maxDayToCheck = Math.min(currentD, totalDays);

  let completedDays = 0;
  let totalCheckedTasks = 0;
  let totalPossibleTasks = 0;

  for (let d = 1; d <= maxDayToCheck; d++) {
    const rec = challenge.history[d];
    const daySankalps = rec?.daySankalps || challenge.sankalps || [];
    const dayTargetCount = daySankalps.length > 0 ? daySankalps.length : (challenge.sankalps?.length || 10);
    
    totalPossibleTasks += dayTargetCount;

    if (rec && rec.isCompleted) {
      completedDays++;
    }

    if (rec && rec.completedSankalpIds) {
      const uniqueCompletedIds = new Set(rec.completedSankalpIds);
      totalCheckedTasks += uniqueCompletedIds.size;
    }
  }

  const completionRate = totalPossibleTasks > 0 ? Math.round((totalCheckedTasks / totalPossibleTasks) * 100) : 0;

  return {
    completedDays,
    totalChecked: totalCheckedTasks,
    completionRate,
    totalPossible: totalPossibleTasks,
  };
};
