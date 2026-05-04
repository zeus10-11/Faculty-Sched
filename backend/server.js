require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Make supabase available to routes
app.locals.supabase = supabase;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

// Import routes
const authRoutes = require('./routes/auth');
const departmentRoutes = require('./routes/departments');
const programmeRoutes = require('./routes/programmes');
const moduleRoutes = require('./routes/modules');
const programmeModulesRoutes = require('./routes/programme-modules');
const facultyModulesRoutes = require('./routes/faculty-modules');
const facultyRoutes = require('./routes/faculty');
const roomRoutes = require('./routes/rooms');
const sessionRoutes = require('./routes/sessions');
const conflictRoutes = require('./routes/conflicts');
const auditRoutes = require('./routes/audit');
const reportRoutes = require('./routes/reports');
const unavailablePeriodsRoutes = require('./routes/unavailable-periods');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/programmes', programmeRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/programme-modules', programmeModulesRoutes);
app.use('/api/faculty-modules', facultyModulesRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/conflicts', conflictRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/unavailable-periods', unavailablePeriodsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Faculty Scheduler Backend running on port ${PORT}`);
});
