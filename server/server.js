require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const authRoutes      = require('./routes/authRoutes');
const requestRoutes   = require('./routes/requestRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const adminRoutes     = require('./routes/adminRoutes');

const app = express();

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.RUN_SEEDS === 'true') {
    const seedAdmin      = require('./utils/seedAdmin');
    const seedRequests   = require('./utils/seedRequests');
    const seedVolunteers = require('./utils/seedVolunteers');
    await seedAdmin();
    await seedRequests();
    await seedVolunteers();
    console.log('Seeds completed');
  }
});
