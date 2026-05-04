const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function addSampleData() {
  try {
    console.log('Adding sample departments...');
    
    // Add departments
    const { data: depts, error: deptError } = await supabase
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
        },
        {
          name: 'Business Administration',
          code: 'BA',
          head: 'Prof. Brown',
          description: 'Department of Business Administration'
        }
      ])
      .select();

    if (deptError) {
      console.error('Department error:', deptError.message);
    } else {
      console.log('✅ Departments added:', depts.length);
    }

    // Get first department for programme creation
    const { data: allDepts } = await supabase
      .from('departments')
      .select('id')
      .limit(1);

    if (allDepts && allDepts.length > 0) {
      const deptId = allDepts[0].id;

      console.log('Adding sample programmes...');
      const { data: progs, error: progError } = await supabase
        .from('programmes')
        .insert([
          {
            name: 'Bachelor of Science in Computer Science',
            code: 'BSC-CS',
            dept_id: deptId,
            group_label: 'Group A',
            start_date: '2026-05-01',
            end_date: '2026-12-31',
            total_weeks: 30,
            allotted_hours: 120,
            status: 'Active'
          },
          {
            name: 'Bachelor of Science in Information Technology',
            code: 'BSC-IT',
            dept_id: deptId,
            group_label: 'Group B',
            start_date: '2026-05-01',
            end_date: '2026-12-31',
            total_weeks: 30,
            allotted_hours: 120,
            status: 'Active'
          }
        ])
        .select();

      if (progError) {
        console.error('Programme error:', progError.message);
      } else {
        console.log('✅ Programmes added:', progs.length);
      }
    }

    console.log('Adding sample modules...');
    const { data: mods, error: modError } = await supabase
      .from('modules')
      .insert([
        {
          name: 'Data Structures',
          code: 'CS201',
          level: 'Level 4',
          default_hours: 30,
          type: 'Lecture',
          description: 'Fundamental data structures and algorithms'
        },
        {
          name: 'Database Management',
          code: 'CS202',
          level: 'Level 4',
          default_hours: 25,
          type: 'Lecture',
          description: 'Relational and NoSQL databases'
        },
        {
          name: 'Web Development',
          code: 'CS203',
          level: 'Level 4',
          default_hours: 35,
          type: 'Lab',
          description: 'Full-stack web development'
        },
        {
          name: 'Software Engineering',
          code: 'CS204',
          level: 'Level 5',
          default_hours: 40,
          type: 'Workshop',
          description: 'Software development methodologies'
        }
      ])
      .select();

    if (modError) {
      console.error('Module error:', modError.message);
    } else {
      console.log('✅ Modules added:', mods.length);
    }

    console.log('Adding sample faculty...');
    const { data: faculty, error: facError } = await supabase
      .from('faculty')
      .insert([
        {
          name: 'Dr. Sarah Johnson',
          staff_id: 'FAC001',
          qualification_level: 'Level 6',
          max_weekly_hours: 40,
          email: 'sarah.johnson@university.edu',
          phone: '+1-555-0101',
          status: 'Active'
        },
        {
          name: 'Prof. Michael Smith',
          staff_id: 'FAC002',
          qualification_level: 'Level 6',
          max_weekly_hours: 40,
          email: 'michael.smith@university.edu',
          phone: '+1-555-0102',
          status: 'Active'
        },
        {
          name: 'Dr. Emily Brown',
          staff_id: 'FAC003',
          qualification_level: 'Level 5',
          max_weekly_hours: 35,
          email: 'emily.brown@university.edu',
          phone: '+1-555-0103',
          status: 'Active'
        }
      ])
      .select();

    if (facError) {
      console.error('Faculty error:', facError.message);
    } else {
      console.log('✅ Faculty members added:', faculty.length);
    }

    console.log('Adding sample rooms...');
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .insert([
        {
          name: 'Lecture Hall A',
          code: 'LH-A',
          capacity: 100,
          type: 'Lecture Hall',
          floor: '1st Floor',
          building: 'Main Building'
        },
        {
          name: 'Lecture Hall B',
          code: 'LH-B',
          capacity: 80,
          type: 'Lecture Hall',
          floor: '1st Floor',
          building: 'Main Building'
        },
        {
          name: 'Lab 1',
          code: 'LAB-1',
          capacity: 30,
          type: 'Lab',
          floor: '2nd Floor',
          building: 'Science Building'
        },
        {
          name: 'Lab 2',
          code: 'LAB-2',
          capacity: 30,
          type: 'Lab',
          floor: '2nd Floor',
          building: 'Science Building'
        },
        {
          name: 'Workshop Room',
          code: 'WR-1',
          capacity: 25,
          type: 'Workshop',
          floor: '3rd Floor',
          building: 'Engineering Building'
        }
      ])
      .select();

    if (roomError) {
      console.error('Room error:', roomError.message);
    } else {
      console.log('✅ Rooms added:', rooms.length);
    }

    console.log('Assigning modules to programmes...');
    
    // Fetch all programmes and modules
    const { data: allProgs } = await supabase.from('programmes').select('id');
    const { data: allMods } = await supabase.from('modules').select('id');

    if (allProgs && allProgs.length > 0 && allMods && allMods.length > 0) {
      // Create programme-module assignments
      const progModules = [];
      
      // Assign first 4 modules to first programme
      for (let i = 0; i < Math.min(4, allMods.length); i++) {
        progModules.push({
          programme_id: allProgs[0].id,
          module_id: allMods[i].id,
          allocated_hours: 30,
          weekly_target_hours: 3
        });
      }

      // Assign remaining modules to second programme (if it exists)
      if (allProgs.length > 1) {
        for (let i = 4; i < allMods.length && i < 8; i++) {
          progModules.push({
            programme_id: allProgs[1].id,
            module_id: allMods[i].id,
            allocated_hours: 30,
            weekly_target_hours: 3
          });
        }
      }

      if (progModules.length > 0) {
        const { data: pmData, error: pmError } = await supabase
          .from('programme_modules')
          .insert(progModules)
          .select();

        if (pmError) {
          console.error('Programme-Module error:', pmError.message);
        } else {
          console.log('✅ Programme-Module assignments added:', pmData.length);
        }
      }
    }

    console.log('Assigning faculty to modules...');
    
    // Fetch all faculty and modules
    const { data: allFac } = await supabase.from('faculty').select('id').limit(3);
    const { data: allModules } = await supabase.from('modules').select('id');

    if (allFac && allFac.length > 0 && allModules && allModules.length > 0) {
      // Create faculty-module assignments
      const facModules = [];
      
      // Assign each faculty to multiple modules
      allFac.forEach((fac, facIdx) => {
        for (let i = 0; i < Math.min(2, allModules.length); i++) {
          const moduleIdx = (facIdx * 2 + i) % allModules.length;
          facModules.push({
            faculty_id: fac.id,
            module_id: allModules[moduleIdx].id,
            expertise_level: 'Standard'
          });
        }
      });

      if (facModules.length > 0) {
        const { data: fmData, error: fmError } = await supabase
          .from('faculty_modules')
          .insert(facModules)
          .select();

        if (fmError) {
          console.error('Faculty-Module error:', fmError.message);
        } else {
          console.log('✅ Faculty-Module assignments added:', fmData.length);
        }
      }
    }

    console.log('\n🎉 Sample data added successfully!');

  } catch (error) {
    console.error('Error:', error);
  }
}

addSampleData();
