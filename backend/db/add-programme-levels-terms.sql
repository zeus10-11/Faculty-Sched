-- Add level and term columns to programmes table if they don't exist

ALTER TABLE programmes
ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Level 3';

ALTER TABLE programmes
ADD COLUMN IF NOT EXISTS term VARCHAR(10) DEFAULT '1';

-- If you get an error, this means the columns already exist, which is fine.
-- If the columns don't exist and you need to create them, run the above separately.
