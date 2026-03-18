const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
require('dotenv').config();

const app = express();

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json());

// ─── MONGODB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });

// ─── ADMIN LOGIN  (POST /api/admin/login) ─────────────────────────────────────
// Validates password against ADMIN_PASSWORD env var.
// Returns { success: true } on match, { success: false } on mismatch.
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD;
  if (password === correct) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Incorrect password' });
  }
});

// ─── API ROUTES ───────────────────────────────────────────────────────────────
app.use('/api/stats',         require('./routes/stats'));
app.use('/api/content',       require('./routes/content'));
app.use('/api/news',          require('./routes/news'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/categories',    require('./routes/categories'));
app.use('/api/albums',        require('./routes/albums'));
app.use('/api/alumni',        require('./routes/alumni'));
app.use('/api/archives',      require('./routes/archives'));
app.use('/api/registrations', require('./routes/registrations'));

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));