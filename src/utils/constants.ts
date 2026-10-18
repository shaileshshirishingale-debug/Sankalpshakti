import { CategoryColor } from '../types';

export interface ColorScheme {
  id: CategoryColor;
  label: string;
  previewBg: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  activeBorder: string;
  accentBg: string;
  glowColor: string;
  softBg: string;
}

export const CATEGORY_COLORS: Record<CategoryColor, ColorScheme> = {
  amber: {
    id: 'amber',
    label: 'Saffron / Amber',
    previewBg: 'bg-amber-500',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    borderColor: 'border-amber-200',
    activeBorder: 'border-amber-500',
    accentBg: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
    softBg: 'bg-amber-50/70'
  },
  emerald: {
    id: 'emerald',
    label: 'Tulsi / Emerald',
    previewBg: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    borderColor: 'border-emerald-200',
    activeBorder: 'border-emerald-500',
    accentBg: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
    softBg: 'bg-emerald-50/70'
  },
  indigo: {
    id: 'indigo',
    label: 'Dhyana / Indigo',
    previewBg: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50',
    badgeText: 'text-indigo-800',
    borderColor: 'border-indigo-200',
    activeBorder: 'border-indigo-500',
    accentBg: 'bg-indigo-500',
    glowColor: 'shadow-indigo-500/20',
    softBg: 'bg-indigo-50/70'
  },
  rose: {
    id: 'rose',
    label: 'Lotus / Terracotta',
    previewBg: 'bg-rose-500',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    borderColor: 'border-rose-200',
    activeBorder: 'border-rose-500',
    accentBg: 'bg-rose-500',
    glowColor: 'shadow-rose-500/20',
    softBg: 'bg-rose-50/70'
  },
  violet: {
    id: 'violet',
    label: 'Amethyst / Violet',
    previewBg: 'bg-violet-500',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-800',
    borderColor: 'border-violet-200',
    activeBorder: 'border-violet-500',
    accentBg: 'bg-violet-500',
    glowColor: 'shadow-violet-500/20',
    softBg: 'bg-violet-50/70'
  }
};

export const COMMON_CATEGORY_EMOJIS = [
  '🧘', '📿', '🌿', '📖', '🏃', '💧', '🥗', '💰', '🧠', '✍️', '🌅', '💤', '🎯', '✨', '🔥'
];

export const COMMON_SANKALP_EMOJIS = [
  '🏃‍♂️', '🚶‍♂️', '🧘‍♀️', '📖', '📿', '💧', '🥗', '✍️', '🚫', '💰', '🛌', '🌅', '🍎', '🏋️', '🎧', '🧹', '🌿', '⚡'
];

export const DURATION_OPTIONS = [
  '2 min',
  '5 min',
  '10 min',
  '15 min',
  '20 min',
  '30 min',
  '45 min',
  '60 min',
  '90 min',
  'Custom'
];

export const CHALLENGE_DAY_OPTIONS = [
  { days: 21, label: '21 Days', note: 'Habit Formation' },
  { days: 30, label: '30 Days', note: '1 Month Reset' },
  { days: 60, label: '60 Days', note: 'Deep Rewiring' },
  { days: 100, label: '100 Days', note: 'Purna Sankalp (Default)', isDefault: true },
  { days: -1, label: 'Custom', note: 'Enter Your Days' }
];

export const SANKALP_SUTRAS = [
  {
    sanskrit: 'संकल्प मूलः कामः',
    translation: 'Every meaningful reality begins with a pure, unwavering vow.',
    source: 'Mahabharata'
  },
  {
    sanskrit: 'अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते',
    translation: 'Through consistent daily practice and disciplined focus, the mind is mastered.',
    source: 'Bhagavad Gita 6.35'
  },
  {
    sanskrit: 'उद्यमेन हि सिध्यन्ति कार्याणि न मनोरथैः',
    translation: 'Noble goals are fulfilled through disciplined effort, not mere wishes.',
    source: 'Hitopadesha'
  },
  {
    sanskrit: 'दृढसंकल्पः एव सर्वसिद्धीनां मूलम्',
    translation: 'Firm resolve is the root source of every great accomplishment.',
    source: 'Subhashita'
  },
  {
    sanskrit: 'तपः स्वाध्याय ईश्वरप्रणिधानानि क्रियायोगः',
    translation: 'Self-discipline, mindful study, and devotion form the path of action.',
    source: 'Yoga Sutra 2.1'
  }
];
