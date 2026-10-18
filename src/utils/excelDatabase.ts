import * as XLSX from 'xlsx';
import { SankalpChallenge, Category, Sankalp, DayRecord } from '../types';
import { validateChallengeData } from './validation';

let linkedFileHandle: any = null;

/**
 * Checks if the browser supports File System Access API for persistent direct Excel database saving.
 */
export const supportsDirectFileAccess = (): boolean => {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
};

/**
 * Links a permanent local Excel file on the user's computer to serve as the direct database.
 */
export const linkPermanentExcelDatabase = async (challenge: SankalpChallenge): Promise<{ success: boolean; error?: string }> => {
  if (!supportsDirectFileAccess()) {
    return { success: false, error: 'Direct file access is not supported in this browser. Use Export/Import Excel instead.' };
  }
  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName: `my_sankalp_database_${challenge.totalDays}days.xlsx`,
      types: [{
        description: 'Excel Spreadsheet Database',
        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
      }],
    });
    linkedFileHandle = handle;
    // Perform initial write
    await writeChallengeToHandle(challenge, linkedFileHandle);
    return { success: true };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return { success: false, error: 'File selection cancelled.' };
    }
    return { success: false, error: err?.message || 'Failed to link Excel database file.' };
  }
};

const writeChallengeToHandle = async (challenge: SankalpChallenge, handle: any): Promise<void> => {
  const wb = createWorkbook(challenge);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const writable = await handle.createWritable();
  await writable.write(excelBuffer);
  await writable.close();
};

const createWorkbook = (challenge: SankalpChallenge) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Overview & Stats
  const overviewData = [
    ['Field', 'Value'],
    ['Challenge Title', challenge.title || 'My 100-Day Sankalp'],
    ['Total Days', challenge.totalDays],
    ['Current Day', challenge.currentDay],
    ['Start Date', challenge.startDate],
    ['Setup Complete', challenge.isSetupComplete ? 'Yes' : 'No'],
    ['Created At', challenge.createdAt || new Date().toISOString()],
  ];
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Overview');

  // Sheet 2: Master Disciplines (Sankalps)
  const categoryMap = new Map(challenge.categories.map((c) => [c.id, c.name]));
  const disciplinesHeaders = ['Category', 'Title', 'Emoji', 'Time of Day', 'Duration', 'Reminder Enabled', 'Reminder Time'];
  const disciplinesRows = challenge.sankalps.map((s) => [
    categoryMap.get(s.categoryId) || 'General',
    s.title,
    s.emoji || '✨',
    s.timeOfDay,
    s.duration,
    s.reminderEnabled ? 'Yes' : 'No',
    s.reminderTime || '',
  ]);
  const wsDisciplines = XLSX.utils.aoa_to_sheet([disciplinesHeaders, ...disciplinesRows]);
  XLSX.utils.book_append_sheet(wb, wsDisciplines, 'Disciplines');

  // Sheet 3: Daily History
  const historyHeaders = ['Day Number', 'Date', 'Status', 'Completed Count', 'Total Target', 'Completed Sankalps', 'Notes', 'Completed Timestamp'];
  const historyRows: (string | number)[][] = [];

  for (let d = 1; d <= challenge.totalDays; d++) {
    const rec = challenge.history[d];
    const completedIds = rec?.completedSankalpIds || [];
    const dayTarget = rec?.daySankalps?.length || rec?.totalSankalpsAtTime || challenge.sankalps.length || 10;
    const status = rec?.isCompleted
      ? 'Completed'
      : (d === challenge.currentDay ? 'In Progress' : (d < challenge.currentDay ? 'Missed' : 'Upcoming'));

    historyRows.push([
      d,
      rec?.dateString || '',
      status,
      completedIds.length,
      dayTarget,
      completedIds.join(', '),
      rec?.notes || '',
      rec?.completedAt || '',
    ]);
  }
  const wsHistory = XLSX.utils.aoa_to_sheet([historyHeaders, ...historyRows]);
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Daily History');

  return wb;
};

/**
 * Exports the SankalpChallenge data to an Excel (.xlsx) file download.
 */
export const exportChallengeToExcel = (challenge: SankalpChallenge): void => {
  const wb = createWorkbook(challenge);
  XLSX.writeFile(wb, `my_sankalp_database_${challenge.totalDays}days.xlsx`);
};

/**
 * Automatically persists challenge updates to the linked Excel database file if active.
 */
export const autoPersistToExcelDatabase = async (challenge: SankalpChallenge): Promise<boolean> => {
  if (!linkedFileHandle) return false;
  try {
    await writeChallengeToHandle(challenge, linkedFileHandle);
    return true;
  } catch {
    linkedFileHandle = null; // reset handle if permission lost
    return false;
  }
};

/**
 * Imports and parses an Excel (.xlsx/.xls) or CSV file, converting it into a valid SankalpChallenge.
 */
