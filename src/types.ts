export type CategoryColor = 'amber' | 'emerald' | 'indigo' | 'rose' | 'violet';

export interface Category {
  id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  order: number;
}

export type TimeOfDay = 'Morning' | 'Evening' | 'Anytime';

export interface Sankalp {
  id: string;
  categoryId: string;
  title: string;
  emoji?: string;
  timeOfDay: TimeOfDay;
  duration: string; // "2 min", "5 min", "15 min", etc.
  order: number;
  createdAt: string;
  reminderEnabled?: boolean;
  reminderTime?: string; // "HH:MM", e.g. "07:00", "19:30"
}

export interface DayRecord {
  dayNumber: number; // 1, 2, ...
  dateString: string; // YYYY-MM-DD
  completedSankalpIds: string[];
  totalSankalpsAtTime: number;
  notes?: string;
  isCompleted: boolean; // whether "Complete Day" was clicked
  completedAt?: string;
  daySankalps?: Sankalp[]; // Daily custom sankalps list specific to this day
}

export interface SankalpChallenge {
  id: string;
  title: string;
  totalDays: number;
  startDate: string; // YYYY-MM-DD
  categories: Category[];
  sankalps: Sankalp[]; // Master library / initial sankalps
  history: Record<number, DayRecord>;
  currentDay: number;
  isSetupComplete: boolean;
  createdAt: string;
}

export type SetupStep = 'empty' | 'categories' | 'sankalps' | 'duration';
export type ActiveTab = 'today' | 'history' | 'manage' | 'stats';
