const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Faculty Report
router.get('/faculty/:facultyId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { start_date, end_date } = req.query;

    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*, modules(name, code), programmes(name)')
      .eq('faculty_id', req.params.facultyId);

    if (error) throw error;

    const { data: leave } = await supabase
      .from('faculty_leave')
      .select('*')
      .eq('faculty_id', req.params.facultyId);

    const report = {
      sessions: sessions || [],
      leave: leave || [],
      total_hours: sessions?.reduce((sum, s) => sum + s.duration_hours, 0) || 0
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Programme Report
router.get('/programme/:programmeId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: programme } = await supabase
      .from('programmes')
      .select('*, programme_modules(*, modules(*))')
      .eq('id', req.params.programmeId)
      .single();

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('programme_id', req.params.programmeId);

    const report = {
      programme,
      total_sessions: sessions?.length || 0,
      total_hours_scheduled: sessions?.reduce((sum, s) => sum + s.duration_hours, 0) || 0,
      sessions
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Module Report
router.get('/module/:moduleId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;

    const { data: programmes } = await supabase
      .from('programme_modules')
      .select('*, programmes(name, code)')
      .eq('module_id', req.params.moduleId);

    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('module_id', req.params.moduleId);

    const report = {
      programmes: programmes || [],
      total_sessions: sessions?.length || 0,
      total_hours: sessions?.reduce((sum, s) => sum + s.duration_hours, 0) || 0
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Room Utilization Report
router.get('/room/utilization/:roomId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { start_date, end_date } = req.query;

    let query = supabase
      .from('sessions')
      .select('*')
      .eq('room_id', req.params.roomId);

    if (start_date) query = query.gte('session_date', start_date);
    if (end_date) query = query.lte('session_date', end_date);

    const { data: sessions, error } = await query;
    if (error) throw error;

    const report = {
      total_sessions: sessions?.length || 0,
      total_hours: sessions?.reduce((sum, s) => sum + s.duration_hours, 0) || 0,
      sessions
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
