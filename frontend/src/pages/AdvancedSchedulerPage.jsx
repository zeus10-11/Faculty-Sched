import React, { useState, useEffect } from 'react'
import { programmeService, moduleService, facultyService, sessionService, programmeModuleService, facultyModuleService } from '../services/api'
import api from '../services/api'
import { Calendar, BookOpen, Users, Send, Download, AlertCircle } from 'lucide-react'
import * as XLSX from 'xlsx'
import {
  getAcademicWeekOptions,
  getAcademicWeekNumber,
  getWeekStartForAcademicWeek,
  getAcademicWeekLabel
} from '../utils/academicWeeks'

/** Format date as YYYY-MM-DD using local timezone (avoids UTC shift from toISOString) */
const formatLocalDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function AdvancedSchedulerPage() {
  // State
  const [step, setStep] = useState(1) // 1: Date Range, 2: Programme, 3: Module, 4: Review/Generate
  const [loading, setLoading] = useState(false)
  const [programmes, setProgrammes] = useState([])
  const [modules, setModules] = useState([])
  const [faculty, setFaculty] = useState([])
  const [generatedSchedule, setGeneratedSchedule] = useState([])

  // Form data
  const [weekRange, setWeekRange] = useState({ startWeek: '', endWeek: '' })
  const weekOptions = getAcademicWeekOptions()
  const [selectedProgramme, setSelectedProgramme] = useState(null)
  const [selectedModule, setSelectedModule] = useState(null)
  const [programmeSessions, setProgrammeSessions] = useState([])
  const [sectionsPerWeek, setSectionsPerWeek] = useState(6)
  const [sectionsPerDay, setSectionsPerDay] = useState(1)

  const MAX_SECTIONS_PER_DAY = 5
  const HOURS_PER_SECTION = 1.5
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [progRes, modRes, facRes] = await Promise.all([
        programmeService.getAll(),
        moduleService.getAll(),
        facultyService.getAll()
      ])
      setProgrammes(progRes.data || [])
      setModules(modRes.data || [])
      setFaculty(facRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const calculateWeeks = (start, end) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const weeks = Math.ceil((endDate - startDate) / (7 * 24 * 60 * 60 * 1000))
    return weeks
  }

  const handleReset = () => {
    setStep(1)
    setWeekRange({ startWeek: '', endWeek: '' })
    setSelectedProgramme(null)
    setSelectedModule(null)
    setSectionsPerWeek(6)
    setSectionsPerDay(1)
    setGeneratedSchedule([])
    setLoading(false)
  }

  /** Fisher-Yates shuffle (in-place) */
  const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  const handleGenerateSchedule = async () => {
    if (!selectedProgramme || !selectedModule || !weekRange.startWeek || !weekRange.endWeek) {
      alert('Please select all required fields')
      return
    }
    if (Number(weekRange.endWeek) < Number(weekRange.startWeek)) {
      alert('End week must be greater than or equal to start week')
      return
    }
    if (sectionsPerDay * 5 < sectionsPerWeek) {
      alert(`Cannot fit ${sectionsPerWeek} sections/week with max ${sectionsPerDay}/day (only ${sectionsPerDay * 5} slots available Mon–Fri)`)
      return
    }

    setLoading(true)
    try {
      // Convert week numbers to actual dates
      const startWeekNum = Number(weekRange.startWeek)
      const endWeekNum = Number(weekRange.endWeek)

      // Fetch unavailable periods
      let unavailablePeriods = []
      try {
        const res = await api.get('/unavailable-periods')
        unavailablePeriods = res.data || []
      } catch (error) {
        console.log('Could not fetch unavailable periods')
        unavailablePeriods = []
      }

      // Fetch faculty assigned to this module
      let moduleAssignments = []
      try {
        const res = await facultyModuleService.getByModule(selectedModule.id)
        moduleAssignments = res.data || []
      } catch (error) {
        console.log('No faculty assignments found for this module yet')
        moduleAssignments = []
      }

      let availableFaculty = moduleAssignments.map(ma => ma.faculty)
      if (availableFaculty.length === 0) {
        availableFaculty = faculty.filter(f => f.status === 'Active')
        if (availableFaculty.length === 0) {
          alert('No faculty available to schedule. Please add faculty members first.')
          setLoading(false)
          return
        }
      }

      const schedule = []
      let facultyRotationIndex = 0

      // Process each week independently
      for (let weekNum = startWeekNum; weekNum <= endWeekNum; weekNum++) {
        const weekStart = getWeekStartForAcademicWeek(weekNum)

        // Build all possible slots for this week: 5 weekdays × MAX_SECTIONS_PER_DAY sections
        const allSlots = []
        for (let dayOffset = 0; dayOffset < 5; dayOffset++) { // Mon=0 .. Fri=4
          const slotDate = new Date(weekStart)
          slotDate.setDate(weekStart.getDate() + dayOffset)
          const dayOfWeek = slotDate.getDay() // 1=Mon .. 5=Fri

          for (let section = 1; section <= MAX_SECTIONS_PER_DAY; section++) {
            // Skip unavailable slots
            const isUnavailable = unavailablePeriods.some(p =>
              p.day_of_week === dayOfWeek && p.section_number === section
            )
            if (isUnavailable) continue

            allSlots.push({
              date: formatLocalDate(slotDate),
              dayOffset,
              section,
              startTime: `${9 + (section - 1) * 2}:00`
            })
          }
        }

        // Shuffle slots randomly
        shuffleArray(allSlots)

        // Pick slots respecting sectionsPerWeek and sectionsPerDay limits
        const pickedSlots = []
        const dayCount = {} // track how many picked per day

        for (const slot of allSlots) {
          if (pickedSlots.length >= sectionsPerWeek) break

          const dayUsed = dayCount[slot.dayOffset] || 0
          if (dayUsed >= sectionsPerDay) continue

          pickedSlots.push(slot)
          dayCount[slot.dayOffset] = dayUsed + 1
        }

        // Sort picked slots by date then section for clean output
        pickedSlots.sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date)
          return a.section - b.section
        })

        // Create sessions from picked slots
        for (const slot of pickedSlots) {
          // Find available faculty (rotation with conflict check)
          let sessionFaculty = null
          let attemptCount = 0
          const timeKey = `${slot.date}-${slot.startTime}`

          while (sessionFaculty === null && attemptCount < availableFaculty.length) {
            const candidate = availableFaculty[facultyRotationIndex % availableFaculty.length]
            // Check this faculty isn't already scheduled at this exact time
            const alreadyBooked = schedule.some(s =>
              s.faculty_id === candidate.id &&
              s.session_date === slot.date &&
              s.section_number === slot.section
            )
            if (!alreadyBooked) {
              sessionFaculty = candidate
              break
            }
            facultyRotationIndex++
            attemptCount++
          }

          if (!sessionFaculty) {
            console.warn(`No faculty available for ${slot.date} Section ${slot.section}`)
            continue
          }

          schedule.push({
            programme_id: selectedProgramme.id,
            module_id: selectedModule.id,
            faculty_id: sessionFaculty.id,
            faculty_name: sessionFaculty.name,
            session_date: slot.date,
            start_time: slot.startTime,
            duration_hours: HOURS_PER_SECTION,
            session_type: 'Lecture',
            section_number: slot.section,
            academic_week: weekNum,
            is_extra: false,
            room_id: null,
            notes: `${selectedModule.name} - Section ${slot.section}`
          })

          facultyRotationIndex++
        }
      }

      if (schedule.length === 0) {
        alert('❌ Could not generate schedule - no available slots found')
        setLoading(false)
        return
      }

      alert(`✅ Schedule generated: ${schedule.length} sessions randomly distributed across ${endWeekNum - startWeekNum + 1} week(s)!`)
      setGeneratedSchedule(schedule)
      setStep(4)
    } catch (error) {
      console.error('Error generating schedule:', error)
      alert('Error generating schedule: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSchedule = async () => {
    setLoading(true)
    let successCount = 0
    let failedCount = 0
    const errors = []

    try {
      for (let i = 0; i < generatedSchedule.length; i++) {
        try {
          const session = generatedSchedule[i]
          // Convert duration_hours to integer for database
          const sessionData = {
            ...session,
            duration_hours: Math.round(session.duration_hours)
          }
          // Remove frontend-only fields
          delete sessionData.faculty_name
          delete sessionData.academic_week
          
          await sessionService.create(sessionData)
          successCount++
        } catch (error) {
          failedCount++
          errors.push(`Session ${i + 1}: ${error.response?.data?.error || error.message}`)
        }
      }

      if (failedCount === 0) {
        alert(`✅ Successfully scheduled ${successCount} sessions!`)
        setGeneratedSchedule([])
        setStep(1)
        setWeekRange({ startWeek: '', endWeek: '' })
        setSelectedProgramme(null)
        setSelectedModule(null)
        setSectionsPerWeek(6)
        setSectionsPerDay(1)
      } else {
        alert(`⚠️ Saved ${successCount} sessions, but ${failedCount} failed:\n\n${errors.slice(0, 5).join('\n')}`)
      }
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error saving schedule: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (generatedSchedule.length === 0) {
      alert('No schedule to export')
      return
    }

    try {
      // Group by date for better visualization
      const scheduleByDate = {}
      generatedSchedule.forEach(session => {
        if (!scheduleByDate[session.session_date]) {
          scheduleByDate[session.session_date] = []
        }
        scheduleByDate[session.session_date].push(session)
      })

      // Create worksheet data
      const worksheetData = []
      
      // Add title
      worksheetData.push([`${selectedModule.name} - Timetable Schedule`])
      worksheetData.push([`Programme: ${selectedProgramme.name}`])
      worksheetData.push([`Weeks: ${getAcademicWeekLabel(Number(weekRange.startWeek))} to ${getAcademicWeekLabel(Number(weekRange.endWeek))}`])
      worksheetData.push([`Generated: ${new Date().toLocaleString()}`])
      worksheetData.push([])
      
      // Add headers
      worksheetData.push(['Acad. Week', 'Date', 'Day', 'Section', 'Module', 'Code', 'Faculty', 'Duration (hrs)'])
      
      // Add data rows
      Object.keys(scheduleByDate).sort().forEach(date => {
        scheduleByDate[date].forEach(session => {
          const dateObj = new Date(session.session_date)
          const dayName = DAYS_OF_WEEK[dateObj.getDay() - 1] || 'Unknown'
          const moduleData = modules.find(m => m.id === session.module_id)
          
          worksheetData.push([
            `Week ${session.academic_week || getAcademicWeekNumber(new Date(session.session_date))}`,
            date,
            dayName,
            `Section ${session.section_number}`,
            moduleData?.name || 'N/A',
            moduleData?.code || 'N/A',
            session.faculty_name,
            session.duration_hours
          ])
        })
      })

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
      
      // Set column widths
      ws['!cols'] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 25 },
        { wch: 10 },
        { wch: 20 },
        { wch: 12 }
      ]
      
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Schedule')
      
      // Download
      XLSX.writeFile(wb, `schedule_${selectedModule.code}_${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      alert('Error exporting to Excel, using CSV fallback')
      handleExportCSV()
    }
  }

  const handleExportCSV = () => {
    if (generatedSchedule.length === 0) {
      alert('No schedule to export')
      return
    }

    // Create CSV content
    let csv = 'Date,Day,Section,Module,Code,Faculty,Time,Duration (hrs)\n'
    
    generatedSchedule.forEach(session => {
      const date = new Date(session.session_date)
      const dayName = DAYS_OF_WEEK[date.getDay() - 1] || 'Unknown'
      const moduleData = modules.find(m => m.id === session.module_id)
      
      csv += `${session.session_date},${dayName},${session.section_number},"${moduleData?.name}","${moduleData?.code}","${session.faculty_name}",${session.start_time},${session.duration_hours}\n`
    })

    // Download CSV
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv))
    element.setAttribute('download', `schedule_${selectedModule.code}_${new Date().toISOString().split('T')[0]}.csv`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleGenerateComprehensiveExcel = () => {
    if (generatedSchedule.length === 0) {
      alert('No schedule to export')
      return
    }

    try {
      // Get unique dates and sort them
      const uniqueDates = [...new Set(generatedSchedule.map(s => s.session_date))].sort()
      
      // Get unique faculty
      const uniqueFaculty = [...new Set(generatedSchedule.map(s => s.faculty_id))]
      const facultyMap = {}
      faculty.forEach(f => { facultyMap[f.id] = f.name })

      // Color scheme for sessions (RGBA format for XLSX)
      const colorMap = {
        '9:00': 'FFE699',   // Yellow
        '11:00': 'C5D9F1',  // Light Blue
        '13:00': 'E2EFDA',  // Light Green
        '15:00': 'FCE4D6',  // Light Orange
        '17:00': 'F4B084'   // Dark Orange
      }

      // Create workbook structure
      const worksheetData = []

      // Add title section
      worksheetData.push([`${selectedModule.name} - Comprehensive Timetable`])
      worksheetData.push([`Programme: ${selectedProgramme.name} | Weeks: ${getAcademicWeekLabel(Number(weekRange.startWeek))} to ${getAcademicWeekLabel(Number(weekRange.endWeek))}`])
      worksheetData.push([])

      // Create header row with dates and academic week numbers
      const headerRow = ['Section']
      uniqueDates.forEach(date => {
        const dateObj = new Date(date)
        const dayName = DAYS_OF_WEEK[dateObj.getDay() - 1]
        const wk = getAcademicWeekNumber(dateObj)
        headerRow.push(`Wk${wk} ${dayName}\n${date}`)
      })
      worksheetData.push(headerRow)

      // Create rows for each section (1-5)
      for (let section = 1; section <= MAX_SECTIONS_PER_DAY; section++) {
        const sectionRow = [`Section ${section}`]
        uniqueDates.forEach(date => {
          const session = generatedSchedule.find(s =>
            s.session_date === date &&
            s.section_number === section
          )
          if (session) {
            const facultyName = facultyMap[session.faculty_id] || 'N/A'
            const moduleCode = modules.find(m => m.id === session.module_id)?.code || 'N/A'
            sectionRow.push(`${facultyName}\n${moduleCode}`)
          } else {
            sectionRow.push('')
          }
        })
        worksheetData.push(sectionRow)
      }

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)

      // Apply styling
      const columnWidth = 18
      const columnWidths = [{ wch: 12 }]
      for (let i = 0; i < uniqueDates.length; i++) {
        columnWidths.push({ wch: columnWidth })
      }
      ws['!cols'] = columnWidths

      // Set row heights
      ws['!rows'] = []
      for (let i = 0; i < worksheetData.length; i++) {
        ws['!rows'][i] = { hpt: i === 3 ? 35 : (i === 0 ? 25 : 30) }
      }

      // Apply cell colors and formatting
      Object.keys(ws).forEach(cell => {
        if (cell.startsWith('!')) return
        
        const cellRef = XLSX.utils.decode_cell(cell)
        const rowNum = cellRef.r
        const colNum = cellRef.c

        // Header formatting
        if (rowNum === 3) {
          ws[cell].fill = { fgColor: { rgb: 'FF4472C4' } }
          ws[cell].font = { bold: true, color: { rgb: 'FFFFFFFF' } }
          ws[cell].alignment = { horizontal: 'center', vertical: 'center', wrapText: true }
        }

        // Time column formatting
        if (colNum === 0 && rowNum > 3) {
          ws[cell].fill = { fgColor: { rgb: 'FFD9E8F5' } }
          ws[cell].font = { bold: true }
          ws[cell].alignment = { horizontal: 'center', vertical: 'center' }
        }

        // Data cell coloring based on start time
        if (rowNum > 3 && colNum > 0) {
          const startTimeCell = ws[XLSX.utils.encode_cell({ r: rowNum, c: 0 })]
          const startTime = startTimeCell?.v || ''
          
          let bgColor = 'FFFFFFFF'
          if (startTime === '9:00') bgColor = 'FFFFE699'
          else if (startTime === '11:00') bgColor = 'FFC5D9F1'
          else if (startTime === '13:00') bgColor = 'FFE2EFDA'
          else if (startTime === '15:00') bgColor = 'FFFCE4D6'
          else if (startTime === '17:00') bgColor = 'FFF4B084'

          ws[cell].fill = { fgColor: { rgb: bgColor } }
          ws[cell].alignment = { horizontal: 'center', vertical: 'center', wrapText: true }
          ws[cell].border = {
            left: { style: 'thin' },
            right: { style: 'thin' },
            top: { style: 'thin' },
            bottom: { style: 'thin' }
          }
        }
      })

      // Create workbook and write file
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Timetable')

      const fileName = `comprehensive_timetable_${selectedModule.code}_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      alert(`✅ Comprehensive timetable exported successfully!`)
    } catch (error) {
      console.error('Error generating comprehensive Excel:', error)
      alert('Error generating comprehensive Excel: ' + error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Advanced Scheduler</h1>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
        >
          Reset
        </button>
        <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
          <span className={`px-3 py-1 rounded ${step >= 1 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
            1. Date Range
          </span>
          <span className={`px-3 py-1 rounded ${step >= 2 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
            2. Programme
          </span>
          <span className={`px-3 py-1 rounded ${step >= 3 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
            3. Module
          </span>
          <span className={`px-3 py-1 rounded ${step >= 4 ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-700'}`}>
            4. Review
          </span>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Step 1: Week Range */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-6">
              <Calendar className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Week Range</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose academic weeks (Aug–Jul academic year)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Week</label>
                <select
                  value={weekRange.startWeek}
                  onChange={(e) => setWeekRange({ ...weekRange, startWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Select start week --</option>
                  {weekOptions.map(w => (
                    <option key={w.weekNum} value={w.weekNum}>{w.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Week</label>
                <select
                  value={weekRange.endWeek}
                  onChange={(e) => setWeekRange({ ...weekRange, endWeek: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">-- Select end week --</option>
                  {weekOptions
                    .filter(w => !weekRange.startWeek || w.weekNum >= Number(weekRange.startWeek))
                    .map(w => (
                      <option key={w.weekNum} value={w.weekNum}>{w.label}</option>
                    ))}
                </select>
              </div>
            </div>

            {weekRange.startWeek && weekRange.endWeek && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Period:</strong> {getAcademicWeekLabel(Number(weekRange.startWeek))} → {getAcademicWeekLabel(Number(weekRange.endWeek))}<br/>
                  <strong>Total weeks:</strong> {Number(weekRange.endWeek) - Number(weekRange.startWeek) + 1}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                disabled={!weekRange.startWeek || !weekRange.endWeek}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Programme */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-6">
              <BookOpen className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Programme</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose the academic programme</p>
              </div>
            </div>

            <select
              value={selectedProgramme?.id || ''}
              onChange={(e) => {
                const prog = programmes.find(p => p.id === e.target.value)
                setSelectedProgramme(prog)
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
            >
              <option value="">-- Select a programme --</option>
              {programmes.filter(p => p.status === 'Active').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedProgramme}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Module */}
        {step === 3 && selectedProgramme && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-6">
              <BookOpen className="text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Module</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose the module for {selectedProgramme.name}</p>
              </div>
            </div>

            <select
              value={selectedModule?.id || ''}
              onChange={(e) => {
                const mod = modules.find(m => m.id === e.target.value)
                setSelectedModule(mod)
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
            >
              <option value="">-- Select a module --</option>
              {modules.filter(m => m.status !== 'Inactive').map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
              ))}
            </select>

            {selectedModule && (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                  <p className="text-sm text-orange-900 dark:text-orange-200 mb-3">
                    <strong>Module:</strong> {selectedModule.name}<br/>
                    <strong>Session Length:</strong> {HOURS_PER_SECTION} hours
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                        Sections per Week
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="25"
                        value={sectionsPerWeek}
                        onChange={(e) => setSectionsPerWeek(Math.max(1, Math.min(25, Number(e.target.value))))}
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg dark:bg-gray-700 dark:text-white text-center font-bold text-lg"
                      />
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Total sessions across Mon–Fri</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-orange-900 dark:text-orange-200 mb-1">
                        Max Sections per Day
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={sectionsPerDay}
                        onChange={(e) => setSectionsPerDay(Math.max(1, Math.min(5, Number(e.target.value))))}
                        className="w-full px-3 py-2 border border-orange-300 dark:border-orange-600 rounded-lg dark:bg-gray-700 dark:text-white text-center font-bold text-lg"
                      />
                      <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">Cap per single day (1–5)</p>
                    </div>
                  </div>
                </div>

                {sectionsPerDay * 5 < sectionsPerWeek && (
                  <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      ⚠️ Cannot fit <strong>{sectionsPerWeek}</strong> sections/week with max <strong>{sectionsPerDay}</strong>/day
                      (only {sectionsPerDay * 5} slots available Mon–Fri). Increase sections/day or decrease sections/week.
                    </p>
                  </div>
                )}

                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📊 <strong>Distribution:</strong> {sectionsPerWeek} session{sectionsPerWeek > 1 ? 's' : ''}/week,
                    max {sectionsPerDay}/day → randomly spread across {Math.min(5, Math.ceil(sectionsPerWeek / sectionsPerDay))} weekdays.
                    Each week gets a fresh random layout.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleGenerateSchedule}
                disabled={!selectedModule || loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? 'Generating...' : 'Generate Schedule'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {step === 4 && generatedSchedule.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 mb-6">
              <Users className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Schedule</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generated {generatedSchedule.length} sessions - Ready to save</p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <p className="text-sm text-green-900 dark:text-green-200">
                <strong>Schedule Details:</strong><br/>
                Programme: {selectedProgramme?.name}<br/>
                Module: {selectedModule?.name}<br/>
                Weeks: {getAcademicWeekLabel(Number(weekRange.startWeek))} → {getAcademicWeekLabel(Number(weekRange.endWeek))}<br/>
                Sections/Week: {sectionsPerWeek} | Max/Day: {sectionsPerDay}<br/>
                Total Sessions: {generatedSchedule.length} (randomly distributed)
              </p>
            </div>

            <div className="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Acad. Week</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Section</th>
                    <th className="px-4 py-2 text-left">Faculty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {generatedSchedule.slice(0, 10).map((session, idx) => (
                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Wk {session.academic_week}</td>
                      <td className="px-4 py-2">{session.session_date}</td>
                      <td className="px-4 py-2">Section {session.section_number}</td>
                      <td className="px-4 py-2 text-xs">{session.faculty_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {generatedSchedule.length > 10 && (
                <div className="px-4 py-2 text-center text-sm text-gray-600 dark:text-gray-400">
                  ... and {generatedSchedule.length - 10} more sessions
                </div>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStep(3)}
                className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Back
              </button>
              <button
                onClick={handleExportExcel}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Export Excel
              </button>
              <button
                onClick={handleGenerateComprehensiveExcel}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Download size={18} /> Timetable Grid
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                {loading ? 'Saving...' : <>
                  <Send size={18} /> Save Schedule
                </>}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex gap-2 items-start">
          <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={20} />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> Before scheduling, ensure faculty members are assigned to the module. Visit the Modules page to manage faculty assignments.
          </div>
        </div>
      </div>
    </div>
  )
}
