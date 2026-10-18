import React, { useState } from 'react';
import { X, Plus, FolderGit2, Check, Trash2, Edit2, Sparkles, Layers } from 'lucide-react';
import { SankalpSystemProfile } from '../utils/storage';

interface SystemsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  systems: SankalpSystemProfile[];
  activeSystemId: string | null;
  onSwitchSystem: (id: string) => void;
  onCreateNewSystem: (name: string) => void;
  onDeleteSystem: (id: string) => void;
  onRenameSystem: (id: string, newName: string) => void;
}

export const SystemsManagerModal: React.FC<SystemsManagerModalProps> = ({
  isOpen,
  onClose,
  systems,
  activeSystemId,
  onSwitchSystem,
  onCreateNewSystem,
  onDeleteSystem,
  onRenameSystem,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSysName, setNewSysName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSysName.trim()) return;
    onCreateNewSystem(newSysName.trim());
    setNewSysName('');
    setIsCreating(false);
  };

  const handleStartRename = (sys: SankalpSystemProfile) => {
    setEditingId(sys.id);
    setEditingName(sys.name);
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameSystem(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200/80 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Layers className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-stone-900">
                Sankalp Systems Manager
              </h3>
              <p className="text-xs text-stone-500">
                Manage and switch between your named Sankalp projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Systems List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {systems.length === 0 ? (
            <div className="text-center py-8 text-stone-400 text-xs italic">
              No Sankalp systems found. Create your first system below!
            </div>
          ) : (
            systems.map((sys) => {
              const isActive = sys.id === activeSystemId;
              const isEditing = sys.id === editingId;

              return (
                <div
                  key={sys.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isActive
                      ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                      : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100/70'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isActive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {isActive ? <Check className="w-4 h-4" /> : <FolderGit2 className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded-lg border border-amber-400 bg-white focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(sys.id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-display font-bold text-sm text-stone-900 truncate">
                            {sys.name}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-2">
                            <span>Total Days: {sys.challenge.totalDays}</span>
                            <span>•</span>
                            <span>Day {sys.challenge.currentDay}</span>
                            <span>•</span>
                            <span>{sys.challenge.sankalps.length} Sankalps</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isActive && !isEditing && (
                      <button
                        onClick={() => {
                          onSwitchSystem(sys.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        Open
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => handleStartRename(sys)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                        title="Rename System"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {systems.length > 1 && !isEditing && (
                      <button
                        onClick={() => onDeleteSystem(sys.id)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete System"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Create New System Section */}
        <div className="pt-4 border-t border-stone-100">
          {isCreating ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Name Your New Sankalp System
                </label>
                <input
                  type="text"
                  value={newSysName}
                  onChange={(e) => setNewSysName(e.target.value)}
                  placeholder="e.g. UPSC Mission 2026, Morning Routine..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-xs font-medium outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold shadow-md cursor-pointer"
                >
                  Create & Setup System
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-stone-300 hover:border-amber-500 hover:bg-amber-50/40 text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-600" />
              <span>Create New Named Sankalp System</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
