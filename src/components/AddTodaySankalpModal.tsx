import React, { useState } from 'react';
import { X, Plus, Sparkles, Clock, Sun, Moon, Check, History, Bell } from 'lucide-react';
import { Category, Sankalp, TimeOfDay } from '../types';
import { CATEGORY_COLORS, COMMON_SANKALP_EMOJIS, DURATION_OPTIONS } from '../utils/constants';

interface AddTodaySankalpModalProps {
  categories: Category[];
  existingSankalps: Sankalp[]; // Master library or past sankalps
  currentDaySankalps: Sankalp[];
  initialCategoryId?: string;
  onAddSankalp: (sankalp: {
    categoryId: string;
    title: string;
    emoji?: string;
    timeOfDay: TimeOfDay;
    duration: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) => void;
  onClose: () => void;
}

export const AddTodaySankalpModal: React.FC<AddTodaySankalpModalProps> = ({
  categories,
  existingSankalps,
  currentDaySankalps,
  initialCategoryId,
  onAddSankalp,
  onClose,
}) => {
  const [tab, setTab] = useState<'create' | 'library'>('create');
  const [categoryId, setCategoryId] = useState(
    initialCategoryId || categories[0]?.id || ''
  );
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🏃‍♂️');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning');
  const [duration, setDuration] = useState('15 min');
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customEmojiMode, setCustomEmojiMode] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('07:00');

  // Filter out sankalps already present in today's list
  const currentTitles = currentDaySankalps.map((s) => s.title.toLowerCase().trim());
  const availableFromLibrary = existingSankalps.filter(
    (s) => !currentTitles.includes(s.title.toLowerCase().trim())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !categoryId) return;

    const finalDuration = isCustomDuration
      ? customDuration.trim() || '15 min'
      : duration;

    onAddSankalp({
      categoryId,
      title: title.trim(),
      emoji: emoji || undefined,
      timeOfDay,
      duration: finalDuration,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
    onClose();
  };

  const handleSelectFromLibrary = (s: Sankalp) => {
    onAddSankalp({
      categoryId: s.categoryId,
      title: s.title,
      emoji: s.emoji,
      timeOfDay: s.timeOfDay,
      duration: s.duration,
      reminderEnabled: s.reminderEnabled,
      reminderTime: s.reminderTime,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div>
            <h2 className="font-display text-xl font-bold text-stone-900">
              Aaj Ke Liye Naya Sankalp
            </h2>
            <p className="text-xs text-stone-500">
              Aaj ki list mein naya sankalp jodein aur complete karein
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs: Create vs Library */}
        {availableFromLibrary.length > 0 && (
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl mb-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTab('create')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                tab === 'create'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Naya Likhein</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('library')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                tab === 'library'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Pehle Ke Sankalp ({availableFromLibrary.length})</span>
            </button>
          </div>
        )}

        {tab === 'library' && availableFromLibrary.length > 0 ? (
          <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
            <p className="text-xs text-stone-500 mb-2">
              Kisi bhi sankalp par click karke use turant aaj ki list me jodein:
            </p>
            {availableFromLibrary.map((s) => {
              const cat = categories.find((c) => c.id === s.categoryId);
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectFromLibrary(s)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{s.emoji || '✨'}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-stone-900 truncate">
                        {s.title}
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {cat ? `${cat.emoji} ${cat.name}` : ''} · {s.timeOfDay} · {s.duration}
                      </div>
                    </div>
                  </div>
                  <button className="text-xs font-bold text-amber-700 bg-white px-2.5 py-1 rounded-lg border border-amber-200 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Select */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Category Chunein
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                {categories.map((c) => {
                  const isSelected = categoryId === c.id;
                  const scheme = CATEGORY_COLORS[c.color];
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? `border-stone-900 bg-stone-900 text-white shadow-xs`
                          : `border-stone-200 hover:border-stone-300 bg-stone-50 text-stone-700`
                      }`}
                    >
                      <span className="text-base">{c.emoji}</span>
                      <span className="text-xs font-medium truncate flex-1">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Sankalp Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 20 min walk, 10 min Dhyana, Read 15 pages"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-medium text-stone-900"
                autoFocus
              />
            </div>

            {/* Emoji Icon */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  Icon (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setCustomEmojiMode(!customEmojiMode)}
                  className="text-[11px] text-amber-700 hover:underline"
                >
                  {customEmojiMode ? 'Quick list' : 'Custom keyboard emoji'}
                </button>
              </div>

              {customEmojiMode ? (
                <input
                  type="text"
                  maxLength={4}
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  placeholder="Enter emoji"
                  className="w-full px-4 py-2 text-center text-2xl rounded-xl border border-stone-300 focus:border-amber-500 outline-none"
                />
              ) : (
                <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200/80 max-h-24 overflow-y-auto">
                  {COMMON_SANKALP_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-white transition-transform active:scale-95 ${
                        emoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Time of Day */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Time of Day
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Morning', 'Evening', 'Anytime'] as TimeOfDay[]).map((time) => {
                  const isSelected = timeOfDay === time;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setTimeOfDay(time)}
                      className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                        isSelected
                          ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {time === 'Morning' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                      {time === 'Evening' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                      {time === 'Anytime' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{time}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={isCustomDuration ? 'Custom' : duration}
                  onChange={(e) => {
                    if (e.target.value === 'Custom') {
                      setIsCustomDuration(true);
                    } else {
                      setIsCustomDuration(false);
                      setDuration(e.target.value);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-xs sm:text-sm font-medium text-stone-900 bg-white"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {isCustomDuration && (
                  <input
                    type="text"
                    placeholder="e.g. 10 pages, 3 sets"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-xs sm:text-sm font-medium text-stone-900"
                  />
                )}
              </div>
            </div>

            {/* Reminder Toggle & Time */}
            <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors ${
                    reminderEnabled ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-200 text-stone-500'
                  }`}>
                    <Bell className="w-4 h-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">
                      Daily Reminder Alert
                    </span>
                    <span className="text-[11px] text-stone-500">
                      Browser notification at preferred time
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminderEnabled}
                    onChange={(e) => setReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {reminderEnabled && (
                <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-700">
                    Preferred Time:
                  </span>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:border-amber-500 outline-none"
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !categoryId}
                className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold min-h-[44px] transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Aaj Ki List Me Jodein</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
