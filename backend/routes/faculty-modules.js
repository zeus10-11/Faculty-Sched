const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get all faculty assignments for a module
router.get('/module/:moduleId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty_modules')
      .select('id, faculty_id, module_id, expertise_level, faculty(*)')
      .eq('module_id', req.params.moduleId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all modules a faculty can teach
router.get('/faculty/:facultyId', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('faculty_modules')
      .select('id, faculty_id, module_id, expertise_level, modules(*)')
      .eq('faculty_id', req.params.facultyId);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign faculty to module
router.post('/', authMiddleware, roleMiddleware(['Admin', 'Scheduler', 'Faculty']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { faculty_id, module_id, expertise_level } = req.body;

    const { data, error } = await supabase
      .from('faculty_modules')
      .insert([{ faculty_id, module_id, expertise_level }])
      .select();

    if (error) throw error;
    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expertise level for a faculty-module assignment
router.put('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler', 'Faculty']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { expertise_level } = req.body;

    const { data, error } = await supabase
      .from('faculty_modules')
      .update({ expertise_level })
      .eq('id', req.params.id)
      .select();

    if (error) throw error;
    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove faculty from module
router.delete('/:id', authMiddleware, roleMiddleware(['Admin', 'Scheduler', 'Faculty']), async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { error } = await supabase
      .from('faculty_modules')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Faculty-module assignment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
