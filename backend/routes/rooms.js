const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all rooms
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('rooms')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get room by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create room (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, capacity, type, floor, building, notes } = req.body;

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ name, code, capacity, type, floor, building, notes }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update room (Admin/Scheduler only)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, capacity, type, floor, building, notes } = req.body;

    const { data, error } = await supabase
      .from('rooms')
      .update({ name, code, capacity, type, floor, building, notes })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete room (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const roomId = req.params.id;

    // Set room_id to NULL for all sessions using this room (instead of deleting them)
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ room_id: null })
      .eq('room_id', roomId);

    if (updateError) throw new Error(`Failed to update sessions: ${updateError.message}`);

    // Delete the room
    const { error: roomError } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (roomError) throw new Error(`Failed to delete room: ${roomError.message}`);

    res.json({ message: 'Room deleted successfully (sessions updated to remove room assignment)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
