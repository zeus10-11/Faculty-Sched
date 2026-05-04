const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get audit log (Admin/Scheduler only)
router.get('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { entity_type, action, start_date, end_date } = req.query;

    let query = supabase
      .from('audit_log')
      .select('*');

    if (entity_type) query = query.eq('entity_type', entity_type);
    if (action) query = query.eq('action', action);
    if (start_date) query = query.gte('timestamp', start_date);
    if (end_date) query = query.lte('timestamp', end_date);

    const { data, error } = await query.order('timestamp', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
