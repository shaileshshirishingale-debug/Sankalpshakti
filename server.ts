import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const DATA_DIR = path.join(process.cwd(), 'data');
const EXCEL_DB_FILE = path.join(DATA_DIR, 'sankalp_database.xlsx');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface SystemProfile {
  id: string;
  name: string;
  challenge: any;
  updatedAt: string;
}

interface SystemsStore {
  activeId: string | null;
  systems: SystemProfile[];
}

function loadStoreFromExcel(): SystemsStore {
  try {
    if (fs.existsSync(EXCEL_DB_FILE)) {
      const fileBuffer = fs.readFileSync(EXCEL_DB_FILE);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      
      if (workbook.Sheets['JSONStore']) {
        const jsonSheet = workbook.Sheets['JSONStore'];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(jsonSheet, { header: 1 });
        if (rows && rows[0] && rows[0][0]) {
          const store = JSON.parse(String(rows[0][0]));
          if (store && Array.isArray(store.systems)) {
            return store;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading store from Excel database:', err);
  }

  // Default fallback store if excel doesn't exist or is invalid
  const defaultChallenge = {
    id: 'sys_default',
    title: '100 Days Mindful Sankalp',
    totalDays: 100,
    currentDay: 1,
    startDate: new Date().toISOString().split('T')[0],
    isSetupComplete: false,
    categories: [],
    sankalps: [],
    history: {},
    createdAt: new Date().toISOString(),
  };

  const defaultStore: SystemsStore = {
    activeId: 'sys_default',
    systems: [{
      id: 'sys_default',
      name: '100 Days Mindful Sankalp',
      challenge: defaultChallenge,
      updatedAt: new Date().toISOString(),
    }],
  };

  saveStoreToExcel(defaultStore);
  return defaultStore;
}

function saveStoreToExcel(store: SystemsStore) {
  try {
    const wb = XLSX.utils.book_new();

    // 1. JSONStore sheet for lossless round-tripping
    const jsonWs = XLSX.utils.aoa_to_sheet([[JSON.stringify(store)]]);
    XLSX.utils.book_append_sheet(wb, jsonWs, 'JSONStore');

    // 2. Systems Overview sheet
    const overviewData = [
      ['System ID', 'System Name', 'Active Status', 'Total Days', 'Current Day', 'Start Date', 'Setup Complete'],
      ...store.systems.map(s => [
        s.id,
        s.name,
        s.id === store.activeId ? 'Active' : 'Inactive',
        s.challenge?.totalDays || 100,
        s.challenge?.currentDay || 1,
        s.challenge?.startDate || '',
        s.challenge?.isSetupComplete ? 'Yes' : 'No',
      ])
    ];
    const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, wsOverview, 'Systems Overview');

    const activeSys = store.systems.find(s => s.id === store.activeId) || store.systems[0];
    const challenge = activeSys ? activeSys.challenge : null;

    if (challenge) {
      // 3. Active Disciplines sheet
      const categoryMap = new Map((challenge.categories || []).map((c: any) => [c.id, c.name]));
      const disciplinesHeaders = ['Category', 'Title', 'Emoji', 'Time of Day', 'Duration', 'Reminder Enabled', 'Reminder Time'];
      const disciplinesRows = (challenge.sankalps || []).map((s: any) => [
        categoryMap.get(s.categoryId) || 'General',
        s.title,
        s.emoji || '✨',
        s.timeOfDay,
        s.duration,
        s.reminderEnabled ? 'Yes' : 'No',
        s.reminderTime || '',
      ]);
      const wsDisciplines = XLSX.utils.aoa_to_sheet([disciplinesHeaders, ...disciplinesRows]);
      XLSX.utils.book_append_sheet(wb, wsDisciplines, 'Active Disciplines');

      // 4. Daily History sheet
      const historyHeaders = ['Day Number', 'Date', 'Status', 'Completed Count', 'Total Target', 'Completed Sankalps', 'Notes'];
      const historyRows: any[][] = [];
      const totalD = challenge.totalDays || 100;
      for (let d = 1; d <= totalD; d++) {
        const rec = challenge.history?.[d];
        const completedIds = rec?.completedSankalpIds || [];
        const dayTarget = rec?.daySankalps?.length || rec?.totalSankalpsAtTime || (challenge.sankalps || []).length || 10;
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
        ]);
      }
      const wsHistory = XLSX.utils.aoa_to_sheet([historyHeaders, ...historyRows]);
      XLSX.utils.book_append_sheet(wb, wsHistory, 'Daily History');
    }

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    fs.writeFileSync(EXCEL_DB_FILE, excelBuffer);
  } catch (err) {
    console.error('Failed to save store to Excel database:', err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Routes for Multi-System Registry backed by Excel file system database
  app.get('/api/systems', (req, res) => {
    try {
      const store = loadStoreFromExcel();
      res.json({ success: true, store });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load systems from Excel database' });
    }
  });

  app.post('/api/systems', (req, res) => {
    try {
      const store: SystemsStore = req.body;
      if (!store || !Array.isArray(store.systems)) {
        res.status(400).json({ success: false, error: 'Invalid systems store data' });
        return;
      }
      saveStoreToExcel(store);
      res.json({ success: true, message: 'Systems successfully saved to Excel database file' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save systems to Excel database' });
    }
  });

  // Legacy compatibility endpoint
  app.get('/api/challenge', (req, res) => {
    try {
      const store = loadStoreFromExcel();
      const active = store.systems.find((s) => s.id === store.activeId) || store.systems[0];
      res.json({ success: true, challenge: active ? active.challenge : null });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load challenge from Excel database' });
    }
  });

  app.post('/api/challenge', (req, res) => {
    try {
      const challenge = req.body;
      if (!challenge) {
        res.status(400).json({ success: false, error: 'Invalid challenge data' });
        return;
      }
      const store = loadStoreFromExcel();
      let sys = store.systems.find((s) => s.id === challenge.id);
      if (sys) {
        sys.challenge = challenge;
        sys.name = challenge.title || sys.name;
        sys.updatedAt = new Date().toISOString();
      } else {
        sys = {
          id: challenge.id || `sys_${Date.now()}`,
          name: challenge.title || 'My Sankalp System',
          challenge,
          updatedAt: new Date().toISOString(),
        };
        store.systems.push(sys);
      }
      store.activeId = sys.id;
      saveStoreToExcel(store);
      res.json({ success: true, message: 'Challenge saved to Excel database file' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save challenge to Excel database' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT} (Backed by Excel Database file system)`);
  });
}

startServer();
