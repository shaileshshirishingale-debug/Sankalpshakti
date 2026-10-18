import React, { useRef } from 'react';
import { Award, Printer, CheckCircle2 } from 'lucide-react';
import { SankalpChallenge } from '../types';
import { calculateStreak, calculateMaxStreak, calculateTotalCompletions, formatDateDisplay } from '../utils/storage';

interface CertificateModalProps {
  challenge: SankalpChallenge;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ challenge, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const { completedDays, completionRate } = calculateTotalCompletions(challenge);
  const currentStreak = calculateStreak(challenge);
  const maxStreak = calculateMaxStreak(challenge);

  const defaultTarget = challenge.sankalps.length > 0 ? challenge.sankalps.length : 10;
  const perfectDays = Object.values(challenge.history).filter((h) => {
    const target = h.daySankalps && h.daySankalps.length > 0
      ? h.daySankalps.length
      : (h.totalSankalpsAtTime && h.totalSankalpsAtTime > 0 ? h.totalSankalpsAtTime : defaultTarget);
    return target > 0 && (h.completedSankalpIds || []).length >= target;
  }).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-10 max-w-lg w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Certificate Container with Sacred Border */}
        <div
          ref={printRef}
          className="printable-certificate relative p-6 sm:p-8 rounded-2xl border-4 border-double border-amber-600/40 bg-stone-50/50 text-center"
        >
          {/* Corner Flourishes */}
          <span className="absolute top-2 left-2 text-amber-600/40 text-xs font-serif">❖</span>
          <span className="absolute top-2 right-2 text-amber-600/40 text-xs font-serif">❖</span>
          <span className="absolute bottom-2 left-2 text-amber-600/40 text-xs font-serif">❖</span>
          <span className="absolute bottom-2 right-2 text-amber-600/40 text-xs font-serif">❖</span>

          {/* Top Emblem */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-amber-500/20 text-2xl font-bold">
            ॐ
          </div>

          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full mb-2 inline-block">
            Sankalp Siddhi Patra
          </span>

          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-stone-900 tracking-tight mb-1">
            Certificate of Resolution
          </h2>

          <p className="text-xs text-stone-500 italic mb-5">
            "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते"
          </p>

          <p className="text-xs text-stone-700 leading-relaxed mb-6 max-w-sm mx-auto">
            Yeh praman-patra is baat ka sakshi hai ki sadhak ne dridh ichhashakti aur nishchay ke sath{' '}
            <strong className="text-stone-900 font-bold">{challenge.totalDays} Din Ka Sankalp</strong>{' '}
            anushasan anukram poorvak nibhaya hai.
          </p>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 p-3 rounded-xl bg-white border border-stone-200/80 mb-6 text-center">
            <div>
              <div className="text-[9px] text-stone-400 uppercase font-semibold">Days Done</div>
              <div className="font-display font-bold text-sm sm:text-base text-stone-900 tabular-nums">
                {completedDays} <span className="text-[10px] text-stone-400 font-normal">/{challenge.totalDays}</span>
              </div>
            </div>
            <div>
              <div className="text-[9px] text-stone-400 uppercase font-semibold">100% Purna</div>
              <div className="font-display font-bold text-sm sm:text-base text-amber-700 tabular-nums">
                {perfectDays}
              </div>
            </div>
            <div>
              <div className="text-[9px] text-stone-400 uppercase font-semibold">Max Streak</div>
              <div className="font-display font-bold text-sm sm:text-base text-emerald-700 tabular-nums">
                {maxStreak}d
              </div>
            </div>
            <div>
              <div className="text-[9px] text-stone-400 uppercase font-semibold">Adherence</div>
              <div className="font-display font-bold text-sm sm:text-base text-stone-900 tabular-nums">
                {completionRate}%
              </div>
            </div>
          </div>

          {/* Date & Signature Stamp */}
          <div className="flex items-center justify-between text-left pt-3 border-t border-stone-200 text-xs text-stone-600">
            <div>
              <div className="text-[10px] text-stone-400">Aarambh Tithi</div>
              <div className="font-semibold text-stone-800">{formatDateDisplay(challenge.startDate)}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-stone-400">Pravadit Anushasan</div>
              <div className="font-semibold text-amber-800 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Sadhana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
