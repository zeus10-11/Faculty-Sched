import React, { useState, useEffect } from 'react'
import { FileText, Edit3, Trash2, RefreshCw } from 'lucide-react'
import { auditService } from '../services/api'

const actionIcons = {
  'CREATE': <FileText size={18} className="text-green-600" />,
  'UPDATE': <Edit3 size={18} className="text-blue-600" />,
  'DELETE': <Trash2 size={18} className="text-red-600" />
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('All')
  const [filterEntity, setFilterEntity] = useState('All')

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await auditService.getAll()
      setLogs(res.data || [])
    } catch (error) {
      console.error('Error fetching audit logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => 
    (filterAction === 'All' || log.action === filterAction) &&
    (filterEntity === 'All' || log.entity_type === filterEntity)
  )

  const entities = ['All', ...new Set(logs.map(l => l.entity_type))]
  const actions = ['All', ...new Set(logs.map(l => l.action))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {actions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Entity Type
            </label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            >
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No audit logs found. Logs will appear here as actions are performed in the system.
          </div>
        ) : (
          /* Logs Table */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Entity</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Changes</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {actionIcons[log.action]}
                        <span className="font-semibold text-gray-900 dark:text-white">{log.action}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{log.entity_type.toUpperCase()}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{log.entity_name || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {log.action === 'CREATE' && (
                        <div className="text-green-600 dark:text-green-400">
                          Created with {log.new_value ? Object.keys(log.new_value).length : 0} fields
                        </div>
                      )}
                      {log.action === 'UPDATE' && (
                        <div className="text-blue-600 dark:text-blue-400">
                          {log.new_value ? Object.keys(log.new_value).length : 0} field(s) changed
                        </div>
                      )}
                      {log.action === 'DELETE' && (
                        <div className="text-red-600 dark:text-red-400">Record deleted</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{log.user_id || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && logs.length > 0 && filteredLogs.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No audit logs found matching the selected filters
          </div>
        )}
      </div>
    </div>
  )
}
