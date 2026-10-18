import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, CheckCircle2, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Sankalp } from '../types';
import { playGentleChime, playCelebrationChime, triggerMicroConfetti, isSoundEnabled, setSoundEnabled } from '../utils/effects';

interface FocusTimerModalProps {
  sankalp: Sankalp;
  onComplete: () => void;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  sankalp,
  onComplete,
  onClose,
}) => {
  // Parse initial minutes from duration string (e.g. "15 min" -> 15 * 60)
  const parseSeconds = (dur: string): number => {
    const match = dur.match(/\d+/);
    if (match) {
      return parseInt(match[0], 10) * 60;
    }
    return 15 * 60; // default 15 minutes
  };

  const totalSeconds = parseSeconds(sankalp.duration);
  const [secondsLeft, setSecondsLeft] = useState<number>(totalSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive || isFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isFinished]);

  // Handle timer completion cleanly outside the state updater
  useEffect(() => {
    if (secondsLeft === 0 && !isFinished) {
      setIsActive(false);
      setIsFinished(true);
      playCelebrationChime();
      triggerMicroConfetti();
    }
  }, [secondsLeft, isFinished]);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsFinished(false);
    setSecondsLeft(totalSeconds);
  };

  const handleAddMinute = (minutes: number) => {
    setSecondsLeft((prev) => Math.max(10, prev + minutes * 60));
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Circular progress
  const progressRatio = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 1;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - progressRatio * circumference;

  const handleFinishAndComplete = () => {
    onComplete();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-stone-200 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        {/* Top header */}
        <div className="flex items-center justify-between pb-2 mb-4">
          <button
            onClick={toggleSound}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
            title={soundOn ? 'Sound On' : 'Sound Muted'}
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-stone-400" />}
          </button>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            Sankalp Dhyana & Focus Timer
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sankalp Title */}
        <div className="mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 text-2xl flex items-center justify-center mx-auto mb-2 shadow-xs">
            {sankalp.emoji || '✨'}
          </div>
          <h3 className="font-display font-bold text-lg text-stone-900 leading-tight">
            {sankalp.title}
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Target Duration: {sankalp.duration} · {sankalp.timeOfDay}
          </p>
        </div>

        {/* Circular Countdown Ring */}
        <div className="relative w-44 h-44 mx-auto mb-6 flex items-center justify-center">
          <svg className="w-44 h-44 transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke="#f5f5f4"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r={radius}
              stroke={isFinished ? '#10b981' : '#f59e0b'}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-300 ease-out"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="font-display font-extrabold text-3xl text-stone-900 tabular-nums">
              {formatTime(secondsLeft)}
            </span>
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mt-0.5">
              {isFinished ? 'Purna Hua!' : isActive ? 'Ekagrata (Focus)' : 'Paused'}
            </span>
          </div>
        </div>

        {/* Quick adjustment buttons */}
        {!isFinished && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => handleAddMinute(-1)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold"
            >
              -1 min
            </button>
            <button
              onClick={() => handleAddMinute(1)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold"
            >
              +1 min
            </button>
            <button
              onClick={() => handleAddMinute(5)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold"
            >
              +5 min
            </button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {!isFinished && (
            <button
              onClick={() => setIsActive(!isActive)}
              className="py-3 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center gap-2 shadow-md min-h-[48px]"
            >
              {isActive ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Resume</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleFinishAndComplete}
            className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/25 min-h-[48px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
