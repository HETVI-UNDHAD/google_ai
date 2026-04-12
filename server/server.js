require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const fs       = require('fs');
const mongoose = require('mongoose');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const authRoutes      = require('./routes/authRoutes');
const requestRoutes   = require('./routes/requestRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const adminRoutes     = require('./routes/adminRoutes');

const seedAdmin      = require('./utils/seedAdmin');
const seedRequests   = require('./utils/seedRequests');
const seedVolunteers = require('./utils/seedVolunteers');

const app = express();

// ── CORS: only allow our own frontend ─────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // allow server-to-server (no origin) and listed origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth',     authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api',          volunteerRoutes);
app.use('/api',          adminRoutes);

app.get('/', (req, res) => res.json({ message: 'Smart Resource Allocation API running' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    // Seeds only run if collections are empty (guarded inside each seed)
    await seedAdmin();
    await seedRequests();
    await seedVolunteers();

    // ── Hourly priority score refresh for pending requests ─────────────────
    const Request = require('./models/Request');
    async function refreshPriorities() {
      const pending = await Request.find({ status: 'Pending' }).select('urgency peopleAffected createdAt');
      for (const r of pending) {
        const score = Request.schema.statics.recalcPriority(r.urgency, r.peopleAffected, r.createdAt);
        if (score !== r.priorityScore)
          await Request.updateOne({ _id: r._id }, { priorityScore: score });
      }
    }
    refreshPriorities();
    setInterval(refreshPriorities, 60 * 60 * 1000); // every hour

    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
