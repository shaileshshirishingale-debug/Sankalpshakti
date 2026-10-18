import React, { useRef } from 'react';
import { Sparkles, ArrowRight, Upload, Flame, ShieldCheck, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { SANKALP_SUTRAS } from '../utils/constants';

interface EmptyStateProps {
  onStartSetup: () => void;
  onImportBackup: (jsonData: string) => void;
  onImportExcel: (file: File) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onStartSetup, onImportBackup, onImportExcel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);
  const sutra = SANKALP_SUTRAS[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportBackup(content);
      }
    };
    reader.readAsText(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onImportExcel(file);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top minimal header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ॐ
          </span>
          <span className="font-display font-bold text-lg text-stone-900 tracking-tight">
            My Sankalp - 100 Din
          </span>
        </div>
        <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
          <span>Daily 10 Sankalp</span>
        </span>
      </header>

      {/* Main hero card */}
      <main className="max-w-xl mx-auto w-full my-auto py-8">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xl shadow-stone-200/40 text-center">
          {/* Sacred Symbol Ring */}
          <div className="relative w-24 h-24 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-amber-100/80 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Flame className="w-10 h-10 text-white fill-amber-100" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mb-2">
            Apna Pehla Sankalp Banao
          </h1>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold mb-4">
            <span>🎯 Lakshya: Rozana 10 Sankalp Pure Karna</span>
          </div>

          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-md mx-auto mb-6">
            Koi pre-written aadat ya template nahi. Apni categories banayein aur daily 10 sankalp define karein jinhe har din nishchay ke sath pura karna hai.
          </p>

          {/* Inspirational Sanskrit Sutra */}
          <div className="bg-stone-50 rounded-2xl p-4 mb-8 border border-stone-100 text-left">
            <div className="text-xs font-semibold text-amber-700 tracking-wide mb-1">
              {sutra.source}
            </div>
            <div className="font-serif italic text-sm text-stone-800 font-medium mb-1">
              "{sutra.sanskrit}"
            </div>
            <div className="text-xs text-stone-500">
              {sutra.translation}
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-800">Daily 10 Sankalp Target</div>
                <div className="text-[11px] text-stone-500">10 niyam har din complete karne ke liye</div>
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-stone-800">100 Din Anushasan</div>
                <div className="text-[11px] text-stone-500">Day locking, daily streaks aur progress</div>
              </div>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onStartSetup}
            className="w-full py-4 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-[0.99] text-white font-medium text-base flex items-center justify-center gap-2 shadow-lg shadow-stone-900/15 transition-all cursor-pointer min-h-[48px]"
          >
            <span>Create My 10 Sankalp System</span>
            <ArrowRight className="w-5 h-5 text-amber-400" />
          </button>

          {/* Backup Restore Option */}
          <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Restore JSON Backup</span>
            </button>

            <input
              type="file"
              ref={excelInputRef}
              onChange={handleExcelUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <button
              onClick={() => excelInputRef.current?.click()}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-emerald-50 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Import Excel Database (.xlsx)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center text-xs text-stone-400 py-3">
        100 Days of Mindful Willpower · Daily 10 Sankalp Discipline
      </footer>
    </div>
  );
};
