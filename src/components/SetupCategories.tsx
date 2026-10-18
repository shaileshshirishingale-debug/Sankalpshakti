import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { Category, CategoryColor } from '../types';
import { CATEGORY_COLORS, COMMON_CATEGORY_EMOJIS } from '../utils/constants';

interface SetupCategoriesProps {
  categories: Category[];
  onUpdateCategories: (categories: Category[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export const SetupCategories: React.FC<SetupCategoriesProps> = ({
  categories,
  onUpdateCategories,
  onNext,
  onBack,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🧘');
  const [color, setColor] = useState<CategoryColor>('amber');
  const [customEmojiMode, setCustomEmojiMode] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const openNewModal = () => {
    setEditingCategoryId(null);
    setName('');
    // Auto-pick next unused color or amber
    const colors: CategoryColor[] = ['amber', 'emerald', 'indigo', 'rose', 'violet'];
    const usedColors = categories.map((c) => c.color);
    const nextColor = colors.find((c) => !usedColors.includes(c)) || 'amber';
    setColor(nextColor);
    setEmoji('🧘');
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategoryId(cat.id);
    setName(cat.name);
    setEmoji(cat.emoji);
    setColor(cat.color);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (editingCategoryId) {
      const updated = categories.map((c) =>
        c.id === editingCategoryId ? { ...c, name: trimmed, emoji, color } : c
      );
      onUpdateCategories(updated);
    } else {
      const newCat: Category = {
        id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: trimmed,
        emoji: emoji || '✨',
        color,
        order: categories.length,
      };
      onUpdateCategories([...categories, newCat]);
    }

    setIsModalOpen(false);
    setName('');
  };

  const handleDelete = (id: string) => {
    if (categories.length <= 1) return;
    const filtered = categories.filter((c) => c.id !== id);
    // re-index order
    const reordered = filtered.map((c, idx) => ({ ...c, order: idx }));
    onUpdateCategories(reordered);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Header */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 py-1.5 px-3 rounded-lg hover:bg-stone-200/50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
          Step 1 of 3 · Categories
        </span>
      </header>

      {/* Main Content */}
      <main className="max-w-xl mx-auto w-full my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-lg shadow-stone-200/40">
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-stone-900 mb-1">
              Create Category System
            </h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Pehle apne jeevan ke stambh (areas) banayein. Udaharan: Spiritual, Swasthya (Health), Financial, Mind.
            </p>
          </div>

          {/* Suggestion notice */}
          {categories.length > 5 && (
            <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200/70 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Tip:</strong> Anusandhan batata hai ki 3 se 5 categories me focus rakhna sabse aasan aur phaldayak hota hai.
              </span>
            </div>
          )}

          {/* Live Preview Chips Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Your Categories ({categories.length})
            </span>
            <button
              onClick={openNewModal}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </button>
          </div>

          {/* Categories List / Chips Preview */}
          {categories.length === 0 ? (
            <div
              onClick={openNewModal}
              className="border-2 border-dashed border-stone-200 hover:border-amber-300 rounded-2xl p-8 text-center cursor-pointer transition-colors group mb-6"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 group-hover:bg-amber-100 text-stone-500 group-hover:text-amber-700 flex items-center justify-center mx-auto mb-3 transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-sm font-semibold text-stone-800 mb-1">
                + Pehli Category Banayein
              </div>
              <p className="text-xs text-stone-500">
                Click karke apni pehli category jaise Spiritual, Health ya Career jodein.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 mb-6">
              {categories.map((cat) => {
                const scheme = CATEGORY_COLORS[cat.color];
                return (
                  <div
                    key={cat.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border ${scheme.borderColor} ${scheme.softBg} transition-all`}
                  >
                    <div
                      onClick={() => openEditModal(cat)}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl shrink-0">
                        {cat.emoji}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-stone-900 flex items-center gap-2">
                          <span>{cat.name}</span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${scheme.previewBg}`}
                            title={scheme.label}
                          />
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {scheme.label} · Click to edit
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(cat.id)}
                      disabled={categories.length <= 1}
                      className="p-2 text-stone-400 hover:text-rose-600 disabled:opacity-20 disabled:hover:text-stone-400 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                      title={categories.length <= 1 ? 'Kam se kam 1 category honi chahiye' : 'Delete category'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-stone-100">
            <span className="text-xs text-stone-500">
              {categories.length === 0
                ? 'Kam se kam 1 category banayein'
                : `${categories.length} category ban chuki hai`}
            </span>
            <button
              onClick={onNext}
              disabled={categories.length === 0}
              className={`py-3 px-6 rounded-2xl font-medium text-sm flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                categories.length > 0
                  ? 'bg-stone-900 hover:bg-stone-800 text-white shadow-md'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>Add Sankalps</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-2xl mx-auto w-full text-center text-xs text-stone-400 py-2">
        My Sankalp · Personalized Discipline Architecture
      </footer>

      {/* Create / Edit Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h2 className="font-display text-xl font-bold text-stone-900 mb-1">
              {editingCategoryId ? 'Edit Category' : 'New Category'}
            </h2>
            <p className="text-xs text-stone-500 mb-5">
              Naam, icon aur color chun kar apni category define karein.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spiritual, Health, Financial, Mind"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none text-sm font-medium text-stone-900"
                  autoFocus
                />
              </div>

              {/* Emoji Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Icon / Emoji
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomEmojiMode(!customEmojiMode)}
                    className="text-[11px] text-amber-700 hover:underline"
                  >
                    {customEmojiMode ? 'Choose from list' : 'Custom keyboard emoji'}
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
                  <div className="grid grid-cols-8 gap-1.5 p-2 bg-stone-50 rounded-xl border border-stone-200/80 max-h-32 overflow-y-auto">
                    {COMMON_CATEGORY_EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => setEmoji(e)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-white transition-transform active:scale-95 ${
                          emoji === e ? 'bg-white shadow-sm ring-2 ring-amber-500' : ''
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Color Picker (5 Colors) */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-2">
                  Category Color (5 Distinct Palettes)
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(CATEGORY_COLORS) as CategoryColor[]).map((cKey) => {
                    const c = CATEGORY_COLORS[cKey];
                    const isSelected = color === cKey;
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => setColor(cKey)}
                        className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-stone-900 ring-2 ring-stone-900/10 bg-stone-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-full ${c.previewBg} flex items-center justify-center text-white mb-1 shadow-sm`}>
                          {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                        </div>
                        <span className="text-[10px] font-medium text-stone-600 truncate w-full text-center">
                          {cKey}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Inside Modal */}
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1">
                  Preview
                </div>
                <div className={`flex items-center gap-3 p-3 rounded-2xl border ${CATEGORY_COLORS[color].borderColor} ${CATEGORY_COLORS[color].softBg}`}>
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl shrink-0">
                    {emoji || '✨'}
                  </div>
                  <div className="font-semibold text-sm text-stone-900">
                    {name.trim() || 'Category Name'}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold min-h-[44px] transition-colors"
                >
                  {editingCategoryId ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
