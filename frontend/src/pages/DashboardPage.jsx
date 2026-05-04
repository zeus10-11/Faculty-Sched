import React, { useState, useEffect } from 'react'
import { programmeService, facultyService, sessionService, moduleService, conflictService } from '../services/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertCircle, Clock, Users, BookOpen, AlertTriangle } from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    programmes: 0,
    modules: 0,
    faculty: 0,
    sessions: 0,
    totalModuleHours: 0
  })
  const [facultyLoad, setFacultyLoad] = useState([])
  const [moduleStats, setModuleStats] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get programmes
      const progRes = await programmeService.getAll()
      
      // Get modules
      const modRes = await moduleService.getAll()
      
      // Get faculty
      const facRes = await facultyService.getAll()
      
      // Get sessions
      const sesRes = await sessionService.getAll({})

      // Get conflicts
      try {
        const conflictRes = await conflictService.getAll()
        setConflicts(conflictRes.data || [])
      } catch (error) {
        console.error('Error fetching conflicts:', error)
        setConflicts([])
      }

      // Calculate total module hours
      const totalModuleHours = modRes.data.reduce((sum, m) => sum + (m.default_hours || 0), 0)

      // Process module statistics
      const moduleData = modRes.data.map(m => ({
        name: m.code,
        hours: m.default_hours || 0,
        type: m.type
      }))
      setModuleStats(moduleData.slice(0, 6))

      setStats({
        programmes: progRes.data.length,
        modules: modRes.data.length,
        faculty: facRes.data.length,
        sessions: sesRes.data.length,
        totalModuleHours: totalModuleHours
      })

      // Process faculty load data - count from sessions
      const facultyData = facRes.data.map(f => {
        const scheduledHours = sesRes.data && sesRes.data.length > 0
          ? sesRes.data
              .filter(s => s && s.faculty_id === f.id)
              .reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          : 0
        
        return {
          name: (f.name || 'Unknown').split(' ')[0],
          hours: scheduledHours,
          max: f.max_weekly_hours || 40
        }
      })
      setFacultyLoad(facultyData.slice(0, 8))

      // Get upcoming sessions (next 7 days)
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = sesRes.data && sesRes.data.length > 0
        ? sesRes.data
            .filter(s => {
              const sDate = new Date(s.session_date)
              return sDate >= today && sDate <= nextWeek
            })
            .slice(0, 5)
        : []
      setUpcomingSessions(upcoming)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>
  }

  // Count hard and soft conflicts
  const hardConflicts = conflicts.filter(c => c.severity === 'Hard').length
  const softConflicts = conflicts.filter(c => c.severity === 'Soft').length

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Active Programmes</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.programmes}</p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Modules</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.modules}</p>
            </div>
            <BookOpen className="text-purple-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Module Hours</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalModuleHours}h</p>
            </div>
            <Clock className="text-indigo-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total Faculty</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.faculty}</p>
            </div>
            <Users className="text-green-500" size={32} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Sessions Scheduled</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.sessions}</p>
            </div>
            <Clock className="text-orange-500" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Faculty Load Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Faculty Weekly Load</h3>
          {facultyLoad.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={facultyLoad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="hours" fill="#3b82f6" name="Hours Scheduled" />
                <Bar dataKey="max" fill="#e5e7eb" name="Max Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              No faculty data available
            </div>
          )}
        </div>

        {/* Conflict Alert Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Conflicts & Alerts
          </h3>
          <div className="space-y-3">
            <div className={`p-3 rounded border ${
              hardConflicts > 0
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            }`}>
              <p className={`text-sm ${
                hardConflicts > 0
                  ? 'text-red-800 dark:text-red-200'
                  : 'text-green-800 dark:text-green-200'
              }`}>
                {hardConflicts > 0 ? `${hardConflicts} hard conflict${hardConflicts !== 1 ? 's' : ''} detected` : 'No hard conflicts detected'}
              </p>
            </div>
            <div className={`p-3 rounded border ${
              softConflicts > 0
                ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <p className={`text-sm ${
                softConflicts > 0
                  ? 'text-yellow-800 dark:text-yellow-200'
                  : 'text-blue-800 dark:text-blue-200'
              }`}>
                {softConflicts > 0 ? `${softConflicts} soft warning${softConflicts !== 1 ? 's' : ''}` : 'No warnings'}
              </p>
            </div>
            <a href="/conflicts" className="block text-center p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
              View Conflict Log
            </a>
          </div>
        </div>
      </div>

      {/* Module Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Module Hours by Type</h3>
          <div className="space-y-2">
            {moduleStats.length > 0 ? (
              moduleStats.map((mod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{mod.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{mod.type}</p>
                  </div>
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{mod.hours}h</span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">No modules created yet</p>
            )}
          </div>
        </div>

        {/* Module Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Module Hours</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{stats.totalModuleHours}h</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Across {stats.modules} modules</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-600 dark:text-green-400">Faculty Members</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{stats.faculty}</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">Active in system</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-purple-600 dark:text-purple-400">Sessions Scheduled</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{stats.sessions}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">Total scheduled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Sessions (Next 7 Days)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Module</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Faculty</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date & Time</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Room</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Hours</th>
              </tr>
            </thead>
            <tbody>
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session) => (
                  <tr key={session.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-gray-900 dark:text-white">{session.modules?.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{session.faculty?.name}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(session.session_date).toLocaleDateString()} {session.start_time}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{session.rooms?.code || 'TBD'}</td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{session.duration_hours}h</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-6 text-gray-500 dark:text-gray-400">
                    No sessions scheduled for the next 7 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
