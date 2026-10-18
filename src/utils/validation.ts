import { SankalpChallenge, Category, Sankalp, TimeOfDay, CategoryColor } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitized?: SankalpChallenge;
}

const VALID_COLORS: CategoryColor[] = ['amber', 'emerald', 'indigo', 'rose', 'violet'];
const VALID_TIMES: TimeOfDay[] = ['Morning', 'Evening', 'Anytime'];

/**
 * Validates and sanitizes imported SankalpChallenge data.
 * Protects against malformed objects, prototype pollution, negative/NaN numbers, and corrupt history records.
 */
export const validateChallengeData = (data: unknown): ValidationResult => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { isValid: false, error: 'Data must be a non-null JSON object.' };
  }

  const raw = data as Record<string, unknown>;

  // Block prototype pollution on own properties
  if (
    Object.prototype.hasOwnProperty.call(raw, '__proto__') ||
    Object.prototype.hasOwnProperty.call(raw, 'prototype')
  ) {
    return { isValid: false, error: 'Malicious payload detected: prototype modification forbidden.' };
  }

  // Validate Categories
  if (!Array.isArray(raw.categories) || raw.categories.length === 0) {
    return { isValid: false, error: 'Invalid or missing categories array (at least 1 category required).' };
  }

  const sanitizedCategories: Category[] = [];
  for (let i = 0; i < raw.categories.length; i++) {
    const c = raw.categories[i];
    if (!c || typeof c !== 'object') {
      return { isValid: false, error: `Category at index ${i} is not a valid object.` };
    }
    const catObj = c as Record<string, unknown>;
    const id = typeof catObj.id === 'string' && catObj.id.trim() ? catObj.id.trim() : `cat_${Date.now()}_${i}`;
    const name = typeof catObj.name === 'string' && catObj.name.trim() ? catObj.name.trim().slice(0, 50) : `Category ${i + 1}`;
    const emoji = typeof catObj.emoji === 'string' && catObj.emoji.trim() ? catObj.emoji.trim().slice(0, 8) : '✨';
    const color = (typeof catObj.color === 'string' && VALID_COLORS.includes(catObj.color as CategoryColor))
      ? (catObj.color as CategoryColor)
      : 'amber';

    sanitizedCategories.push({
      id,
      name,
      emoji,
      color,
      order: typeof catObj.order === 'number' && Number.isFinite(catObj.order) ? catObj.order : i,
    });
  }

  const validCategoryIds = new Set(sanitizedCategories.map((c) => c.id));
  const fallbackCatId = sanitizedCategories[0].id;

  // Validate Sankalps
  if (!Array.isArray(raw.sankalps)) {
    return { isValid: false, error: 'Invalid or missing sankalps array.' };
  }

  const sanitizedSankalps: Sankalp[] = [];
  for (let i = 0; i < raw.sankalps.length; i++) {
    const s = raw.sankalps[i];
    if (!s || typeof s !== 'object') continue;
    const snkObj = s as Record<string, unknown>;
    const id = typeof snkObj.id === 'string' && snkObj.id.trim() ? snkObj.id.trim() : `snk_${Date.now()}_${i}`;
    const title = typeof snkObj.title === 'string' && snkObj.title.trim() ? snkObj.title.trim().slice(0, 100) : `Sankalp ${i + 1}`;
    const rawCatId = typeof snkObj.categoryId === 'string' ? snkObj.categoryId : '';
    const categoryId = validCategoryIds.has(rawCatId) ? rawCatId : fallbackCatId;
    const emoji = typeof snkObj.emoji === 'string' && snkObj.emoji.trim() ? snkObj.emoji.trim().slice(0, 8) : '✨';
    const timeOfDay = (typeof snkObj.timeOfDay === 'string' && VALID_TIMES.includes(snkObj.timeOfDay as TimeOfDay))
      ? (snkObj.timeOfDay as TimeOfDay)
      : 'Morning';
    const duration = typeof snkObj.duration === 'string' && snkObj.duration.trim() ? snkObj.duration.trim().slice(0, 30) : '15 min';

    sanitizedSankalps.push({
      id,
      categoryId,
      title,
      emoji,
      timeOfDay,
      duration,
      order: typeof snkObj.order === 'number' && Number.isFinite(snkObj.order) ? snkObj.order : i,
      reminderEnabled: Boolean(snkObj.reminderEnabled),
      reminderTime: typeof snkObj.reminderTime === 'string' ? snkObj.reminderTime.trim().slice(0, 5) : undefined,
      createdAt: typeof snkObj.createdAt === 'string' ? snkObj.createdAt : new Date().toISOString(),
    });
  }

  // Validate Challenge Numbers
  const totalDays = typeof raw.totalDays === 'number' && Number.isInteger(raw.totalDays) && raw.totalDays > 0
    ? Math.min(1000, raw.totalDays)
    : 100;

  const currentDay = typeof raw.currentDay === 'number' && Number.isInteger(raw.currentDay) && raw.currentDay >= 1
    ? Math.min(totalDays, raw.currentDay)
    : 1;

  const startDate = typeof raw.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)
    ? raw.startDate
    : new Date().toISOString().split('T')[0];

  // Validate History Records
  const sanitizedHistory: SankalpChallenge['history'] = {};
  if (raw.history && typeof raw.history === 'object' && !Array.isArray(raw.history)) {
    const hist = raw.history as Record<string, unknown>;
    for (const [dayKey, dayVal] of Object.entries(hist)) {
      const dayNum = parseInt(dayKey, 10);
      if (Number.isNaN(dayNum) || dayNum < 1 || dayNum > totalDays || !dayVal || typeof dayVal !== 'object') {
        continue;
      }
      const recordObj = dayVal as Record<string, unknown>;
      const completedIds = Array.isArray(recordObj.completedSankalpIds)
        ? Array.from(new Set(recordObj.completedSankalpIds.filter((id): id is string => typeof id === 'string')))
        : [];

      let daySankalps: Sankalp[] | undefined = undefined;
      if (Array.isArray(recordObj.daySankalps)) {
        daySankalps = recordObj.daySankalps
          .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === 'object'))
          .map((snk, idx) => ({
            id: typeof snk.id === 'string' && snk.id.trim() ? snk.id.trim() : `snk_day_${dayNum}_${idx}`,
            categoryId: typeof snk.categoryId === 'string' && validCategoryIds.has(snk.categoryId) ? snk.categoryId : fallbackCatId,
            title: typeof snk.title === 'string' && snk.title.trim() ? snk.title.trim().slice(0, 100) : `Sankalp ${idx + 1}`,
            emoji: typeof snk.emoji === 'string' && snk.emoji.trim() ? snk.emoji.trim().slice(0, 8) : '✨',
            timeOfDay: typeof snk.timeOfDay === 'string' && VALID_TIMES.includes(snk.timeOfDay as TimeOfDay) ? (snk.timeOfDay as TimeOfDay) : 'Morning',
            duration: typeof snk.duration === 'string' && snk.duration.trim() ? snk.duration.trim().slice(0, 30) : '15 min',
            order: typeof snk.order === 'number' && Number.isFinite(snk.order) ? snk.order : idx,
            reminderEnabled: Boolean(snk.reminderEnabled),
            reminderTime: typeof snk.reminderTime === 'string' ? snk.reminderTime.trim().slice(0, 5) : undefined,
            createdAt: typeof snk.createdAt === 'string' ? snk.createdAt : new Date().toISOString(),
          }));
      }

      sanitizedHistory[dayNum] = {
        dayNumber: dayNum,
        dateString: typeof recordObj.dateString === 'string' ? recordObj.dateString : startDate,
        completedSankalpIds: completedIds,
        totalSankalpsAtTime: typeof recordObj.totalSankalpsAtTime === 'number' && recordObj.totalSankalpsAtTime > 0
          ? recordObj.totalSankalpsAtTime
          : sanitizedSankalps.length,
        isCompleted: Boolean(recordObj.isCompleted),
        notes: typeof recordObj.notes === 'string' ? recordObj.notes.trim().slice(0, 500) : undefined,
        completedAt: typeof recordObj.completedAt === 'string' ? recordObj.completedAt : undefined,
        daySankalps: daySankalps && daySankalps.length > 0 ? daySankalps : undefined,
      };
    }
  }

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim().slice(0, 100) : `challenge_${Date.now()}`;
  const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 100) : 'My 100-Day Sankalp';
  const isSetupComplete = typeof raw.isSetupComplete === 'boolean' ? raw.isSetupComplete : true;
  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString();

  const sanitizedChallenge: SankalpChallenge = {
    id,
    title,
    totalDays,
    currentDay,
    startDate,
    categories: sanitizedCategories,
    sankalps: sanitizedSankalps,
    history: sanitizedHistory,
    isSetupComplete,
    createdAt,
  };

  return { isValid: true, sanitized: sanitizedChallenge };
};
