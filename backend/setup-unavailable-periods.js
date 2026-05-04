const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupUnavailablePeriodsTable() {
  try {
    // Create the unavailable_periods table
    const { error } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS unavailable_periods (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
          section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 5),
          reason VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(day_of_week, section_number)
        );
      `
    });

    if (error) {
      console.log('Table might already exist or error:', error.message);
    } else {
      console.log('✅ Unavailable periods table created successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('Please run this SQL directly in Supabase SQL Editor:');
    console.log(`
      CREATE TABLE IF NOT EXISTS unavailable_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
        section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 5),
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(day_of_week, section_number)
      );
    `);
  }
}

setupUnavailablePeriodsTable();
