import React, { useState, useEffect } from 'react'
import { sessionService, facultyService, programmeService, moduleService, roomService } from '../services/api'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Download, Filter } from 'lucide-react'
import * as XLSX from 'xlsx'
import { generateWeeklyTimetablePDF, generateMonthlySummaryPDF, downloadPDF } from '../services/pdfGenerator'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('faculty-hours')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [rawData, setRawData] = useState([])
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [sessions, setSessions] = useState([])
  const [faculty, setFaculty] = useState([])
  const [programmes, setProgrammes] = useState([])
  const [modules, setModules] = useState([])
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    generateReport()
  }, [reportType, dateRange])

  const generateReport = async () => {
    setLoading(true)
    try {
      const [sessRes, facRes, progRes, modRes, roomRes] = await Promise.all([
        sessionService.getAll(),
        facultyService.getAll(),
        programmeService.getAll(),
        moduleService.getAll(),
        roomService.getAll()
      ])

      setSessions(sessRes.data || [])
      setFaculty(facRes.data || [])
      setProgrammes(progRes.data || [])
      setModules(modRes.data || [])
      setRooms(roomRes.data || [])

      let reportData = []
      let fullDetailData = []

      if (reportType === 'faculty-hours') {
        // Faculty hours report
        reportData = (facRes.data || []).map(f => {
          const facSessions = (sessRes.data || []).filter(s => s.faculty_id === f.id)
          const totalHours = facSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          return {
            name: f.name,
            scheduled: totalHours,
            max: f.max_weekly_hours || 40,
            percentage: ((totalHours / (f.max_weekly_hours || 40)) * 100).toFixed(1)
          }
        })

        fullDetailData = (facRes.data || []).map(f => {
          const facSessions = (sessRes.data || []).filter(s => s.faculty_id === f.id)
          const totalHours = facSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          return {
            'Faculty Name': f.name,
            'Staff ID': f.staff_id,
            'Email': f.email || 'N/A',
            'Department': f.dept_id || 'N/A',
            'Total Hours': totalHours,
            'Max Weekly': f.max_weekly_hours,
            'Utilization %': ((totalHours / (f.max_weekly_hours || 40)) * 100).toFixed(1),
            'Sessions': facSessions.length,
            'Status': f.status
          }
        })

      } else if (reportType === 'programme-completion') {
        // Programme completion report
        reportData = (progRes.data || []).map(p => {
          const progSessions = (sessRes.data || []).filter(s => s.programme_id === p.id)
          const totalHours = progSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          const completion = ((totalHours / (p.allotted_hours || 1)) * 100).toFixed(1)
          return {
            name: p.name,
            completion: parseInt(completion),
            scheduled: totalHours,
            allocated: p.allotted_hours,
            sessions: progSessions.length
          }
        })

        fullDetailData = (progRes.data || []).map(p => {
          const progSessions = (sessRes.data || []).filter(s => s.programme_id === p.id)
          const totalHours = progSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          return {
            'Programme': p.name,
            'Code': p.code,
            'Start Date': p.start_date,
            'End Date': p.end_date,
            'Allocated Hours': p.allotted_hours,
            'Scheduled Hours': totalHours,
            'Completion %': ((totalHours / (p.allotted_hours || 1)) * 100).toFixed(1),
            'Sessions': progSessions.length,
            'Status': p.status
          }
        })

      } else if (reportType === 'module-usage') {
        // Module usage across programmes
        reportData = (modRes.data || []).map(m => {
          const modSessions = (sessRes.data || []).filter(s => s.module_id === m.id)
          const totalHours = modSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          return {
            name: m.code,
            usage: totalHours,
            programmes: new Set(modSessions.map(s => s.programme_id)).size,
            sessions: modSessions.length
          }
        })

        fullDetailData = (modRes.data || []).map(m => {
          const modSessions = (sessRes.data || []).filter(s => s.module_id === m.id)
          const totalHours = modSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          const uniqueProgrammes = new Set(modSessions.map(s => s.programme_id))
          return {
            'Module': m.name,
            'Code': m.code,
            'Level': m.level,
            'Type': m.type,
            'Total Hours': totalHours,
            'Programmes': uniqueProgrammes.size,
            'Sessions': modSessions.length,
            'Default Hours': m.default_hours
          }
        })

      } else if (reportType === 'room-utilization') {
        // Room utilization report
        reportData = (roomRes.data || []).map(r => {
          const roomSessions = (sessRes.data || []).filter(s => s.room_id === r.id)
          const totalHours = roomSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          // Assume 40 hours per week available * 52 weeks
          const maxCapacity = 2080
          return {
            name: r.name,
            utilization: ((totalHours / maxCapacity) * 100).toFixed(1),
            hours: totalHours,
            sessions: roomSessions.length
          }
        })

        fullDetailData = (roomRes.data || []).map(r => {
          const roomSessions = (sessRes.data || []).filter(s => s.room_id === r.id)
          const totalHours = roomSessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
          return {
            'Room': r.name,
            'Code': r.code,
            'Capacity': r.capacity,
            'Type': r.type,
            'Total Hours Used': totalHours,
            'Sessions': roomSessions.length,
            'Utilization %': ((totalHours / 2080) * 100).toFixed(1),
            'Floor': r.floor || 'N/A'
          }
        })
      }

      setData(reportData)
      setRawData(fullDetailData)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Error generating report: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    if (rawData.length === 0) {
      alert('No data to export')
      return
    }

    const ws = XLSX.utils.json_to_sheet(rawData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, reportType)
    XLSX.writeFile(wb, `report_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const handleExportPDF = async () => {
    try {
      let pdf
      const month = new Date(dateRange.startDate).getMonth()
      const year = new Date(dateRange.startDate).getFullYear()

      if (reportType === 'programme-completion') {
        pdf = await generateMonthlySummaryPDF(
          sessions,
          programmes,
          modules,
          faculty,
          rooms,
          month,
          year,
          'Faculty Scheduler'
        )
      } else {
        alert('PDF export available for Programme Completion report')
        return
      }

      downloadPDF(pdf, `report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      alert('Error generating PDF: ' + error.message)
    }
  }

  const renderChart = () => {
    if (!data || data.length === 0) {
      return <p className="text-center text-gray-500 dark:text-gray-400 py-8">No data available</p>
    }

    switch (reportType) {
      case 'faculty-hours':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="scheduled" fill="#3b82f6" name="Scheduled Hours" />
              <Bar dataKey="max" fill="#e5e7eb" name="Max Capacity" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'programme-completion':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="completion" fill="#10b981" name="Completion %" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'module-usage':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="usage" fill="#8b5cf6" name="Total Hours" />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'room-utilization':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="utilization" fill="#f59e0b" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>

      {/* Report Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: 'faculty-hours', label: 'Faculty Hours', icon: '👥' },
            { value: 'programme-completion', label: 'Programme Completion', icon: '📚' },
            { value: 'module-usage', label: 'Module Usage', icon: '📖' },
            { value: 'room-utilization', label: 'Room Utilization', icon: '🏫' }
          ].map(report => (
            <button
              key={report.value}
              onClick={() => setReportType(report.value)}
              className={`p-4 rounded-lg border-2 transition ${
                reportType === report.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              <div className="text-3xl mb-2">{report.icon}</div>
              <p className="font-semibold text-gray-900 dark:text-white">{report.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
          >
            <Download size={18} /> Excel
          </button>
          {reportType === 'programme-completion' && (
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
            >
              <Download size={18} /> PDF
            </button>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          renderChart()
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Data</h3>
        {rawData.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {Object.keys(rawData[0]).map(key => (
                  <th key={key} className="text-left px-4 py-2 font-semibold text-gray-900 dark:text-white">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rawData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  {Object.values(row).map((cell, cidx) => (
                    <td key={cidx} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-6">No data available</p>
        )}
      </div>
    </div>
  )
}
