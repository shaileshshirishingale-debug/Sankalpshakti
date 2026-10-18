import { SankalpChallenge } from '../types';

const STORAGE_KEY = 'my_sankalp_100_din_data_v1';

export const getStoredChallenge = (): SankalpChallenge | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load Sankalp data from localStorage', err);
    return null;
  }
};

export const saveChallenge = (challenge: SankalpChallenge): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));
  } catch (err) {
    console.error('Failed to save Sankalp data to localStorage', err);
  }
};

export const clearChallengeData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
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
    const date = new Date(y, m - 1, d, 12, 0, 0);
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

// Compute current streak of consecutive completed days ending at or just before currentDay
export const calculateStreak = (challenge: SankalpChallenge): number => {
  if (!challenge || !challenge.history) return 0;

  let streak = 0;
  const currentDay = challenge.currentDay;
  const todayRecord = challenge.history[currentDay];
  let checkDay = currentDay;

  if (
    todayRecord &&
    todayRecord.isCompleted &&
    (todayRecord.completedSankalpIds || []).length > 0
  ) {
    streak = 1;
    checkDay = currentDay - 1;
  } else if (todayRecord && todayRecord.isCompleted) {
    // Today was closed/completed as a 0-completion day (an explicit Loss / Missed Day)
    return 0;
  } else {
    // If today is not marked complete yet (in-progress), check unbroken streak from yesterday
    checkDay = currentDay - 1;
  }

  while (checkDay >= 1) {
    const rec = challenge.history[checkDay];
    if (rec && rec.isCompleted && (rec.completedSankalpIds || []).length > 0) {
      streak++;
      checkDay--;
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
  totalChecked: number;
  completedDays: number;
  completionRate: number;
  totalPossible: number;
} => {
  if (!challenge || !challenge.history) {
    return { totalChecked: 0, completedDays: 0, completionRate: 0, totalPossible: 0 };
  }

  let totalChecked = 0;
  let completedDays = 0;
  let totalPossible = 0;
  const defaultFallback = Math.max(1, challenge.sankalps?.length || 10);
  const history = challenge.history;
  const maxDay = challenge.currentDay;

  // Process day by day up to currentDay deterministically
  for (let d = 1; d <= maxDay; d++) {
    const day = history[d];
    if (!day) {
      totalPossible += defaultFallback;
      continue;
    }

    const ids = day.completedSankalpIds;
    let uniqueChecked = 0;
    if (ids && ids.length > 0) {
      const len = ids.length;
      if (len === 1) {
        uniqueChecked = 1;
      } else if (len === 2) {
        uniqueChecked = ids[0] === ids[1] ? 1 : 2;
      } else if (len <= 16) {
        // Zero-allocation inner loop for habit slot deduplication
        for (let i = 0; i < len; i++) {
          let isDup = false;
          for (let j = 0; j < i; j++) {
            if (ids[i] === ids[j]) {
              isDup = true;
              break;
            }
          }
          if (!isDup) uniqueChecked++;
        }
      } else {
        uniqueChecked = new Set(ids).size;
      }
    }

    const possibleForDay = day.daySankalps && day.daySankalps.length > 0
      ? day.daySankalps.length
      : (day.totalSankalpsAtTime && day.totalSankalpsAtTime > 0
          ? day.totalSankalpsAtTime
          : defaultFallback);

    if (day.isCompleted && uniqueChecked > 0) {
      completedDays++;
    }
    totalChecked += uniqueChecked;
    totalPossible += Math.max(1, possibleForDay);
  }

  const completionRate = totalPossible > 0 ? Math.min(100, Math.round((totalChecked / totalPossible) * 100)) : 0;
  return { totalChecked, completedDays, completionRate, totalPossible };
};
