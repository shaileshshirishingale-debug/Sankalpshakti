import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, Info } from 'lucide-react';
import { SankalpChallenge } from '../types';
import { formatDateDisplay } from '../utils/storage';

interface StreaksConsistencyChartProps {
  challenge: SankalpChallenge;
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
}

type TimeRangeFilter = 'all' | '30' | '14';

interface DayChartData {
  day: number;
  label: string;
  count: number;
  total: number;
  percentage: number;
  isCompleted: boolean;
  isToday: boolean;
  isPast: boolean;
  dateStr: string;
  notes?: string;
}

export const StreaksConsistencyChart: React.FC<StreaksConsistencyChartProps> = ({
  challenge,
  selectedDayNumber,
  onSelectDay,
}) => {
  const { totalDays, currentDay, history, sankalps } = challenge;
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');

  const defaultTarget = sankalps.length > 0 ? sankalps.length : 10;

  // Prepare data for recharts with dynamic day totals
  const fullChartData: DayChartData[] = useMemo(() => {
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const record = history[dayNum];
      const completedCount = new Set(record?.completedSankalpIds || []).size;
      const dayTotal = record?.daySankalps && record.daySankalps.length > 0
        ? record.daySankalps.length
        : (record?.totalSankalpsAtTime && record.totalSankalpsAtTime > 0
            ? record.totalSankalpsAtTime
            : defaultTarget);

      const isPast = dayNum < currentDay;
      const isToday = dayNum === currentDay;
      const isCompleted = record?.isCompleted || false;
      const pct = dayTotal > 0 ? Math.min(100, Math.round((completedCount / dayTotal) * 100)) : 0;

      return {
        day: dayNum,
        label: `D${dayNum}`,
        count: completedCount,
        total: dayTotal,
        percentage: pct,
        isCompleted,
        isToday,
        isPast,
        dateStr: record?.dateString || '',
        notes: record?.notes,
      };
    });
  }, [totalDays, currentDay, history, defaultTarget]);

  // Filter based on range selection
  const filteredData = useMemo(() => {
    if (timeRange === '14') {
      const start = Math.max(1, currentDay - 13);
      return fullChartData.filter((d) => d.day >= start && d.day <= Math.min(totalDays, currentDay + 7));
    }
    if (timeRange === '30') {
      const start = Math.max(1, currentDay - 29);
      return fullChartData.filter((d) => d.day >= start && d.day <= Math.min(totalDays, currentDay + 15));
    }
    return fullChartData;
  }, [fullChartData, timeRange, currentDay, totalDays]);

  // Metrics for consistency up to currentDay
  const pastAndCurrentDays = useMemo(() => {
    return fullChartData.filter((d) => d.day <= currentDay);
  }, [fullChartData, currentDay]);

  const totalCompletedInRecorded = pastAndCurrentDays.reduce((acc, d) => acc + d.count, 0);
  const maxPossibleRecorded = pastAndCurrentDays.reduce((acc, d) => acc + d.total, 0);
  const overallAdherence = maxPossibleRecorded > 0 ? Math.min(100, Math.round((totalCompletedInRecorded / maxPossibleRecorded) * 100)) : 0;
  const perfectDaysCount = pastAndCurrentDays.filter((d) => d.total > 0 && d.count >= d.total).length;

  const maxChartY = useMemo(() => {
    const maxVal = Math.max(defaultTarget, ...fullChartData.map((d) => d.total));
    return Math.max(10, maxVal);
  }, [defaultTarget, fullChartData]);

  // Function to determine cell fill color based on adherence ratio
  const getBarColor = (entry: DayChartData) => {
    if (entry.day > currentDay) {
      return '#e2e8f0'; // Future upcoming day
    }
    if (entry.day === selectedDayNumber) {
      return '#b45309'; // Selected day deep amber
    }
    if (entry.count >= entry.total && entry.total > 0) {
      return '#10b981'; // 100% Purna - Emerald green
    }
    if (entry.percentage >= 70) {
      return '#34d399'; // High adherence green
    }
    if (entry.percentage >= 40) {
      return '#f59e0b'; // Medium adherence amber
    }
    if (entry.count >= 1) {
      return '#fb923c'; // Low completion orange
    }
    return '#cbd5e1'; // 0 completions
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DayChartData = payload[0].payload;
      const isPerfect = data.total > 0 && data.count >= data.total;

      return (
        <div className="bg-stone-900 text-white text-xs rounded-xl p-3 shadow-xl border border-stone-700 min-w-[190px]">
          <div className="flex items-center justify-between font-bold mb-1 border-b border-stone-700/80 pb-1">
            <span className="text-amber-400">Day {data.day} of {totalDays}</span>
            {data.isToday && (
              <span className="bg-amber-500/30 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
                Today
              </span>
            )}
            {isPerfect && (
              <span className="text-amber-300 font-bold">⭐ Purna ({data.count}/{data.total})</span>
            )}
          </div>

          <div className="space-y-1 text-stone-300 text-[11px] my-1.5">
            <div className="flex justify-between">
              <span>Sankalps Completed:</span>
              <span className="font-bold text-white tabular-nums">{data.count} / {data.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Adherence Rate:</span>
              <span className="font-bold text-emerald-400 tabular-nums">{data.percentage}%</span>
            </div>
            {data.dateStr && (
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Date:</span>
                <span>{formatDateDisplay(data.dateStr)}</span>
              </div>
            )}
            {data.notes && (
              <div className="mt-2 pt-1 border-t border-stone-800 text-[10px] italic text-amber-200/90 line-clamp-2">
                "{data.notes}"
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-amber-400 font-medium text-center bg-stone-800/80 py-1 rounded-md">
            Click bar to view full day details
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Top Controls & Range Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-stone-900 text-sm">
              100-Day Consistency & Streaks Chart
            </h3>
            <p className="text-[11px] text-stone-500">
              Interactive consistency tracker powered by recharts
            </p>
          </div>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-xl text-xs">
          <button
            onClick={() => setTimeRange('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All 100 Days
          </button>
          <button
            onClick={() => setTimeRange('30')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === '30'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('14')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeRange === '14'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Last 14 Days
          </button>
        </div>
      </div>

      {/* Mini Metric Badges */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] font-semibold text-amber-800 block">Consistency Rate</span>
          <span className="font-display font-bold text-base text-amber-950 tabular-nums">
            {overallAdherence}%
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
          <span className="text-[10px] font-semibold text-emerald-800 block">100% Purna Days</span>
          <span className="font-display font-bold text-base text-emerald-950 tabular-nums">
            {perfectDaysCount}
          </span>
        </div>
        <div className="p-2.5 rounded-xl bg-stone-100/80 border border-stone-200/60">
          <span className="text-[10px] font-semibold text-stone-600 block">Current Selected</span>
          <span className="font-display font-bold text-base text-stone-900 tabular-nums">
            Day {selectedDayNumber}
          </span>
        </div>
      </div>

      {/* Recharts Bar Chart Container */}
      <div className="bg-stone-50/70 p-3 rounded-2xl border border-stone-200/70">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filteredData}
              margin={{ top: 14, right: 8, left: -20, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedDay = state.activePayload[0].payload.day;
                  if (clickedDay <= currentDay) {
                    onSelectDay(clickedDay);
                  }
                }
              }}
            >
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#78716c' }}
                interval={timeRange === 'all' ? 9 : 0}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, maxChartY]}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }} />
              <ReferenceLine
                y={defaultTarget}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                label={{
                  value: `Target (${defaultTarget})`,
                  position: 'top',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Bar
                dataKey="count"
                radius={[4, 4, 0, 0]}
                className="cursor-pointer transition-opacity hover:opacity-80"
              >
                {filteredData.map((entry) => (
                  <Cell
                    key={`cell-${entry.day}`}
                    fill={getBarColor(entry)}
                    stroke={entry.day === selectedDayNumber ? '#78350f' : undefined}
                    strokeWidth={entry.day === selectedDayNumber ? 2 : 0}
                    onClick={() => {
                      if (entry.day <= currentDay) {
                        onSelectDay(entry.day);
                      }
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Color Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-[11px] text-stone-600 border-t border-stone-200/60 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>100% Purna</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
            <span>&ge; 70% High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            <span>&ge; 40% Mid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />
            <span>&ge; 1% Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 inline-block" />
            <span>Upcoming / 0%</span>
          </div>
        </div>
      </div>

      <div className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1">
        <Info className="w-3.5 h-3.5" />
        <span>Click any bar in the chart to inspect that day's completed sankalps & reflection</span>
      </div>
    </div>
  );
};
