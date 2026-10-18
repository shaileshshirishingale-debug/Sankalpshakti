import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { put, head } from '@vercel/blob';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_SYSTEMS_FILE = path.join(DATA_DIR, 'systems.json');
const BLOB_FILENAME = 'sankalp_systems_store.json';

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

let inMemoryStore: SystemsStore = { activeId: null, systems: [] };

async function loadStore(): Promise<SystemsStore> {
  // 1. Try loading from Vercel Blob if configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blobMeta = await head(BLOB_FILENAME).catch(() => null);
      if (blobMeta && blobMeta.url) {
        const response = await fetch(blobMeta.url);
        if (response.ok) {
          const blobData = await response.json();
          if (blobData && Array.isArray(blobData.systems)) {
            inMemoryStore = blobData;
            return blobData;
          }
        }
      }
    } catch (err) {
      console.warn('Vercel Blob load fallback:', err);
    }
  }

  // 2. Try loading from local file system
  try {
    if (fs.existsSync(LOCAL_SYSTEMS_FILE)) {
      const raw = fs.readFileSync(LOCAL_SYSTEMS_FILE, 'utf-8');
      const store = JSON.parse(raw);
      if (store && Array.isArray(store.systems)) {
        inMemoryStore = store;
        return store;
      }
    }
  } catch (err) {
    console.warn('Local systems file load fallback:', err);
  }

  // 3. Fallback to in-memory store
  return inMemoryStore;
}

async function saveStore(store: SystemsStore): Promise<void> {
  inMemoryStore = store;

  // 1. Save to local file system
  try {
    fs.writeFileSync(LOCAL_SYSTEMS_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not write local systems.json:', err);
  }

  // 2. Save to Vercel Blob if token present
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(store, null, 2), {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/json',
      });
    } catch (err) {
      console.warn('Failed to upload to Vercel Blob:', err);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // API Routes for Multi-System Registry with Vercel Blob / Local Storage
  app.get('/api/systems', async (req, res) => {
    try {
      const store = await loadStore();
      res.json({ success: true, store });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load systems' });
    }
  });

  app.post('/api/systems', async (req, res) => {
    try {
      const store: SystemsStore = req.body;
      if (!store || !Array.isArray(store.systems)) {
        res.status(400).json({ success: false, error: 'Invalid systems store data' });
        return;
      }
      await saveStore(store);
      res.json({ success: true, message: 'Systems successfully saved' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save systems' });
    }
  });

  // Legacy compatibility endpoint
  app.get('/api/challenge', async (req, res) => {
    try {
      const store = await loadStore();
      const active = store.systems.find((s) => s.id === store.activeId) || store.systems[0];
      res.json({ success: true, challenge: active ? active.challenge : null });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load challenge' });
    }
  });

  app.post('/api/challenge', async (req, res) => {
    try {
      const challenge = req.body;
      if (!challenge) {
        res.status(400).json({ success: false, error: 'Invalid challenge data' });
        return;
      }
      const store = await loadStore();
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
      await saveStore(store);
      res.json({ success: true, message: 'Challenge saved' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save challenge' });
    }
  });

  app.post('/api/clear', async (req, res) => {
    try {
      const emptyStore: SystemsStore = { activeId: null, systems: [] };
      await saveStore(emptyStore);
      res.json({ success: true, message: 'Data cleared' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to clear data' });
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
    console.log(`Server running on http://0.0.0.0:${PORT} (Vercel Blob / REST API Store)`);
  });
}

startServer();
