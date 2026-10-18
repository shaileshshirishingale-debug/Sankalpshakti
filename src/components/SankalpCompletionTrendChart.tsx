import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Award, CheckCircle2, Sparkles, Info } from 'lucide-react';
import { SankalpChallenge } from '../types';
import { formatDateDisplay } from '../utils/storage';

interface SankalpCompletionTrendChartProps {
  challenge: SankalpChallenge;
  selectedDayNumber: number;
  onSelectDay: (dayNumber: number) => void;
}

interface TrendDataPoint {
  day: number;
  label: string;
  completedCount: number;
  totalTarget: number;
  percentage: number;
  dateStr: string;
  isCompleted: boolean;
  notes?: string;
}

export const SankalpCompletionTrendChart: React.FC<SankalpCompletionTrendChartProps> = ({
  challenge,
  selectedDayNumber,
  onSelectDay,
}) => {
  const { totalDays, currentDay, history, sankalps } = challenge;
  const defaultTarget = sankalps.length > 0 ? sankalps.length : 10;

  // Build trend data points up to currentDay
  const trendData: TrendDataPoint[] = useMemo(() => {
    return Array.from({ length: currentDay }, (_, i) => {
      const dayNum = i + 1;
      const rec = history[dayNum];
      const completedCount = new Set(rec?.completedSankalpIds || []).size;
      const dayTarget = rec?.daySankalps && rec.daySankalps.length > 0
        ? rec.daySankalps.length
        : (rec?.totalSankalpsAtTime && rec.totalSankalpsAtTime > 0
            ? rec.totalSankalpsAtTime
            : defaultTarget);

      const percentage = dayTarget > 0 ? Math.min(100, Math.round((completedCount / dayTarget) * 100)) : 0;

      return {
        day: dayNum,
        label: `D${dayNum}`,
        completedCount,
        totalTarget: dayTarget,
        percentage,
        dateStr: rec?.dateString || '',
        isCompleted: Boolean(rec?.isCompleted),
        notes: rec?.notes,
      };
    });
  }, [totalDays, currentDay, history, defaultTarget]);

  // Calculate average adherence trend
  const avgPercentage = useMemo(() => {
    if (trendData.length === 0) return 0;
    const sum = trendData.reduce((acc, d) => acc + d.percentage, 0);
    return Math.round(sum / trendData.length);
  }, [trendData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TrendDataPoint = payload[0].payload;
      const isPerfect = data.totalTarget > 0 && data.completedCount >= data.totalTarget;

      return (
        <div className="bg-stone-900 text-white text-xs rounded-2xl p-3.5 shadow-2xl border border-stone-700 min-w-[210px] space-y-1.5">
          <div className="flex items-center justify-between font-bold border-b border-stone-800 pb-1.5">
            <span className="text-amber-400">Day {data.day} Progress</span>
            {isPerfect ? (
              <span className="text-emerald-400 text-[10px] bg-emerald-950 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>100% Purna</span>
              </span>
            ) : (
              <span className="text-stone-400 text-[10px]">{data.percentage}% Adherence</span>
            )}
          </div>

          <div className="space-y-1 text-stone-300 text-[11px] pt-0.5">
            <div className="flex justify-between">
              <span>Sankalps Completed:</span>
              <span className="font-bold text-white tabular-nums">{data.completedCount} / {data.totalTarget}</span>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate:</span>
              <span className="font-bold text-amber-400 tabular-nums">{data.percentage}%</span>
            </div>
            {data.dateStr && (
              <div className="flex justify-between text-[10px] text-stone-400">
                <span>Date:</span>
                <span>{formatDateDisplay(data.dateStr)}</span>
              </div>
            )}
            {data.notes && (
              <div className="mt-2 pt-1.5 border-t border-stone-800 text-[10px] italic text-amber-200/90 line-clamp-2">
                "{data.notes}"
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-amber-400 font-medium text-center bg-stone-800/90 py-1 rounded-md">
            Click data point to inspect day
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Chart Top Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-stone-900 text-sm">
              Sankalp Completion Trend Line Chart
            </h3>
            <p className="text-[11px] text-stone-500">
              Daily adherence trajectory from Day 1 to Day {currentDay}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-emerald-50 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-200">
          <span className="font-semibold">Average Trend:</span>
          <span className="font-bold font-display text-sm">{avgPercentage}%</span>
        </div>
      </div>

      {/* Recharts Area + Line Chart Container */}
      <div className="bg-stone-50/70 p-3 sm:p-4 rounded-2xl border border-stone-200/70">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 12, left: -20, bottom: 0 }}
              onClick={(state: any) => {
                if (state && state.activePayload && state.activePayload.length) {
                  const clickedDay = state.activePayload[0].payload.day;
                  if (clickedDay <= currentDay) {
                    onSelectDay(clickedDay);
                  }
                }
              }}
            >
              <defs>
                <linearGradient id="trendColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#78716c' }}
                interval={trendData.length > 25 ? Math.floor(trendData.length / 10) : 0}
                axisLine={{ stroke: '#e7e5e4' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#78716c' }}
                axisLine={false}
                tickLine={false}
                unit="%"
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={100}
                stroke="#10b981"
                strokeDasharray="3 3"
                strokeWidth={1}
                label={{
                  value: '100% Purna Target',
                  position: 'top',
                  fill: '#059669',
                  fontSize: 10,
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#trendColor)"
              />
              <Line
                type="monotone"
                dataKey="percentage"
                stroke="#047857"
                strokeWidth={2.5}
                dot={{ r: trendData.length > 30 ? 2 : 4, fill: '#059669', strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                className="cursor-pointer"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Footer Indicator */}
        <div className="flex items-center justify-between text-xs text-stone-500 pt-3 border-t border-stone-200/60 mt-2 px-1">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Showing progress across {trendData.length} recorded day(s)</span>
          </div>
          <span className="text-[11px] text-amber-700 font-medium">
            💡 Click any data point to inspect that day
          </span>
        </div>
      </div>
    </div>
  );
};
