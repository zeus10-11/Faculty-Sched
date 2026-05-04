const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get programme modules
router.get('/programme/:programmeId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('programme_modules')
      .select('*, modules(*)')
      .eq('programme_id', req.params.programmeId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add module to programme (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { programme_id, module_id, allocated_hours, weekly_target_hours } = req.body;

    const { data, error } = await supabase
      .from('programme_modules')
      .insert([{ programme_id, module_id, allocated_hours, weekly_target_hours }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update module in programme
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { allocated_hours, weekly_target_hours } = req.body;

    const { data, error } = await supabase
      .from('programme_modules')
      .update({ allocated_hours, weekly_target_hours })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove module from programme
router.delete('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('programme_modules')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Module removed from programme' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
