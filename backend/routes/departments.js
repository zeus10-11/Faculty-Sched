const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all departments
router.get('/', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('departments')
      .select('*');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get department by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create department (Admin/Scheduler only)
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, head, description } = req.body;

    const { data, error } = await supabase
      .from('departments')
      .insert([{ name, code, head, description }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update department (Admin/Scheduler only)
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { name, code, head, description } = req.body;

    const { data, error } = await supabase
      .from('departments')
      .update({ name, code, head, description })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete department (Admin only) - cascade deletes programmes and faculty
router.delete('/:id', authMiddleware, roleMiddleware(['Admin']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const deptId = req.params.id;

    // Delete all faculty members in this department
    const { error: facultyError } = await supabase
      .from('faculty')
      .delete()
      .eq('dept_id', deptId);

    if (facultyError) throw new Error(`Failed to delete faculty: ${facultyError.message}`);

    // Delete all programmes in this department
    const { error: progError } = await supabase
      .from('programmes')
      .delete()
      .eq('dept_id', deptId);

    if (progError) throw new Error(`Failed to delete programmes: ${progError.message}`);

    // Delete the department
    const { error: deptError } = await supabase
      .from('departments')
      .delete()
      .eq('id', deptId);

    if (deptError) throw new Error(`Failed to delete department: ${deptError.message}`);

    res.json({ message: 'Department and all related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
