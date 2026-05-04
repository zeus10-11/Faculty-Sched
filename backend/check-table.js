const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkTable() {
  try {
    console.log('Checking if faculty_modules table exists...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('faculty_modules')
      .select('*')
      .limit(1);

    if (error && error.code === 'PGRST116') {
      console.log('❌ Table does NOT exist - Error: ' + error.message);
      console.log('\nYou need to create the table in Supabase SQL Editor:');
      console.log(`
COPY AND PASTE THIS SQL IN SUPABASE SQL EDITOR:
================================================

CREATE TABLE IF NOT EXISTS faculty_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    expertise_level VARCHAR(50) DEFAULT 'Standard' CHECK (expertise_level IN ('Basic', 'Standard', 'Expert')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, module_id)
);

CREATE INDEX idx_faculty_modules_faculty_id ON faculty_modules(faculty_id);
CREATE INDEX idx_faculty_modules_module_id ON faculty_modules(module_id);
      `);
      return;
    }

    if (error) {
      console.log('❌ Error checking table:', error.message);
      return;
    }

    console.log('✅ Table EXISTS!');
    console.log('Found', data?.length || 0, 'records');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTable();
