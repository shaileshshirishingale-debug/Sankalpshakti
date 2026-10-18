import React, { useState, useEffect } from 'react';
import {
  Flame,
  Check,
  Sun,
  Moon,
  Sparkles,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Copy,
  History,
  Star,
  Timer,
  Volume2,
  VolumeX,
  Search,
  PenLine,
  Edit3,
  Edit2,
  MessageSquareQuote,
  Bell,
  Lock,
} from 'lucide-react';
import { SankalpChallenge, TimeOfDay, Sankalp } from '../types';
import { CATEGORY_COLORS, SANKALP_SUTRAS } from '../utils/constants';
import { formatDateDisplay, calculateStreak, getDateForDay } from '../utils/storage';
import { isSoundEnabled, setSoundEnabled, playGentleChime } from '../utils/effects';
import { formatTimeDisplay } from '../utils/notifications';
import { AddTodaySankalpModal } from './AddTodaySankalpModal';
import { FocusTimerModal } from './FocusTimerModal';
import { EditTodaySankalpModal } from './EditTodaySankalpModal';
import { ReminderSettingModal } from './ReminderSettingModal';

interface DailyTrackerProps {
  challenge: SankalpChallenge;
  onToggleSankalp: (sankalpId: string, event: React.MouseEvent) => void;
  onAddTodaySankalp: (sankalpData: {
    categoryId: string;
    title: string;
    emoji?: string;
    timeOfDay: TimeOfDay;
    duration: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) => void;
  onRemoveTodaySankalp: (sankalpId: string) => void;
  onUpdateTodaySankalp?: (updatedSankalp: Sankalp) => void;
  onToggleSankalpReminder?: (sankalpId: string, enabled: boolean, reminderTime?: string) => void;
  onTestReminderAlert?: () => void;
  onCopyYesterdaySankalps: () => void;
  onUpdateTodayReflection?: (notes: string) => void;
  onOpenCompleteDayModal: () => void;
  onGoToHistory: () => void;
  onGoToManage: () => void;
}

const QUICK_REFLECTION_IDEAS = [
  '🎯 Sabhi 10 sankalp dridh anushasan se purna huye.',
  '🧘 Dhyana aur niyam se mann shant aur kendrit raha.',
  '💪 Shuruat me aalas tha par ichhashakti jeet gayi.',
  '🌅 Kal aur behtar samay niyamit karunga.',
];

export const DailyTracker: React.FC<DailyTrackerProps> = ({
  challenge,
  onToggleSankalp,
  onAddTodaySankalp,
  onRemoveTodaySankalp,
  onUpdateTodaySankalp,
  onToggleSankalpReminder,
  onTestReminderAlert,
  onCopyYesterdaySankalps,
  onUpdateTodayReflection,
  onOpenCompleteDayModal,
  onGoToHistory,
  onGoToManage,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | TimeOfDay>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetCategoryForAdd, setTargetCategoryForAdd] = useState<string | undefined>(undefined);
  const [activeTimerSankalp, setActiveTimerSankalp] = useState<Sankalp | null>(null);
  const [editingTodaySankalp, setEditingTodaySankalp] = useState<Sankalp | null>(null);
  const [reminderModalSankalp, setReminderModalSankalp] = useState<Sankalp | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());
  const [isEditingInlineReflection, setIsEditingInlineReflection] = useState(false);
  const [inlineReflectionText, setInlineReflectionText] = useState('');

  const { currentDay, totalDays, categories, sankalps, history } = challenge;
  const computedDateStr = getDateForDay(challenge.startDate, currentDay);

  const currentRecord = history[currentDay] || {
    dayNumber: currentDay,
    dateString: computedDateStr,
    completedSankalpIds: [],
    totalSankalpsAtTime: sankalps.length,
    isCompleted: false,
    daySankalps: sankalps,
  };

  // Today's active sankalp list: prefer dayRecord.daySankalps, fallback to challenge.sankalps
  const todaySankalps: Sankalp[] = currentRecord.daySankalps !== undefined
    ? currentRecord.daySankalps
    : sankalps;

