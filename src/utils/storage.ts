import { SankalpChallenge } from '../types';

const STORAGE_KEY = 'my_sankalp_100_din_data_v1';
const SYSTEMS_STORAGE_KEY = 'my_sankalp_systems_registry_v2';
const ACTIVE_SYSTEM_ID_KEY = 'my_sankalp_active_system_id_v2';

export interface SankalpSystemProfile {
  id: string;
  name: string;
  challenge: SankalpChallenge;
  updatedAt: string;
}

/**
 * Gets cached systems synchronously from local storage (instant UI render before server sync)
 */
export const getStoredSystems = (): { activeId: string | null; systems: SankalpSystemProfile[] } => {
  try {
    const raw = localStorage.getItem(SYSTEMS_STORAGE_KEY);
    const activeId = localStorage.getItem(ACTIVE_SYSTEM_ID_KEY);
    if (raw) {
      const systems = JSON.parse(raw);
      if (Array.isArray(systems) && systems.length > 0) {
        return { activeId, systems };
      }
    }
    // Fallback to legacy single challenge directly without calling getStoredChallenge
    const legacyRaw = localStorage.getItem(STORAGE_KEY);
    if (legacyRaw) {
      const legacy: SankalpChallenge = JSON.parse(legacyRaw);
      if (legacy && legacy.id) {
        const prof: SankalpSystemProfile = {
          id: legacy.id || 'sys_legacy',
          name: legacy.title || 'My Sankalp System',
          challenge: legacy,
          updatedAt: new Date().toISOString(),
        };
        return { activeId: prof.id, systems: [prof] };
      }
    }
  } catch {}

  return { activeId: null, systems: [] };
};

/**
 * Saves systems registry to local cache and syncs with server API / Vercel Blob
 */
export const saveSystemsToStorage = (activeId: string | null, systems: SankalpSystemProfile[]): void => {
  try {
    localStorage.setItem(SYSTEMS_STORAGE_KEY, JSON.stringify(systems));
    if (activeId) {
      localStorage.setItem(ACTIVE_SYSTEM_ID_KEY, activeId);
    }
  } catch {}

  try {
    fetch('/api/systems', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeId, systems }),
    }).catch(() => {});
  } catch {}
};

export const getStoredChallenge = (): SankalpChallenge | null => {
  try {
    const { activeId, systems } = getStoredSystems();
    if (activeId && systems.length > 0) {
      const active = systems.find((s) => s.id === activeId);
      if (active) return active.challenge;
      return systems[0].challenge;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveChallenge = (challenge: SankalpChallenge): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenge));

    const { activeId, systems } = getStoredSystems();
    let updatedSystems = [...systems];
    const index = updatedSystems.findIndex((s) => s.id === challenge.id);
    if (index >= 0) {
      updatedSystems[index] = {
        id: challenge.id,
        name: challenge.title || updatedSystems[index].name,
        challenge,
        updatedAt: new Date().toISOString(),
      };
    } else {
      updatedSystems.push({
        id: challenge.id,
        name: challenge.title || 'My Sankalp System',
        challenge,
        updatedAt: new Date().toISOString(),
      });
    }
    saveSystemsToStorage(challenge.id, updatedSystems);

    fetch('/api/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(challenge),
    }).catch(() => {});
  } catch {}
};

export const clearChallengeData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SYSTEMS_STORAGE_KEY);
    localStorage.removeItem(ACTIVE_SYSTEM_ID_KEY);
  } catch {}

  try {
    fetch('/api/clear', { method: 'POST' }).catch(() => {});
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
