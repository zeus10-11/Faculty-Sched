const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // Create Supabase Auth user
    const { data: { user }, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@university.edu',
      password: 'password123',
      email_confirm: true
    });

    if (authError) {
      console.error('Auth error:', authError);
      return;
    }

    console.log('✅ Supabase Auth user created:', user.id);

    // Insert user record in users table
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: 'admin@university.edu',
        name: 'Admin User',
        role: 'Admin'
      })
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      return;
    }

    console.log('✅ User record created in database');
    console.log('\n🎉 Admin user ready! Try login:');
    console.log('Email: admin@university.edu');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();
