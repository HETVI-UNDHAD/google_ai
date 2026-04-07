require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const mongoose = require('mongoose');

const authRoutes      = require('./routes/authRoutes');
const requestRoutes   = require('./routes/requestRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const adminRoutes     = require('./routes/adminRoutes');

const seedAdmin      = require('./utils/seedAdmin');
const seedRequests   = require('./utils/seedRequests');
const seedVolunteers = require('./utils/seedVolunteers');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',     authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api',          volunteerRoutes);
app.use('/api',          adminRoutes);

app.get('/', (req, res) => res.json({ message: 'Smart Resource Allocation API running' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    await seedAdmin();
    await seedRequests();
    await seedVolunteers();
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
