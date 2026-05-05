const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addSectionNumber() {
  console.log('Adding section_number column to sessions table...');

  // Use Supabase SQL editor via REST - try direct SQL via rpc
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE sessions ADD COLUMN IF NOT EXISTS section_number INT;'
  });

  if (error) {
    console.log('RPC method not available:', error.message);
    console.log('');
    console.log('==> Please run this SQL manually in Supabase SQL Editor:');
    console.log('');
    console.log('    ALTER TABLE sessions ADD COLUMN IF NOT EXISTS section_number INT;');
    console.log('');
    console.log('Go to: https://supabase.com/dashboard → Your project → SQL Editor');
    console.log('Paste the SQL above and click "Run"');
  } else {
    console.log('✅ Column added successfully!');
  }
}

addSectionNumber();
