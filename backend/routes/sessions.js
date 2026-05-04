const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all sessions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { programme_id, faculty_id, room_id, start_date, end_date } = req.query;

    let query = supabase
      .from('sessions')
      .select('*, programmes(name, code), modules(name, code), faculty(name), rooms(name, code)');

    if (programme_id) query = query.eq('programme_id', programme_id);
    if (faculty_id) query = query.eq('faculty_id', faculty_id);
    if (room_id) query = query.eq('room_id', room_id);
    if (start_date) query = query.gte('session_date', start_date);
    if (end_date) query = query.lte('session_date', end_date);

    const { data, error } = await query;

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('sessions')
      .select('*, programmes(name, code), modules(name, code), faculty(name), rooms(name, code)')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create session with conflict check (Admin/Scheduler/Faculty)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler', 'Faculty']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { programme_id, module_id, faculty_id, room_id, session_date, start_time, duration_hours, session_type, section_number, is_extra, notes } = req.body;

    // Validate required fields
    if (!programme_id || !module_id || !faculty_id || !session_date || !start_time || !duration_hours) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert duration_hours to integer (database expects INT)
    const durationInt = Math.round(duration_hours);

    // Check for conflicts
    const conflicts = await checkConflicts(supabase, {
      programme_id, module_id, faculty_id, room_id, session_date, start_time, duration_hours: durationInt
    });

    if (conflicts.hard.length > 0) {
      return res.status(400).json({ 
        error: 'Hard conflicts detected',
        conflicts: conflicts.hard 
      });
    }

    // Create session
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ 
        programme_id, module_id, faculty_id, room_id, session_date, 
        start_time, duration_hours: durationInt, session_type, section_number, is_extra, notes,
        created_by: req.user.userId
      }])
      .select();

    if (error) throw error;

    // Log soft conflicts if any
    if (conflicts.soft.length > 0) {
      conflicts.soft.forEach(async (conflict) => {
        await supabase
          .from('conflicts_log')
          .insert([{
            session_id: data[0].id,
            conflict_type: conflict.type,
            severity: 'Soft',
            description: conflict.description
          }]);
      });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update session
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { session_date, start_time, duration_hours, session_type, section_number, is_locked, notes } = req.body;

    const { data, error } = await supabase
      .from('sessions')
      .update({ session_date, start_time, duration_hours, session_type, section_number, is_locked, notes })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conflict detection helper
async function checkConflicts(supabase, sessionData) {
  const { programme_id, module_id, faculty_id, room_id, session_date, start_time, duration_hours } = sessionData;
  const hard = [];
  const soft = [];

  // Check faculty double-booking
  const { data: facultyConflict } = await supabase
    .from('sessions')
    .select('*')
    .eq('faculty_id', faculty_id)
    .eq('session_date', session_date);

  if (facultyConflict && facultyConflict.length > 0) {
    const overlaps = facultyConflict.some(s => {
      const sEnd = new Date(`${s.session_date}T${s.start_time}`).getTime() + (s.duration_hours * 60 * 60 * 1000);
      const newEnd = new Date(`${session_date}T${start_time}`).getTime() + (duration_hours * 60 * 60 * 1000);
      const sStart = new Date(`${s.session_date}T${s.start_time}`).getTime();
      const newStart = new Date(`${session_date}T${start_time}`).getTime();
      return newStart < sEnd && newEnd > sStart;
    });
    if (overlaps) hard.push({ type: 'Faculty Double-Booking', description: 'Faculty is already scheduled at this time' });
  }

  // Check room double-booking
  if (room_id) {
    const { data: roomConflict } = await supabase
      .from('sessions')
      .select('*')
      .eq('room_id', room_id)
      .eq('session_date', session_date);

    if (roomConflict && roomConflict.length > 0) {
      const overlaps = roomConflict.some(s => {
        const sEnd = new Date(`${s.session_date}T${s.start_time}`).getTime() + (s.duration_hours * 60 * 60 * 1000);
        const newEnd = new Date(`${session_date}T${start_time}`).getTime() + (duration_hours * 60 * 60 * 1000);
        const sStart = new Date(`${s.session_date}T${s.start_time}`).getTime();
        const newStart = new Date(`${session_date}T${start_time}`).getTime();
        return newStart < sEnd && newEnd > sStart;
      });
      if (overlaps) hard.push({ type: 'Room Double-Booking', description: 'Room is already booked at this time' });
    }
  }

  return { hard, soft };
}

module.exports = router;
