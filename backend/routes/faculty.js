const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all faculty
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty')
      .select('*, departments(name, code)');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get faculty by ID with availability
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty')
      .select('*, faculty_availability(*), faculty_leave(*)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create faculty (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, staff_id, dept_id, qualification_level, max_weekly_hours, status, notes } = req.body;

    const { data, error } = await supabase
      .from('faculty')
      .insert([{ name, staff_id, dept_id, qualification_level, max_weekly_hours, status, notes }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update faculty (Admin/Scheduler only)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, staff_id, dept_id, qualification_level, max_weekly_hours, status, notes } = req.body;

    const { data, error } = await supabase
      .from('faculty')
      .update({ name, staff_id, dept_id, qualification_level, max_weekly_hours, status, notes })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add availability
router.post('/:id/availability', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { day_of_week, start_time, end_time } = req.body;

    const { data, error } = await supabase
      .from('faculty_availability')
      .insert([{ faculty_id: req.params.id, day_of_week, start_time, end_time }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all availability
router.get('/availability/all', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty_availability')
      .select('*');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all leave dates
router.get('/leave/all', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty_leave')
      .select('*');

    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add leave
router.post('/:id/leave', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { leave_date, reason } = req.body;

    const { data, error } = await supabase
      .from('faculty_leave')
      .insert([{ faculty_id: req.params.id, leave_date, reason }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete faculty (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const facId = req.params.id;

    // Delete all sessions for this faculty member (cascade will delete conflicts_log too)
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('faculty_id', facId);

    if (sessionsError) throw new Error(`Failed to delete sessions: ${sessionsError.message}`);

    // Delete the faculty member (cascade will delete availability and leave records too)
    const { error: facError } = await supabase
      .from('faculty')
      .delete()
      .eq('id', facId);

    if (facError) throw new Error(`Failed to delete faculty: ${facError.message}`);

    res.json({ message: 'Faculty member and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
