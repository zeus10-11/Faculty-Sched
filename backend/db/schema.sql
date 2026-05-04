-- Faculty Timetable Scheduling System - Database Schema

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    head VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programmes
CREATE TABLE IF NOT EXISTS programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    dept_id UUID NOT NULL REFERENCES departments(id),
    group_label VARCHAR(50),
    level VARCHAR(50) DEFAULT 'Level 3',
    term VARCHAR(10) DEFAULT '1',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_weeks INT,
    allotted_hours INT NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Upcoming')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modules
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    level VARCHAR(50) NOT NULL CHECK (level IN ('Level 3', 'Level 4', 'Level 5', 'Level 6')),
    default_hours INT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Lecture', 'Lab', 'Workshop', 'Short Course', 'Assessment', 'Schematic')),
    description TEXT,
    is_shared BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programme-Module Assignments
CREATE TABLE IF NOT EXISTS programme_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    allocated_hours INT NOT NULL,
    weekly_target_hours INT NOT NULL,
    hours_scheduled INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(programme_id, module_id)
);

-- Faculty
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    staff_id VARCHAR(50) NOT NULL UNIQUE,
    dept_id UUID REFERENCES departments(id),
    qualification_level VARCHAR(50) CHECK (qualification_level IN ('Level 3', 'Level 4', 'Level 5', 'Level 6')),
    max_weekly_hours INT NOT NULL DEFAULT 40,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'On Leave')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Weekly Availability
CREATE TABLE IF NOT EXISTS faculty_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, day_of_week, start_time, end_time)
);

-- Faculty Leave Dates
CREATE TABLE IF NOT EXISTS faculty_leave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    leave_date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, leave_date)
);

-- Faculty Module Assignments
CREATE TABLE IF NOT EXISTS faculty_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    expertise_level VARCHAR(50) DEFAULT 'Standard' CHECK (expertise_level IN ('Basic', 'Standard', 'Expert')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, module_id)
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    capacity INT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Lecture Hall', 'Lab', 'Workshop', 'Simulation Room')),
    floor VARCHAR(50),
    building VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_id UUID NOT NULL REFERENCES programmes(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    room_id UUID REFERENCES rooms(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_hours INT NOT NULL,
    session_type VARCHAR(50),
    is_extra BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conflicts Log
CREATE TABLE IF NOT EXISTS conflicts_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    conflict_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('Hard', 'Soft')),
    description TEXT NOT NULL,
    override_reason TEXT,
    resolved_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users (Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Scheduler', 'Faculty')) DEFAULT 'Faculty',
    name VARCHAR(255),
    faculty_id UUID REFERENCES faculty(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL UNIQUE,
    value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unavailable Periods (blocked time slots for scheduling)
CREATE TABLE IF NOT EXISTS unavailable_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 5),
    section_number INT NOT NULL CHECK (section_number BETWEEN 1 AND 5),
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(day_of_week, section_number)
);

-- Indexes for performance
CREATE INDEX idx_programmes_dept_id ON programmes(dept_id);
CREATE INDEX idx_programme_modules_programme_id ON programme_modules(programme_id);
CREATE INDEX idx_programme_modules_module_id ON programme_modules(module_id);
CREATE INDEX idx_faculty_dept_id ON faculty(dept_id);
CREATE INDEX idx_faculty_availability_faculty_id ON faculty_availability(faculty_id);
CREATE INDEX idx_faculty_leave_faculty_id ON faculty_leave(faculty_id);
CREATE INDEX idx_faculty_modules_faculty_id ON faculty_modules(faculty_id);
CREATE INDEX idx_faculty_modules_module_id ON faculty_modules(module_id);
CREATE INDEX idx_sessions_programme_id ON sessions(programme_id);
CREATE INDEX idx_sessions_module_id ON sessions(module_id);
CREATE INDEX idx_sessions_faculty_id ON sessions(faculty_id);
CREATE INDEX idx_sessions_room_id ON sessions(room_id);
CREATE INDEX idx_sessions_date ON sessions(session_date);
CREATE INDEX idx_conflicts_log_session_id ON conflicts_log(session_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_users_email ON users(email);
