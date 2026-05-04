const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function createTable() {
  try {
    console.log('Creating faculty_modules table...');

    const { data, error } = await supabase
      .from('faculty_modules')
      .select('id')
      .limit(1);

    if (!error) {
      console.log('✅ Table already exists');
      return;
    }

    // Table doesn't exist, create it
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS faculty_modules (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
            module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
            expertise_level VARCHAR(50) DEFAULT 'Standard' CHECK (expertise_level IN ('Basic', 'Standard', 'Expert')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(faculty_id, module_id)
        );

        CREATE INDEX IF NOT EXISTS idx_faculty_modules_faculty_id ON faculty_modules(faculty_id);
        CREATE INDEX IF NOT EXISTS idx_faculty_modules_module_id ON faculty_modules(module_id);
      `
    });

    if (createError) {
      // RPC might not be available, try direct SQL
      console.log('Note: Direct table creation via Supabase client');
      console.log('Please run this SQL in Supabase SQL Editor:');
      console.log(`
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
    } else {
      console.log('✅ faculty_modules table created successfully');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createTable();
