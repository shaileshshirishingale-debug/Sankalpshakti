import React, { useState } from 'react';
import { X, Clock, Sun, Moon, Sparkles, Bell, Check } from 'lucide-react';
import { Category, Sankalp, TimeOfDay } from '../types';
import { COMMON_SANKALP_EMOJIS, DURATION_OPTIONS } from '../utils/constants';

interface EditTodaySankalpModalProps {
  sankalp: Sankalp;
  categories: Category[];
  onSave: (updated: Sankalp) => void;
  onClose: () => void;
}

export const EditTodaySankalpModal: React.FC<EditTodaySankalpModalProps> = ({
  sankalp,
  categories,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(sankalp.title);
  const [categoryId, setCategoryId] = useState(sankalp.categoryId);
  const [emoji, setEmoji] = useState(sankalp.emoji || '✨');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(sankalp.timeOfDay);
  const [duration, setDuration] = useState(
    DURATION_OPTIONS.includes(sankalp.duration) ? sankalp.duration : 'Custom'
  );
  const [customDuration, setCustomDuration] = useState(
    DURATION_OPTIONS.includes(sankalp.duration) ? '' : sankalp.duration
  );
  const [isCustomDuration, setIsCustomDuration] = useState(
    !DURATION_OPTIONS.includes(sankalp.duration)
  );
  const [reminderEnabled, setReminderEnabled] = useState(sankalp.reminderEnabled || false);
  const [reminderTime, setReminderTime] = useState(sankalp.reminderTime || '07:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDuration = isCustomDuration ? customDuration.trim() || '15 min' : duration;

    onSave({
      ...sankalp,
      title: title.trim(),
      categoryId,
      emoji: emoji || undefined,
      timeOfDay,
      duration: finalDuration,
      reminderEnabled,
      reminderTime: reminderEnabled ? reminderTime : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div>
            <h3 className="font-display font-bold text-lg text-stone-900">
              Edit Sankalp
            </h3>
            <p className="text-xs text-stone-500">
              Sankalp ke niyam, samay aur reminder badlein
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold bg-white text-stone-900"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-sm font-medium text-stone-900"
            />
          </div>

          {/* Emoji */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200/80 max-h-24 overflow-y-auto">
              {COMMON_SANKALP_EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-white ${
                    emoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
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
                  placeholder="e.g. 10 pages"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm font-medium text-stone-900"
                />
              )}
            </div>
          </div>

          {/* Reminder Toggle & Time */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors ${
                  reminderEnabled ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-200 text-stone-500'
                }`}>
                  <Bell className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-xs font-bold text-stone-900 block leading-tight">
                    Daily Push-like Reminder
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Local browser notification at time
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
              <div className="mt-3 pt-3 border-t border-amber-200/70 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-stone-800">
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

          {/* Action Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold min-h-[44px] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