  const streak = calculateStreak(challenge);
  const completedIds = currentRecord.completedSankalpIds || [];
  const completedCount = completedIds.length;
  const totalCount = todaySankalps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isDayAlreadyCompleted = currentRecord.isCompleted;
  const isAllTenDone = totalCount > 0 && completedCount >= totalCount;

  // Filter sankalps
  const filteredSankalps = todaySankalps.filter((s) => {
    if (selectedFilter !== 'All' && s.timeOfDay !== selectedFilter) return false;
    if (searchQuery.trim() && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const sutra = SANKALP_SUTRAS[(currentDay - 1) % SANKALP_SUTRAS.length];

  // Circular progress SVG calculations
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Check if yesterday exists to offer "Copy Yesterday"
  const yesterdayRecord = history[currentDay - 1];
  const canCopyYesterday = currentDay > 1 && yesterdayRecord && (yesterdayRecord.daySankalps?.length || 0) > 0;

  // Milestone message
  const getMilestoneMessage = () => {
    if (totalCount === 0) return 'Aaj ke naye sankalp jodein (+ Add)';
    if (completedCount === 0) return `0 / ${totalCount} completed · Aaj ka shubh aarambh`;
    if (completedCount === totalCount && totalCount >= 10) return '🌟 Shandar! Sabhi 10 Sankalp Aaj Pure Huye!';
    if (completedCount === totalCount) return `🌟 Shandar! Sabhi ${totalCount} Sankalp Aaj Pure Huye!`;
    if (completedCount >= 5) return `${completedCount} / ${totalCount} completed · Halfway done!`;
    return `${completedCount} / ${totalCount} completed · Niyam jari rakhein`;
  };

  const openAddForCategory = (catId?: string) => {
    setTargetCategoryForAdd(catId);
    setIsAddModalOpen(true);
  };

  useEffect(() => {
    setInlineReflectionText(currentRecord.notes || '');
  }, [currentRecord.notes]);

  const handleSaveInlineReflection = () => {
    onUpdateTodayReflection?.(inlineReflectionText.trim());
    setIsEditingInlineReflection(false);
    playGentleChime();
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playGentleChime();
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-28 pt-2">
      {/* Top Main App Bar */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Navigation / Header Strip */}
        <div className="flex items-center justify-between py-3 border-b border-stone-200/80 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
              ॐ
            </span>
            <div>
              <h1 className="font-display font-bold text-base text-stone-900 tracking-tight leading-none">
                My Sankalp
              </h1>
              <span className="text-[11px] text-amber-800 font-medium">
                Day {currentDay} of {totalDays}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Test Reminder Alert */}
            {onTestReminderAlert && (
              <button
                onClick={onTestReminderAlert}
                className="p-2 rounded-xl text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                title="Test Browser Reminder Alert 🔔"
              >
                <Bell className="w-4 h-4 text-amber-600" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title={soundOn ? 'Sound On' : 'Sound Muted'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
            </button>

            {!isDayAlreadyCompleted && (
              <button
                onClick={() => openAddForCategory()}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Sankalp</span>
              </button>
            )}
            <button
              onClick={onGoToHistory}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span className="hidden sm:inline">Patra /</span>
              <span>History</span>
            </button>
            <button
              onClick={onGoToManage}
              className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold transition-colors cursor-pointer min-h-[36px]"
            >
              System
            </button>
          </div>
        </div>

        {/* Hero Progress Header Card */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-sm mb-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Day & Streak */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {formatDateDisplay(currentRecord.dateString || computedDateStr)}
                </span>
                {isDayAlreadyCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Locked & Completed
                  </span>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                  Day {currentDay}
                </h2>
                <span className="text-stone-400 font-display text-lg font-medium">
                  / {totalDays}
                </span>
              </div>

              {/* Streak Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-xs">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                <span>{streak} Day Streak</span>
                <span className="text-amber-600 font-normal">· Anukram</span>
              </div>
            </div>

            {/* Right: Circular Progress Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke="#f5f5f4"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  stroke={isAllTenDone ? '#10b981' : '#f59e0b'}
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-display font-bold text-base text-stone-900 tabular-nums">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Daily 10-Slot Interactive Progress Strip */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-stone-800 flex items-center gap-1.5">
                <span>Daily Sankalps:</span>
                <span className={isAllTenDone ? 'text-emerald-700' : 'text-amber-700'}>
                  {completedCount} / {totalCount} Purna
                </span>
              </span>
              <span className="text-stone-500 font-medium text-[11px]">
                {getMilestoneMessage()}
              </span>
            </div>

            {/* 10-Dot Tactile Indicators */}
            <div className="grid grid-cols-10 gap-1 sm:gap-1.5 mb-3">
              {Array.from({ length: Math.max(10, totalCount) }).map((_, idx) => {
                const s = todaySankalps[idx];
                const isCompleted = s ? completedIds.includes(s.id) : false;
                const isAssigned = !!s;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!isAssigned && !isDayAlreadyCompleted) {
                        openAddForCategory();
                      }
                    }}
                    title={
                      s
                        ? `${idx + 1}. ${s.title} (${isCompleted ? 'Purna' : 'Baki'})`
                        : `Slot ${idx + 1} Khali · Tap to add`
                    }
                    className={`h-7 sm:h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : isAssigned
                        ? 'bg-stone-100 text-stone-700 border border-stone-300'
                        : !isDayAlreadyCompleted
                        ? 'border-2 border-dashed border-amber-300 text-amber-600 bg-amber-50/50 hover:bg-amber-100/70 cursor-pointer'
                        : 'bg-stone-50 text-stone-300 border border-stone-200'
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : isAssigned ? (
                      idx + 1
                    ) : (
                      '+'
                    )}
                  </button>
                );
              })}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${
                  isAllTenDone ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{
                  width: `${
                    totalCount > 0
                      ? Math.min(100, Math.round((completedCount / totalCount) * 100))
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Quick Add Bar / Today's Setup Notice */}
        {!isDayAlreadyCompleted && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">✍️</span>
              <div>
                <div className="text-xs font-bold text-amber-950">
                  {totalCount === 0
                    ? 'Day ' + currentDay + ' ke naye sankalp tay karein'
                    : `Aaj ki list me ${totalCount} sankalp hain (${Math.max(0, 10 - totalCount)} slots baki)`}
                </div>
                <div className="text-[11px] text-amber-800">
                  Har din naye sankalp jodein aur unhe complete karein
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canCopyYesterday && totalCount === 0 && (
                <button
                  onClick={onCopyYesterdaySankalps}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold border border-amber-200 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-600" />
                  <span>Kal ke Copy Karein</span>
                </button>
              )}
              <button
                onClick={() => openAddForCategory()}
                className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                <span>+ Naya Sankalp Jodein</span>
              </button>
            </div>
          </div>
        )}

        {/* Daily Sankalp Reflection Card on Home Screen (Accessible Before & After Complete Day) */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs mb-4">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-semibold shrink-0">
                <PenLine className="w-4 h-4 text-amber-700" />
              </span>
              <div>
                <h3 className="font-display font-bold text-sm text-stone-900 leading-none">
                  Daily Sankalp Reflection
                </h3>
                <span className="text-[11px] text-stone-500">
                  Day {currentDay} Accountability & Mindful Insight
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isDayAlreadyCompleted && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Completed</span>
                </span>
              )}

              {/* Reflection is always editable/writable on Home Screen to boost accountability after day completion! */}
              <button
                onClick={() => setIsEditingInlineReflection(!isEditingInlineReflection)}
                className="text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 py-1 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/70 border border-amber-200/70 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>{currentRecord.notes ? 'Edit 1-2 Lines' : 'Write 1-2 Lines'}</span>
              </button>
            </div>
          </div>

          {/* Reflection Content or Inline Editor */}
          {isEditingInlineReflection ? (
            <div className="space-y-2.5 pt-1">
              <textarea
                rows={2}
                value={inlineReflectionText}
                onChange={(e) => setInlineReflectionText(e.target.value)}
                placeholder="Aaj ke 10 sankalp aur anushasan par 1-2 lines likhein..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-stone-50/50 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-stone-900 resize-none font-medium leading-relaxed"
                autoFocus
              />

              {/* Quick reflection suggestions */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Tap to add prompt:
                </span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_REFLECTION_IDEAS.map((idea, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setInlineReflectionText((prev) =>
                          prev.trim() ? prev.trim() + ' ' + idea : idea
                        );
                      }}
                      className="text-[10px] text-stone-600 bg-stone-100 hover:bg-amber-100/60 hover:text-amber-950 px-2 py-1 rounded-lg border border-stone-200 transition-colors text-left"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                <span>Accountability note boosts consistency & willpower</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingInlineReflection(false)}
                    className="px-3 py-1.5 text-xs text-stone-500 hover:bg-stone-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveInlineReflection}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white rounded-lg shadow-xs cursor-pointer"
                  >
                    Save Reflection
                  </button>
                </div>
              </div>
            </div>
          ) : currentRecord.notes ? (
            <div className="pt-1">
              <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-100 text-xs italic font-serif text-stone-800 leading-relaxed flex items-start gap-2">
                <MessageSquareQuote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 not-italic" />
                <p>"{currentRecord.notes}"</p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-stone-400 mt-2 px-1">
                <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Day {currentDay} Accountability Reflection Active</span>
                </span>
                <span className="text-amber-800 font-medium">
                  {isDayAlreadyCompleted ? 'Permanently Saved in History' : 'Will lock on Complete Day'}
                </span>
              </div>
            </div>
          ) : (
            <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-stone-500 bg-stone-50/60 p-3 rounded-2xl border border-stone-100">
              <p className="text-[11px] text-stone-600 leading-relaxed">
                {isDayAlreadyCompleted
                  ? 'Day complete ho chuka hai. Yahan apna 1-2 line ka anubhav likhkar accountability darj karein.'
                  : '"Complete Day" se pehle ya baad me yahan 1-2 lines likhkar apna aatam-vishwas badhayein.'}
              </p>
              <button
                onClick={() => setIsEditingInlineReflection(true)}
                className="shrink-0 text-xs font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-amber-200/80 shadow-xs cursor-pointer self-start sm:self-auto"
              >
                <PenLine className="w-3.5 h-3.5 text-amber-600" />
                <span>+ Write 1-2 Lines</span>
              </button>
            </div>
          )}
        </div>

        {/* Sanskrit Inspirational Whisper */}
        <div className="mb-4 flex items-center justify-between px-3.5 py-2 rounded-2xl bg-stone-100/60 text-xs text-stone-600">
          <div className="flex items-center gap-2 truncate">
            <span className="text-amber-700 font-serif italic font-medium shrink-0">
              "{sutra.sanskrit}"
            </span>
            <span className="text-stone-400 hidden sm:inline">·</span>
            <span className="text-stone-500 truncate hidden sm:inline">
              {sutra.translation}
            </span>
          </div>
          <span className="text-[11px] text-stone-400 shrink-0 font-medium">
            {sutra.source}
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
          {/* Time Segmented Filter Controls */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-2xl flex-1 w-full overflow-x-auto">
            {(['All', 'Morning', 'Evening', 'Anytime'] as const).map((filter) => {
              const isSelected = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`flex-1 min-w-[64px] py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap min-h-[38px] cursor-pointer ${
                    isSelected
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {filter === 'Morning' && <Sun className="w-3 h-3 text-amber-500" />}
                  {filter === 'Evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                  {filter === 'Anytime' && <Sparkles className="w-3 h-3 text-emerald-500" />}
                  <span>{filter}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          {todaySankalps.length > 5 && (
            <div className="relative w-full sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sankalp..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* If Day Has 0 Sankalps Yet */}
        {todaySankalps.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-dashed border-stone-300 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl">
              🎯
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900 mb-1">
                Day {currentDay} Ke Sankalp Chunein
              </h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Aaj ke din ke liye naye sankalp likhein ya pehle ke sankalps me se chunein.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                onClick={() => openAddForCategory()}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
                <span>+ Aaj Ka Naya Sankalp Jodein</span>
              </button>

              {canCopyYesterday && (
                <button
                  onClick={onCopyYesterdaySankalps}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4 text-amber-600" />
                  <span>Kal Ke 10 Sankalp Copy Karein</span>
                </button>
              )}
            </div>
          </div>
        ) : filteredSankalps.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <div>
              <h4 className="font-display font-bold text-stone-900 text-sm">
                Koi sankalp nahi mila
              </h4>
              <p className="text-xs text-stone-500 max-w-xs mx-auto mt-0.5">
                "{searchQuery || selectedFilter}" filter ke anuroop koi sankalp match nahi hua.
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedFilter('All');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              Filters Clear Karein
            </button>
          </div>
        ) : (
          /* Categories and Sankalps Feed */
          <div className="space-y-6">
            {categories.map((category) => {
              const categorySankalps = filteredSankalps
                .filter((s) => s.categoryId === category.id)
                .sort((a, b) => a.order - b.order);

              if (categorySankalps.length === 0 && (selectedFilter !== 'All' || searchQuery.trim())) {
                return null;
              }

              const catCompletedCount = categorySankalps.filter((s) =>
                completedIds.includes(s.id)
              ).length;

              return (
                <div key={category.id} className="space-y-2.5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.emoji}</span>
                      <h3 className="font-display font-bold text-stone-900 text-base">
                        {category.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-stone-500 tabular-nums">
                        {catCompletedCount} / {categorySankalps.length}
                      </span>
                      {!isDayAlreadyCompleted && (
                        <button
                          onClick={() => openAddForCategory(category.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-white transition-colors cursor-pointer"
                          title={`Add sankalp to ${category.name}`}
                        >
                          <Plus className="w-3 h-3 text-amber-600" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sankalp Cards */}
                  {categorySankalps.length === 0 ? (
                    <div
                      onClick={() => !isDayAlreadyCompleted && openAddForCategory(category.id)}
                      className="text-xs text-stone-400 p-3.5 text-center bg-white rounded-2xl border border-stone-200/60 hover:border-amber-300 transition-colors cursor-pointer"
                    >
                      <span>Is category me sankalp jodne ke liye tap karein</span>
                      <span className="text-amber-700 ml-1 font-semibold">+ Add</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categorySankalps.map((s) => {
                        const isDone = completedIds.includes(s.id);

                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all select-none min-h-[64px] group ${
                              isDone
                                ? 'bg-emerald-50/70 border-emerald-300 shadow-xs'
                                : 'bg-white border-stone-200/90 hover:border-amber-300 shadow-xs hover:shadow-sm'
                            }`}
                          >
                            {/* Checkbox Trigger Hitbox */}
                            <div
                              onClick={(e) => {
                                if (!isDayAlreadyCompleted) {
                                  onToggleSankalp(s.id, e);
                                }
                              }}
                              className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                            >
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                  isDone
                                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20'
                                    : 'border-2 border-stone-300 group-hover:border-amber-500 bg-white'
                                }`}
                              >
                                {isDone && <Check className="w-5 h-5 stroke-[3]" />}
                              </div>

                              {/* Icon */}
                              <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-lg shrink-0">
                                {s.emoji || '✨'}
                              </div>

                              {/* Title & Metadata */}
                              <div className="flex-1 min-w-0">
                                <div
                                  className={`font-semibold text-sm transition-all ${
                                    isDone
                                      ? 'line-through text-emerald-900 opacity-75'
                                      : 'text-stone-900'
                                  }`}
                                >
                                  {s.title}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    {s.timeOfDay === 'Morning' && (
                                      <Sun className="w-3 h-3 text-amber-500" />
                                    )}
                                    {s.timeOfDay === 'Evening' && (
                                      <Moon className="w-3 h-3 text-indigo-500" />
                                    )}
                                    {s.timeOfDay === 'Anytime' && (
                                      <Sparkles className="w-3 h-3 text-emerald-500" />
                                    )}
                                    <span>{s.timeOfDay}</span>
                                  </span>
                                  <span>·</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-stone-400" />
                                    <span>{s.duration}</span>
                                  </span>
                                  {s.reminderEnabled && (
                                    <>
                                      <span>·</span>
                                      <span className="inline-flex items-center gap-0.5 text-amber-800 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                        <Bell className="w-2.5 h-2.5 text-amber-600" />
                                        <span>{formatTimeDisplay(s.reminderTime) || s.reminderTime}</span>
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {/* Reminder Toggle/Config Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setReminderModalSankalp(s);
                                }}
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  s.reminderEnabled
                                    ? 'text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/70'
                                    : 'text-stone-400 hover:text-amber-600 hover:bg-stone-100'
                                }`}
                                title={
                                  s.reminderEnabled
                                    ? `Reminder set for ${formatTimeDisplay(s.reminderTime)}. Tap to change.`
                                    : 'Set push reminder alert'
                                }
                              >
                                <Bell className="w-4 h-4" />
                              </button>

                              {/* Focus Timer Trigger Button */}
                              {!isDone && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveTimerSankalp(s);
                                  }}
                                  className="p-2 text-stone-400 hover:text-amber-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                                  title="Dhyana / Focus Timer Chalu Karein"
                                >
                                  <Timer className="w-4 h-4" />
                                </button>
                              )}

                              {/* Edit button for today if day is not locked */}
                              {!isDayAlreadyCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingTodaySankalp(s);
                                  }}
                                  className="p-2 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer opacity-80 group-hover:opacity-100"
                                  title="Sankalp edit karein"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Remove button for today if day is not locked */}
                              {!isDayAlreadyCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveTodaySankalp(s.id);
                                  }}
                                  className="p-2 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Aaj ki list se hatayein"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Sticky Bar for Complete Day */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent z-40">
        <div className="max-w-md mx-auto">
          {isDayAlreadyCompleted ? (
            <div className="w-full py-3 px-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>Day {currentDay} Sampann Ho Chuka Hai (Locked)</span>
            </div>
          ) : (
            <button
              onClick={onOpenCompleteDayModal}
              className={`w-full h-13 rounded-2xl font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer min-h-[48px] ${
                isAllTenDone
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25 ring-2 ring-emerald-400/40'
                  : 'bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/20'
              }`}
            >
              {isAllTenDone ? (
                <>
                  <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                  <span>Complete Day {currentDay} ({totalCount}/{totalCount} Purna!)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Complete Day {currentDay}</span>
                  <span className="text-xs text-stone-400">
                    ({completedCount}/{totalCount} completed)
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Add Sankalp Modal */}
      {isAddModalOpen && (
        <AddTodaySankalpModal
          categories={categories}
          existingSankalps={sankalps}
          currentDaySankalps={todaySankalps}
          initialCategoryId={targetCategoryForAdd}
          onAddSankalp={onAddTodaySankalp}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {/* Edit Today Sankalp Modal */}
      {editingTodaySankalp && onUpdateTodaySankalp && (
        <EditTodaySankalpModal
          sankalp={editingTodaySankalp}
          categories={categories}
          onSave={onUpdateTodaySankalp}
          onClose={() => setEditingTodaySankalp(null)}
        />
      )}

      {/* Quick Reminder Settings Modal */}
      {reminderModalSankalp && onToggleSankalpReminder && (
        <ReminderSettingModal
          sankalp={reminderModalSankalp}
          onSaveReminder={onToggleSankalpReminder}
          onClose={() => setReminderModalSankalp(null)}
        />
      )}

      {/* Focus Timer Modal */}
      {activeTimerSankalp && (
        <FocusTimerModal
          sankalp={activeTimerSankalp}
          onComplete={() => {
            const dummyEvent = {
              currentTarget: document.body,
            } as unknown as React.MouseEvent;
            if (!completedIds.includes(activeTimerSankalp.id)) {
              onToggleSankalp(activeTimerSankalp.id, dummyEvent);
            }
          }}
          onClose={() => setActiveTimerSankalp(null)}
        />
      )}
    </div>
  );
};
