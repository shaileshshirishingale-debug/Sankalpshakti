import React, { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle2, XCircle, Flame, Calendar, BookOpen, Star, Award, Grid, List, MessageSquareQuote, PenLine, BarChart2, TrendingUp } from 'lucide-react';
import { SankalpChallenge } from '../types';
import { formatDateDisplay, calculateStreak, calculateMaxStreak, calculateTotalCompletions } from '../utils/storage';
import { CATEGORY_COLORS } from '../utils/constants';
import { CertificateModal } from './CertificateModal';
import { StreaksConsistencyChart } from './StreaksConsistencyChart';
import { SankalpCompletionTrendChart } from './SankalpCompletionTrendChart';

interface HistoryLogProps {
  challenge: SankalpChallenge;
  onBackToToday: () => void;
  onGoToManage?: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ challenge, onBackToToday, onGoToManage }) => {
  const { totalDays, currentDay, history, sankalps, categories } = challenge;
  const [selectedDayNumber, setSelectedDayNumber] = useState<number>(currentDay);
  const [viewMode, setViewMode] = useState<'grid' | 'carousel' | 'reflections' | 'chart' | 'trend'>('trend');
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);

  const streak = calculateStreak(challenge);
  const maxStreak = calculateMaxStreak(challenge);
  const { totalChecked, completedDays, completionRate } = calculateTotalCompletions(challenge);

  // Array of days from 1 to currentDay
  const recordedDays = Array.from({ length: currentDay }, (_, i) => i + 1);
  const allChallengeDays = Array.from({ length: totalDays }, (_, i) => i + 1);

  // Count perfect days (100% adherence) dynamically
  const defaultTarget = sankalps.length > 0 ? sankalps.length : 10;
  const perfectTenDaysCount = Object.values(history).filter((h) => {
    const target = h.daySankalps && h.daySankalps.length > 0
      ? h.daySankalps.length
      : (h.totalSankalpsAtTime && h.totalSankalpsAtTime > 0 ? h.totalSankalpsAtTime : defaultTarget);
    return target > 0 && (h.completedSankalpIds || []).length >= target;
  }).length;

  const selectedRecord = history[selectedDayNumber];
  const selectedCompletedIds = selectedRecord?.completedSankalpIds || [];
  const selectedIsCompleted = selectedRecord?.isCompleted || false;
  const isPastLockedDay = selectedDayNumber < currentDay || selectedIsCompleted;
  const selectedDayTarget = selectedRecord?.daySankalps && selectedRecord.daySankalps.length > 0
    ? selectedRecord.daySankalps.length
    : (selectedRecord?.totalSankalpsAtTime && selectedRecord.totalSankalpsAtTime > 0
        ? selectedRecord.totalSankalpsAtTime
        : defaultTarget);
  const isSelectedPerfectTen = selectedDayTarget > 0 && selectedCompletedIds.length >= selectedDayTarget;

  return (
    <div className="min-h-screen bg-stone-50 pb-16 pt-2">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between py-3 border-b border-stone-200/80 mb-4">
          <button
            onClick={onBackToToday}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Today</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCertificateOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200/80 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-700" />
              <span>Siddhi Patra</span>
            </button>
            {onGoToManage && (
              <button
                onClick={onGoToManage}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                System
              </button>
            )}
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-stone-500 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Streak</span>
            </div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-stone-900 tabular-nums">
              {streak}d
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1 text-[11px] text-amber-700 font-semibold mb-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>10/10 Days</span>
            </div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-amber-900 tabular-nums">
              {perfectTenDaysCount}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs text-center">
            <div className="text-[11px] text-stone-500 mb-1">Days Done</div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-stone-900 tabular-nums">
              {completedDays} <span className="text-[10px] text-stone-400 font-normal">/ {totalDays}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 sm:p-4 border border-stone-200/80 shadow-xs text-center">
            <div className="text-[11px] text-stone-500 mb-1">Adherence</div>
            <div className="font-display font-extrabold text-lg sm:text-xl text-stone-900 tabular-nums">
              {completionRate}%
            </div>
          </div>
        </div>

        {/* View Toggle Bar */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              {totalDays} Din Ka Visual Mandala
            </span>
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('carousel')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'carousel' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
                title="Carousel View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="text-[11px]">List</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                }`}
                title="100-Day Grid View"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="text-[11px]">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'chart' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-500'
                }`}
                title="Streaks & Consistency Chart (recharts)"
              >
                <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Streaks Chart</span>
              </button>
              <button
                onClick={() => setViewMode('trend')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'trend' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-500'
                }`}
                title="Completion Trend Line Chart (recharts)"
              >
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[11px]">Trend Line</span>
              </button>
              <button
                onClick={() => setViewMode('reflections')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'reflections' ? 'bg-white text-amber-900 shadow-xs' : 'text-stone-500'
                }`}
                title="Reflections Diary"
              >
                <MessageSquareQuote className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">Reflections</span>
              </button>
            </div>
          </div>

          {viewMode === 'carousel' ? (
            /* Carousel View */
            <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
              {recordedDays.map((dayNum) => {
                const rec = history[dayNum];
                const isSelected = selectedDayNumber === dayNum;
                const isDone = rec?.isCompleted;
                const count = (rec?.completedSankalpIds || []).length;
                const dayTarget = rec?.daySankalps && rec.daySankalps.length > 0
                  ? rec.daySankalps.length
                  : (rec?.totalSankalpsAtTime && rec.totalSankalpsAtTime > 0 ? rec.totalSankalpsAtTime : defaultTarget);
                const isTen = dayTarget > 0 && count >= dayTarget;

                return (
                  <button
                    key={dayNum}
                    onClick={() => setSelectedDayNumber(dayNum)}
                    className={`flex flex-col items-center justify-between min-w-[56px] h-[68px] p-1.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20 font-bold'
                        : isTen
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
                        : isDone
                        ? 'border-stone-200 bg-stone-50 text-stone-700'
                        : 'border-stone-200 bg-white text-stone-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-1">
                      <span className="text-[9px] uppercase font-semibold">D{dayNum}</span>
                      {isTen && <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />}
                    </div>

                    <span className="text-sm font-display font-bold tabular-nums">
                      {count}/{dayTarget}
                    </span>

                    <div className="flex items-center gap-0.5">
                      {isDone ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Completed" />
                      ) : dayNum < currentDay ? (
                        <span className="w-2 h-2 rounded-full bg-stone-300" title="Incomplete" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500" title="In Progress" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : viewMode === 'grid' ? (
            /* 100-Day Visual Mandala Grid (10 columns) */
            <div className="space-y-2">
              <div className="grid grid-cols-10 gap-1 sm:gap-1.5 p-1 bg-stone-50 rounded-xl border border-stone-200/60 max-h-64 overflow-y-auto">
                {allChallengeDays.map((dayNum) => {
                  const rec = history[dayNum];
                  const isPastOrToday = dayNum <= currentDay;
                  const isSelected = selectedDayNumber === dayNum;
                  const isDone = rec?.isCompleted;
                  const count = (rec?.completedSankalpIds || []).length;
                  const dayTarget = rec?.daySankalps && rec.daySankalps.length > 0
                    ? rec.daySankalps.length
                    : (rec?.totalSankalpsAtTime && rec.totalSankalpsAtTime > 0 ? rec.totalSankalpsAtTime : defaultTarget);
                  const isTen = dayTarget > 0 && count >= dayTarget;

                  return (
                    <button
                      key={dayNum}
                      disabled={!isPastOrToday}
                      onClick={() => setSelectedDayNumber(dayNum)}
                      title={`Day ${dayNum} ${isDone ? `(${count}/${dayTarget} Purna)` : isPastOrToday ? '(In Progress)' : '(Upcoming)'}`}
                      className={`h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center text-[11px] font-bold transition-all relative ${
                        isSelected
                          ? 'ring-2 ring-amber-500 border border-amber-600 bg-amber-100 text-amber-950 font-extrabold'
                          : isTen
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : dayNum === currentDay
                          ? 'bg-amber-500 text-white shadow-xs'
                          : isPastOrToday
                          ? 'bg-stone-200 text-stone-600 border border-stone-300'
                          : 'bg-white text-stone-300 border border-dashed border-stone-200 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <span>{dayNum}</span>
                      {isTen && <span className="text-[8px] leading-none">⭐</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-500 px-1 pt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>100% Purna</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Today</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-300" />
                  <span>Upcoming / Unlocked</span>
                </span>
              </div>
            </div>
          ) : viewMode === 'trend' ? (
            /* Recharts Completion Trend Line Chart */
            <SankalpCompletionTrendChart
              challenge={challenge}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={(dayNum) => setSelectedDayNumber(dayNum)}
            />
          ) : viewMode === 'chart' ? (
            /* Recharts Streaks & Consistency Bar Chart */
            <StreaksConsistencyChart
              challenge={challenge}
              selectedDayNumber={selectedDayNumber}
              onSelectDay={(dayNum) => setSelectedDayNumber(dayNum)}
            />
          ) : null}

          {/* Positive Reinforcement & Journey Stats Summary */}
          {(viewMode === 'trend' || viewMode === 'chart') && (
            <div className="mt-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Award className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-stone-900 text-sm flex items-center gap-1.5">
                    <span>Journey Reinforcement & Milestone</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                      Dridhata
                    </span>
                  </h4>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {completedDays >= 10
                      ? 'अद्भुत अनुशासन! आपकी यह निष्ठा आपके उज्ज्वल भविष्य का आधार है।'
                      : 'हर दिन का छोटा प्रयास बड़े बदलाव लाता है। अपनी गति बनाए रखें!'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
                <div className="bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs text-center">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase block">Longest Streak</span>
                  <span className="font-display font-extrabold text-sm text-amber-700 tabular-nums">
                    {maxStreak} Days 🔥
                  </span>
                </div>
                <div className="bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-xs text-center">
                  <span className="text-[10px] font-semibold text-stone-500 uppercase block">Total Completed</span>
                  <span className="font-display font-extrabold text-sm text-emerald-700 tabular-nums">
                    {completedDays} / {totalDays} 🌟
                  </span>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'reflections' && (
            /* Reflections Diary View */
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-700 pb-1 border-b border-stone-100">
                <span className="flex items-center gap-1.5">
                  <PenLine className="w-4 h-4 text-amber-600" />
                  <span>Daily Accountability Reflections (Day 1 to {currentDay})</span>
                </span>
                <span className="text-stone-400 font-normal text-[11px]">
                  {Object.values(history).filter((h) => !!h.notes).length} reflections saved
                </span>
              </div>

              {Object.values(history).filter((h) => !!h.notes).length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs italic">
                  Abhi tak koi reflection note save nahi kiya gaya hai. Home screen par "Complete Day" ke baad 1-2 lines likhein.
                </div>
              ) : (
                <div className="space-y-3">
                  {recordedDays
                    .slice()
                    .reverse()
                    .map((dayNum) => {
                      const rec = history[dayNum];
                      if (!rec || !rec.notes) return null;
                      const count = (rec.completedSankalpIds || []).length;
                      const dayTarget = rec.daySankalps && rec.daySankalps.length > 0
                        ? rec.daySankalps.length
                        : (rec.totalSankalpsAtTime && rec.totalSankalpsAtTime > 0 ? rec.totalSankalpsAtTime : defaultTarget);
                      const isTen = dayTarget > 0 && count >= dayTarget;

                      return (
                        <div
                          key={dayNum}
                          onClick={() => {
                            setSelectedDayNumber(dayNum);
                            setViewMode('carousel');
                          }}
                          className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 hover:border-amber-400 hover:bg-amber-50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-display font-bold text-xs text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg">
                                Day {dayNum}
                              </span>
                              <span className="text-[11px] text-stone-500 font-medium">
                                {formatDateDisplay(rec.dateString)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {isTen && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                                  ⭐ 100% Purna
                                </span>
                              )}
                              <span className="text-[11px] font-bold text-stone-700">
                                {count}/{dayTarget}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2.5 text-xs text-stone-800 font-serif italic leading-relaxed">
                            <MessageSquareQuote className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 not-italic group-hover:scale-110 transition-transform" />
                            <p>"{rec.notes}"</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Day Detail Card */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-sm mb-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {selectedRecord?.dateString ? formatDateDisplay(selectedRecord.dateString) : `Day ${selectedDayNumber}`}
                </span>
                {isPastLockedDay && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3 text-stone-500" />
                    Locked Record
                  </span>
                )}
              </div>
              <h2 className="font-display text-2xl font-bold text-stone-900 flex items-center gap-2">
                <span>Day {selectedDayNumber} Report</span>
                {isSelectedPerfectTen && (
                  <span className="text-amber-500 text-lg" title="10/10 Perfect Day">⭐</span>
                )}
              </h2>
            </div>

            <div className="text-right">
              <span className="text-xs font-semibold text-stone-500 block">
                Daily Score
              </span>
              <span className={`font-display font-extrabold text-2xl tabular-nums ${
                isSelectedPerfectTen ? 'text-emerald-700' : 'text-stone-900'
              }`}>
                {selectedCompletedIds.length} <span className="text-sm text-stone-400 font-normal">/ {selectedDayTarget}</span>
              </span>
            </div>
          </div>

          {/* Reflection Note if any */}
          {selectedRecord?.notes && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950 flex items-start gap-2.5">
              <BookOpen className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-900 font-semibold mb-0.5">
                  Daily Reflection / Aaj Ka Anubhav:
                </strong>
                <p className="italic text-stone-700">{selectedRecord.notes}</p>
              </div>
            </div>
          )}

          {/* Sankalp List for this Day */}
          <div className="space-y-4">
            {categories.map((category) => {
              const targetDaySankalps = selectedRecord?.daySankalps || sankalps;
              const catSankalps = targetDaySankalps
                .filter((s) => s.categoryId === category.id)
                .sort((a, b) => a.order - b.order);

              if (catSankalps.length === 0) return null;

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-stone-700">
                    <span>{category.emoji}</span>
                    <span>{category.name}</span>
                  </div>

                  <div className="space-y-1.5">
                    {catSankalps.map((s) => {
                      const isDone = selectedCompletedIds.includes(s.id);

                      return (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                              : 'bg-stone-50 border-stone-200 text-stone-500'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-stone-300 shrink-0" />
                            )}
                            <span className="text-base">{s.emoji || '✨'}</span>
                            <span className={isDone ? 'font-semibold' : 'opacity-70'}>
                              {s.title}
                            </span>
                          </div>

                          <span className="text-[11px] text-stone-400">
                            {s.timeOfDay} · {s.duration}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notice about past days */}
          <div className="mt-6 pt-4 border-t border-stone-100 text-center text-xs text-stone-400 flex items-center justify-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            <span>Past days are locked to maintain unshakeable discipline & authenticity.</span>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {isCertificateOpen && (
        <CertificateModal
          challenge={challenge}
          onClose={() => setIsCertificateOpen(false)}
        />
      )}
    </div>
  );
};
