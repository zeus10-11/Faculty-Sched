const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all unavailable periods
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('unavailable_periods')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('section_number', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unavailable periods for a specific day
router.get('/day/:dayOfWeek', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('unavailable_periods')
      .select('*')
      .eq('day_of_week', parseInt(req.params.dayOfWeek))
      .order('section_number', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create unavailable period
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { day_of_week, section_number, reason } = req.body;

    if (!day_of_week || !section_number) {
      return res.status(400).json({ error: 'day_of_week and section_number are required' });
    }

    if (day_of_week < 1 || day_of_week > 5 || section_number < 1 || section_number > 5) {
      return res.status(400).json({ error: 'day_of_week must be 1-5 (Mon-Fri) and section_number must be 1-5' });
    }

    const { data, error } = await supabase
      .from('unavailable_periods')
      .insert([{ day_of_week, section_number, reason }])
      .select();

    if (error) {
      if (error.message.includes('duplicate')) {
        return res.status(409).json({ error: 'This day and section combination is already marked as unavailable' });
      }
      throw error;
    }

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete unavailable period
router.delete('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('unavailable_periods')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Unavailable period deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
