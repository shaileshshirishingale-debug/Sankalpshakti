import React from 'react';
import { Bell, Check, X, Clock, Sparkles } from 'lucide-react';
import { ActiveReminderAlert, formatTimeDisplay } from '../utils/notifications';

interface ReminderToastProps {
  alert: ActiveReminderAlert;
  onComplete: (sankalpId: string) => void;
  onDismiss: () => void;
}

export const ReminderToast: React.FC<ReminderToastProps> = ({
  alert,
  onComplete,
  onDismiss,
}) => {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto animate-in slide-in-from-top-4 fade-in duration-200">
      <div className="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-2xl shadow-amber-900/15 flex items-center justify-between gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm text-xl ring-2 ring-amber-400/30">
          {alert.emoji || <Bell className="w-5 h-5 text-white animate-bounce" />}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Bell className="w-2.5 h-2.5 text-amber-700" />
              <span>Sankalp Reminder</span>
            </span>
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-0.5">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{formatTimeDisplay(alert.time) || alert.time}</span>
            </span>
          </div>

          <h4 className="font-display font-bold text-sm text-stone-900 truncate">
            {alert.title}
          </h4>
          <p className="text-[11px] text-stone-500 font-medium">
            Niyam ka samay ho gaya hai · {alert.duration}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onComplete(alert.sankalpId)}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer transition-all active:scale-95 min-h-[40px]"
            title="Mark Completed"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Purna</span>
          </button>
          <button
            onClick={onDismiss}
            className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
