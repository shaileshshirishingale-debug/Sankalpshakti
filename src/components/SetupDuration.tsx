import React, { useState } from 'react';
import { ArrowLeft, Flame, Calendar, Sparkles, Check, ArrowRight } from 'lucide-react';
import { CHALLENGE_DAY_OPTIONS, SANKALP_SUTRAS } from '../utils/constants';
import { getTodayDateString } from '../utils/storage';
import { Category, Sankalp } from '../types';

interface SetupDurationProps {
  categories: Category[];
  sankalps: Sankalp[];
  onFinishSetup: (totalDays: number, startDate: string) => void;
  onBack: () => void;
}

export const SetupDuration: React.FC<SetupDurationProps> = ({
  categories,
  sankalps,
  onFinishSetup,
  onBack,
}) => {
  const [selectedDays, setSelectedDays] = useState<number>(100);
  const [customDays, setCustomDays] = useState<string>('100');
  const [startDate, setStartDate] = useState<string>(getTodayDateString());
  const sutra = SANKALP_SUTRAS[3];

  const handleStart = () => {
    const finalDays = selectedDays === -1 ? (parseInt(customDays, 10) || 100) : selectedDays;
    onFinishSetup(Math.max(1, finalDays), startDate);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sankalps</span>
        </button>
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Step 3 of 3 · Duration
        </span>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto w-full my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-lg shadow-stone-200/40">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20">
              <Flame className="w-7 h-7 text-white fill-amber-100" />
            </div>
            <h1 className="font-display text-2xl font-bold text-stone-900 mb-1">
              Kitne Din Ka Sankalp Lena Hai?
            </h1>
            <p className="text-xs sm:text-sm text-stone-600">
              Chunein apna lakshya. Classical 100 din ka nishchay mansik shakti ko dridh karta hai.
            </p>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            {CHALLENGE_DAY_OPTIONS.map((opt) => {
              const isSelected = selectedDays === opt.days;
              return (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setSelectedDays(opt.days)}
                  className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between min-h-[72px] cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                      : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-display font-bold text-lg text-stone-900">
                      {opt.label}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-stone-500 mt-1">
                    {opt.note}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Custom Days Input if selected */}
          {selectedDays === -1 && (
            <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Enter Custom Days
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g. 45 or 90"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none font-semibold text-stone-900"
                  autoFocus
                />
                <span className="text-sm font-medium text-stone-600 shrink-0">Days</span>
              </div>
            </div>
          )}

          {/* Start Date Selection */}
          <div className="mb-6 p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Start Date (Aarambh Tithi)</span>
              </label>
              <span className="text-[11px] text-stone-500">Defaults to Today</span>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-xs sm:text-sm font-medium text-stone-900 bg-white"
            />
          </div>

          {/* Configuration Summary Badge */}
          <div className="mb-6 p-3.5 rounded-2xl bg-stone-100/80 flex items-center justify-between text-xs text-stone-600">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-stone-400">Categories: </span>
                <strong className="text-stone-800">{categories.length}</strong>
              </div>
              <span>·</span>
              <div>
                <span className="text-stone-400">Sankalps: </span>
                <strong className="text-stone-800">{sankalps.length}</strong>
              </div>
            </div>
            <div className="text-amber-800 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedDays === -1 ? `${customDays || 100} Days` : `${selectedDays} Days`}
              </span>
            </div>
          </div>

          {/* Sacred Inspiration */}
          <div className="mb-6 text-center text-xs italic text-stone-500 bg-amber-50/50 py-2.5 px-3 rounded-xl border border-amber-100">
            "{sutra.sanskrit}" — {sutra.translation}
          </div>

          {/* Final Launch Button */}
          <button
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 active:scale-[0.99] text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-600/25 transition-all cursor-pointer min-h-[48px]"
          >
            <span>Dridh Sankalp Aarambh Karein</span>
            <ArrowRight className="w-5 h-5 text-amber-100" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-xl mx-auto w-full text-center text-xs text-stone-400 py-2">
        My Sankalp · Resolve & Transformation
      </footer>
    </div>
  );
};
