import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { conflictService } from '../services/api'

export default function ConflictLogPage() {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterSeverity, setFilterSeverity] = useState('All')

  useEffect(() => {
    fetchConflicts()
  }, [])

  const fetchConflicts = async () => {
    try {
      const res = await conflictService.getAll()
      setConflicts(res.data || [])
    } catch (error) {
      console.error('Error fetching conflicts:', error)
      setConflicts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredConflicts = filterSeverity === 'All' 
    ? conflicts 
    : conflicts.filter(c => c.severity === filterSeverity)

  const resolveConflict = async (id) => {
    try {
      await conflictService.resolve(id, { resolved_by: 'admin@university.edu' })
      // Update local state
      setConflicts(conflicts.map(c => 
        c.id === id ? {...c, resolved_by: 'admin@university.edu'} : c
      ))
      alert('✅ Conflict resolved successfully')
    } catch (error) {
      console.error('Error resolving conflict:', error)
      alert('❌ Failed to resolve conflict: ' + error.response?.data?.error || error.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conflict Log</h1>
        <div className="flex gap-2 items-center">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="All">All Conflicts</option>
            <option value="Hard">Hard Conflicts</option>
            <option value="Soft">Soft Conflicts</option>
          </select>
          <button
            onClick={fetchConflicts}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : filteredConflicts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No conflicts found</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Conflicts will appear here when scheduling issues are detected
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConflicts.map(conflict => (
            <div key={conflict.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4" 
              style={{
                borderLeftColor: conflict.severity === 'Hard' ? '#ef4444' : '#f59e0b'
              }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  {conflict.severity === 'Hard' ? (
                    <XCircle size={24} className="text-red-600 flex-shrink-0 mt-1" />
                  ) : (
                    <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {conflict.conflict_type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {conflict.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    conflict.severity === 'Hard'
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {conflict.severity}
                  </span>
                  {!conflict.resolved_by && (
                    <button
                      onClick={() => resolveConflict(conflict.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition"
                    >
                      Resolve
                    </button>
                  )}
                  {conflict.resolved_by && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded font-semibold">
                      Resolved
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>Created: {new Date(conflict.created_at).toLocaleString()}</p>
                {conflict.resolved_by && (
                  <p className="text-green-600 dark:text-green-400">Resolved by: {conflict.resolved_by}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
