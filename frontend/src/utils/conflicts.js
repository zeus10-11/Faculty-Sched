// Conflict detection utilities

export const checkHardConflicts = async (supabase, sessionData) => {
  const { programme_id, module_id, faculty_id, room_id, session_date, start_time, duration_hours } = sessionData;
  const conflicts = [];

  // Check faculty double-booking
  const { data: facultySessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('faculty_id', faculty_id)
    .eq('session_date', session_date);

  if (facultySessions && facultySessions.length > 0) {
    const overlaps = facultySessions.some(s => timeOverlaps(s, { start_time, duration_hours }));
    if (overlaps) conflicts.push('Faculty double-booked at this time');
  }

  // Check room double-booking
  if (room_id) {
    const { data: roomSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('room_id', room_id)
      .eq('session_date', session_date);

    if (roomSessions && roomSessions.length > 0) {
      const overlaps = roomSessions.some(s => timeOverlaps(s, { start_time, duration_hours }));
      if (overlaps) conflicts.push('Room already booked at this time');
    }
  }

  // Check programme duplicate session
  const { data: programmeSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('programme_id', programme_id)
    .eq('session_date', session_date);

  if (programmeSessions && programmeSessions.length > 0) {
    const overlaps = programmeSessions.some(s => timeOverlaps(s, { start_time, duration_hours }));
    if (overlaps) conflicts.push('Programme already has session at this time');
  }

  // Check module allocation
  const { data: programmeModules } = await supabase
    .from('programme_modules')
    .select('*')
    .eq('programme_id', programme_id)
    .eq('module_id', module_id)
    .single();

  if (programmeModules) {
    const totalScheduled = programmeModules.hours_scheduled + duration_hours;
    if (totalScheduled > programmeModules.allocated_hours) {
      conflicts.push('Would exceed module hour allocation');
    }
  }

  return conflicts;
};

export const checkSoftConflicts = async (supabase, sessionData) => {
  const { programme_id, module_id, faculty_id, start_time, duration_hours } = sessionData;
  const warnings = [];

  // Check faculty utilization
  const { data: facultyData } = await supabase
    .from('faculty')
    .select('*')
    .eq('id', faculty_id)
    .single();

  const { data: facultySessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('faculty_id', faculty_id);

  const totalHours = (facultySessions || []).reduce((sum, s) => sum + s.duration_hours, 0) + duration_hours;
  const utilization = (totalHours / facultyData.max_weekly_hours) * 100;

  if (utilization > 80) warnings.push(`Faculty utilization would be ${utilization.toFixed(0)}%`);

  // Check module behind schedule
  const { data: programmeData } = await supabase
    .from('programmes')
    .select('*')
    .eq('id', programme_id)
    .single();

  const daysElapsed = Math.floor((new Date() - new Date(programmeData.start_date)) / (1000 * 60 * 60 * 24));
  const weeksElapsed = Math.ceil(daysElapsed / 7);
  const expectedHours = weeksElapsed * (programmeData.allotted_hours / programmeData.total_weeks);

  const { data: moduleSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('programme_id', programme_id)
    .eq('module_id', module_id);

  const currentHours = (moduleSessions || []).reduce((sum, s) => sum + s.duration_hours, 0);
  const completion = (currentHours / expectedHours) * 100;

  if (completion < 70) warnings.push(`Module only ${completion.toFixed(0)}% complete vs schedule`);

  return warnings;
};

const timeOverlaps = (session, newTime) => {
  const sStart = new Date(`2000-01-01T${session.start_time}`).getTime();
  const sEnd = sStart + (session.duration_hours * 60 * 60 * 1000);
  const nStart = new Date(`2000-01-01T${newTime.start_time}`).getTime();
  const nEnd = nStart + (newTime.duration_hours * 60 * 60 * 1000);
  return nStart < sEnd && nEnd > sStart;
};

export const calculateFacultyLoad = (sessions, faculty) => {
  const weeklyHours = sessions.reduce((sum, s) => sum + s.duration_hours, 0);
  const maxHours = faculty.max_weekly_hours;
  const utilization = (weeklyHours / maxHours) * 100;

  let status = 'green';
  if (utilization > 100) status = 'red';
  else if (utilization > 80) status = 'amber';

  return { weeklyHours, maxHours, utilization, status };
};
