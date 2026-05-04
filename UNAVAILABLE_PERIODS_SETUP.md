# Creating the Unavailable Periods Table

The system now supports marking specific day/section combinations as unavailable for scheduling.

## To Enable This Feature:

### Option 1: Run the SQL directly in Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to the "SQL Editor" tab
4. Create a new query and paste the following SQL:

```sql
CREATE TABLE IF NOT EXISTS unavailable_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
  section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 5),
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(day_of_week, section_number)
);
```

5. Click "Run" to create the table
6. The system will now work correctly!

### Option 2: Via Migration (if using migrations)

Copy the above SQL into a new migration file and apply it.

## What This Feature Does:

- **Block Scheduling Slots**: Admins/Schedulers can mark specific day/section combinations as unavailable
- **No Scheduling During Blocked Time**: When auto-generating schedules, the system will skip any blocked day/section combinations
- **Maintenance Windows**: Useful for facility maintenance, special events, or facility unavailability

## How to Use:

1. Go to "🚫 Unavailable Periods" in the navigation menu
2. Select a day (Monday-Friday) and section (1-5)
3. Optionally add a reason (e.g., "Maintenance", "Special Event")
4. Click "Add Block"
5. The blocked combination will appear in the "Blocked Sections" table
6. When running "Advanced Scheduler", these sections will be automatically skipped

## Example:

If you block Monday Section 2 for "Facility Maintenance":
- When scheduling any programme for Monday, Section 2 (11:00-12:30) will not be used
- The scheduler will use other available sections instead
