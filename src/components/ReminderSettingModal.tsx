import React, { useState } from 'react';
import { X, Bell, Clock, Sparkles, Check, Volume2 } from 'lucide-react';
import { Sankalp } from '../types';
import { formatTimeDisplay, requestNotificationPermission, triggerSystemNotification } from '../utils/notifications';
import { playGentleChime } from '../utils/effects';

interface ReminderSettingModalProps {
  sankalp: Sankalp;
  onSaveReminder: (sankalpId: string, enabled: boolean, reminderTime?: string) => void;
  onClose: () => void;
}

const PRESET_TIMES = [
  { label: '06:00 AM (Pratahkal)', value: '06:00' },
  { label: '07:00 AM (Morning)', value: '07:00' },
  { label: '08:30 AM (Breakfast)', value: '08:30' },
  { label: '12:30 PM (Mid-day)', value: '12:30' },
  { label: '06:00 PM (Evening)', value: '18:00' },
  { label: '08:30 PM (Post-work)', value: '20:30' },
  { label: '09:30 PM (Ratri)', value: '21:30' },
];

export const ReminderSettingModal: React.FC<ReminderSettingModalProps> = ({
  sankalp,
  onSaveReminder,
  onClose,
}) => {
  const [enabled, setEnabled] = useState(sankalp.reminderEnabled ?? true);
  const [time, setTime] = useState(sankalp.reminderTime || '07:00');
  const [testSent, setTestSent] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enabled) {
      await requestNotificationPermission();
    }
    onSaveReminder(sankalp.id, enabled, enabled ? time : undefined);
    onClose();
  };

  const handleTestNow = async () => {
    await requestNotificationPermission();
    playGentleChime();
    triggerSystemNotification(
      `Reminder Alert: ${sankalp.title}`,
      `Niyam ka samay ho gaya hai (${sankalp.duration}). 🔔`
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-stone-900 leading-tight">
                Sankalp Reminder
              </h3>
              <span className="text-[11px] text-stone-500">
                Preferred alert time
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sankalp Card Info */}
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 mb-4 flex items-center gap-2.5">
          <span className="text-xl">{sankalp.emoji || '✨'}</span>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-stone-900 truncate">
              {sankalp.title}
            </h4>
            <span className="text-[10px] text-stone-500">
              {sankalp.timeOfDay} · {sankalp.duration}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                Daily Push-like Reminder
              </span>
              <span className="text-[11px] text-amber-800">
                Browser notification at preferred time
              </span>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {enabled && (
            <div className="space-y-3">
              {/* Precise Time Input */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Alert Samay (Preferred Time)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 text-sm font-bold text-stone-900 bg-white outline-none"
                  />
                  <div className="text-xs font-semibold text-amber-800 bg-amber-50 px-3 py-2.5 rounded-xl border border-amber-200">
                    {formatTimeDisplay(time)}
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                  Quick Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto p-1">
                  {PRESET_TIMES.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setTime(preset.value)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-left border transition-colors ${
                        time === preset.value
                          ? 'border-amber-500 bg-amber-500 text-white font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Alert Button */}
              <button
                type="button"
                onClick={handleTestNow}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                <span>{testSent ? '✓ Alert Sent!' : 'Test Notification Alert Now'}</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold min-h-[40px] shadow-sm cursor-pointer"
            >
              Save Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
