const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all programmes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('programmes')
      .select('*, departments(name, code)');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get programme by ID with module details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('programmes')
      .select('*, departments(name, code), programme_modules(*, modules(*))')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create programme (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, dept_id, group_label, level, term, start_date, end_date, total_weeks, allotted_hours, status, notes } = req.body;

    const { data, error } = await supabase
      .from('programmes')
      .insert([{ name, code, dept_id, group_label, level, term, start_date, end_date, total_weeks, allotted_hours, status, notes }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update programme (Admin/Scheduler only)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, group_label, level, term, start_date, end_date, total_weeks, allotted_hours, status, notes } = req.body;

    const { data, error } = await supabase
      .from('programmes')
      .update({ name, code, group_label, level, term, start_date, end_date, total_weeks, allotted_hours, status, notes })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clone programme (Admin/Scheduler only)
router.post('/:id/clone', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    
    // Get original programme
    const { data: programme, error: fetchError } = await supabase
      .from('programmes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) throw fetchError;

    // Create new programme
    const newProgramme = {
      ...programme,
      id: undefined,
      code: `${programme.code}_CLONE_${Date.now()}`,
      name: `${programme.name} (Clone)`,
      created_at: undefined,
      updated_at: undefined
    };

    const { data: created, error: createError } = await supabase
      .from('programmes')
      .insert([newProgramme])
      .select();

    if (createError) throw createError;

    res.status(201).json(created[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete programme (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const progId = req.params.id;

    // Delete all sessions for this programme (cascade will delete conflicts_log too)
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('programme_id', progId);

    if (sessionsError) throw new Error(`Failed to delete sessions: ${sessionsError.message}`);

    // Delete the programme (cascade will delete programme_modules too)
    const { error: progError } = await supabase
      .from('programmes')
      .delete()
      .eq('id', progId);

    if (progError) throw new Error(`Failed to delete programme: ${progError.message}`);

    res.json({ message: 'Programme and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
