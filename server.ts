import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'challenge.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes for Permanent Server Storage
  app.get('/api/challenge', (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const challenge = JSON.parse(fileContent);
        res.json({ success: true, challenge });
      } else {
        res.json({ success: true, challenge: null });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load challenge from server' });
    }
  });

  app.post('/api/challenge', (req, res) => {
    try {
      const challenge = req.body;
      if (!challenge) {
        res.status(400).json({ success: false, error: 'Invalid challenge data' });
        return;
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(challenge, null, 2), 'utf-8');
      res.json({ success: true, message: 'Challenge permanently saved to server database' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to save challenge to server' });
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
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
