import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import db from './db.js';
import * as tf from '@tensorflow/tfjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Active timers registry: Map<userId, { timeoutId, expiresAt, status }>
const activeTimers = new Map();

// ========================
// ML RISK ENGINE SETUP
// ========================
let riskModel = null;
async function loadRiskModel() {
  const modelPath = path.join(__dirname, 'ml_model', 'model.json');
  const weightsPath = path.join(__dirname, 'ml_model', 'weights.bin');
  const manifestPath = path.join(__dirname, 'ml_model', 'manifest.json');
  
  if (fs.existsSync(modelPath) && fs.existsSync(weightsPath) && fs.existsSync(manifestPath)) {
    try {
      const loadHandler = {
        load: async () => {
          const modelJson = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
          const weightsManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const weightBuf = fs.readFileSync(weightsPath);
          const weightData = weightBuf.buffer.slice(weightBuf.byteOffset, weightBuf.byteOffset + weightBuf.byteLength);
          return {
            modelTopology: modelJson,
            weightSpecs: weightsManifest[0].weights,
            weightData: weightData,
          };
        }
      };
      riskModel = await tf.loadLayersModel(loadHandler);
      console.log('🧠 ML Risk Engine (TensorFlow) loaded successfully');
    } catch (err) {
      console.error('Failed to load ML Risk Engine:', err);
    }
  } else {
    console.warn('⚠️ ML Risk Model files not found. Run: node server/trainModel.js');
  }
}
loadRiskModel();

app.use(cors());
app.use(express.json());

// ========================
// AUTH ENDPOINTS
// ========================

