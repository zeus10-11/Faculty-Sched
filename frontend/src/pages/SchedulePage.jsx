import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionService, programmeService, moduleService, facultyService, roomService } from '../services/api'
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Edit2, Trash2, Lock, Unlock, Filter, Download } from 'lucide-react'
import * as XLSX from 'xlsx'
import { getAcademicWeekNumber, getAcademicWeekLabel, getWeekStartForAcademicWeek } from '../utils/academicWeeks'

export default function SchedulePage() {
  const [sessions, setSessions] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [modules, setModules] = useState([])
  const [faculty, setFaculty] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('week')
  const [filters, setFilters] = useState({
    programme: '',
    faculty: '',
    module: '',
    room: ''
  })
  const [selectedSession, setSelectedSession] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sessRes, progRes, modRes, facRes, roomRes] = await Promise.all([
        sessionService.getAll(),
        programmeService.getAll(),
        moduleService.getAll(),
        facultyService.getAll(),
        roomService.getAll()
      ])
      
      setSessions(sessRes.data || [])
      setProgrammes(progRes.data || [])
      setModules(modRes.data || [])
      setFaculty(facRes.data || [])
      setRooms(roomRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredSessions = () => {
    return sessions.filter(s => {
      if (filters.programme && s.programme_id !== filters.programme) return false
      if (filters.faculty && s.faculty_id !== filters.faculty) return false
      if (filters.module && s.module_id !== filters.module) return false
      if (filters.room && s.room_id !== filters.room) return false
      return true
    })
  }

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const getSessionsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return getFilteredSessions().filter(s => s.session_date === dateStr)
  }

  const handleSessionClick = (session) => {
    setSelectedSession(session)
    setShowSessionModal(true)
  }

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return

    try {
      await sessionService.delete(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      setShowSessionModal(false)
      alert('✅ Session deleted successfully')
    } catch (error) {
      alert('❌ Error deleting session: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleResetAllSchedules = async () => {
    if (!window.confirm('⚠️ WARNING: This will DELETE ALL scheduled sessions. This action cannot be undone. Are you sure?')) return
    if (!window.confirm('🔴 FINAL WARNING: This will permanently delete ALL sessions. Click OK to confirm.')) return

    try {
      setLoading(true)
      // Delete all sessions
      for (const session of sessions) {
        try {
          await sessionService.delete(session.id)
        } catch (error) {
          console.error('Error deleting session:', error)
        }
      }
      setSessions([])
      setShowSessionModal(false)
      alert('✅ All sessions have been deleted successfully')
    } catch (error) {
      alert('❌ Error clearing schedule: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleLockSession = async (sessionId, isLocked) => {
    try {
      await sessionService.update(sessionId, { is_locked: !isLocked })
      setSessions(sessions.map(s => s.id === sessionId ? { ...s, is_locked: !isLocked } : s))
      alert(`✅ Session ${!isLocked ? 'locked' : 'unlocked'} successfully`)
    } catch (error) {
      alert('❌ Error: ' + (error.response?.data?.error || error.message))
    }
  }

  const getSessionColor = (sessionType) => {
    const colors = {
      'Lecture': 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border-blue-300',
      'Lab': 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-200 border-green-300',
      'Workshop': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 border-yellow-300',
      'Tutorial': 'bg-purple-100 dark:bg-purple-900 text-purple-900 dark:text-purple-200 border-purple-300',
      'Assessment': 'bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 border-red-300'
    }
    return colors[sessionType] || colors['Lecture']
  }

  const renderSessionCard = (session, isCompact = false) => {
    const prog = programmes.find(p => p.id === session.programme_id)
    const mod = modules.find(m => m.id === session.module_id)
    const fac = faculty.find(f => f.id === session.faculty_id)
    const room = rooms.find(r => r.id === session.room_id)

    return (
      <div
        onClick={() => handleSessionClick(session)}
        className={`${getSessionColor(session.session_type)} border rounded cursor-pointer hover:shadow-md transition p-2 ${
          session.is_locked ? 'border-2 border-dashed' : ''
        }`}
      >
        {session.is_locked && <Lock size={12} className="inline mr-1" />}
        {isCompact ? (
          <>
            <div className="font-bold text-xs truncate">{mod?.code}</div>
            <div className="text-xs truncate">{session.start_time}</div>
          </>
        ) : (
          <>
            <div className="font-semibold text-sm truncate">{mod?.name}</div>
            <div className="text-xs truncate">{fac?.name}</div>
            <div className="text-xs">{session.start_time} ({session.duration_hours}h)</div>
            {room && <div className="text-xs truncate">{room.code}</div>}
          </>
        )}
      </div>
    )
  }

  const SECTIONS = [1, 2, 3, 4, 5]

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentDate)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + i)
      days.push(day)
    }

    const weekNum = getAcademicWeekNumber(weekStart)
    const weekLabel = getAcademicWeekLabel(weekNum)

    return (
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Academic Week Banner */}
          <div className="mb-2 px-2 py-1 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700 rounded-lg flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
              Academic {weekLabel}
            </span>
            <span className="text-xs text-indigo-700 dark:text-indigo-300">Academic Year (Aug – Jul)</span>
          </div>

          {/* Header */}
          <div className="grid gap-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded font-semibold text-xs"></div>
            {days.map((day, idx) => (
              <div key={idx} className="bg-blue-100 dark:bg-blue-900 p-2 rounded font-semibold text-center">
                <div className="text-xs text-gray-600 dark:text-gray-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className="text-lg font-bold">{day.getDate()}</div>
              </div>
            ))}
          </div>

          {/* Section slots */}
          {SECTIONS.map((section) => (
            <div key={section} className="grid gap-1 mt-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
              <div className="bg-gray-50 dark:bg-gray-800 p-2 text-xs font-bold text-center flex items-center justify-center rounded border border-gray-200 dark:border-gray-700">
                Section {section}
              </div>
              {days.map((day, dayIdx) => {
                const daySessions = getSessionsForDate(day).filter(s =>
                  Number(s.section_number) === section
                )
                return (
                  <div key={dayIdx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-1 min-h-20 rounded">
                    <div className="space-y-1">
                      {daySessions.map((s, idx) => (
                        <div key={idx}>{renderSessionCard(s, false)}</div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Fallback row for sessions with no section_number */}
          {(() => {
            const hasUnassigned = days.some(day =>
              getSessionsForDate(day).some(s => !s.section_number && s.section_number !== 0)
            )
            if (!hasUnassigned) return null
            return (
              <div className="grid gap-1 mt-1" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                <div className="bg-orange-50 dark:bg-orange-900/30 p-2 text-xs font-bold text-center flex items-center justify-center rounded border border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                  Unassigned
                </div>
                {days.map((day, dayIdx) => {
                  const daySessions = getSessionsForDate(day).filter(s =>
                    !s.section_number && s.section_number !== 0
                  )
                  return (
                    <div key={dayIdx} className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 p-1 min-h-20 rounded">
                      <div className="space-y-1">
                        {daySessions.map((s, idx) => (
                          <div key={idx}>{renderSessionCard(s, false)}</div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-100 dark:bg-gray-700 p-2 text-center font-semibold text-sm">{day}</div>
          ))}
        </div>
        
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 gap-1">
            {week.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 min-h-32 cursor-pointer hover:shadow-md transition"
              >
                {day && (
                  <>
                    <div className="font-semibold text-sm mb-2">{day.getDate()}</div>
                    <div className="space-y-1">
                      {getSessionsForDate(day).slice(0, 4).map((s, idx) => (
                        <div key={idx} className="text-xs">
                          {renderSessionCard(s, true)}
                        </div>
                      ))}
                      {getSessionsForDate(day).length > 4 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                          +{getSessionsForDate(day).length - 4} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  const renderSessionModal = () => {
    if (!selectedSession) return null

    const prog = programmes.find(p => p.id === selectedSession.programme_id)
    const mod = modules.find(m => m.id === selectedSession.module_id)
    const fac = faculty.find(f => f.id === selectedSession.faculty_id)
    const room = rooms.find(r => r.id === selectedSession.room_id)

    return (
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Session Details</h2>
            <button
              onClick={() => setShowSessionModal(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>

          <div className={`mb-4 p-3 rounded ${getSessionColor(selectedSession.session_type)}`}>
            <div className="font-bold text-lg">{mod?.name}</div>
            <div className="text-sm font-semibold mt-1">{selectedSession.session_type}</div>
          </div>

          <div className="space-y-3 mb-6">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Programme</p>
              <p className="font-semibold text-gray-900 dark:text-white">{prog?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Faculty</p>
              <p className="font-semibold text-gray-900 dark:text-white">{fac?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-semibold text-gray-900 dark:text-white">{new Date(selectedSession.session_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Time</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedSession.start_time}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                <p className="font-semibold text-gray-900 dark:text-white">{selectedSession.duration_hours}h</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Room</p>
                <p className="font-semibold text-gray-900 dark:text-white">{room?.name || 'TBD'}</p>
              </div>
            </div>
            {selectedSession.notes && (
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Notes</p>
                <p className="text-sm text-gray-900 dark:text-white">{selectedSession.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleLockSession(selectedSession.id, selectedSession.is_locked)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition ${
                selectedSession.is_locked
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                  : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800'
              }`}
            >
              {selectedSession.is_locked ? (
                <>
                  <Unlock size={16} /> Unlock
                </>
              ) : (
                <>
                  <Lock size={16} /> Lock
                </>
              )}
            </button>
            <button
              onClick={() => handleDeleteSession(selectedSession.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleExportTimetableGrid = () => {
    // Ask user if they want to filter
    const useFilters = window.confirm('Export filtered sessions only? Click OK for filtered, Cancel for all sessions')
    
    // Use filtered or all sessions based on user choice
    const exportSessions = useFilters ? getFilteredSessions() : sessions
    
    if (exportSessions.length === 0) {
      alert('No sessions to export')
      return
    }

    try {
      const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      const wb = XLSX.utils.book_new()
      
      // Update references to use exportSessions instead of sessions

      // Create comprehensive master sheet with all sessions
      const masterData = []
      const title = useFilters ? 'FACULTY TIMETABLE - FILTERED SESSIONS' : 'COMPREHENSIVE FACULTY TIMETABLE - ALL PROGRAMMES'
      masterData.push([title])
      masterData.push([`Generated: ${new Date().toLocaleString()}`])
      masterData.push([`Total Sessions: ${exportSessions.length}`])
      
      // Add filter information if filters were used
      if (useFilters) {
        const filterInfo = []
        if (filters.programme) filterInfo.push(`Programme: ${programmes.find(p => p.id === filters.programme)?.name || 'Unknown'}`)
        if (filters.faculty) filterInfo.push(`Faculty: ${faculty.find(f => f.id === filters.faculty)?.name || 'Unknown'}`)
        if (filters.module) filterInfo.push(`Module: ${modules.find(m => m.id === filters.module)?.name || 'Unknown'}`)
        if (filters.room) filterInfo.push(`Room: ${rooms.find(r => r.id === filters.room)?.code || 'Unknown'}`)
        if (filterInfo.length > 0) {
          masterData.push(['Filters Applied:'])
          filterInfo.forEach(info => masterData.push([info]))
        }
      }
      masterData.push([])
      
      // Headers
      masterData.push(['Acad. Week', 'Date', 'Day', 'Section', 'Programme', 'Module', 'Module Code', 'Faculty', 'Room', 'Session Type', 'Notes'])

      // Sort sessions by date and section
      const sortedSessions = [...exportSessions].sort((a, b) => {
        const dateCompare = new Date(a.session_date) - new Date(b.session_date)
        if (dateCompare !== 0) return dateCompare
        return (a.section_number || 0) - (b.section_number || 0)
      })

      // Add all sessions
      sortedSessions.forEach(session => {
        const dateObj = new Date(session.session_date)
        const dayName = DAYS_OF_WEEK[dateObj.getDay()]
        const weekNo = getAcademicWeekNumber(dateObj)
        const programme = programmes.find(p => p.id === session.programme_id)
        const module = modules.find(m => m.id === session.module_id)
        const facultyMember = faculty.find(f => f.id === session.faculty_id)
        const room = rooms.find(r => r.id === session.room_id)

        masterData.push([
          `Week ${weekNo}`,
          session.session_date,
          dayName,
          session.section_number ? `Section ${session.section_number}` : '-',
          programme?.name || 'N/A',
          module?.name || 'N/A',
          module?.code || 'N/A',
          facultyMember?.name || 'N/A',
          room?.name || 'TBD',
          session.session_type || 'Lecture',
          session.notes || ''
        ])
      })

      // Create master sheet
      const masterSheet = XLSX.utils.aoa_to_sheet(masterData)
      masterSheet['!cols'] = [
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 25 },
        { wch: 25 },
        { wch: 12 },
        { wch: 18 },
        { wch: 15 },
        { wch: 12 },
        { wch: 20 }
      ]

      // Format header
      for (let col = 0; col < 11; col++) {
        const cell = masterSheet[XLSX.utils.encode_cell({ r: 4, c: col })]
        if (cell) {
          cell.fill = { fgColor: { rgb: 'FF4472C4' } }
          cell.font = { bold: true, color: { rgb: 'FFFFFFFF' } }
          cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true }
        }
      }

      XLSX.utils.book_append_sheet(wb, masterSheet, 'All Sessions')

      // Create separate sheets for each programme
      const programmeSessions = {}
      exportSessions.forEach(session => {
        if (!programmeSessions[session.programme_id]) {
          programmeSessions[session.programme_id] = []
        }
        programmeSessions[session.programme_id].push(session)
      })

      Object.keys(programmeSessions).forEach(programmeId => {
        const programmeSes = programmeSessions[programmeId]
        const programme = programmes.find(p => p.id === programmeId)
        const programmeName = programme?.code || 'Unknown'
        const sheetName = programmeName.substring(0, 31) // Excel sheet name limit is 31 chars

        const progData = []
        progData.push([`${programme?.name || 'Unknown Programme'} - Timetable Grid`])
        progData.push([`Generated: ${new Date().toLocaleString()}`])
        progData.push([`Total Sessions: ${programmeSes.length}`])
        progData.push([])

        // Group by date
        const uniqueDates = [...new Set(programmeSes.map(s => s.session_date))].sort()
        const headerRow = ['Section']
        uniqueDates.forEach(date => {
          const dateObj = new Date(date)
          const dayName = DAYS_OF_WEEK[dateObj.getDay()]
          const wk = getAcademicWeekNumber(dateObj)
          headerRow.push(`Wk${wk} ${dayName}\n${date}`)
        })
        progData.push(headerRow)

        // Create section rows (Section 1-5 per date)
        for (let section = 1; section <= 5; section++) {
          const sectionRow = [`Section ${section}`]
          uniqueDates.forEach(date => {
            const session = programmeSes.find(s =>
              s.session_date === date &&
              Number(s.section_number) === section
            )
            if (session) {
              const module = modules.find(m => m.id === session.module_id)
              const facultyMember = faculty.find(f => f.id === session.faculty_id)
              sectionRow.push(`${facultyMember?.name || 'N/A'}\n${module?.code || 'N/A'}`)
            } else {
              sectionRow.push('')
            }
          })
          progData.push(sectionRow)
        }

        const progSheet = XLSX.utils.aoa_to_sheet(progData)
        progSheet['!cols'] = [{ wch: 12 }]
        for (let i = 0; i < uniqueDates.length; i++) {
          progSheet['!cols'].push({ wch: 22 })
        }

        // Format header row
        for (let col = 0; col < uniqueDates.length + 1; col++) {
          const cell = progSheet[XLSX.utils.encode_cell({ r: 4, c: col })]
          if (cell) {
            cell.fill = { fgColor: { rgb: 'FF4472C4' } }
            cell.font = { bold: true, color: { rgb: 'FFFFFFFF' } }
            cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true }
          }
        }

        XLSX.utils.book_append_sheet(wb, progSheet, sheetName)
      })

      // Write file
      const fileName = `comprehensive_timetable_all_programmes_${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
      
      alert(`✅ Comprehensive timetable exported successfully!\n📊 Total: ${sessions.length} sessions across ${Object.keys(programmeSessions).length} programmes`)
    } catch (error) {
      console.error('Error exporting timetable grid:', error)
      alert('Error exporting timetable grid: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Timetable</h1>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => navigate('/schedule/wizard')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
          >
            <Plus size={20} /> New Session
          </button>
          <button
            onClick={handleExportTimetableGrid}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
          >
            <Download size={20} /> Timetable Grid
          </button>
          <button
            onClick={handleResetAllSchedules}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
          >
            <Trash2 size={20} /> Reset All
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <Filter size={20} /> Filters
          </button>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="week">Week View</option>
            <option value="month">Month View</option>
          </select>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Programme</label>
            <select
              value={filters.programme}
              onChange={(e) => setFilters({ ...filters, programme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">All Programmes</option>
              {programmes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Faculty</label>
            <select
              value={filters.faculty}
              onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">All Faculty</option>
              {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module</label>
            <select
              value={filters.module}
              onChange={(e) => setFilters({ ...filters, module: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">All Modules</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room</label>
            <select
              value={filters.room}
              onChange={(e) => setFilters({ ...filters, room: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">All Rooms</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Session Types:</p>
        <div className="flex flex-wrap gap-4">
          {['Lecture', 'Lab', 'Workshop', 'Tutorial', 'Assessment'].map(type => (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getSessionColor(type).split(' ')[0]}`}></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Timetable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === 'week') {
                newDate.setDate(newDate.getDate() - 7)
              } else {
                newDate.setMonth(newDate.getMonth() - 1)
              }
              setCurrentDate(newDate)
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronLeft size={24} />
          </button>
          
          <h2 className="text-center">
            {viewMode === 'week' ? (
              <>
                <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  Academic {getAcademicWeekLabel(getAcademicWeekNumber(getWeekStart(currentDate)))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            )}
          </h2>

          <button
            onClick={() => {
              const newDate = new Date(currentDate)
              if (viewMode === 'week') {
                newDate.setDate(newDate.getDate() + 7)
              } else {
                newDate.setMonth(newDate.getMonth() + 1)
              }
              setCurrentDate(newDate)
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {getFilteredSessions().length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 dark:text-gray-400">No sessions scheduled</p>
            <button
              onClick={() => navigate('/schedule/wizard')}
              className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              Create your first session
            </button>
          </div>
        ) : (
          viewMode === 'week' ? renderWeekView() : renderMonthView()
        )}
      </div>

      {/* Session Modal */}
      {showSessionModal && renderSessionModal()}
    </div>
  )
}
