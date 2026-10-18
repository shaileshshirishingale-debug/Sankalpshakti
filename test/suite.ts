/**
 * Automated Verification and Test Suite for My Sankalp - 100 Din
 * Tests formulas, analytical functions, security sanitization, and edge cases.
 */

import {
  calculateStreak,
  calculateMaxStreak,
  calculateTotalCompletions,
  getDateForDay,
  formatDateDisplay,
} from '../src/utils/storage';
import { validateChallengeData } from '../src/utils/validation';
import { SankalpChallenge, Category, Sankalp } from '../src/types';

export interface TestResult {
  name: string;
  category: 'UNIT' | 'INTEGRATION' | 'REGRESSION' | 'EDGE_CASE' | 'SECURITY';
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

function runTest(
  name: string,
  category: TestResult['category'],
  fn: () => void
) {
  const t0 = performance.now();
  try {
    fn();
    const durationMs = Math.round((performance.now() - t0) * 100) / 100;
    results.push({ name, category, status: 'PASS', durationMs });
  } catch (err: any) {
    const durationMs = Math.round((performance.now() - t0) * 100) / 100;
    results.push({
      name,
      category,
      status: 'FAIL',
      details: err?.message || String(err),
      durationMs,
    });
  }
}

function assertEqual<T>(actual: T, expected: T, msg?: string) {
  if (actual !== expected) {
    throw new Error(`${msg || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function createMockChallenge(overrides: Partial<SankalpChallenge> = {}): SankalpChallenge {
  const defaultCategory: Category = {
    id: 'cat_spiritual',
    name: 'Spiritual',
    emoji: '🧘',
    color: 'amber',
    order: 0,
  };

  const defaultSankalp: Sankalp = {
    id: 's1',
    categoryId: 'cat_spiritual',
    title: 'Meditation',
    emoji: '🧘',
    timeOfDay: 'Morning',
    duration: '15m',
    order: 0,
    createdAt: '2026-10-18T00:00:00.000Z',
  };

  return {
    id: 'challenge_test_001',
    title: '100-Day Sankalp Challenge',
    totalDays: 100,
    currentDay: 1,
    startDate: '2026-10-18',
    categories: [defaultCategory],
    sankalps: [defaultSankalp],
    history: {},
    isSetupComplete: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. UNIT TESTS: STREAK FORMULAS & DETERMINISTIC SEQUENCES
// ---------------------------------------------------------------------------

runTest('Streak calculation: Day 1 completed', 'UNIT', () => {
  const challenge = createMockChallenge({
    currentDay: 1,
    history: {
      1: { dayNumber: 1, dateString: '2026-10-18', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
    },
  });
  assertEqual(calculateStreak(challenge), 1, 'Day 1 completed should yield streak 1');
  assertEqual(calculateMaxStreak(challenge), 1, 'Max streak should be 1');
});

runTest('Streak calculation: Days 1-3 completed, Day 4 in progress', 'UNIT', () => {
  const challenge = createMockChallenge({
    currentDay: 4,
    history: {
      1: { dayNumber: 1, dateString: '2026-10-18', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      2: { dayNumber: 2, dateString: '2026-10-19', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      3: { dayNumber: 3, dateString: '2026-10-20', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      4: { dayNumber: 4, dateString: '2026-10-21', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
    },
  });
  assertEqual(calculateStreak(challenge), 3, 'Consecutive completed prior days should yield streak 3');
  assertEqual(calculateMaxStreak(challenge), 3, 'Max streak should be 3');
});

runTest('Streak calculation: Broken streak (Day 2 missed)', 'UNIT', () => {
  const challenge = createMockChallenge({
    currentDay: 4,
    history: {
      1: { dayNumber: 1, dateString: '2026-10-18', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      2: { dayNumber: 2, dateString: '2026-10-19', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      3: { dayNumber: 3, dateString: '2026-10-20', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      4: { dayNumber: 4, dateString: '2026-10-21', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
    },
  });
  assertEqual(calculateStreak(challenge), 2, 'Broken day 2 should leave days 3-4 (streak 2)');
  assertEqual(calculateMaxStreak(challenge), 2, 'Max streak should be 2');
});

runTest('Deterministic Sequence: WWLLW verification (3 wins, 2 losses, 60% win rate)', 'UNIT', () => {
  // Sequence: Day 1 (W), Day 2 (W), Day 3 (L), Day 4 (L), Day 5 (W)
  const challenge = createMockChallenge({
    totalDays: 5,
    currentDay: 5,
    history: {
      1: { dayNumber: 1, dateString: '2026-10-18', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      2: { dayNumber: 2, dateString: '2026-10-19', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      3: { dayNumber: 3, dateString: '2026-10-20', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      4: { dayNumber: 4, dateString: '2026-10-21', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      5: { dayNumber: 5, dateString: '2026-10-22', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
    },
  });

  assertEqual(calculateStreak(challenge), 1, 'Current streak for WWLLW should be 1');
  assertEqual(calculateMaxStreak(challenge), 2, 'Max streak for WWLLW should be 2');

  const { completedDays, totalChecked, completionRate, totalPossible } = calculateTotalCompletions(challenge);
  assertEqual(completedDays, 3, 'Completed days (wins) for WWLLW should be 3');
  assertEqual(totalPossible - completedDays, 2, 'Missed days (losses) for WWLLW should be 2');
  assertEqual(totalChecked, 3, 'Total checked tasks for WWLLW should be 3');
  assertEqual(totalPossible, 5, 'Total possible tasks for WWLLW should be 5');
  assertEqual(completionRate, 60, 'Completion rate (win rate) for WWLLW should be 3/5 = 60%');
});

runTest('Deterministic Reverse Sequence: LLWWL verification (2 wins, 3 losses, 40% win rate)', 'UNIT', () => {
  // Reverse Sequence: Day 1 (L), Day 2 (L), Day 3 (W), Day 4 (W), Day 5 (L)
  const challenge = createMockChallenge({
    totalDays: 5,
    currentDay: 5,
    history: {
      1: { dayNumber: 1, dateString: '2026-10-18', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      2: { dayNumber: 2, dateString: '2026-10-19', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      3: { dayNumber: 3, dateString: '2026-10-20', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      4: { dayNumber: 4, dateString: '2026-10-21', completedSankalpIds: ['s1'], totalSankalpsAtTime: 1, isCompleted: true },
      5: { dayNumber: 5, dateString: '2026-10-22', completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: true }, // completed as 0 check (explicit loss)
    },
  });

  assertEqual(calculateStreak(challenge), 0, 'Current streak for LLWWL when Day 5 is closed with 0 checks should be 0');
  assertEqual(calculateMaxStreak(challenge), 2, 'Max streak for LLWWL should be 2');

  const { completedDays, totalChecked, completionRate, totalPossible } = calculateTotalCompletions(challenge);
  assertEqual(completedDays, 2, 'Completed days (wins) for LLWWL should be 2');
  assertEqual(totalPossible - completedDays, 3, 'Missed days (losses) for LLWWL should be 3');
  assertEqual(totalChecked, 2, 'Total checked tasks for LLWWL should be 2');
  assertEqual(totalPossible, 5, 'Total possible tasks for LLWWL should be 5');
  assertEqual(completionRate, 40, 'Completion rate (win rate) for LLWWL should be 2/5 = 40%');
});

// ---------------------------------------------------------------------------
// 2. UNIT TESTS: DYNAMIC DENOMINATOR & COMPLETION RATES
// ---------------------------------------------------------------------------

runTest('Completion rate with 5 custom sankalps (no artificial 10 floor)', 'UNIT', () => {
  const fiveSankalps: Sankalp[] = [
    { id: 'c1', categoryId: 'cat_spiritual', title: '1', emoji: '✨', timeOfDay: 'Morning', duration: '10m', order: 0, createdAt: '' },
    { id: 'c2', categoryId: 'cat_spiritual', title: '2', emoji: '✨', timeOfDay: 'Morning', duration: '10m', order: 1, createdAt: '' },
    { id: 'c3', categoryId: 'cat_spiritual', title: '3', emoji: '✨', timeOfDay: 'Morning', duration: '10m', order: 2, createdAt: '' },
    { id: 'c4', categoryId: 'cat_spiritual', title: '4', emoji: '✨', timeOfDay: 'Morning', duration: '10m', order: 3, createdAt: '' },
    { id: 'c5', categoryId: 'cat_spiritual', title: '5', emoji: '✨', timeOfDay: 'Morning', duration: '10m', order: 4, createdAt: '' },
  ];

  const challenge = createMockChallenge({
    sankalps: fiveSankalps,
    history: {
      1: {
        dayNumber: 1,
        dateString: '2026-10-18',
        completedSankalpIds: ['c1', 'c2', 'c3', 'c4', 'c5'],
        totalSankalpsAtTime: 5,
        daySankalps: fiveSankalps,
        isCompleted: true,
      },
    },
  });

  const { totalChecked, completedDays, completionRate, totalPossible } = calculateTotalCompletions(challenge);
  assertEqual(totalChecked, 5, 'totalChecked should be 5');
  assertEqual(totalPossible, 5, 'totalPossible should be 5');
  assertEqual(completedDays, 1, 'completedDays should be 1');
  assertEqual(completionRate, 100, '5/5 completed must equal 100% (not 50%)');
});

runTest('Deduplication of duplicate completed IDs in history records', 'REGRESSION', () => {
  const challenge = createMockChallenge({
    history: {
      1: {
        dayNumber: 1,
        dateString: '2026-10-18',
        completedSankalpIds: ['s1', 's1', 's1', 's1'],
        totalSankalpsAtTime: 1,
        isCompleted: true,
      },
    },
  });

  const { totalChecked } = calculateTotalCompletions(challenge);
  assertEqual(totalChecked, 1, 'Duplicate IDs in history must be deduplicated to unique count 1');
});

// ---------------------------------------------------------------------------
// 3. UNIT TESTS: DATE INTERPOLATION & BOUNDARIES
// ---------------------------------------------------------------------------

runTest('Date interpolation: Day 1 and Day 100 with noon anchoring', 'UNIT', () => {
  const day1 = getDateForDay('2026-10-18', 1);
  assertEqual(day1, '2026-10-18', 'Day 1 must match start date');

  const day100 = getDateForDay('2026-10-18', 100);
  assertEqual(day100, '2027-01-25', 'Day 100 from 2026-10-18 must be 2027-01-25');
});

runTest('Date formatting display for valid and empty strings', 'UNIT', () => {
  const formatted = formatDateDisplay('2026-10-18');
  if (!formatted.includes('Oct') && !formatted.includes('2026')) {
    throw new Error(`Unexpected date display format: ${formatted}`);
  }
  assertEqual(formatDateDisplay(''), '', 'Empty string must return empty string');
});

// ---------------------------------------------------------------------------
// 4. INTEGRATION & SECURITY TESTS: VALIDATION MODULE
// ---------------------------------------------------------------------------

runTest('Validation: Sanitizes and accepts legitimate challenge backup', 'INTEGRATION', () => {
  const rawPayload = {
    id: 'imported_001',
    title: 'My Custom 100 Days',
    totalDays: 100,
    currentDay: 2,
    startDate: '2026-10-18',
    isSetupComplete: true,
    createdAt: '2026-10-18T00:00:00.000Z',
    categories: [
      { id: 'cat_spiritual', name: 'Spiritual', emoji: '🧘', color: 'amber', order: 0 },
    ],
    sankalps: [
      { id: 'snk_1', categoryId: 'cat_spiritual', title: 'Japa', emoji: '📿', timeOfDay: 'Morning', duration: '20 min' },
    ],
    history: {
      1: {
        dayNumber: 1,
        dateString: '2026-10-18',
        completedSankalpIds: ['snk_1'],
        totalSankalpsAtTime: 1,
        isCompleted: true,
        daySankalps: [
          { id: 'snk_1', categoryId: 'cat_spiritual', title: 'Japa', emoji: '📿', timeOfDay: 'Morning', duration: '20 min' }
        ]
      },
    },
  };

  const res = validateChallengeData(rawPayload);
  assertEqual(res.isValid, true, 'Valid payload should pass validation');
  assertEqual(res.sanitized?.categories.length, 1);
  assertEqual(res.sanitized?.sankalps.length, 1);
  assertEqual(res.sanitized?.history[1].completedSankalpIds.length, 1);
  assertEqual(res.sanitized?.history[1].daySankalps?.length, 1, 'Custom daySankalps must be preserved');
});

runTest('Security: Blocks prototype pollution payloads', 'SECURITY', () => {
  const malicious = JSON.parse('{"__proto__": {"isAdmin": true}, "categories": []}');
  const res = validateChallengeData(malicious);
  assertEqual(res.isValid, false, 'Payload with prototype keys must be rejected');
});

runTest('Security: Rejects non-object or array root payloads', 'SECURITY', () => {
  assertEqual(validateChallengeData(null).isValid, false);
  assertEqual(validateChallengeData([]).isValid, false);
  assertEqual(validateChallengeData('not-an-object').isValid, false);
});

runTest('Edge-case: Clamps invalid totalDays and repairs orphaned categories', 'EDGE_CASE', () => {
  const payload = {
    totalDays: -99,
    currentDay: 500,
    categories: [{ id: 'valid_cat', name: 'Cat', emoji: '✨', color: 'amber' }],
    sankalps: [{ id: 's1', categoryId: 'ghost_cat_id', title: 'Orphan Habit', duration: '10m' }],
  };

  const res = validateChallengeData(payload);
  assertEqual(res.isValid, true);
  assertEqual(res.sanitized?.totalDays, 100, 'Negative totalDays must default to 100');
  assertEqual(res.sanitized?.currentDay, 100, 'currentDay must be clamped to totalDays');
  assertEqual(res.sanitized?.sankalps[0].categoryId, 'valid_cat', 'Orphaned categoryId must be reassigned to valid category');
});

// ---------------------------------------------------------------------------
// 5. EDGE-CASE TESTS: ZERO & LARGE DATASETS
// ---------------------------------------------------------------------------

runTest('Edge-case: Zero sankalps and empty history', 'EDGE_CASE', () => {
  const emptyChallenge = createMockChallenge({
    sankalps: [],
    history: {},
  });

  assertEqual(calculateStreak(emptyChallenge), 0, 'Streak on empty challenge must be 0');
  assertEqual(calculateMaxStreak(emptyChallenge), 0, 'Max streak on empty challenge must be 0');
  const stats = calculateTotalCompletions(emptyChallenge);
  assertEqual(stats.totalChecked, 0);
  assertEqual(stats.completedDays, 0);
  assertEqual(stats.completionRate, 0);
  assertEqual(stats.totalPossible, 10, 'Fallback to 10 possible for day 1 avoids divide-by-zero');
});

runTest('Performance Stress: 1,000 Days dataset metric calculation', 'EDGE_CASE', () => {
  const largeHistory: SankalpChallenge['history'] = {};
  for (let d = 1; d <= 1000; d++) {
    largeHistory[d] = {
      dayNumber: d,
      dateString: '2026-10-18',
      completedSankalpIds: d % 2 === 0 ? ['s1', 's2', 's3', 's4', 's5'] : ['s1', 's2'],
      totalSankalpsAtTime: 5,
      isCompleted: d % 2 === 0,
    };
  }

  const largeChallenge = createMockChallenge({
    totalDays: 1000,
    currentDay: 1000,
    sankalps: new Array(5).fill(null).map((_, i) => ({
      id: `s${i + 1}`,
      categoryId: 'cat_spiritual',
      title: `Habit ${i + 1}`,
      emoji: '⚡',
      timeOfDay: 'Morning',
      duration: '10m',
      order: i,
      createdAt: '',
    })),
    history: largeHistory,
  });

  const t0 = performance.now();
  const streak = calculateStreak(largeChallenge);
  const maxStreak = calculateMaxStreak(largeChallenge);
  const { totalChecked, completionRate } = calculateTotalCompletions(largeChallenge);
  const elapsed = performance.now() - t0;

  assertEqual(streak, 1, 'Large challenge streak should be 1');
  assertEqual(maxStreak, 1, 'Large challenge maxStreak should be 1 (alternating days)');
  assertEqual(totalChecked, 3500, '500*5 + 500*2 = 3500 checked tasks');
  assertEqual(completionRate, 70, '3500 / 5000 = 70% completion rate');

  if (elapsed > 50) {
    throw new Error(`Large dataset calculation took ${elapsed.toFixed(2)}ms (> 50ms budget)`);
  }
});

runTest('Performance Benchmark: 10,000 iterations of calculateTotalCompletions', 'EDGE_CASE', () => {
  const history30: SankalpChallenge['history'] = {};
  for (let d = 1; d <= 30; d++) {
    history30[d] = {
      dayNumber: d,
      dateString: '2026-10-18',
      completedSankalpIds: ['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10'],
      totalSankalpsAtTime: 10,
      isCompleted: true,
    };
  }

  const challenge = createMockChallenge({
    totalDays: 100,
    currentDay: 30,
    sankalps: new Array(10).fill(null).map((_, i) => ({
      id: `s${i + 1}`,
      categoryId: 'cat_spiritual',
      title: `Habit ${i + 1}`,
      emoji: '✨',
      timeOfDay: 'Morning',
      duration: '15m',
      order: i,
      createdAt: '',
    })),
    history: history30,
  });

  const t0 = performance.now();
  for (let i = 0; i < 10000; i++) {
    calculateTotalCompletions(challenge);
  }
  const elapsed = performance.now() - t0;

  if (elapsed > 150) {
    throw new Error(`10,000 calculations took ${elapsed.toFixed(2)}ms (> 150ms budget)`);
  }
});

// ---------------------------------------------------------------------------
// REPORT GENERATION
// ---------------------------------------------------------------------------

console.log('\n======================================================');
console.log('       MY SANKALP - 100 DIN AUTOMATED TEST SUITE');
console.log('======================================================\n');

let passCount = 0;
let failCount = 0;

for (const res of results) {
  const statusStr = res.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusStr} [${res.category}] ${res.name} (${res.durationMs}ms)`);
  if (res.details) {
    console.log(`   └─ Error: ${res.details}`);
  }
  if (res.status === 'PASS') passCount++;
  else failCount++;
}

console.log('\n------------------------------------------------------');
console.log(`Summary: ${passCount} Passed, ${failCount} Failed, Total: ${results.length}`);
console.log('------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
