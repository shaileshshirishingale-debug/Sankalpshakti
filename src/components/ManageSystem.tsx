import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Download, Upload, RotateCcw, AlertTriangle, Trash2, Edit2, ChevronUp, ChevronDown, Check, Bell, FileSpreadsheet } from 'lucide-react';
import { formatTimeDisplay } from '../utils/notifications';
import { SankalpChallenge, Category, Sankalp, CategoryColor, TimeOfDay } from '../types';
import { CATEGORY_COLORS, COMMON_CATEGORY_EMOJIS, COMMON_SANKALP_EMOJIS, DURATION_OPTIONS } from '../utils/constants';
import { validateChallengeData } from '../utils/validation';
import { exportChallengeToExcel, importChallengeFromExcel, linkPermanentExcelDatabase, supportsDirectFileAccess } from '../utils/excelDatabase';

interface ManageSystemProps {
  challenge: SankalpChallenge;
  onUpdateChallenge: (updated: SankalpChallenge) => void;
  onResetChallenge: () => void;
  onBackToToday: () => void;
  onGoToHistory?: () => void;
}

export const ManageSystem: React.FC<ManageSystemProps> = ({
  challenge,
  onUpdateChallenge,
  onResetChallenge,
  onBackToToday,
  onGoToHistory,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [catEmoji, setCatEmoji] = useState('🧘');
  const [catColor, setCatColor] = useState<CategoryColor>('amber');

  // Sankalp Modal State
  const [isSnkModalOpen, setIsSnkModalOpen] = useState(false);
  const [targetCatId, setTargetCatId] = useState<string>('');
  const [editingSnkId, setEditingSnkId] = useState<string | null>(null);
  const [snkTitle, setSnkTitle] = useState('');
  const [snkEmoji, setSnkEmoji] = useState('🏃‍♂️');
  const [snkTimeOfDay, setSnkTimeOfDay] = useState<TimeOfDay>('Morning');
  const [snkDuration, setSnkDuration] = useState('15 min');
  const [snkReminderEnabled, setSnkReminderEnabled] = useState(false);
  const [snkReminderTime, setSnkReminderTime] = useState('07:00');

  // Total days editor state
  const [isEditingDays, setIsEditingDays] = useState(false);
  const [tempTotalDays, setTempTotalDays] = useState(challenge.totalDays.toString());

  // Reset confirmation state
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // In-app status notice (replaces window.alert)
  const [statusNotice, setStatusNotice] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusNotice({ message, type });
    setTimeout(() => {
      setStatusNotice((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  // Category handlers
  const openNewCategory = () => {
    setEditingCatId(null);
    setCatName('');
    setCatEmoji('🧘');
    setCatColor('amber');
    setIsCatModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatEmoji(cat.emoji);
    setCatColor(cat.color);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId) {
      const updatedCategories = challenge.categories.map((c) =>
        c.id === editingCatId ? { ...c, name: catName.trim(), emoji: catEmoji, color: catColor } : c
      );
      onUpdateChallenge({ ...challenge, categories: updatedCategories });
    } else {
      const newCat: Category = {
        id: 'cat_' + Date.now(),
        name: catName.trim(),
        emoji: catEmoji || '✨',
        color: catColor,
        order: challenge.categories.length,
      };
      onUpdateChallenge({ ...challenge, categories: [...challenge.categories, newCat] });
    }

    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = (catId: string) => {
    if (challenge.categories.length <= 1) {
      showNotice('Kam se kam 1 category honi chahiye.', 'error');
      return;
    }
    const filteredCats = challenge.categories.filter((c) => c.id !== catId);
    const filteredSnks = challenge.sankalps.filter((s) => s.categoryId !== catId);
    onUpdateChallenge({ ...challenge, categories: filteredCats, sankalps: filteredSnks });
    showNotice('Category safalta-purvak hatayi gayi.', 'success');
  };

  // Sankalp handlers
  const openNewSankalp = (categoryId: string) => {
    setTargetCatId(categoryId);
    setEditingSnkId(null);
    setSnkTitle('');
    setSnkEmoji('🏃‍♂️');
    setSnkTimeOfDay('Morning');
    setSnkDuration('15 min');
    setSnkReminderEnabled(false);
    setSnkReminderTime('07:00');
    setIsSnkModalOpen(true);
  };

  const openEditSankalp = (sankalp: Sankalp) => {
    setTargetCatId(sankalp.categoryId);
    setEditingSnkId(sankalp.id);
    setSnkTitle(sankalp.title);
    setSnkEmoji(sankalp.emoji || '✨');
    setSnkTimeOfDay(sankalp.timeOfDay);
    setSnkDuration(sankalp.duration);
    setSnkReminderEnabled(sankalp.reminderEnabled || false);
    setSnkReminderTime(sankalp.reminderTime || '07:00');
    setIsSnkModalOpen(true);
  };

  const handleSaveSankalp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snkTitle.trim() || !targetCatId) return;

    if (editingSnkId) {
      const updatedSnks = challenge.sankalps.map((s) =>
        s.id === editingSnkId
          ? {
              ...s,
              title: snkTitle.trim(),
              emoji: snkEmoji,
              timeOfDay: snkTimeOfDay,
              duration: snkDuration,
              reminderEnabled: snkReminderEnabled,
              reminderTime: snkReminderEnabled ? snkReminderTime : undefined,
            }
          : s
      );
      onUpdateChallenge({ ...challenge, sankalps: updatedSnks });
    } else {
      const newSnk: Sankalp = {
        id: 'snk_' + Date.now(),
        categoryId: targetCatId,
        title: snkTitle.trim(),
        emoji: snkEmoji,
        timeOfDay: snkTimeOfDay,
        duration: snkDuration,
        reminderEnabled: snkReminderEnabled,
        reminderTime: snkReminderEnabled ? snkReminderTime : undefined,
        order: challenge.sankalps.filter((s) => s.categoryId === targetCatId).length,
        createdAt: new Date().toISOString(),
      };
      onUpdateChallenge({ ...challenge, sankalps: [...challenge.sankalps, newSnk] });
    }

    setIsSnkModalOpen(false);
  };

  const handleDeleteSankalp = (snkId: string) => {
    const filtered = challenge.sankalps.filter((s) => s.id !== snkId);
    onUpdateChallenge({ ...challenge, sankalps: filtered });
  };

  const moveSankalp = (id: string, direction: 'up' | 'down') => {
    const item = challenge.sankalps.find((s) => s.id === id);
    if (!item) return;
    const catItems = challenge.sankalps
      .filter((s) => s.categoryId === item.categoryId)
      .sort((a, b) => a.order - b.order);
    const indexInCat = catItems.findIndex((s) => s.id === id);
    if (direction === 'up' && indexInCat === 0) return;
    if (direction === 'down' && indexInCat === catItems.length - 1) return;

    const targetIndex = direction === 'up' ? indexInCat - 1 : indexInCat + 1;
    const reordered = [...catItems];
    const [removed] = reordered.splice(indexInCat, 1);
    reordered.splice(targetIndex, 0, removed);

    const orderMap = new Map<string, number>();
    reordered.forEach((s, idx) => {
      orderMap.set(s.id, idx);
    });

    const updated = challenge.sankalps.map((s) => {
      if (orderMap.has(s.id)) {
        return { ...s, order: orderMap.get(s.id)! };
      }
      return s;
    });

    onUpdateChallenge({ ...challenge, sankalps: updated });
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(challenge, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `my_sankalp_backup_${challenge.totalDays}days.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON with validation and schema sanitization
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validation = validateChallengeData(parsed);
        if (validation.isValid && validation.sanitized) {
          onUpdateChallenge(validation.sanitized);
          showNotice('Backup safalta-purvak restore ho gaya!', 'success');
        } else {
          showNotice(validation.error || 'Amanaya (Invalid) JSON structure.', 'error');
        }
      } catch {
        showNotice('File read karne me error aayi.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const excelInputRef = useRef<HTMLInputElement>(null);

  // Export Excel (.xlsx) database
  const handleExportExcel = () => {
    try {
      exportChallengeToExcel(challenge);
      showNotice('Excel database downloaded successfully!', 'success');
    } catch (err: any) {
      showNotice(err?.message || 'Failed to export Excel file.', 'error');
    }
  };

  // Import Excel (.xlsx) database
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importChallengeFromExcel(file);
      if (res.isValid && res.sanitized) {
        onUpdateChallenge(res.sanitized);
        showNotice('Excel database imported & loaded successfully!', 'success');
      } else {
        showNotice(res.error || 'Invalid Excel database structure.', 'error');
      }
    } catch (err: any) {
      showNotice(err?.message || 'Failed to read Excel file.', 'error');
    }
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const handleLinkPermanentExcel = async () => {
    const res = await linkPermanentExcelDatabase(challenge);
    if (res.success) {
      showNotice('Permanent Excel database linked! Changes will auto-save to your Excel file.', 'success');
    } else {
      showNotice(res.error || 'Failed to link permanent Excel file.', 'error');
    }
  };

  const handleSaveDays = () => {
    const d = parseInt(tempTotalDays, 10);
    if (d > 0) {
      onUpdateChallenge({ ...challenge, totalDays: d });
      setIsEditingDays(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20 pt-2">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="flex items-center justify-between py-3 border-b border-stone-200/80 mb-6">
          <button
            onClick={onBackToToday}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tracker</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-sm sm:text-base text-stone-900 hidden sm:block">
              System Settings & Management
            </h1>
            {onGoToHistory && (
              <button
                onClick={onGoToHistory}
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Patra / History
              </button>
            )}
          </div>
        </div>

        {/* Status Notice Banner */}
        {statusNotice && (
          <div
            className={`p-3 rounded-2xl mb-6 text-xs font-semibold flex items-center justify-between animate-in fade-in slide-in-from-top-2 border ${
              statusNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <span>{statusNotice.message}</span>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-stone-400 hover:text-stone-600 text-xs px-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* Challenge Duration Card */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Challenge Goal
              </span>
              <h2 className="font-display font-bold text-xl text-stone-900">
                {challenge.totalDays} Din Ka Sankalp
              </h2>
              <p className="text-xs text-stone-500">
                Start date: {challenge.startDate} · Currently on Day {challenge.currentDay}
              </p>
            </div>

            {isEditingDays ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tempTotalDays}
                  onChange={(e) => setTempTotalDays(e.target.value)}
                  className="w-20 px-2.5 py-1.5 rounded-lg border border-stone-300 text-sm font-bold text-center"
                />
                <button
                  onClick={handleSaveDays}
                  className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setTempTotalDays(challenge.totalDays.toString());
                    setIsEditingDays(false);
                  }}
                  className="px-2.5 py-1.5 text-stone-500 hover:text-stone-800 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingDays(true)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50"
              >
                Change Days
              </button>
            )}
          </div>
        </div>

        {/* Daily 10 Sankalp Status Card */}
        <div className="bg-white rounded-3xl p-5 border border-stone-200/80 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Daily Discipline Capacity
              </span>
              <h3 className="font-display font-bold text-lg text-stone-900 flex items-center gap-2">
                <span>Daily 10 Sankalp System</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  challenge.sankalps.length === 10
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {challenge.sankalps.length} / 10 Slots Filled
                </span>
              </h3>
            </div>
            {challenge.sankalps.length < 10 && (
              <span className="text-xs text-amber-800 font-medium bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/70">
                {10 - challenge.sankalps.length} aur sankalp jodein
              </span>
            )}
          </div>

          {/* 10 Slot Micro-Grid */}
          <div className="grid grid-cols-10 gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const s = challenge.sankalps[idx];
              const isFilled = idx < challenge.sankalps.length;
              return (
                <div
                  key={idx}
                  title={s ? `${idx + 1}. ${s.title}` : `Slot ${idx + 1} Empty`}
                  className={`h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                    isFilled
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'border-2 border-dashed border-stone-300 text-stone-400 bg-stone-50'
                  }`}
                >
                  {isFilled ? (s?.emoji || `${idx + 1}`) : `${idx + 1}`}
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories & Sankalps Hierarchy */}
        <div className="space-y-6 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-lg text-stone-900">
              Categories & Sankalps ({challenge.sankalps.length} Total)
            </h2>
            <button
              onClick={openNewCategory}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Category</span>
            </button>
          </div>

          {challenge.categories.map((cat) => {
            const scheme = CATEGORY_COLORS[cat.color];
            const catSankalps = challenge.sankalps
              .filter((s) => s.categoryId === cat.id)
              .sort((a, b) => a.order - b.order);

            return (
              <div
                key={cat.id}
                className={`bg-white rounded-2xl border ${scheme.borderColor} p-4 sm:p-5 shadow-xs`}
              >
                {/* Category Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="font-display font-bold text-stone-900 text-base">
                      {cat.name}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      ({catSankalps.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openNewSankalp(cat.id)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg text-white ${scheme.accentBg} hover:opacity-90 transition-opacity flex items-center gap-1`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Sankalp</span>
                    </button>
                    <button
                      onClick={() => openEditCategory(cat)}
                      className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
                      title="Edit Category"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-stone-100"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Sankalp List */}
                {catSankalps.length === 0 ? (
                  <div className="text-xs text-stone-400 italic p-3 text-center bg-stone-50 rounded-xl">
                    Is category mein koi sankalp nahi hai. Upar "+ Add Sankalp" dabayein.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {catSankalps.map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5 text-stone-400">
                            <button
                              onClick={() => moveSankalp(s.id, 'up')}
                              disabled={idx === 0}
                              className="hover:text-stone-700 disabled:opacity-20"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveSankalp(s.id, 'down')}
                              disabled={idx === catSankalps.length - 1}
                              className="hover:text-stone-700 disabled:opacity-20"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <span className="text-lg">{s.emoji || '✨'}</span>

                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-xs sm:text-sm text-stone-900 truncate">
                              {s.title}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 flex-wrap">
                              <span>{s.timeOfDay} · {s.duration}</span>
                              {s.reminderEnabled && (
                                <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                                  <Bell className="w-2.5 h-2.5 text-amber-600" />
                                  <span>{formatTimeDisplay(s.reminderTime) || s.reminderTime}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditSankalp(s)}
                            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSankalp(s.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Data Persistence, Backup & Reset Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-xs space-y-4">
          <h3 className="font-display font-bold text-base text-stone-900">
            Data Backup & Reset
          </h3>

          {supportsDirectFileAccess() && (
            <button
              onClick={handleLinkPermanentExcel}
              className="w-full p-4 rounded-2xl border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 hover:bg-emerald-50 flex items-center justify-between gap-3 transition-all text-left shadow-xs cursor-pointer group mb-3"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white shadow-xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm text-stone-900 flex items-center gap-2">
                    <span>Link Permanent Excel File (Auto-Database)</span>
                    <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-medium">Direct Save</span>
                  </div>
                  <div className="text-xs text-stone-600">
                    Select a local .xlsx file so all progress & updates auto-save directly to Excel as your database
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-xs shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                Link File &rarr;
              </span>
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="p-3.5 rounded-2xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center gap-3 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-amber-700 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-stone-900">Export Backup</div>
                <div className="text-[11px] text-stone-500">Apna data JSON file me save karein</div>
              </div>
            </button>

            {/* Import JSON */}
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileImport}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-emerald-700 shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900">Restore Backup</div>
                  <div className="text-[11px] text-stone-500">Pehle se save JSON upload karein</div>
                </div>
              </button>
            </div>

            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              className="p-3.5 rounded-2xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 flex items-center gap-3 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-emerald-700 shrink-0">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-xs text-stone-900">Export Excel Database (.xlsx)</div>
                <div className="text-[11px] text-stone-500">Download formatted Excel spreadsheet</div>
              </div>
            </button>

            {/* Import Excel */}
            <div>
              <input
                type="file"
                ref={excelInputRef}
                onChange={handleExcelImport}
                accept=".xlsx, .xls, .csv"
                className="hidden"
              />
              <button
                onClick={() => excelInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl border border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 hover:bg-emerald-50 flex items-center gap-3 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-white shadow-xs flex items-center justify-center text-teal-700 shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900">Import Excel Database</div>
                  <div className="text-[11px] text-stone-500">Use spreadsheet as app database</div>
                </div>
              </button>
            </div>
          </div>

          {/* Reset Challenge */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              Naye sire se sabhi sankalp aur data mitayein
            </span>
            <button
              onClick={() => setIsResetConfirmOpen(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-xl">
            <h3 className="font-display font-bold text-lg text-stone-900 mb-3">
              {editingCatId ? 'Edit Category' : 'New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-medium"
                  placeholder="e.g. Swasthya"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Icon</label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-stone-50 rounded-xl max-h-24 overflow-y-auto">
                  {COMMON_CATEGORY_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setCatEmoji(e)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${
                        catEmoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Color</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(CATEGORY_COLORS) as CategoryColor[]).map((cKey) => (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setCatColor(cKey)}
                      className={`p-1.5 rounded-xl border text-center ${
                        catColor === cKey ? 'border-stone-900 bg-stone-50' : 'border-stone-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full mx-auto ${CATEGORY_COLORS[cKey].previewBg}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sankalp Modal */}
      {isSnkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-stone-200 shadow-xl">
            <h3 className="font-display font-bold text-lg text-stone-900 mb-3">
              {editingSnkId ? 'Edit Sankalp' : 'Naya Sankalp'}
            </h3>
            <form onSubmit={handleSaveSankalp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={snkTitle}
                  onChange={(e) => setSnkTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-sm font-medium"
                  placeholder="e.g. 15 min walk"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Icon</label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-stone-50 rounded-xl max-h-24 overflow-y-auto">
                  {COMMON_SANKALP_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setSnkEmoji(e)}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center ${
                        snkEmoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Time</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Morning', 'Evening', 'Anytime'] as TimeOfDay[]).map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSnkTimeOfDay(time)}
                      className={`py-2 text-xs font-semibold rounded-xl border ${
                        snkTimeOfDay === time
                          ? 'border-stone-900 bg-stone-900 text-white'
                          : 'border-stone-200 bg-stone-50 text-stone-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Duration</label>
                <select
                  value={snkDuration}
                  onChange={(e) => setSnkDuration(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs font-medium bg-white"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reminder Alert Toggle */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className={`w-4 h-4 ${snkReminderEnabled ? 'text-amber-600' : 'text-stone-400'}`} />
                    <div>
                      <span className="text-xs font-bold text-stone-800 block">Daily Reminder</span>
                      <span className="text-[10px] text-stone-500">Alert at preferred time</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={snkReminderEnabled}
                      onChange={(e) => setSnkReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {snkReminderEnabled && (
                  <div className="mt-2.5 pt-2.5 border-t border-stone-200 flex items-center justify-between">
                    <span className="text-xs font-medium text-stone-600">Time:</span>
                    <input
                      type="time"
                      value={snkReminderTime}
                      onChange={(e) => setSnkReminderTime(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white text-xs font-bold text-stone-900"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSnkModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-stone-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-lg text-stone-900 mb-1">
              Kya aap sach me Reset karna chahte hain?
            </h3>
            <p className="text-xs text-stone-500 mb-5">
              Aapka banaya system, categories aur Day 1 se ab tak ka sara record delete ho jayega.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
              >
                Nahi, Cancel
              </button>
              <button
                onClick={() => {
                  setIsResetConfirmOpen(false);
                  onResetChallenge();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
              >
                Haan, Reset Karein
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
