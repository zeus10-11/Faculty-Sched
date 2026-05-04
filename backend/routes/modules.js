const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all modules
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('modules')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get module by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create module (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, level, default_hours, type, description, is_shared } = req.body;

    const { data, error } = await supabase
      .from('modules')
      .insert([{ name, code, level, default_hours, type, description, is_shared }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update module (Admin/Scheduler only)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, level, default_hours, type, description, is_shared } = req.body;

    const { data, error } = await supabase
      .from('modules')
      .update({ name, code, level, default_hours, type, description, is_shared })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete module (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const modId = req.params.id;

    // Delete all sessions for this module (cascade will delete conflicts_log too)
    const { error: sessionsError } = await supabase
      .from('sessions')
      .delete()
      .eq('module_id', modId);

    if (sessionsError) throw new Error(`Failed to delete sessions: ${sessionsError.message}`);

    // Delete the module (cascade will delete programme_modules too)
    const { error: modError } = await supabase
      .from('modules')
      .delete()
      .eq('id', modId);

    if (modError) throw new Error(`Failed to delete module: ${modError.message}`);

    res.json({ message: 'Module and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
