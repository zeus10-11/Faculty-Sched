const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all conflicts
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { severity, type, start_date, end_date } = req.query;

    let query = supabase
      .from('conflicts_log')
      .select('*, sessions(id)');

    if (severity) query = query.eq('severity', severity);
    if (type) query = query.eq('conflict_type', type);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve conflict (Admin/Scheduler only)
router.put('/:id/resolve', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { override_reason } = req.body;

    const { data, error } = await supabase
      .from('conflicts_log')
      .update({ 
        resolved_by: req.user.userId,
        override_reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