// Sign Up
app.post('/api/auth/signup', (req, res) => {
  try {
    const { name, username, password, email } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ error: 'Name, username, and password are required' });
    }

    // Check if user exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db.prepare(
      'INSERT INTO users (name, username, email, password_hash) VALUES (?, ?, ?, ?)'
    ).run(name, username, email || null, passwordHash);

    const user = db.prepare('SELECT id, name, username, email, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Account created', user, otp: '123456' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Sign In
app.post('/api/auth/signin', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        women_safety: !!user.women_safety,
        dark_mode: !!user.dark_mode,
        voice_enabled: !!user.voice_enabled,
      },
      otp: '123456',
    });
  } catch (err) {
    console.error('Signin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP (simulated - always accepts 123456 or any 6 digits)
app.post('/api/auth/verify-otp', (req, res) => {
  const { userId, otp } = req.body;
  if (otp && otp.length === 6) {
    const user = db.prepare('SELECT id, name, username, email FROM users WHERE id = ?').get(userId);
    if (user) {
      return res.json({ verified: true, user });
    }
  }
  res.status(400).json({ error: 'Invalid OTP' });
});

// Google Sign In (simulated)
app.post('/api/auth/google', (req, res) => {
  try {
    const { googleId, name, email } = req.body;
    const username = email || `google_${googleId}`;

    let user = db.prepare('SELECT * FROM users WHERE username = ? OR google_id = ?').get(username, googleId);

    if (!user) {
      const passwordHash = bcrypt.hashSync(googleId || 'google', 10);
      const result = db.prepare(
        'INSERT INTO users (name, username, email, password_hash, google_id) VALUES (?, ?, ?, ?, ?)'
      ).run(name || 'Google User', username, email, passwordHash, googleId);

      user = db.prepare('SELECT id, name, username, email FROM users WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json({ user: { id: user.id, name: user.name, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user settings
app.put('/api/auth/settings/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { women_safety, dark_mode, voice_enabled } = req.body;

    db.prepare(
      'UPDATE users SET women_safety = ?, dark_mode = ?, voice_enabled = ? WHERE id = ?'
    ).run(women_safety ? 1 : 0, dark_mode ? 1 : 0, voice_enabled ? 1 : 0, userId);

    res.json({ message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================
// TRIPS ENDPOINTS
// ========================

// Save a trip
app.post('/api/trips', (req, res) => {
  try {
    const {
      user_id, origin_name, origin_lat, origin_lng,
      destination_name, destination_lat, destination_lng,
      total_distance, total_time, safety_score,
      risk_low, risk_medium, risk_high,
      alerts_received, start_time, end_time,
    } = req.body;

    const result = db.prepare(`
      INSERT INTO trips (user_id, origin_name, origin_lat, origin_lng,
        destination_name, destination_lat, destination_lng,
        total_distance, total_time, safety_score,
        risk_low, risk_medium, risk_high,
        alerts_received, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      user_id, origin_name, origin_lat, origin_lng,
      destination_name, destination_lat, destination_lng,
      total_distance || 0, total_time || 0, safety_score || 0,
      risk_low || 0, risk_medium || 0, risk_high || 0,
      alerts_received || 0,
      start_time ? new Date(start_time).toISOString() : null,
      end_time ? new Date(end_time).toISOString() : null
    );

    res.status(201).json({ id: result.lastInsertRowid, message: 'Trip saved' });
  } catch (err) {
    console.error('Save trip error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user trips
app.get('/api/trips/:userId', (req, res) => {
  try {
    const trips = db.prepare(
      'SELECT * FROM trips WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    ).all(req.params.userId);

    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================
// REPORTS ENDPOINTS
// ========================

// Create report
app.post('/api/reports', (req, res) => {
  try {
    const { user_id, type, lat, lng, description } = req.body;

    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    const result = db.prepare(
      'INSERT INTO reports (user_id, type, lat, lng, description, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(user_id || null, type, lat, lng, description || '', expiresAt);

    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(report);
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get active reports
app.get('/api/reports', (req, res) => {
  try {
    // Deactivate expired reports
    db.prepare("UPDATE reports SET active = 0 WHERE expires_at < datetime('now') AND active = 1").run();

    const reports = db.prepare('SELECT * FROM reports WHERE active = 1 ORDER BY created_at DESC').all();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upvote report
app.post('/api/reports/:id/upvote', (req, res) => {
  try {
    db.prepare('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Upvoted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ========================
// ARRIVAL TIMER ENDPOINTS
// ========================

// Start or update a user timer
app.post('/api/timer/start', (req, res) => {
  const { userId, durationMinutes } = req.body;
  if (!userId || !durationMinutes) return res.status(400).json({ error: 'Missing parameters' });

  // Clear existing timer if any
  if (activeTimers.has(userId)) {
    const existing = activeTimers.get(userId);
    clearTimeout(existing.timeoutId);
    activeTimers.delete(userId);
  }

  const ms = durationMinutes * 60 * 1000;
  const expiresAt = new Date(Date.now() + ms);

  const timeoutId = setTimeout(() => {
    // When timer expires, mark status as alert
    if (activeTimers.has(userId)) {
      activeTimers.get(userId).status = 'alert';
      console.log(`\n🚨 [TIMER ALERT] User ${userId} failed to check-in by ${expiresAt.toLocaleTimeString()}!`);
    }
  }, ms);

  activeTimers.set(userId, { timeoutId, expiresAt, status: 'active' });
  res.json({ message: 'Timer started', expiresAt });
});

// Check-in to cancel a timer
app.post('/api/timer/checkin', (req, res) => {
  const { userId } = req.body;
  
  if (activeTimers.has(userId)) {
    const existing = activeTimers.get(userId);
    clearTimeout(existing.timeoutId);
    activeTimers.delete(userId);
    console.log(`✅ [TIMER SAFE] User ${userId} checked in safely.`);
    return res.json({ message: 'Checked in successfully' });
  }
  
  res.json({ message: 'No active timer found' });
});

// Polling endpoint for frontend to check timer status
app.get('/api/timer/status/:userId', (req, res) => {
  const { userId } = req.params;
  
  if (activeTimers.has(userId)) {
    const timer = activeTimers.get(userId);
    return res.json({
      active: true,
      status: timer.status,
      expiresAt: timer.expiresAt
    });
  }
  
  res.json({ active: false, status: 'none' });
});

// ========================
// ML RISK ENDPOINT
// ========================

app.post('/api/risk/predict', (req, res) => {
  if (!riskModel) {
    return res.status(503).json({ error: 'ML Model not yet loaded or trained.' });
  }

  try {
    const { features } = req.body;
    
    // Check if valid array
    if (!Array.isArray(features) || features.length !== 11) {
      return res.status(400).json({ error: 'Expected 11 features for ML Risk prediction.' });
    }

    const inputTensor = tf.tensor2d([features]);
    const predictionTensor = riskModel.predict(inputTensor);
    const scoreVal = predictionTensor.dataSync()[0]; // 0.0 to 1.0

    console.log('[DEBUG] Feats:', features.map(f => f.toFixed(2)).join(', '));
    console.log('[DEBUG] Pred Score:', scoreVal);

    // Cleanup memory
    inputTensor.dispose();
    predictionTensor.dispose();

    // Map the 0-1 score to a 0-100 score
    const finalScore = Math.min(100, Math.max(0, Math.round(scoreVal * 100)));
    const level = finalScore < 30 ? 'low' : finalScore < 60 ? 'medium' : 'high';

    res.json({ score: finalScore, level });
  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Server error during ML inference' });
  }
});

// ========================
// HEALTH CHECK
// ========================

app.get('/api/health', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  const tripCount = db.prepare('SELECT COUNT(*) as count FROM trips').get();
  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports WHERE active = 1').get();

  res.json({
    status: 'ok',
    database: 'SQLite (better-sqlite3)',
    tables: {
      users: userCount.count,
      trips: tripCount.count,
      active_reports: reportCount.count,
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 SafeRoute API Server running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (saferoute.db)`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/auth/signup`);
  console.log(`  POST /api/auth/signin`);
  console.log(`  POST /api/auth/verify-otp`);
  console.log(`  POST /api/auth/google`);
  console.log(`  GET  /api/trips/:userId`);
  console.log(`  POST /api/trips`);
  console.log(`  GET  /api/reports`);
  console.log(`  POST /api/reports`);
  console.log(`  POST /api/risk/predict`);
  console.log(`  GET  /api/health\n`);
});