export const importChallengeFromExcel = async (file: File): Promise<{ isValid: boolean; error?: string; sanitized?: SankalpChallenge }> => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    const sheetNames = workbook.SheetNames;
    if (sheetNames.length === 0) {
      return { isValid: false, error: 'Excel file contains no worksheets.' };
    }

    const overviewSheet = workbook.Sheets['Overview'] || workbook.Sheets[sheetNames[0]];
    const overviewRows = XLSX.utils.sheet_to_json<Record<string, any>>(overviewSheet, { header: 1 });

    let title = 'My 100-Day Sankalp';
    let totalDays = 100;
    let currentDay = 1;
    let startDate = new Date().toISOString().split('T')[0];

    for (const row of overviewRows) {
      if (Array.isArray(row) && row.length >= 2) {
        const key = String(row[0]).trim().toLowerCase();
        const val = row[1];
        if (key.includes('title')) title = String(val);
        if (key.includes('total days')) totalDays = parseInt(val, 10) || 100;
        if (key.includes('current day')) currentDay = parseInt(val, 10) || 1;
        if (key.includes('start date')) startDate = String(val);
      }
    }

    const discSheet = workbook.Sheets['Disciplines'] || (sheetNames[1] ? workbook.Sheets[sheetNames[1]] : null);
    const rawDisciplines = discSheet ? XLSX.utils.sheet_to_json<Record<string, any>>(discSheet) : [];

    const categories: Category[] = [
      { id: 'cat_spiritual', name: 'Spiritual', emoji: '🧘', color: 'amber', order: 0 },
      { id: 'cat_health', name: 'Health & Body', emoji: '💪', color: 'emerald', order: 1 },
      { id: 'cat_mind', name: 'Mind & Study', emoji: '📚', color: 'indigo', order: 2 },
    ];

    const sankalps: Sankalp[] = [];
    if (rawDisciplines.length > 0) {
      rawDisciplines.forEach((row, idx) => {
        const titleText = row['Title'] || row['Sankalp Discipline'] || row['title'] || `Habit ${idx + 1}`;
        const catName = row['Category'] || row['category'] || 'Spiritual';
        let cat = categories.find((c) => c.name.toLowerCase() === String(catName).toLowerCase());
        if (!cat) {
          cat = {
            id: `cat_${Date.now()}_${idx}`,
            name: String(catName),
            emoji: '✨',
            color: 'amber',
            order: categories.length,
          };
          categories.push(cat);
        }

        sankalps.push({
          id: `snk_${idx + 1}`,
          categoryId: cat.id,
          title: String(titleText),
          emoji: String(row['Emoji'] || row['emoji'] || '✨'),
          timeOfDay: (['Morning', 'Evening', 'Anytime'].includes(row['Time of Day'] || row['timeOfDay'])
            ? row['Time of Day'] || row['timeOfDay']
            : 'Morning') as any,
          duration: String(row['Duration'] || row['duration'] || '15 min'),
          order: idx,
          reminderEnabled: String(row['Reminder Enabled'] || row['reminderEnabled'] || '').toLowerCase() === 'yes',
          reminderTime: String(row['Reminder Time'] || row['reminderTime'] || '07:00'),
          createdAt: new Date().toISOString(),
        });
      });
    }

    if (sankalps.length === 0) {
      sankalps.push({
        id: 's1',
        categoryId: categories[0].id,
        title: 'Morning Meditation',
        emoji: '🧘',
        timeOfDay: 'Morning',
        duration: '15 min',
        order: 0,
        createdAt: new Date().toISOString(),
      });
    }

    const histSheet = workbook.Sheets['Daily History'] || (sheetNames[2] ? workbook.Sheets[sheetNames[2]] : null);
    const rawHistory = histSheet ? XLSX.utils.sheet_to_json<Record<string, any>>(histSheet) : [];

    const history: Record<number, DayRecord> = {};
    if (rawHistory.length > 0) {
      rawHistory.forEach((row) => {
        const dayNum = parseInt(row['Day Number'] || row['dayNumber'] || row['Day #'], 10);
        if (!Number.isNaN(dayNum) && dayNum >= 1) {
          const completedStr = String(row['Completed Sankalps'] || row['completedSankalpIds'] || '');
          const completedIds = completedStr ? completedStr.split(',').map((s) => s.trim()).filter(Boolean) : [];
          const isCompleted = String(row['Status'] || row['status'] || '').toLowerCase().includes('completed');

          history[dayNum] = {
            dayNumber: dayNum,
            dateString: String(row['Date'] || row['dateString'] || startDate),
            completedSankalpIds: completedIds,
            totalSankalpsAtTime: sankalps.length,
            isCompleted: isCompleted || completedIds.length > 0,
            notes: String(row['Notes'] || row['notes'] || ''),
            completedAt: String(row['Completed Timestamp'] || row['completedAt'] || ''),
          };
        }
      });
    }

    const constructedChallenge = {
      id: `challenge_excel_${Date.now()}`,
      title,
      totalDays,
      currentDay,
      startDate,
      categories,
      sankalps,
      history,
      isSetupComplete: true,
      createdAt: new Date().toISOString(),
    };

    return validateChallengeData(constructedChallenge);
  } catch (err: any) {
    return { isValid: false, error: err?.message || 'Failed to parse Excel spreadsheet file.' };
  }
};
