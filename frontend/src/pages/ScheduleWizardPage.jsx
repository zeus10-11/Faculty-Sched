import React, { useState, useEffect } from 'react'
import { sessionService, programmeService, moduleService, facultyService, roomService } from '../services/api'
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, AlertTriangle, Shield, Clock, Users, BookOpen } from 'lucide-react'

export default function ScheduleWizardPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [programmes, setProgrammes] = useState([])
  const [allModules, setAllModules] = useState([])
  const [programmeModules, setProgrammeModules] = useState([])
  const [faculty, setFaculty] = useState([])
  const [allFaculty, setAllFaculty] = useState([])
  const [availableFaculty, setAvailableFaculty] = useState([])
  const [rooms, setRooms] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])
  const [sessions, setSessions] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [availabilityData, setAvailabilityData] = useState({})
  const [leaveData, setLeaveData] = useState({})
  const [overrideSoftWarning, setOverrideSoftWarning] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')

  const [formData, setFormData] = useState({
    programme_id: '',
    module_id: '',
    faculty_id: '',
    room_id: '',
    session_date: '',
    start_time: '09:00',
    duration_hours: 1,
    session_type: 'Lecture',
    is_extra: false,
    notes: '',
    conflict_override_reason: ''
  })
  const [moduleLoadError, setModuleLoadError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  // When programme changes, load its modules
  useEffect(() => {
    if (formData.programme_id) {
      loadProgrammeModules(formData.programme_id)
    } else {
      setProgrammeModules([])
      setFormData(prev => ({ ...prev, module_id: '' }))
    }
  }, [formData.programme_id])

  // When date is selected, filter faculty and rooms
  useEffect(() => {
    if (formData.session_date) {
      filterFacultyByDate()
      filterRoomsByDateTime()
    }
  }, [formData.session_date, formData.start_time, formData.duration_hours])

  // Check conflicts when relevant data changes
  useEffect(() => {
    if (step === 4 || step === 5 || step === 6) {
      performConflictCheck()
    }
  }, [formData.faculty_id, formData.session_date, formData.start_time, formData.duration_hours, formData.room_id, formData.module_id])

  const fetchData = async () => {
    try {
      const [progRes, modRes, facRes, roomRes, sessRes] = await Promise.all([
        programmeService.getAll(),
        moduleService.getAll(),
        facultyService.getAll(),
        roomService.getAll(),
        sessionService.getAll()
      ])
      
      setProgrammes(progRes.data || [])
      setAllModules(modRes.data || [])
      const allFacData = facRes.data || []
      setAllFaculty(allFacData)
      setAvailableFaculty(allFacData)
      setRooms(roomRes.data || [])
      setAvailableRooms(roomRes.data || [])
      setSessions(sessRes.data || [])

      // Fetch availability and leave data
      try {
        const [availRes, leaveRes] = await Promise.all([
          fetch('http://localhost:5000/api/faculty/availability/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          }),
          fetch('http://localhost:5000/api/faculty/leave/all', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
          })
        ])
        
        if (availRes.ok) {
          const availData = await availRes.json()
          const map = {}
          availData?.forEach(av => {
            if (!map[av.faculty_id]) map[av.faculty_id] = []
            map[av.faculty_id].push(av)
          })
          setAvailabilityData(map)
        }

        if (leaveRes.ok) {
          const leaveDataRes = await leaveRes.json()
          const leaveMap = {}
          leaveDataRes?.forEach(leave => {
            if (!leaveMap[leave.faculty_id]) leaveMap[leave.faculty_id] = []
            leaveMap[leave.faculty_id].push(leave.leave_date)
          })
          setLeaveData(leaveMap)
        }
      } catch (e) {
        console.log('Availability data not yet available:', e.message)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const loadProgrammeModules = async (progId) => {
    try {
      setModuleLoadError('')
      const token = localStorage.getItem('authToken')
      const url = `http://localhost:5000/api/programme-modules/programme/${progId}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(`API Error: ${res.status} - ${errorData.error || 'Unknown error'}`)
      }
      
      const data = await res.json()
      console.log('Loaded programme modules:', data)
      
      if (!Array.isArray(data) || data.length === 0) {
        setModuleLoadError('No modules assigned to this programme yet.')
      }
      
      setProgrammeModules(data || [])
    } catch (error) {
      console.error('Error loading programme modules:', error)
      setModuleLoadError(error.message)
      setProgrammeModules([])
    }
  }

  const filterFacultyByDate = () => {
    if (!formData.session_date) return

    const date = new Date(formData.session_date)
    const dayOfWeek = date.getDay()
    const dateStr = formData.session_date

    const filtered = allFaculty.filter(fac => {
      // Check if on leave
      const onLeave = leaveData[fac.id]?.includes(dateStr)
      if (onLeave) return false

      // Check if available on this day
      const availForThisFaculty = availabilityData[fac.id] || []
      if (availForThisFaculty.length === 0) {
        return fac.status === 'Active'
      }

      return availForThisFaculty.some(av => av.day_of_week === dayOfWeek) && fac.status === 'Active'
    })

    setAvailableFaculty(filtered)

    // Reset faculty selection if not in filtered list
    if (formData.faculty_id && !filtered.find(f => f.id === formData.faculty_id)) {
      setFormData(prev => ({ ...prev, faculty_id: '' }))
    }
  }

  const filterRoomsByDateTime = () => {
    if (!formData.session_date || !formData.start_time) return

    const endTime = calculateEndTime(formData.start_time, formData.duration_hours)

    const filtered = rooms.filter(room => {
      const roomBooked = sessions.some(s => {
        if (s.room_id !== room.id || s.session_date !== formData.session_date) return false
        const sEndTime = calculateEndTime(s.start_time, s.duration_hours)
        return timeOverlap(formData.start_time, endTime, s.start_time, sEndTime)
      })
      return !roomBooked
    })

    setAvailableRooms(filtered)
  }

  const calculateEndTime = (startTime, durationHours) => {
    const [h, m] = startTime.split(':').map(Number)
    const totalMinutes = h * 60 + m + (durationHours * 60)
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  const timeOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && start2 < end1
  }

  const performConflictCheck = () => {
    const newConflicts = []

    if (!formData.faculty_id || !formData.session_date || !formData.start_time) return

    const selectedFaculty = allFaculty.find(f => f.id === formData.faculty_id)
    const selectedModule = programmeModules.find(m => m.module_id === formData.module_id)
    const selectedProgram = programmes.find(p => p.id === formData.programme_id)
    const endTime = calculateEndTime(formData.start_time, formData.duration_hours)

    // HARD CONFLICTS (Block save)
    // 1. Faculty double-booked
    const facultyDouble = sessions.some(s => {
      if (s.faculty_id !== formData.faculty_id || s.session_date !== formData.session_date) return false
      return timeOverlap(formData.start_time, endTime, s.start_time, calculateEndTime(s.start_time, s.duration_hours))
    })
    if (facultyDouble) {
      newConflicts.push({
        type: 'hard',
        icon: Users,
        message: '❌ Faculty is double-booked at this time'
      })
    }

    // 2. Room double-booked (if room selected)
    if (formData.room_id) {
      const roomDouble = sessions.some(s => {
        if (s.room_id !== formData.room_id || s.session_date !== formData.session_date) return false
        return timeOverlap(formData.start_time, endTime, s.start_time, calculateEndTime(s.start_time, s.duration_hours))
      })
      if (roomDouble) {
        newConflicts.push({
          type: 'hard',
          icon: AlertCircle,
          message: '❌ Room is double-booked at this time'
        })
      }
    }

    // 3. Faculty on leave
    if (leaveData[formData.faculty_id]?.includes(formData.session_date)) {
      newConflicts.push({
        type: 'hard',
        icon: AlertTriangle,
        message: '❌ Faculty is marked as on leave'
      })
    }

    // 4. Faculty not available at this time (check availability times)
    const facAvailability = availabilityData[formData.faculty_id] || []
    if (facAvailability.length > 0) {
      const dayOfWeek = new Date(formData.session_date).getDay()
      const availToday = facAvailability.find(av => av.day_of_week === dayOfWeek)
      if (availToday) {
        const [reqStart, reqEnd] = [formData.start_time, endTime]
        const [availStart, availEnd] = [availToday.start_time, availToday.end_time]
        if (!(reqStart >= availStart && reqEnd <= availEnd)) {
          newConflicts.push({
            type: 'hard',
            icon: Clock,
            message: `❌ Faculty not available at this time (available: ${availStart}-${availEnd})`
          })
        }
      }
    }

    // 5. Faculty exceeds max weekly hours
    const weekStart = new Date(formData.session_date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6) // Sunday

    const weekSessions = sessions.filter(s => {
      const sDate = new Date(s.session_date)
      return s.faculty_id === formData.faculty_id && sDate >= weekStart && sDate <= weekEnd
    })
    const weekHours = weekSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0) + formData.duration_hours
    if (weekHours > (selectedFaculty?.max_weekly_hours || 40)) {
      newConflicts.push({
        type: 'hard',
        icon: AlertTriangle,
        message: `❌ Faculty would exceed max weekly hours (${weekHours}/${selectedFaculty?.max_weekly_hours})`
      })
    }

    // 6. Module scheduled hours exceed allocated hours
    const moduleHours = sessions.filter(s => s.module_id === formData.module_id && s.programme_id === formData.programme_id)
      .reduce((sum, s) => sum + (s.duration_hours || 0), 0) + formData.duration_hours
    const allocatedHours = selectedModule?.allocated_hours || 0
    if (moduleHours > allocatedHours && !formData.is_extra) {
      newConflicts.push({
        type: 'hard',
        icon: BookOpen,
        message: `❌ Module would exceed allocated hours (${moduleHours}/${allocatedHours})`
      })
    }

    // SOFT WARNINGS (Allow override)
    // 1. Faculty approaching max hours (>80%)
    if (weekHours > (selectedFaculty?.max_weekly_hours * 0.8 || 32)) {
      newConflicts.push({
        type: 'soft',
        icon: AlertTriangle,
        message: `⚠️ Faculty is approaching max weekly hours (${weekHours}/${selectedFaculty?.max_weekly_hours})`
      })
    }

    // 2. Module behind schedule
    const moduleProgress = moduleHours / (selectedModule?.allocated_hours || 1)
    if (moduleProgress < 0.7) {
      newConflicts.push({
        type: 'soft',
        icon: BookOpen,
        message: '⚠️ Module is behind schedule (less than 70% complete)'
      })
    }

    // 3. Scheduled outside programme active weeks
    if (selectedProgram && formData.session_date) {
      const sessionDate = new Date(formData.session_date)
      const startDate = new Date(selectedProgram.start_date)
      const endDate = new Date(selectedProgram.end_date)
      if (sessionDate < startDate || sessionDate > endDate) {
        newConflicts.push({
          type: 'soft',
          icon: AlertTriangle,
          message: '⚠️ Session is outside programme active dates'
        })
      }
    }

    setConflicts(newConflicts)
  }

  const hasHardConflicts = () => conflicts.some(c => c.type === 'hard')
  const hasSoftConflicts = () => conflicts.some(c => c.type === 'soft')

  const handleNext = () => {
    // Validate current step before proceeding
    if (step === 1 && !formData.programme_id) {
      alert('Please select a programme to continue.')
      return
    }
    if (step === 2 && !formData.module_id) {
      alert('Please select a module to continue.')
      return
    }
    if (step === 3 && !formData.faculty_id) {
      alert('Please select a faculty member to continue.')
      return
    }
    if (step === 4 && hasHardConflicts()) {
      alert('Cannot proceed: Hard conflicts detected. Please resolve them first.')
      return
    }
    if (step === 5 && hasHardConflicts() && !overrideSoftWarning) {
      alert('Cannot proceed: Hard conflicts detected.')
      return
    }
    setStep(step + 1)
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    // Validate all required fields
    if (!formData.programme_id) {
      alert('Please select a programme')
      return
    }
    if (!formData.module_id) {
      alert('Please select a module')
      return
    }
    if (!formData.faculty_id) {
      alert('Please select a faculty member')
      return
    }
    if (!formData.session_date) {
      alert('Please select a session date')
      return
    }
    if (!formData.start_time) {
      alert('Please select a start time')
      return
    }
    if (!formData.duration_hours || formData.duration_hours <= 0) {
      alert('Please enter a valid duration')
      return
    }

    if (hasHardConflicts() && !overrideSoftWarning) {
      alert('Cannot save: Hard conflicts must be resolved')
      return
    }

    setLoading(true)
    try {
      const dataToSave = {
        ...formData,
        // Convert empty strings to null for optional fields
        room_id: formData.room_id || null,
        conflict_override_reason: overrideSoftWarning ? overrideReason : ''
      }
      await sessionService.create(dataToSave)
      alert('✅ Session scheduled successfully!')
      
      setFormData({
        programme_id: '',
        module_id: '',
        faculty_id: '',
        room_id: '',
        session_date: '',
        start_time: '09:00',
        duration_hours: 1,
        session_type: 'Lecture',
        is_extra: false,
        notes: '',
        conflict_override_reason: ''
      })
      setConflicts([])
      setOverrideSoftWarning(false)
      setOverrideReason('')
      setStep(1)
      
      // Refresh sessions data
      const res = await sessionService.getAll()
      setSessions(res.data || [])
    } catch (error) {
      console.error('Error scheduling session:', error)
      alert('❌ Error: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  // ===== RENDER STEPS =====

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-6">
        <BookOpen className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Programme</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose the academic programme for this session</p>
        </div>
      </div>
      
      <select
        value={formData.programme_id}
        onChange={(e) => setFormData({...formData, programme_id: e.target.value})}
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
      >
        <option value="">-- Select a programme --</option>
        {programmes.filter(p => p.status === 'Active').map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.code}) - {new Date(p.start_date).toLocaleDateString()} to {new Date(p.end_date).toLocaleDateString()}
          </option>
        ))}
      </select>

      {formData.programme_id && programmes.find(p => p.id === formData.programme_id) && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Programme Details:</strong><br/>
            Start: {new Date(programmes.find(p => p.id === formData.programme_id)?.start_date).toLocaleDateString()}<br/>
            End: {new Date(programmes.find(p => p.id === formData.programme_id)?.end_date).toLocaleDateString()}<br/>
            Allocated Hours: {programmes.find(p => p.id === formData.programme_id)?.allotted_hours}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-6">
        <BookOpen className="text-purple-600 dark:text-purple-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Module</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose the module for this programme</p>
        </div>
      </div>
      
      {!formData.programme_id ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">Select a programme first to see available modules</p>
        </div>
      ) : programmeModules.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">
            {moduleLoadError ? `Error: ${moduleLoadError}` : 'Loading modules... If this persists, ensure modules are assigned to this programme.'}
          </p>
        </div>
      ) : (
        <>
          <select
            value={formData.module_id}
            onChange={(e) => setFormData({...formData, module_id: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
          >
            <option value="">-- Select a module --</option>
            {programmeModules.map(pm => {
              const mod = allModules.find(m => m.id === pm.module_id)
              return (
                <option key={pm.id} value={pm.module_id}>
                  {mod?.name} ({mod?.code}) - Level {mod?.level}
                </option>
              )
            })}
          </select>

          {formData.module_id && programmeModules.find(pm => pm.module_id === formData.module_id) && (
            <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-2">
              {(() => {
                const pm = programmeModules.find(pm => pm.module_id === formData.module_id)
                const scheduled = sessions.filter(s => s.module_id === formData.module_id && s.programme_id === formData.programme_id).reduce((sum, s) => sum + (s.duration_hours || 0), 0)
                const remaining = (pm?.allocated_hours || 0) - scheduled
                return (
                  <>
                    <p className="text-sm font-semibold text-purple-900 dark:text-purple-200">Module Progress:</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{scheduled}h scheduled</span>
                      <span>{pm?.allocated_hours || 0}h allocated</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: `${Math.min(100, (scheduled / (pm?.allocated_hours || 1)) * 100)}%`}}></div>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300">{remaining}h remaining</p>
                  </>
                )
              })()}
            </div>
          )}

          <div className="flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              id="extra"
              checked={formData.is_extra}
              onChange={(e) => setFormData({...formData, is_extra: e.target.checked})}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="extra" className="text-sm text-gray-700 dark:text-gray-300">Mark as Extra/Additional Session</label>
          </div>
        </>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-6">
        <Users className="text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Faculty</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose the faculty member to teach this session</p>
        </div>
      </div>
      
      {formData.session_date && availableFaculty.length === 0 ? (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <p className="text-sm text-red-900 dark:text-red-200">No faculty available on {new Date(formData.session_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        </div>
      ) : (
        <>
          <select
            value={formData.faculty_id}
            onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
          >
            <option value="">-- Select faculty --</option>
            {availableFaculty.map(f => {
              const weekSessions = sessions.filter(s => {
                const sDate = new Date(s.session_date)
                const weekStart = new Date(formData.session_date)
                weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
                const weekEnd = new Date(weekStart)
                weekEnd.setDate(weekEnd.getDate() + 6)
                return s.faculty_id === f.id && sDate >= weekStart && sDate <= weekEnd
              })
              const weekHours = weekSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
              const capacity = f.max_weekly_hours || 40
              const loadColor = weekHours > capacity ? 'text-red-600' : weekHours > capacity * 0.8 ? 'text-yellow-600' : 'text-green-600'
              
              return (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.staff_id}) - {weekHours}/{capacity}h this week
                </option>
              )
            })}
          </select>

          {formData.faculty_id && allFaculty.find(f => f.id === formData.faculty_id) && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 space-y-2">
              {(() => {
                const fac = allFaculty.find(f => f.id === formData.faculty_id)
                const weekSessions = sessions.filter(s => {
                  const sDate = new Date(s.session_date)
                  const weekStart = new Date(formData.session_date)
                  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
                  const weekEnd = new Date(weekStart)
                  weekEnd.setDate(weekEnd.getDate() + 6)
                  return s.faculty_id === fac.id && sDate >= weekStart && sDate <= weekEnd
                })
                const weekHours = weekSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
                const capacity = fac?.max_weekly_hours || 40
                const pct = (weekHours / capacity) * 100
                const loadColor = weekHours > capacity ? 'bg-red-500' : weekHours > capacity * 0.8 ? 'bg-yellow-500' : 'bg-green-500'
                
                return (
                  <>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-200">Weekly Load:</p>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{weekHours}h scheduled</span>
                      <span>{capacity}h max</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className={`${loadColor} h-2 rounded-full`} style={{width: `${Math.min(100, pct)}%`}}></div>
                    </div>
                    {weekHours > capacity && <p className="text-xs text-red-600 dark:text-red-400">⚠️ Would exceed capacity</p>}
                    {weekHours > capacity * 0.8 && weekHours <= capacity && <p className="text-xs text-yellow-600 dark:text-yellow-400">⚠️ Approaching capacity</p>}
                  </>
                )
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-6">
        <Clock className="text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Date & Time</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose when this session will be held</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date *</label>
          <input
            type="date"
            value={formData.session_date}
            onChange={(e) => setFormData({...formData, session_date: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Time *</label>
          <input
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({...formData, start_time: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (hours) *</label>
          <select
            value={formData.duration_hours}
            onChange={(e) => setFormData({...formData, duration_hours: parseInt(e.target.value)})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            {[1,2,3,4,5,6,7,8].map(h => <option key={h} value={h}>{h} hour{h>1?'s':''}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Session Type *</label>
          <select
            value={formData.session_type}
            onChange={(e) => setFormData({...formData, session_type: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="Lecture">Lecture</option>
            <option value="Lab">Lab</option>
            <option value="Workshop">Workshop</option>
            <option value="Tutorial">Tutorial</option>
            <option value="Assessment">Assessment</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows="3"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          placeholder="Any additional notes..."
        />
      </div>

      {formData.session_date && formData.start_time && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>End Time:</strong> {calculateEndTime(formData.start_time, formData.duration_hours)}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="flex items-start gap-3 mb-6">
        <Shield className="text-indigo-600 dark:text-indigo-400 mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Room (Optional)</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose a venue if needed for this session</p>
        </div>
      </div>
      
      {availableRooms.length === 0 && formData.session_date && formData.start_time ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <p className="text-sm text-yellow-900 dark:text-yellow-200">No rooms available for this time slot</p>
        </div>
      ) : (
        <select
          value={formData.room_id}
          onChange={(e) => setFormData({...formData, room_id: e.target.value})}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-lg"
        >
          <option value="">-- Select room (optional) --</option>
          {availableRooms.map(r => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.code}) - Cap: {r.capacity}, Type: {r.type}
            </option>
          ))}
        </select>
      )}

      {formData.room_id && rooms.find(r => r.id === formData.room_id) && (
        <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
          <p className="text-sm text-indigo-900 dark:text-indigo-200">
            <strong>Room Details:</strong><br/>
            Capacity: {rooms.find(r => r.id === formData.room_id)?.capacity}<br/>
            Type: {rooms.find(r => r.id === formData.room_id)?.type}<br/>
            Floor: {rooms.find(r => r.id === formData.room_id)?.floor || 'N/A'}
          </p>
        </div>
      )}
    </div>
  )

  const renderStep6 = () => {
    const programme = programmes.find(p => p.id === formData.programme_id)
    const module = allModules.find(m => m.id === formData.module_id)
    const fac = allFaculty.find(f => f.id === formData.faculty_id)
    const room = rooms.find(r => r.id === formData.room_id)

    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 mb-6">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review & Confirm</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Please review all details before scheduling</p>
          </div>
        </div>
        
        {/* Summary Card */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-3 border-2 border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Programme</p>
              <p className="font-semibold text-gray-900 dark:text-white">{programme?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Module</p>
              <p className="font-semibold text-gray-900 dark:text-white">{module?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Faculty</p>
              <p className="font-semibold text-gray-900 dark:text-white">{fac?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Room</p>
              <p className="font-semibold text-gray-900 dark:text-white">{room?.name || 'TBD'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Date & Time</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formData.session_date} at {formData.start_time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Duration</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formData.duration_hours}h ({formData.session_type})</p>
            </div>
          </div>
        </div>

        {/* Conflict Check Results */}
        {conflicts.length > 0 && (
          <div className="space-y-3">
            <p className="font-semibold text-gray-900 dark:text-white">Conflict Check Results:</p>
            {conflicts.map((conflict, idx) => {
              const IconComponent = conflict.icon
              return (
                <div key={idx} className={`p-4 rounded-lg border flex gap-3 items-start ${
                  conflict.type === 'hard'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
                }`}>
                  <IconComponent className={`flex-shrink-0 w-5 h-5 mt-0.5 ${
                    conflict.type === 'hard'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`} />
                  <p className={`text-sm ${
                    conflict.type === 'hard'
                      ? 'text-red-800 dark:text-red-200'
                      : 'text-yellow-800 dark:text-yellow-200'
                  }`}>{conflict.message}</p>
                </div>
              )
            })}
          </div>
        )}

        {/* Soft Warning Override */}
        {hasSoftConflicts() && !hasHardConflicts() && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideSoftWarning}
                onChange={(e) => setOverrideSoftWarning(e.target.checked)}
                className="w-4 h-4 mt-1 rounded"
              />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Override Soft Warnings?</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">You can proceed despite the warnings above by providing a reason</p>
              </div>
            </label>
            
            {overrideSoftWarning && (
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why are you overriding these warnings?"
                rows="3"
                className="w-full mt-3 px-3 py-2 border border-amber-300 dark:border-amber-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
              />
            )}
          </div>
        )}

        {hasHardConflicts() && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-200">❌ Hard Conflicts Detected</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">You cannot proceed until hard conflicts are resolved. Please go back and make changes.</p>
          </div>
        )}

        {conflicts.length === 0 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
            <p className="text-sm font-semibold text-green-800 dark:text-green-200">✅ No Conflicts Detected</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">This session is clear to schedule</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Schedule Wizard</h1>
      <p className="text-gray-600 dark:text-gray-400">Create a new session with automatic conflict detection</p>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Progress Steps - 6 steps */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max md:min-w-full gap-2">
            {[
              { num: 1, label: 'Programme' },
              { num: 2, label: 'Module' },
              { num: 3, label: 'Faculty' },
              { num: 4, label: 'Date & Time' },
              { num: 5, label: 'Room' },
              { num: 6, label: 'Review' }
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1 min-w-fit">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${
                  s.num <= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {s.num < step ? <CheckCircle2 size={24} /> : s.num}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 ml-2 hidden sm:block">{s.label}</div>
                {idx < 5 && (
                  <div className={`flex-1 h-1 mx-1 ${
                    s.num < step ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8 min-h-96">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
          {step === 6 && renderStep6()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handlePrevious}
            disabled={step === 1 || loading}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
          >
            <ChevronLeft size={20} /> Back
          </button>

          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            Step {step} of 6
          </div>

          {step < 6 ? (
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !formData.programme_id) ||
                (step === 2 && !formData.module_id) ||
                (step === 3 && !formData.faculty_id) ||
                (step === 4 && (!formData.session_date || !formData.start_time)) ||
                (step === 5 && false) || // room is optional
                loading
              }
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              Next <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || hasHardConflicts() || (hasSoftConflicts() && !overrideSoftWarning)}
              className={`px-8 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium ${
                hasHardConflicts() 
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? '⏳ Scheduling...' : '✅ Schedule Session'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
