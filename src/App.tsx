/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { SankalpChallenge, Category, Sankalp, SetupStep, ActiveTab, TimeOfDay } from './types';
import { getStoredChallenge, saveChallenge, clearChallengeData, getTodayDateString, getDateForDay, getStoredSystems, saveSystemsToStorage, SankalpSystemProfile } from './utils/storage';
import { SystemsManagerModal } from './components/SystemsManagerModal';
import { playGentleChime, playCelebrationChime, triggerMicroConfetti, triggerDayCompletionCelebration } from './utils/effects';
import { EmptyState } from './components/EmptyState';
import { SetupCategories } from './components/SetupCategories';
import { SetupSankalps } from './components/SetupSankalps';
import { SetupDuration } from './components/SetupDuration';
import { DailyTracker } from './components/DailyTracker';
import { HistoryLog } from './components/HistoryLog';
import { ManageSystem } from './components/ManageSystem';
import { CompleteDayModal } from './components/CompleteDayModal';
import { CertificateModal } from './components/CertificateModal';
import { ReminderToast } from './components/ReminderToast';
import { ActiveReminderAlert, triggerSystemNotification, requestNotificationPermission } from './utils/notifications';
import { validateChallengeData } from './utils/validation';
import { importChallengeFromExcel, autoPersistToExcelDatabase } from './utils/excelDatabase';
import { Trophy, Sparkles, RefreshCw, ArrowRight, Award, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [challenge, setChallenge] = useState<SankalpChallenge | null>(null);
  const [setupStep, setSetupStep] = useState<SetupStep>('empty');
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');

  // Working setup draft state before completion
  const [draftCategories, setDraftCategories] = useState<Category[]>([]);
  const [draftSankalps, setDraftSankalps] = useState<Sankalp[]>([]);

  // Modal state for Complete Day
  const [isCompleteDayModalOpen, setIsCompleteDayModalOpen] = useState(false);
  const [isGrandCertificateOpen, setIsGrandCertificateOpen] = useState(false);

  const [isSystemsManagerOpen, setIsSystemsManagerOpen] = useState(false);
  const [systemsRegistry, setSystemsRegistry] = useState<{ activeId: string | null; systems: SankalpSystemProfile[] }>({ activeId: null, systems: [] });

  // Active in-app reminder alert
  const [activeReminderAlert, setActiveReminderAlert] = useState<ActiveReminderAlert | null>(null);
  const firedAlertKeysRef = useRef<Set<string>>(new Set());

  // In-app non-blocking system toast notification (replaces window.alert for iframe compatibility)
  const [systemToast, setSystemToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showSystemToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ) => {
    setSystemToast({ message, type });
    setTimeout(() => {
      setSystemToast((current) => (current?.message === message ? null : current));
    }, 3500);
  };

  // Load systems registry on mount from server Excel database
  useEffect(() => {
    fetch('/api/systems')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.store) {
          const reg = data.store;
          setSystemsRegistry(reg);
          if (reg.activeId && reg.systems.length > 0) {
            const active = reg.systems.find((s: any) => s.id === reg.activeId) || reg.systems[0];
            if (active.challenge && active.challenge.isSetupComplete) {
              setChallenge(active.challenge);
            } else {
              setSetupStep('empty');
            }
          } else {
            setSetupStep('empty');
          }
        }
      })
      .catch(() => {
        const reg = getStoredSystems();
        setSystemsRegistry(reg);
        setSetupStep('empty');
      });
  }, []);

  const handleSwitchSystem = (id: string) => {
    const sys = systemsRegistry.systems.find((s) => s.id === id);
    if (sys) {
      saveSystemsToStorage(sys.id, systemsRegistry.systems);
      setSystemsRegistry({ activeId: sys.id, systems: systemsRegistry.systems });
      setChallenge(sys.challenge);
      setActiveTab('today');
      showSystemToast(`Switched to "${sys.name}"`, 'success');
    }
  };

  const handleCreateNewSystem = (name: string) => {
    const newId = `sys_${Date.now()}`;
    const newChallenge: SankalpChallenge = {
      id: newId,
      title: name,
      totalDays: 100,
      currentDay: 1,
      startDate: getTodayDateString(),
      categories: [
        { id: 'c1', name: 'Spiritual', emoji: '🧘', color: 'amber', order: 0 },
        { id: 'c2', name: 'Health & Body', emoji: '💪', color: 'emerald', order: 1 },
      ],
      sankalps: [
        { id: 's1', categoryId: 'c1', title: 'Morning Meditation', emoji: '🧘', timeOfDay: 'Morning', duration: '15 min', order: 0, createdAt: new Date().toISOString() },
      ],
      history: {
        1: { dayNumber: 1, dateString: getTodayDateString(), completedSankalpIds: [], totalSankalpsAtTime: 1, isCompleted: false },
      },
      isSetupComplete: true,
      createdAt: new Date().toISOString(),
    };

    const newSys: SankalpSystemProfile = {
      id: newId,
      name,
      challenge: newChallenge,
      updatedAt: new Date().toISOString(),
    };

    const updatedSystems = [...systemsRegistry.systems, newSys];
    saveSystemsToStorage(newId, updatedSystems);
    setSystemsRegistry({ activeId: newId, systems: updatedSystems });
    setChallenge(newChallenge);
    setSetupStep('empty');
    setActiveTab('today');
    showSystemToast(`Created & switched to "${name}"`, 'success');
  };

  const handleDeleteSystem = (id: string) => {
    const updated = systemsRegistry.systems.filter((s) => s.id !== id);
    if (updated.length === 0) {
      showSystemToast('Cannot delete the last remaining system.', 'error');
      return;
    }
    const nextActive = updated[0].id;
    saveSystemsToStorage(nextActive, updated);
    setSystemsRegistry({ activeId: nextActive, systems: updated });
    setChallenge(updated[0].challenge);
    showSystemToast('System deleted successfully', 'success');
  };

  const handleRenameSystem = (id: string, newName: string) => {
    const updated = systemsRegistry.systems.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          name: newName,
          challenge: { ...s.challenge, title: newName },
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    const active = updated.find((s) => s.id === systemsRegistry.activeId) || updated[0];
    saveSystemsToStorage(active.id, updated);
    setSystemsRegistry({ activeId: active.id, systems: updated });
    if (challenge && challenge.id === id) {
      setChallenge({ ...challenge, title: newName });
    }
    showSystemToast('System renamed successfully', 'success');
  };

  // Background reminder scheduler ticker: checks every 10 seconds against local clock
  useEffect(() => {
    if (!challenge || !challenge.isSetupComplete) return;

    const checkReminders = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const currentTimeString = `${hh}:${mm}`;

      const currentDay = challenge.currentDay;
      const currentRecord = challenge.history[currentDay];
      if (!currentRecord || currentRecord.isCompleted) return;

      const activeDaySankalps =
        currentRecord.daySankalps !== undefined
          ? currentRecord.daySankalps
          : challenge.sankalps;

      const completedIds = currentRecord.completedSankalpIds || [];

      activeDaySankalps.forEach((s) => {
        if (!s.reminderEnabled || !s.reminderTime) return;
        if (completedIds.includes(s.id)) return;

        const alertKey = `${currentDay}_${s.id}_${currentTimeString}`;
        if (
          s.reminderTime === currentTimeString &&
          !firedAlertKeysRef.current.has(alertKey)
        ) {
          firedAlertKeysRef.current.add(alertKey);
          triggerSystemNotification(
            `My Sankalp: ${s.title}`,
            `Niyam ka samay ho gaya hai (${s.duration}). Nishchay banaye rakhein!`
          );
          setActiveReminderAlert({
            id: 'rem_' + Date.now(),
            sankalpId: s.id,
            title: s.title,
            emoji: s.emoji,
            time: s.reminderTime,
            duration: s.duration,
          });
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [challenge]);

  // Save changes to localStorage and linked Excel database whenever challenge changes
  const updateAndSaveChallenge = (updated: SankalpChallenge) => {
    setChallenge(updated);
    saveChallenge(updated);
    autoPersistToExcelDatabase(updated).then((saved) => {
      if (saved) {
        showSystemToast('Auto-saved to permanent Excel database!', 'success');
      }
    }).catch(() => {});
  };

  // FLOW 1: Start from empty
  const handleStartSetup = () => {
    setDraftCategories([]);
    setDraftSankalps([]);
    setSetupStep('categories');
  };

  // Import JSON backup directly with strict schema validation
  const handleImportBackup = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      const validation = validateChallengeData(parsed);
      if (validation.isValid && validation.sanitized) {
        updateAndSaveChallenge(validation.sanitized);
        setSetupStep('empty');
        setActiveTab('today');
        showSystemToast('Backup safalta-purvak restore ho gaya!', 'success');
      } else {
        showSystemToast(validation.error || 'Amanaya (Invalid) Sankalp JSON format.', 'error');
      }
    } catch {
      showSystemToast('File parse karne me truti aayi.', 'error');
    }
  };

  // Import Excel (.xlsx) as app database
  const handleImportExcel = async (file: File) => {
    try {
      const res = await importChallengeFromExcel(file);
      if (res.isValid && res.sanitized) {
        updateAndSaveChallenge(res.sanitized);
        setSetupStep('empty');
        setActiveTab('today');
        showSystemToast('Excel database successfully imported & loaded as app database!', 'success');
      } else {
        showSystemToast(res.error || 'Invalid Excel database structure.', 'error');
      }
    } catch (err: any) {
      showSystemToast(err?.message || 'Failed to parse Excel file.', 'error');
    }
  };

  // FLOW 2: Finished categories, move to sankalps
  const handleCategoriesNext = () => {
    setSetupStep('sankalps');
  };

  // FLOW 3: Finished sankalps, move to duration
  const handleSankalpsNext = () => {
    setSetupStep('duration');
  };

  // FLOW 4: Finish duration and finalize system
  const handleFinishSetup = (totalDays: number, startDate: string) => {
    const today = getTodayDateString();
    const newChallenge: SankalpChallenge = {
      id: 'challenge_' + Date.now(),
      title: `${totalDays} Din Ka Sankalp`,
      totalDays,
      startDate: startDate || today,
      categories: draftCategories,
      sankalps: draftSankalps,
      history: {
        1: {
          dayNumber: 1,
          dateString: startDate || today,
          completedSankalpIds: [],
          daySankalps: draftSankalps,
          totalSankalpsAtTime: draftSankalps.length,
          isCompleted: false,
        },
      },
      currentDay: 1,
      isSetupComplete: true,
      createdAt: new Date().toISOString(),
    };

    updateAndSaveChallenge(newChallenge);
    triggerDayCompletionCelebration();
    playCelebrationChime();
    setActiveTab('today');
  };

  // FLOW 5: Add a new sankalp for today on the fly
  const handleAddTodaySankalp = (data: {
    categoryId: string;
    title: string;
    emoji?: string;
    timeOfDay: TimeOfDay;
    duration: string;
    reminderEnabled?: boolean;
    reminderTime?: string;
  }) => {
    if (!challenge) return;
    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: challenge.sankalps.length,
      isCompleted: false,
      daySankalps: challenge.sankalps,
    };

    const activeDaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : [...challenge.sankalps];

    const newSankalp: Sankalp = {
      id: 'snk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      categoryId: data.categoryId,
      title: data.title,
      emoji: data.emoji,
      timeOfDay: data.timeOfDay,
      duration: data.duration,
      reminderEnabled: data.reminderEnabled,
      reminderTime: data.reminderEnabled ? data.reminderTime : undefined,
      order: activeDaySankalps.length,
      createdAt: new Date().toISOString(),
    };

    const nextDaySankalps = [...activeDaySankalps, newSankalp];

    // Preserve in master library if title doesn't exist yet
    const existsInMaster = challenge.sankalps.some(
      (s) => s.title.toLowerCase().trim() === data.title.toLowerCase().trim()
    );
    const updatedMasterSankalps = existsInMaster
      ? challenge.sankalps
      : [...challenge.sankalps, newSankalp];

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        daySankalps: nextDaySankalps,
        totalSankalpsAtTime: nextDaySankalps.length,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      sankalps: updatedMasterSankalps,
      history: updatedHistory,
    });

    playGentleChime();
  };

  // Remove a sankalp from today's list
  const handleRemoveTodaySankalp = (sankalpId: string) => {
    if (!challenge) return;
    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay];
    if (!currentRecord || currentRecord.isCompleted) return;

    const activeDaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : [...challenge.sankalps];

    const nextDaySankalps = activeDaySankalps.filter((s) => s.id !== sankalpId);
    const nextCompleted = (currentRecord.completedSankalpIds || []).filter((id) => id !== sankalpId);

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        daySankalps: nextDaySankalps,
        completedSankalpIds: nextCompleted,
        totalSankalpsAtTime: nextDaySankalps.length,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      history: updatedHistory,
    });
  };

  // Toggle or edit reminder on a specific sankalp
  const handleToggleSankalpReminder = (sankalpId: string, enabled: boolean, reminderTime?: string) => {
    if (!challenge) return;
    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: challenge.sankalps.length,
      isCompleted: false,
      daySankalps: challenge.sankalps,
    };

    const activeDaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : [...challenge.sankalps];

    const updatedDaySankalps = activeDaySankalps.map((s) => {
      if (s.id === sankalpId) {
        return {
          ...s,
          reminderEnabled: enabled,
          reminderTime: enabled ? (reminderTime || s.reminderTime || '07:00') : s.reminderTime,
        };
      }
      return s;
    });

    const updatedMasterSankalps = challenge.sankalps.map((s) => {
      if (s.id === sankalpId) {
        return {
          ...s,
          reminderEnabled: enabled,
          reminderTime: enabled ? (reminderTime || s.reminderTime || '07:00') : s.reminderTime,
        };
      }
      return s;
    });

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        daySankalps: updatedDaySankalps,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      sankalps: updatedMasterSankalps,
      history: updatedHistory,
    });
    playGentleChime();
  };

  // Update an existing today sankalp
  const handleUpdateTodaySankalp = (updatedSankalp: Sankalp) => {
    if (!challenge) return;
    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay];
    if (!currentRecord) return;

    const activeDaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : [...challenge.sankalps];

    const updatedDaySankalps = activeDaySankalps.map((s) =>
      s.id === updatedSankalp.id ? updatedSankalp : s
    );

    const updatedMasterSankalps = challenge.sankalps.map((s) =>
      s.id === updatedSankalp.id ? updatedSankalp : s
    );

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        daySankalps: updatedDaySankalps,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      sankalps: updatedMasterSankalps,
      history: updatedHistory,
    });
  };

  // Immediate Test Alert for User Verification
  const handleTestReminderAlert = async () => {
    await requestNotificationPermission();
    playGentleChime();
    triggerSystemNotification(
      'My Sankalp Reminder Alert',
      'Aapka sankalp reminder notification bilkul sahi kaam kar raha hai! 🔔'
    );
    const activeDaySankalps = currentDaySankalps;
    const firstSankalp = activeDaySankalps[0];
    setActiveReminderAlert({
      id: 'test_' + Date.now(),
      sankalpId: firstSankalp ? firstSankalp.id : 'test_snk',
      title: firstSankalp ? firstSankalp.title : '15 min Dhyana & Walk',
      emoji: firstSankalp?.emoji || '🧘',
      time: 'Abhi',
      duration: firstSankalp?.duration || '15 min',
    });
  };

  // Copy yesterday's sankalps to today
  const handleCopyYesterdaySankalps = () => {
    if (!challenge || challenge.currentDay <= 1) return;
    const currentDay = challenge.currentDay;
    const yesterday = challenge.history[currentDay - 1];
    if (!yesterday) return;

    const yesterdaySankalps = yesterday.daySankalps || challenge.sankalps;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: yesterdaySankalps.length,
      isCompleted: false,
    };

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        daySankalps: [...yesterdaySankalps],
        totalSankalpsAtTime: yesterdaySankalps.length,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      history: updatedHistory,
    });
    playGentleChime();
  };

  // Toggle check on a sankalp for currentDay
  const handleToggleSankalp = (sankalpId: string, event: React.MouseEvent) => {
    if (!challenge) return;

    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: challenge.sankalps.length,
      isCompleted: false,
      daySankalps: challenge.sankalps,
    };

    // If day was already marked completed, prevent edits
    if (currentRecord.isCompleted) return;

    const activeDaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : challenge.sankalps;

    const alreadyChecked = currentRecord.completedSankalpIds.includes(sankalpId);
    let nextChecked: string[];

    if (alreadyChecked) {
      nextChecked = currentRecord.completedSankalpIds.filter((id) => id !== sankalpId);
    } else {
      nextChecked = [...currentRecord.completedSankalpIds, sankalpId];
      // Micro-confetti & sound on checking off
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      triggerMicroConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);

      // If user reached 10 sankalps completed today or all of today's sankalps, celebration!
      if (nextChecked.length === 10 || (activeDaySankalps.length > 0 && nextChecked.length === activeDaySankalps.length)) {
        triggerDayCompletionCelebration();
        playCelebrationChime();
      } else {
        playGentleChime();
      }
    }

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        completedSankalpIds: nextChecked,
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      history: updatedHistory,
    });
  };

  // FLOW 5: Complete Day
  const handleConfirmCompleteDay = (notes?: string) => {
    if (!challenge) return;

    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: challenge.sankalps.length,
      isCompleted: false,
      daySankalps: challenge.sankalps,
    };

    const nextDay = currentDay + 1;
    const isLastDay = currentDay >= challenge.totalDays;

    const todaySankalps = currentRecord.daySankalps !== undefined
      ? currentRecord.daySankalps
      : challenge.sankalps;

    // Mark current day as completed and locked
    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        notes: notes?.trim() || undefined,
        isCompleted: true,
        completedAt: new Date().toISOString(),
        daySankalps: todaySankalps,
        totalSankalpsAtTime: todaySankalps.length,
      },
    };

    // Initialize next day record: carry forward today's active sankalps list so user can start with them, add new ones, or adjust!
    if (!isLastDay && !updatedHistory[nextDay]) {
      const nextDateStr = getDateForDay(challenge.startDate, nextDay);

      updatedHistory[nextDay] = {
        dayNumber: nextDay,
        dateString: nextDateStr,
        completedSankalpIds: [],
        daySankalps: todaySankalps,
        totalSankalpsAtTime: todaySankalps.length,
        isCompleted: false,
      };
    }

    const updatedChallenge: SankalpChallenge = {
      ...challenge,
      history: updatedHistory,
      currentDay: isLastDay ? currentDay : nextDay,
    };

    updateAndSaveChallenge(updatedChallenge);
    setIsCompleteDayModalOpen(false);

    // Grand celebration
    triggerDayCompletionCelebration();
    playCelebrationChime();
  };

  // Reset entire challenge
  const handleResetChallenge = () => {
    clearChallengeData();
    setChallenge(null);
    setDraftCategories([]);
    setDraftSankalps([]);
    setSetupStep('empty');
  };

  // If user hasn't completed initial setup, show the setup flows
  if (!challenge || !challenge.isSetupComplete) {
    if (setupStep === 'empty') {
      return (
        <EmptyState
          onStartSetup={handleStartSetup}
          onImportBackup={handleImportBackup}
          onImportExcel={handleImportExcel}
          onOpenSystemsManager={() => setIsSystemsManagerOpen(true)}
        />
      );
    }

    if (setupStep === 'categories') {
      return (
        <SetupCategories
          categories={draftCategories}
          onUpdateCategories={setDraftCategories}
          onNext={handleCategoriesNext}
          onBack={() => setSetupStep('empty')}
        />
      );
    }

    if (setupStep === 'sankalps') {
      return (
        <SetupSankalps
          categories={draftCategories}
          sankalps={draftSankalps}
          onUpdateSankalps={setDraftSankalps}
          onNext={handleSankalpsNext}
          onBack={() => setSetupStep('categories')}
        />
      );
    }

    if (setupStep === 'duration') {
      return (
        <SetupDuration
          categories={draftCategories}
          sankalps={draftSankalps}
          onFinishSetup={handleFinishSetup}
          onBack={() => setSetupStep('sankalps')}
        />
      );
    }
  }

  // If entire challenge is completed
  const isGrandChallengeFinished =
    challenge &&
    challenge.currentDay >= challenge.totalDays &&
    challenge.history[challenge.totalDays]?.isCompleted;

  if (isGrandChallengeFinished && activeTab === 'today') {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
        <div className="max-w-xl mx-auto w-full my-auto py-8 text-center">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-stone-200/80 shadow-xl">
            <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30">
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-wider mb-2 inline-block">
              Purna Sankalp Siddhi
            </span>

            <h1 className="font-display text-3xl font-extrabold text-stone-900 mb-2">
              Badhai Ho! {challenge.totalDays} Din Ka Sankalp Purna Hua
            </h1>

            <p className="text-sm text-stone-600 mb-6 max-w-md mx-auto leading-relaxed">
              Aapne apna nishchay aur niyam dridhata se nibha liya. Yeh anushasan aapke jeevan ko sada disha dega.
            </p>

            <div className="grid grid-cols-3 gap-2.5 mb-6 text-left">
              <button
                onClick={() => setIsGrandCertificateOpen(true)}
                className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100/80 transition-colors text-left"
              >
                <div className="text-xs font-bold text-amber-900 mb-0.5 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-700" />
                  <span>Siddhi Patra</span>
                </div>
                <div className="text-[10px] text-amber-700">
                  Certificate print karein
                </div>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors text-left"
              >
                <div className="text-xs font-semibold text-stone-900 mb-0.5">
                  Sankalp Patra
                </div>
                <div className="text-[10px] text-stone-500">
                  Sabhi dino ka itihaas
                </div>
              </button>

              <button
                onClick={() => setActiveTab('manage')}
                className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 hover:bg-stone-100 transition-colors text-left"
              >
                <div className="text-xs font-semibold text-stone-900 mb-0.5">
                  Backup
                </div>
                <div className="text-[10px] text-stone-500">
                  JSON download karein
                </div>
              </button>
            </div>

            <button
              onClick={handleResetChallenge}
              className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Naya Sankalp Aarambh Karein</span>
            </button>
          </div>
        </div>

        {isGrandCertificateOpen && (
          <CertificateModal
            challenge={challenge}
            onClose={() => setIsGrandCertificateOpen(false)}
          />
        )}
      </div>
    );
  }

  // Update today's 1-2 line reflection directly from Home Screen
  const handleUpdateTodayReflection = (notes: string) => {
    if (!challenge) return;
    const currentDay = challenge.currentDay;
    const currentRecord = challenge.history[currentDay] || {
      dayNumber: currentDay,
      dateString: getTodayDateString(),
      completedSankalpIds: [],
      totalSankalpsAtTime: challenge.sankalps.length,
      isCompleted: false,
    };

    const updatedHistory = {
      ...challenge.history,
      [currentDay]: {
        ...currentRecord,
        notes: notes.trim(),
      },
    };

    updateAndSaveChallenge({
      ...challenge,
      history: updatedHistory,
    });
  };

  const currentRecord = challenge ? challenge.history[challenge.currentDay] : null;
  const currentDaySankalps = currentRecord?.daySankalps !== undefined
    ? currentRecord.daySankalps
    : (challenge ? challenge.sankalps : []);

  // Active Main Tracker App
  return (
    <>
      {activeTab === 'today' && challenge && (
        <DailyTracker
          challenge={challenge}
          onToggleSankalp={handleToggleSankalp}
          onAddTodaySankalp={handleAddTodaySankalp}
          onRemoveTodaySankalp={handleRemoveTodaySankalp}
          onUpdateTodaySankalp={handleUpdateTodaySankalp}
          onToggleSankalpReminder={handleToggleSankalpReminder}
          onTestReminderAlert={handleTestReminderAlert}
          onCopyYesterdaySankalps={handleCopyYesterdaySankalps}
          onUpdateTodayReflection={handleUpdateTodayReflection}
          onOpenCompleteDayModal={() => setIsCompleteDayModalOpen(true)}
          onGoToHistory={() => setActiveTab('history')}
          onGoToManage={() => setActiveTab('manage')}
        />
      )}

      {activeTab === 'history' && challenge && (
        <HistoryLog
          challenge={challenge}
          onBackToToday={() => setActiveTab('today')}
          onGoToManage={() => setActiveTab('manage')}
        />
      )}

      {activeTab === 'manage' && challenge && (
        <ManageSystem
          challenge={challenge}
          onUpdateChallenge={updateAndSaveChallenge}
          onResetChallenge={handleResetChallenge}
          onBackToToday={() => setActiveTab('today')}
          onGoToHistory={() => setActiveTab('history')}
        />
      )}

      {/* Floating Push Notification Reminder Toast */}
      {activeReminderAlert && (
        <ReminderToast
          alert={activeReminderAlert}
          onComplete={(sankalpId) => {
            const dummyEvent = {
              currentTarget: document.body,
            } as unknown as React.MouseEvent;
            handleToggleSankalp(sankalpId, dummyEvent);
            setActiveReminderAlert(null);
          }}
          onDismiss={() => setActiveReminderAlert(null)}
        />
      )}

      {/* Complete Day Confirmation Modal */}
      {isCompleteDayModalOpen && challenge && (
        <CompleteDayModal
          dayNumber={challenge.currentDay}
          totalDays={challenge.totalDays}
          completedCount={
            challenge.history[challenge.currentDay]?.completedSankalpIds?.length || 0
          }
          totalSankalps={currentDaySankalps.length}
          initialNotes={currentRecord?.notes || ''}
          onConfirm={handleConfirmCompleteDay}
          onCancel={() => setIsCompleteDayModalOpen(false)}
        />
      )}

      {/* Floating System Toast Notification Banner */}
      {systemToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2 border transition-all ${
            systemToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : systemToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {systemToast.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          {systemToast.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{systemToast.message}</span>
        </div>
      )}
    </>
  );
}
