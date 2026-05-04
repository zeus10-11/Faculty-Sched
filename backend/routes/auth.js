const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Verify with Supabase Auth
    const supabase = req.app.locals.supabase;
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get user details from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError) {
      return res.status(400).json({ error: 'User not found in system' });
    }

    // Generate JWT token (7 days expiration)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    const token = require('jsonwebtoken').sign(
      { userId: user.id, email: email, role: userData.role },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        facultyId: userData.faculty_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout endpoint
router.post('/logout', authMiddleware, (req, res) => {
  // Token is invalidated on client side
  res.json({ message: 'Logged out successfully' });
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (error) {
      return res.status(400).json({ error: 'User not found' });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
