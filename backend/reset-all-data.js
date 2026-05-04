const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function resetAllData() {
  try {
    console.log('⚠️  Starting fresh data setup...\n');

    // Delete all data in correct order (respecting foreign keys)
    console.log('Cleaning up old data...');
    
    try { await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('conflicts').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('faculty_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('faculty_availability').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('faculty_leave').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('programme_modules').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('faculty').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('modules').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('programmes').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}
    try { await supabase.from('departments').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch (e) {}

    console.log('✅ Old data cleaned\n');

    // ===== DEPARTMENTS =====
    console.log('📚 Creating departments...');
    const { data: depts } = await supabase
      .from('departments')
      .insert([
        {
          name: 'Computer Science',
          code: 'CS',
          head: 'Dr. Johnson',
          description: 'Department of Computer Science and Engineering'
        },
        {
          name: 'Information Technology',
          code: 'IT',
          head: 'Prof. Smith',
          description: 'Department of Information Technology'
        },
        {
          name: 'Software Engineering',
          code: 'SE',
          head: 'Dr. Williams',
          description: 'Department of Software Engineering'
        }
      ])
      .select();
    console.log(`✅ Created ${depts.length} departments\n`);

    // ===== PROGRAMMES =====
    console.log('🎓 Creating programmes...');
    const { data: progs } = await supabase
      .from('programmes')
      .insert([
        {
          name: 'Bachelor of Science in Computer Science',
          code: 'BSC-CS',
          dept_id: depts[0].id,
          group_label: 'Group A',
          start_date: '2026-05-01',
          end_date: '2026-12-31',
          total_weeks: 30,
          allotted_hours: 150,
          status: 'Active'
        },
        {
          name: 'Bachelor of Science in Information Technology',
          code: 'BSC-IT',
          dept_id: depts[1].id,
          group_label: 'Group B',
          start_date: '2026-05-01',
          end_date: '2026-12-31',
          total_weeks: 30,
          allotted_hours: 150,
          status: 'Active'
        },
        {
          name: 'Master of Science in Software Engineering',
          code: 'MSC-SE',
          dept_id: depts[2].id,
          group_label: 'Group C',
          start_date: '2026-05-01',
          end_date: '2026-12-31',
          total_weeks: 30,
          allotted_hours: 120,
          status: 'Active'
        }
      ])
      .select();
    console.log(`✅ Created ${progs.length} programmes\n`);

    // ===== MODULES =====
    console.log('📖 Creating modules...');
    const { data: mods, error: modError } = await supabase
      .from('modules')
      .insert([
        { name: 'Data Structures', code: 'CS201', level: 'Level 4', default_hours: 30, type: 'Lecture', description: 'Fundamental data structures and algorithms' },
        { name: 'Database Management', code: 'CS202', level: 'Level 4', default_hours: 30, type: 'Lecture', description: 'Relational and NoSQL databases' },
        { name: 'Web Development', code: 'CS203', level: 'Level 4', default_hours: 30, type: 'Lab', description: 'Full-stack web development' },
        { name: 'Software Engineering', code: 'CS204', level: 'Level 5', default_hours: 30, type: 'Workshop', description: 'Software development methodologies' },
        { name: 'Artificial Intelligence', code: 'CS301', level: 'Level 5', default_hours: 30, type: 'Lecture', description: 'AI and Machine Learning basics' },
        { name: 'Cloud Computing', code: 'IT301', level: 'Level 5', default_hours: 30, type: 'Lab', description: 'Cloud platforms and services' },
        { name: 'Cybersecurity', code: 'IT302', level: 'Level 5', default_hours: 30, type: 'Lecture', description: 'Network security and encryption' },
        { name: 'Advanced Algorithms', code: 'SE401', level: 'Level 6', default_hours: 30, type: 'Workshop', description: 'Advanced algorithmic techniques' }
      ])
      .select();
    
    if (modError) {
      console.error('Module error:', modError.message);
      throw new Error('Failed to create modules: ' + modError.message);
    }
    console.log(`✅ Created ${mods?.length || 0} modules\n`);

    // ===== FACULTY =====
    console.log('👨‍🏫 Creating faculty...');
    const { data: faculty } = await supabase
      .from('faculty')
      .insert([
        {
          name: 'Dr. Sarah Johnson',
          staff_id: 'FAC001',
          dept_id: depts[0].id,
          max_weekly_hours: 40,
          email: 'sarah.johnson@university.edu',
          phone: '+1-555-0101',
          status: 'Active',
          notes: 'Specializes in Data Structures and Algorithms'
        },
        {
          name: 'Prof. Michael Smith',
          staff_id: 'FAC002',
          dept_id: depts[0].id,
          max_weekly_hours: 40,
          email: 'michael.smith@university.edu',
          phone: '+1-555-0102',
          status: 'Active',
          notes: 'Expert in Database Systems'
        },
        {
          name: 'Dr. Emily Brown',
          staff_id: 'FAC003',
          dept_id: depts[1].id,
          max_weekly_hours: 35,
          email: 'emily.brown@university.edu',
          phone: '+1-555-0103',
          status: 'Active',
          notes: 'Specializes in Web Technologies'
        },
        {
          name: 'Prof. Ahmed Hassan',
          staff_id: 'FAC004',
          dept_id: depts[1].id,
          max_weekly_hours: 40,
          email: 'ahmed.hassan@university.edu',
          phone: '+1-555-0104',
          status: 'Active',
          notes: 'Expert in Cloud Computing'
        },
        {
          name: 'Dr. Lisa Chen',
          staff_id: 'FAC005',
          dept_id: depts[2].id,
          max_weekly_hours: 38,
          email: 'lisa.chen@university.edu',
          phone: '+1-555-0105',
          status: 'Active',
          notes: 'AI and Machine Learning specialist'
        },
        {
          name: 'Dr. James Wilson',
          staff_id: 'FAC006',
          dept_id: depts[2].id,
          max_weekly_hours: 40,
          email: 'james.wilson@university.edu',
          phone: '+1-555-0106',
          status: 'Active',
          notes: 'Cybersecurity expert'
        }
      ])
      .select();
    console.log(`✅ Created ${faculty.length} faculty members\n`);

    // ===== ROOMS =====
    console.log('🏫 Creating rooms...');
    const { data: rooms } = await supabase
      .from('rooms')
      .insert([
        { name: 'Lecture Hall A', code: 'LH-A', capacity: 100, type: 'Lecture Hall', floor: '1st Floor', building: 'Main Building' },
        { name: 'Lecture Hall B', code: 'LH-B', capacity: 80, type: 'Lecture Hall', floor: '1st Floor', building: 'Main Building' },
        { name: 'Lecture Hall C', code: 'LH-C', capacity: 60, type: 'Lecture Hall', floor: '2nd Floor', building: 'Main Building' },
        { name: 'Lab 1', code: 'LAB-1', capacity: 30, type: 'Lab', floor: '2nd Floor', building: 'Science Building' },
        { name: 'Lab 2', code: 'LAB-2', capacity: 30, type: 'Lab', floor: '2nd Floor', building: 'Science Building' },
        { name: 'Workshop Room', code: 'WR-1', capacity: 25, type: 'Workshop', floor: '3rd Floor', building: 'Engineering Building' },
        { name: 'Computer Lab', code: 'CL-1', capacity: 40, type: 'Lab', floor: '3rd Floor', building: 'IT Building' }
      ])
      .select();
    console.log(`✅ Created ${rooms.length} rooms\n`);

    // ===== PROGRAMME-MODULE ASSIGNMENTS =====
    console.log('🔗 Assigning modules to programmes...');
    const progModules = [
      // BSC-CS gets modules 0, 1, 2, 3
      { programme_id: progs[0].id, module_id: mods[0].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[0].id, module_id: mods[1].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[0].id, module_id: mods[2].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[0].id, module_id: mods[3].id, allocated_hours: 30, weekly_target_hours: 3 },
      // BSC-IT gets modules 1, 2, 5, 6
      { programme_id: progs[1].id, module_id: mods[1].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[1].id, module_id: mods[2].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[1].id, module_id: mods[5].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[1].id, module_id: mods[6].id, allocated_hours: 30, weekly_target_hours: 3 },
      // MSC-SE gets modules 4, 7
      { programme_id: progs[2].id, module_id: mods[4].id, allocated_hours: 30, weekly_target_hours: 3 },
      { programme_id: progs[2].id, module_id: mods[7].id, allocated_hours: 30, weekly_target_hours: 3 }
    ];
    const { data: pmData } = await supabase.from('programme_modules').insert(progModules).select();
    console.log(`✅ Created ${pmData.length} programme-module assignments\n`);

    // ===== FACULTY-MODULE ASSIGNMENTS =====
    console.log('👨‍💼 Assigning modules to faculty...');
    const facModules = [
      // Dr. Sarah Johnson → Data Structures, Advanced Algorithms
      { faculty_id: faculty[0].id, module_id: mods[0].id, expertise_level: 'Expert' },
      { faculty_id: faculty[0].id, module_id: mods[7].id, expertise_level: 'Standard' },
      // Prof. Michael Smith → Database Management, Cloud Computing
      { faculty_id: faculty[1].id, module_id: mods[1].id, expertise_level: 'Expert' },
      { faculty_id: faculty[1].id, module_id: mods[5].id, expertise_level: 'Standard' },
      // Dr. Emily Brown → Web Development, Software Engineering
      { faculty_id: faculty[2].id, module_id: mods[2].id, expertise_level: 'Expert' },
      { faculty_id: faculty[2].id, module_id: mods[3].id, expertise_level: 'Standard' },
      // Prof. Ahmed Hassan → Cloud Computing, Cybersecurity
      { faculty_id: faculty[3].id, module_id: mods[5].id, expertise_level: 'Expert' },
      { faculty_id: faculty[3].id, module_id: mods[6].id, expertise_level: 'Standard' },
      // Dr. Lisa Chen → AI, Advanced Algorithms
      { faculty_id: faculty[4].id, module_id: mods[4].id, expertise_level: 'Expert' },
      { faculty_id: faculty[4].id, module_id: mods[7].id, expertise_level: 'Expert' },
      // Dr. James Wilson → Cybersecurity, Software Engineering
      { faculty_id: faculty[5].id, module_id: mods[6].id, expertise_level: 'Expert' },
      { faculty_id: faculty[5].id, module_id: mods[3].id, expertise_level: 'Standard' }
    ];
    const { data: fmData } = await supabase.from('faculty_modules').insert(facModules).select();
    console.log(`✅ Created ${fmData.length} faculty-module assignments\n`);

    // ===== FACULTY AVAILABILITY =====
    console.log('📅 Adding faculty availability (Monday-Friday, 9am-5pm)...');
    let availabilityCount = 0;
    for (const fac of faculty) {
      for (let day = 1; day <= 5; day++) { // Monday to Friday
        const { error } = await supabase.from('faculty_availability').insert({
          faculty_id: fac.id,
          day_of_week: day,
          start_time: '09:00',
          end_time: '17:00'
        });
        if (!error) availabilityCount++;
      }
    }
    console.log(`✅ Created ${availabilityCount} availability records\n`);

    console.log('═════════════════════════════════════════');
    console.log('🎉 SAMPLE DATA CREATED SUCCESSFULLY!');
    console.log('═════════════════════════════════════════\n');
    console.log('📊 Summary:');
    console.log(`   • ${depts.length} Departments`);
    console.log(`   • ${progs.length} Programmes`);
    console.log(`   • ${mods.length} Modules`);
    console.log(`   • ${faculty.length} Faculty Members`);
    console.log(`   • ${rooms.length} Rooms`);
    console.log(`   • ${pmData.length} Programme-Module Assignments`);
    console.log(`   • ${fmData.length} Faculty-Module Assignments`);
    console.log(`   • ${availabilityCount} Availability Records\n`);
    console.log('✅ Ready for testing!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

resetAllData();
