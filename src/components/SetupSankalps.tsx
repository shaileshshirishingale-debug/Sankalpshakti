import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Clock, Sun, Moon, Sparkles, ChevronUp, ChevronDown, Edit2, CheckCircle2, AlertCircle, Bell } from 'lucide-react';
import { formatTimeDisplay } from '../utils/notifications';
import { Category, Sankalp, TimeOfDay } from '../types';
import { CATEGORY_COLORS, COMMON_SANKALP_EMOJIS, DURATION_OPTIONS } from '../utils/constants';

interface SetupSankalpsProps {
  categories: Category[];
  sankalps: Sankalp[];
  onUpdateSankalps: (sankalps: Sankalp[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SetupSankalps: React.FC<SetupSankalpsProps> = ({
  categories,
  sankalps,
  onUpdateSankalps,
  onNext,
  onBack,
}) => {
  const [activeModalCatId, setActiveModalCatId] = useState<string | null>(null);
  const [editingSankalpId, setEditingSankalpId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🏃‍♂️');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('Morning');
  const [duration, setDuration] = useState('15 min');
  const [customDuration, setCustomDuration] = useState('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customEmojiMode, setCustomEmojiMode] = useState(false);
  const [showIncompleteNotice, setShowIncompleteNotice] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('07:00');

  const TARGET_DAILY_SANKALPS = 10;
  const currentCount = sankalps.length;
  const remainingCount = Math.max(0, TARGET_DAILY_SANKALPS - currentCount);

  const openAddModal = (categoryId: string) => {
    setActiveModalCatId(categoryId);
    setEditingSankalpId(null);
    setTitle('');
    setEmoji('🏃‍♂️');
    setTimeOfDay('Morning');
    setDuration('15 min');
    setIsCustomDuration(false);
    setCustomDuration('');
    setReminderEnabled(false);
    setReminderTime('07:00');
  };

  const openEditModal = (sankalp: Sankalp) => {
    setActiveModalCatId(sankalp.categoryId);
    setEditingSankalpId(sankalp.id);
    setTitle(sankalp.title);
    setEmoji(sankalp.emoji || '✨');
    setTimeOfDay(sankalp.timeOfDay);
    setReminderEnabled(sankalp.reminderEnabled || false);
    setReminderTime(sankalp.reminderTime || '07:00');
    if (DURATION_OPTIONS.includes(sankalp.duration)) {
      setDuration(sankalp.duration);
      setIsCustomDuration(false);
    } else {
      setDuration('Custom');
      setIsCustomDuration(true);
      setCustomDuration(sankalp.duration);
    }
  };

  const closeModal = () => {
    setActiveModalCatId(null);
    setEditingSankalpId(null);
    setTitle('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !activeModalCatId) return;

    const finalDuration = isCustomDuration ? (customDuration.trim() || '15 min') : duration;

    if (editingSankalpId) {
      const updated = sankalps.map((s) =>
        s.id === editingSankalpId
          ? {
              ...s,
              title: title.trim(),
              emoji: emoji || undefined,
              timeOfDay,
              duration: finalDuration,
              reminderEnabled,
              reminderTime: reminderEnabled ? reminderTime : undefined,
            }
          : s
      );
      onUpdateSankalps(updated);
    } else {
      const newSankalp: Sankalp = {
        id: 'snk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        categoryId: activeModalCatId,
        title: title.trim(),
        emoji: emoji || undefined,
        timeOfDay,
        duration: finalDuration,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
        order: sankalps.filter((s) => s.categoryId === activeModalCatId).length,
        createdAt: new Date().toISOString(),
      };
      onUpdateSankalps([...sankalps, newSankalp]);
    }

    closeModal();
  };

  const handleDelete = (id: string) => {
    onUpdateSankalps(sankalps.filter((s) => s.id !== id));
  };

  const moveSankalp = (id: string, direction: 'up' | 'down') => {
    const item = sankalps.find((s) => s.id === id);
    if (!item) return;
    const catItems = sankalps
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

    const updated = sankalps.map((s) => {
      if (orderMap.has(s.id)) {
        return { ...s, order: orderMap.get(s.id)! };
      }
      return s;
    });

    onUpdateSankalps(updated);
  };

  // Drag and drop handler - execute swap cleanly on drop
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const sourceItem = sankalps.find((s) => s.id === draggedId);
    const targetItem = sankalps.find((s) => s.id === targetId);

    if (sourceItem && targetItem && sourceItem.categoryId === targetItem.categoryId) {
      const catItems = sankalps
        .filter((s) => s.categoryId === sourceItem.categoryId)
        .sort((a, b) => a.order - b.order);
      const sourceIndex = catItems.findIndex((s) => s.id === draggedId);
      const targetIndex = catItems.findIndex((s) => s.id === targetId);

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const reordered = [...catItems];
        const [removed] = reordered.splice(sourceIndex, 1);
        reordered.splice(targetIndex, 0, removed);

        const orderMap = new Map<string, number>();
        reordered.forEach((s, idx) => {
          orderMap.set(s.id, idx);
        });

        const updated = sankalps.map((s) => {
          if (orderMap.has(s.id)) {
            return { ...s, order: orderMap.get(s.id)! };
          }
          return s;
        });

        onUpdateSankalps(updated);
      }
    }
    setDraggedId(null);
  };

  const handleNextClick = () => {
    if (currentCount === 0) return;
    if (currentCount < TARGET_DAILY_SANKALPS) {
      setShowIncompleteNotice(true);
    } else {
      onNext();
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Categories</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
            Step 2 of 3 · Sankalps
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
            currentCount === TARGET_DAILY_SANKALPS
              ? 'bg-emerald-100 text-emerald-900'
              : 'bg-amber-100 text-amber-900'
          }`}>
            {currentCount} / {TARGET_DAILY_SANKALPS} Sankalp
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto w-full my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-lg shadow-stone-200/40">
          <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-display text-2xl font-bold text-stone-900">
                  Daily 10 Sankalp Banayein
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  Target: 10
                </span>
              </div>
              <p className="text-sm text-stone-600">
                Apni categories mein roz ke 10 sankalp baantein jinhe aapko har din pura karna hai.
              </p>
            </div>
          </div>

          {/* Dedicated 10-Slot Visual Tracker */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${currentCount >= TARGET_DAILY_SANKALPS ? 'text-emerald-600' : 'text-amber-500'}`} />
                <span>Daily 10 Sankalp Slots ({currentCount} / 10)</span>
              </span>
              <span className="text-[11px] font-medium text-stone-500">
                {currentCount === TARGET_DAILY_SANKALPS
                  ? '🌟 10/10 slots complete!'
                  : currentCount < TARGET_DAILY_SANKALPS
                  ? `${remainingCount} slot aur jodein`
                  : `${currentCount} sankalp banaye gaye hain`}
              </span>
            </div>

            {/* 10 Visual Slot Indicators */}
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 10 }).map((_, idx) => {
                const isFilled = idx < currentCount;
                const filledSankalp = sankalps[idx];
                return (
                  <div
                    key={idx}
                    title={filledSankalp ? `${idx + 1}. ${filledSankalp.title}` : `Slot ${idx + 1} (Empty)`}
                    className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isFilled
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'border-2 border-dashed border-stone-300 text-stone-400 bg-white'
                    }`}
                  >
                    {isFilled ? (filledSankalp?.emoji || `${idx + 1}`) : `${idx + 1}`}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories Blocks */}
          <div className="space-y-6 mb-8">
            {categories.map((category) => {
              const scheme = CATEGORY_COLORS[category.color];
              const categorySankalps = sankalps
                .filter((s) => s.categoryId === category.id)
                .sort((a, b) => a.order - b.order);

              return (
                <div
                  key={category.id}
                  className={`rounded-2xl border ${scheme.borderColor} p-4 sm:p-5 bg-white shadow-xs`}
                >
                  {/* Category Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{category.emoji}</span>
                      <h2 className="font-display font-semibold text-stone-900 text-base">
                        {category.name}
                      </h2>
                      <span className="text-xs font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                        {categorySankalps.length} sankalp
                      </span>
                    </div>

                    <button
                      onClick={() => openAddModal(category.id)}
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl text-white ${scheme.accentBg} hover:opacity-90 transition-opacity cursor-pointer shadow-xs min-h-[36px]`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Sankalp</span>
                    </button>
                  </div>

                  {/* Sankalp List inside this Category */}
                  {categorySankalps.length === 0 ? (
                    <div
                      onClick={() => openAddModal(category.id)}
                      className="border border-dashed border-stone-200 hover:border-stone-300 rounded-xl p-4 text-center cursor-pointer bg-stone-50/60 transition-colors"
                    >
                      <p className="text-xs font-medium text-stone-500">
                        Is category mein abhi koi sankalp nahi hai.
                        <span className="text-amber-700 ml-1 underline font-semibold">
                          + Sankalp Jodein
                        </span>
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categorySankalps.map((s, idx) => (
                        <div
                          key={s.id}
                          draggable
                          onDragStart={() => handleDragStart(s.id)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(s.id)}
                          onDragEnd={() => setDraggedId(null)}
                          className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 hover:border-stone-300 transition-all cursor-grab active:cursor-grabbing group"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Reorder Arrows for Mobile/Touch */}
                            <div className="flex flex-col gap-0.5 text-stone-400 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSankalp(s.id, 'up');
                                }}
                                disabled={idx === 0}
                                className="hover:text-stone-700 disabled:opacity-20 p-0.5"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSankalp(s.id, 'down');
                                }}
                                disabled={idx === categorySankalps.length - 1}
                                className="hover:text-stone-700 disabled:opacity-20 p-0.5"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Emoji */}
                            <div className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-base shrink-0">
                              {s.emoji || '✨'}
                            </div>

                            {/* Title & Time */}
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-xs sm:text-sm text-stone-900 truncate">
                                {s.title}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                                <span className="flex items-center gap-1">
                                  {s.timeOfDay === 'Morning' && <Sun className="w-3 h-3 text-amber-500" />}
                                  {s.timeOfDay === 'Evening' && <Moon className="w-3 h-3 text-indigo-500" />}
                                  {s.timeOfDay === 'Anytime' && <Sparkles className="w-3 h-3 text-emerald-500" />}
                                  {s.timeOfDay}
                                </span>
                                <span>·</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  {s.duration}
                                </span>
                                {s.reminderEnabled && (
                                  <>
                                    <span>·</span>
                                    <span className="inline-flex items-center gap-0.5 text-amber-700 font-medium">
                                      <Bell className="w-2.5 h-2.5 text-amber-600" />
                                      <span>{formatTimeDisplay(s.reminderTime) || s.reminderTime}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <button
                              onClick={() => openEditModal(s)}
                              className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-white transition-colors"
                              title="Edit Sankalp"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                              title="Delete Sankalp"
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

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <div className="text-xs text-stone-500">
              {currentCount === 10 ? (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Roz ke 10 sankalp taiyar hain!
                </span>
              ) : currentCount < 10 ? (
                <span>10 sankalp ke lakshya me se {currentCount} bane hain ({remainingCount} baaki)</span>
              ) : (
                <span>Kul {currentCount} sankalp banaye gaye hain</span>
              )}
            </div>
            <button
              onClick={handleNextClick}
              disabled={sankalps.length === 0}
              className={`py-3 px-6 rounded-2xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                sankalps.length > 0
                  ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-md'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Set Challenge Duration</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-stone-400 py-2">
        My Sankalp · Daily 10 Sankalp Discipline
      </footer>

      {/* Modal if user has fewer than 10 sankalps */}
      {showIncompleteNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-display text-xl font-bold text-stone-900 mb-1">
              Daily 10 Sankalp Target
            </h3>
            <p className="text-xs text-stone-600 mb-5 leading-relaxed">
              Aapne abhi <strong>{currentCount} sankalp</strong> banaye hain. Daily 10 sankalp pure karne ke liye <strong>{remainingCount} aur sankalp</strong> jodna behtar hoga.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowIncompleteNotice(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold"
              >
                + Aur Sankalp Jodein
              </button>
              <button
                onClick={() => {
                  setShowIncompleteNotice(false);
                  onNext();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Isi ke sath Aage Badhein
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Sankalp Modal */}
      {activeModalCatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="font-display text-xl font-bold text-stone-900 mb-1">
              {editingSankalpId ? 'Edit Sankalp' : `Sankalp #${currentCount + 1} Jodein`}
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Sankalp ka title, samay aur duration set karein.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Sankalp Title */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Sankalp Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 min walk, 10 min Pranayama, Read 10 pages"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-medium text-stone-900"
                  autoFocus
                />
              </div>

              {/* Emoji Icon */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Icon / Emoji (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomEmojiMode(!customEmojiMode)}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    {customEmojiMode ? 'Quick list' : 'Custom keyboard emoji'}
                  </button>
                </div>

                {customEmojiMode ? (
                  <input
                    type="text"
                    maxLength={4}
                    value={emoji}
                    onChange={(e) => setEmoji(e.target.value)}
                    placeholder="Enter emoji"
                    className="w-full px-4 py-2 text-center text-2xl rounded-xl border border-stone-300 focus:border-amber-500 outline-none"
                  />
                ) : (
                  <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200/80 max-h-24 overflow-y-auto">
                    {COMMON_SANKALP_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-base hover:bg-white transition-transform active:scale-95 ${
                          emoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Time of Day
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Morning', 'Evening', 'Anytime'] as TimeOfDay[]).map((time) => {
                    const isSelected = timeOfDay === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setTimeOfDay(time)}
                        className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                          isSelected
                            ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                            : 'border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {time === 'Morning' && <Sun className="w-3.5 h-3.5 text-amber-400" />}
                        {time === 'Evening' && <Moon className="w-3.5 h-3.5 text-indigo-400" />}
                        {time === 'Anytime' && <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{time}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Duration
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={isCustomDuration ? 'Custom' : duration}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setIsCustomDuration(true);
                      } else {
                        setIsCustomDuration(false);
                        setDuration(e.target.value);
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-xs sm:text-sm font-medium text-stone-900 bg-white"
                  >
                    {DURATION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>

                  {isCustomDuration && (
                    <input
                      type="text"
                      placeholder="e.g. 10 pages, 3 rounds"
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 outline-none text-xs sm:text-sm font-medium text-stone-900"
                    />
                  )}
                </div>
              </div>

              {/* Reminder Alert Toggle */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs transition-colors ${
                      reminderEnabled ? 'bg-amber-500 text-white shadow-xs' : 'bg-stone-200 text-stone-500'
                    }`}>
                      <Bell className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs font-bold text-stone-800 block leading-tight">
                        Daily Reminder Alert
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Browser notification at preferred time
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {reminderEnabled && (
                  <div className="mt-3 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-stone-700">
                      Preferred Time:
                    </span>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:border-amber-500 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold min-h-[44px] transition-colors"
                >
                  {editingSankalpId ? 'Save Changes' : 'Add Sankalp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
