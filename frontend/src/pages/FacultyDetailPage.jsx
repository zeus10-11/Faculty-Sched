import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { facultyService, sessionService, programmeService, moduleService, roomService } from '../services/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ChevronLeft, Download, Calendar, Clock, BookOpen, AlertTriangle, Edit2, Trash2 } from 'lucide-react'
import { generateFacultySchedulePDF, downloadPDF } from '../services/pdfGenerator'

export default function FacultyDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [faculty, setFaculty] = useState(null)
  const [sessions, setSessions] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [modules, setModules] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [weeklyLoad, setWeeklyLoad] = useState([])
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [availability, setAvailability] = useState([])

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [facRes, sessRes, progRes, modRes, roomRes] = await Promise.all([
        facultyService.getById(id),
        sessionService.getAll(),
        programmeService.getAll(),
        moduleService.getAll(),
        roomService.getAll()
      ])

      setFaculty(facRes.data)
      setSessions(sessRes.data || [])
      setProgrammes(progRes.data || [])
      setModules(modRes.data || [])
      setRooms(roomRes.data || [])

      // Calculate weekly load
      const facultySessions = sessRes.data?.filter(s => s.faculty_id === id) || []
      calculateWeeklyLoad(facultySessions, facRes.data.max_weekly_hours)
      calculateMonthlyStats(facultySessions)

      // Fetch availability
      try {
        const availRes = await fetch(`http://localhost:5000/api/faculty/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        })
        if (availRes.ok) {
          const data = await availRes.json()
          setAvailability(data.faculty_availability || [])
        }
      } catch (e) {
        console.log('Availability data not available')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyLoad = (facultySessions, maxHours) => {
    const weekData = {}
    facultySessions.forEach(s => {
      const date = new Date(s.session_date)
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      const weekKey = weekStart.toISOString().split('T')[0]
      
      if (!weekData[weekKey]) {
        weekData[weekKey] = {
          week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          hours: 0,
          max: maxHours || 40,
          sessions: 0
        }
      }
      weekData[weekKey].hours += s.duration_hours || 0
      weekData[weekKey].sessions += 1
    })

    setWeeklyLoad(Object.values(weekData).slice(-8)) // Last 8 weeks
  }

  const calculateMonthlyStats = (facultySessions) => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthSessions = facultySessions.filter(s => {
      const sDate = new Date(s.session_date)
      return sDate.getMonth() === currentMonth && sDate.getFullYear() === currentYear
    })

    const monthHours = monthSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
    const moduleTypes = {}
    monthSessions.forEach(s => {
      const mod = modules.find(m => m.id === s.module_id)
      if (mod) {
        moduleTypes[mod.type] = (moduleTypes[mod.type] || 0) + 1
      }
    })

    setMonthlyStats({
      totalHours: monthHours,
      totalSessions: monthSessions.length,
      moduleTypes: Object.entries(moduleTypes).map(([type, count]) => ({ name: type, value: count }))
    })
  }

  const handleExportPDF = async () => {
    try {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
      
      const pdf = await generateFacultySchedulePDF(
        faculty.id,
        sessions,
        programmes,
        modules,
        rooms,
        weekStart,
        'Faculty Scheduler'
      )
      downloadPDF(pdf, `${faculty.name}_schedule.pdf`)
    } catch (error) {
      alert('Error generating PDF: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!faculty) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600 dark:text-gray-400">Faculty member not found</p>
        <button
          onClick={() => navigate('/faculty')}
          className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Back to Faculty
        </button>
      </div>
    )
  }

  const facultySessions = sessions.filter(s => s.faculty_id === faculty.id)
  const totalHours = facultySessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
  const maxHours = faculty.max_weekly_hours || 40
  const loadPercentage = ((totalHours / maxHours) * 100).toFixed(1)

  const dayNames = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/faculty')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{faculty.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">{faculty.staff_id}</p>
        </div>
      </div>

      {/* Faculty Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
          <p className="font-semibold text-gray-900 dark:text-white truncate">{faculty.email || 'N/A'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Phone</p>
          <p className="font-semibold text-gray-900 dark:text-white">{faculty.phone || 'N/A'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Qualification Level</p>
          <p className="font-semibold text-gray-900 dark:text-white">Level {faculty.qualification_level}</p>
        </div>
        <div className={`rounded-lg shadow p-4 ${
          faculty.status === 'Active' 
            ? 'bg-green-50 dark:bg-green-900' 
            : 'bg-red-50 dark:bg-red-900'
        }`}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
          <p className={`font-semibold ${
            faculty.status === 'Active'
              ? 'text-green-700 dark:text-green-200'
              : 'text-red-700 dark:text-red-200'
          }`}>{faculty.status}</p>
        </div>
      </div>

      {/* Weekly Load Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Total Hours</h3>
            <Clock className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalHours}h</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Across all sessions</p>
        </div>

        <div className={`rounded-lg shadow p-6 ${
          loadPercentage > 100 ? 'bg-red-50 dark:bg-red-900' :
          loadPercentage > 80 ? 'bg-yellow-50 dark:bg-yellow-900' :
          'bg-green-50 dark:bg-green-900'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Load</h3>
            <AlertTriangle className={`${
              loadPercentage > 100 ? 'text-red-600' :
              loadPercentage > 80 ? 'text-yellow-600' :
              'text-green-600'
            }`} />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{loadPercentage}%</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{maxHours}h max capacity</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sessions</h3>
            <Calendar className="text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{facultySessions.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total scheduled</p>
        </div>
      </div>

      {/* Weekly Load Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weekly Load Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyLoad}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="hours" fill="#3b82f6" name="Scheduled Hours" />
            <Bar dataKey="max" fill="#e5e7eb" name="Max Hours" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Stats */}
      {monthlyStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">This Month's Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Hours</span>
                <span className="font-bold text-gray-900 dark:text-white">{monthlyStats.totalHours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Sessions</span>
                <span className="font-bold text-gray-900 dark:text-white">{monthlyStats.totalSessions}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Session Types:</p>
                {monthlyStats.moduleTypes.length > 0 ? (
                  monthlyStats.moduleTypes.map(item => (
                    <div key={item.name} className="flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No sessions this month</p>
                )}
              </div>
            </div>
          </div>

          {monthlyStats.moduleTypes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Session Types Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={monthlyStats.moduleTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {monthlyStats.moduleTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Availability</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5, 6].map(day => {
              const dayAvail = availability.find(a => a.day_of_week === day)
              return (
                <div key={day} className={`p-3 rounded-lg ${dayAvail ? 'bg-green-50 dark:bg-green-900' : 'bg-gray-50 dark:bg-gray-700'}`}>
                  <p className={`font-semibold ${dayAvail ? 'text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'}`}>
                    {dayNames[day]}
                  </p>
                  {dayAvail ? (
                    <p className={`text-sm ${dayAvail ? 'text-green-800 dark:text-green-200' : 'text-gray-600 dark:text-gray-400'}`}>
                      {dayAvail.start_time} - {dayAvail.end_time}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">Not available</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions</h3>
        {facultySessions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No sessions scheduled</p>
        ) : (
          <div className="space-y-3">
            {facultySessions.slice(0, 10).map(s => {
              const prog = programmes.find(p => p.id === s.programme_id)
              const mod = modules.find(m => m.id === s.module_id)
              const room = rooms.find(r => r.id === s.room_id)
              
              return (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{mod?.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(s.session_date).toLocaleDateString()} at {s.start_time} ({s.duration_hours}h) - {prog?.name}
                      {room && ` - ${room.code}`}
                    </p>
                  </div>
                </div>
              )
            })}
            {facultySessions.length > 10 && (
              <p className="text-sm text-gray-600 dark:text-gray-400">And {facultySessions.length - 10} more sessions...</p>
            )}
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className="flex gap-2">
        <button
          onClick={handleExportPDF}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <Download size={20} /> Export Schedule as PDF
        </button>
      </div>
    </div>
  )
}
