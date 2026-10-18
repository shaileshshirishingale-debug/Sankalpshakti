import React, { useState } from 'react';
import { Lock, Sparkles, CheckCircle2, Star, BookOpen, PenLine, Heart } from 'lucide-react';
import { SANKALP_SUTRAS } from '../utils/constants';

interface CompleteDayModalProps {
  dayNumber: number;
  totalDays: number;
  completedCount: number;
  totalSankalps: number;
  initialNotes?: string;
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
}

const QUICK_REFLECTION_PROMPTS = [
  '🎯 10/10 sankalp dridh anushasan se purna huye.',
  '🧘 Dhyana aur niyam se mann shant aur kendrit raha.',
  '💪 Shuruat me aalas tha par sankalp shakti jeet gayi.',
  '🌅 Kal aur behtar samay niyamit karunga.',
];

export const CompleteDayModal: React.FC<CompleteDayModalProps> = ({
  dayNumber,
  totalDays,
  completedCount,
  totalSankalps,
  initialNotes = '',
  onConfirm,
  onCancel,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const targetTotal = totalSankalps > 0 ? totalSankalps : 10;
  const isTenAchieved = targetTotal > 0 && completedCount >= targetTotal;
  const remaining = Math.max(0, targetTotal - completedCount);
  const completionPercentage = targetTotal > 0 ? Math.min(100, Math.round((completedCount / targetTotal) * 100)) : 0;
  const sutra = SANKALP_SUTRAS[(dayNumber - 1) % SANKALP_SUTRAS.length];

  const handlePromptClick = (promptText: string) => {
    if (!notes.trim()) {
      setNotes(promptText);
    } else {
      setNotes((prev) => prev.trim() + ' ' + promptText);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-sm ${
            isTenAchieved ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
          }`}>
            {isTenAchieved ? (
              <Star className="w-8 h-8 text-amber-200 fill-amber-200" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-white" />
            )}
          </div>
          <h2 className="font-display text-xl font-bold text-stone-900">
            Day {dayNumber} / {totalDays} Sampann Karein?
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Apne niyam ka antim satyapan aur Daily Reflection
          </p>
        </div>

        {/* Completion Status */}
        <div className={`p-3.5 rounded-2xl mb-4 border flex items-center justify-between ${
          isTenAchieved ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <div className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>{completedCount} / {targetTotal} Sankalp Purna</span>
              {isTenAchieved && <span className="text-xs text-emerald-700">⭐ (100% Purna!)</span>}
            </div>
            <div className="text-[11px] text-stone-600 mt-0.5">
              {isTenAchieved
                ? `Anushasan ki vijay! Sabhi ${targetTotal} sankalp purna huye.`
                : `${targetTotal} me se ${completedCount} pure huye, ${remaining} baki reh gaye.`}
            </div>
          </div>
          <span className={`text-base font-extrabold ${isTenAchieved ? 'text-emerald-700' : 'text-amber-800'}`}>
            {completionPercentage}%
          </span>
        </div>

        {/* Daily Sankalp Reflection Section */}
        <div className="mb-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
              <PenLine className="w-3.5 h-3.5 text-amber-600" />
              <span>Daily Sankalp Reflection (1-2 Lines)</span>
            </label>
            <span className="text-[10px] text-amber-800 font-semibold">
              Accountability Boost
            </span>
          </div>
          <p className="text-[11px] text-amber-900/80 mb-2 leading-relaxed">
            Aaj ke anubhav aur willpower par 1-2 lines likhein jo Home Screen aur History me aapka aatam-avashwas badhayegi:
          </p>

          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Aaj subah niyam samay par shuru hua. 10 sankalp pure karke mann me atoot shanti aur santushti hai..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-xs text-stone-900 resize-none font-medium leading-relaxed"
            autoFocus
          />

          {/* Quick Reflection Prompt Ideas */}
          <div className="mt-2.5">
            <span className="text-[10px] uppercase font-semibold text-stone-400 block mb-1">
              Tap to add inspiration:
            </span>
            <div className="flex flex-wrap gap-1">
              {QUICK_REFLECTION_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="text-[10px] font-medium text-stone-700 bg-white/90 hover:bg-white px-2 py-1 rounded-lg border border-amber-200/60 transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lock Notice */}
        <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2 mb-4">
          <Lock className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> Complete Day dabane ke baad Day {dayNumber} lock ho jayega aur reflection save ho jayegi.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium min-h-[44px]"
          >
            Abhi Nahi, Rukein
          </button>
          <button
            type="button"
            onClick={() => onConfirm(notes)}
            className={`px-5 py-2.5 rounded-xl text-white text-xs font-semibold min-h-[44px] transition-colors flex items-center gap-1.5 shadow-md cursor-pointer ${
              isTenAchieved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-stone-900 hover:bg-stone-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Confirm & Complete Day {dayNumber}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
