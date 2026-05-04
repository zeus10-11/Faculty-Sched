import React, { useState, useEffect } from 'react'
import { programmeService, departmentService, moduleService, programmeModuleService } from '../services/api'
import { Plus, Edit, Trash2, Copy, Building2, BookOpen, X } from 'lucide-react'

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState([])
  const [departments, setDepartments] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [selectedProgramme, setSelectedProgramme] = useState(null)
  const [programmeModules, setProgrammeModules] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [moduleFormData, setModuleFormData] = useState({
    module_id: '',
    allocated_hours: 0,
    weekly_target_hours: 0
  })
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    dept_id: '',
    group_label: '',
    level: 'Level 3',
    term: '1',
    start_date: '',
    end_date: '',
    total_weeks: 12,
    allotted_hours: 0,
    status: 'Active',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [progRes, deptRes, modRes] = await Promise.all([
        programmeService.getAll(),
        departmentService.getAll(),
        moduleService.getAll()
      ])
      setProgrammes(progRes.data || [])
      setDepartments(deptRes.data || [])
      setModules(modRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await programmeService.update(editingId, formData)
        setProgrammes(programmes.map(p => p.id === editingId ? { ...p, ...formData } : p))
      } else {
        const res = await programmeService.create(formData)
        setProgrammes([...programmes, res.data])
      }
      resetForm()
    } catch (error) {
      console.error('Error saving programme:', error)
      alert('Error saving programme: ' + error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (programme) => {
    setEditingId(programme.id)
    setFormData(programme)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this programme?')) {
      try {
        await programmeService.delete(id)
        setProgrammes(programmes.filter(p => p.id !== id))
      } catch (error) {
        console.error('Error deleting programme:', error)
        alert('Error deleting programme: ' + error.response?.data?.error || error.message)
      }
    }
  }

  const handleClone = async (id) => {
    try {
      const res = await programmeService.clone(id)
      setProgrammes([...programmes, res.data])
    } catch (error) {
      console.error('Error cloning programme:', error)
      alert('Error cloning programme: ' + error.response?.data?.error || error.message)
    }
  }

  const handleResetAll = async () => {
    if (window.confirm('⚠️ WARNING: This will DELETE ALL programmes. This action cannot be undone. Are you sure?')) {
      setLoading(true)
      try {
        let successCount = 0
        let failedCount = 0
        const errors = []
        
        for (const prog of programmes) {
          try {
            await programmeService.delete(prog.id)
            successCount++
          } catch (error) {
            failedCount++
            errors.push(`${prog.name}: ${error.response?.data?.error || error.message}`)
          }
        }
        
        if (failedCount === 0) {
          setProgrammes([])
          alert('✅ All programmes have been deleted successfully')
        } else {
          alert(`⚠️ Deleted ${successCount} programmes, but ${failedCount} failed:\n\n${errors.join('\n')}`)
          // Refresh the list
          const res = await programmeService.getAll()
          setProgrammes(res.data || [])
        }
      } catch (error) {
        console.error('Error resetting programmes:', error)
        alert(`❌ Error deleting programmes: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const openModuleModal = async (programme) => {
    setSelectedProgramme(programme)
    try {
      const res = await programmeModuleService.getByProgramme(programme.id)
      setProgrammeModules(res.data || [])
    } catch (error) {
      console.error('Error loading programme modules:', error)
      setProgrammeModules([])
    }
    setShowModuleModal(true)
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    if (!moduleFormData.module_id) {
      alert('Please select a module')
      return
    }
    try {
      await programmeModuleService.add({
        programme_id: selectedProgramme.id,
        module_id: moduleFormData.module_id,
        allocated_hours: moduleFormData.allocated_hours,
        weekly_target_hours: moduleFormData.weekly_target_hours
      })
      const res = await programmeModuleService.getByProgramme(selectedProgramme.id)
      setProgrammeModules(res.data || [])
      setModuleFormData({ module_id: '', allocated_hours: 0, weekly_target_hours: 0 })
      alert('Module added successfully!')
    } catch (error) {
      console.error('Error adding module:', error)
      alert('Error adding module: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleRemoveModule = async (programmeModuleId) => {
    if (window.confirm('Remove this module from the programme?')) {
      try {
        await programmeModuleService.delete(programmeModuleId)
        setProgrammeModules(programmeModules.filter(pm => pm.id !== programmeModuleId))
        alert('Module removed successfully!')
      } catch (error) {
        console.error('Error removing module:', error)
        alert('Error removing module: ' + (error.response?.data?.error || error.message))
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      dept_id: '',
      group_label: '',
      level: 'Level 3',
      term: '1',
      start_date: '',
      end_date: '',
      total_weeks: 12,
      allotted_hours: 0,
      status: 'Active',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Programmes</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Add Programme
          </button>
          {programmes.length > 0 && (
            <button
              onClick={handleResetAll}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              🗑️ Reset All
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {editingId ? 'Edit Programme' : 'Add New Programme'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programme Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., BSc Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programme Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., BSC-CS"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department *</label>
                <select
                  value={formData.dept_id}
                  onChange={(e) => setFormData({...formData, dept_id: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Programme Leader</label>
                <input
                  type="text"
                  value={formData.group_label}
                  onChange={(e) => setFormData({...formData, group_label: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Group A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Level 3">Level 3</option>
                  <option value="Level 4">Level 4</option>
                  <option value="Level 5">Level 5</option>
                  <option value="Level 6">Level 6</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Term</label>
                <select
                  value={formData.term}
                  onChange={(e) => setFormData({...formData, term: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="1">Term 1</option>
                  <option value="2">Term 2</option>
                  <option value="3">Term 3</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date *</label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date *</label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Weeks</label>
                <input
                  type="number"
                  min="1"
                  value={formData.total_weeks}
                  onChange={(e) => setFormData({...formData, total_weeks: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allotted Hours</label>
                <input
                  type="number"
                  min="0"
                  value={formData.allotted_hours}
                  onChange={(e) => setFormData({...formData, allotted_hours: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Additional notes"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {editingId ? 'Update Programme' : 'Create Programme'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : programmes.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">No programmes found</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              Add First Programme
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Programme Leader</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {programmes.map((prog) => (
                <tr key={prog.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{prog.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{prog.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{prog.group_label || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      prog.status === 'Active' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
                      prog.status === 'Completed' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                      'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {prog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEdit(prog)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded transition"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => openModuleModal(prog)}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900 text-green-600 dark:text-green-400 rounded transition"
                      title="Manage Modules"
                    >
                      <BookOpen size={18} />
                    </button>
                    <button
                      onClick={() => handleClone(prog.id)}
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 rounded transition"
                      title="Clone"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(prog.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModuleModal && selectedProgramme && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Manage Modules: {selectedProgramme.name}
              </h2>
              <button
                onClick={() => {
                  setShowModuleModal(false)
                  setSelectedProgramme(null)
                  setProgrammeModules([])
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Add Module Form */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-4">Add New Module to Programme</h3>
                <form onSubmit={handleAddModule} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module *</label>
                      <select
                        value={moduleFormData.module_id}
                        onChange={(e) => setModuleFormData({...moduleFormData, module_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select a module</option>
                        {modules.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.code})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allocated Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={moduleFormData.allocated_hours}
                        onChange={(e) => setModuleFormData({...moduleFormData, allocated_hours: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weekly Target Hours</label>
                      <input
                        type="number"
                        min="0"
                        value={moduleFormData.weekly_target_hours}
                        onChange={(e) => setModuleFormData({...moduleFormData, weekly_target_hours: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
                  >
                    Add Module to Programme
                  </button>
                </form>
              </div>

              {/* Assigned Modules List */}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Assigned Modules ({programmeModules.length})
                </h3>
                {programmeModules.length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200">
                      No modules assigned yet. Add one using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {programmeModules.map(pm => {
                      const mod = modules.find(m => m.id === pm.module_id)
                      return (
                        <div key={pm.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {mod?.name} <span className="text-gray-600 dark:text-gray-400">({mod?.code})</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Allocated: {pm.allocated_hours}h | Weekly Target: {pm.weekly_target_hours}h
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveModule(pm.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-4">
              <button
                onClick={() => {
                  setShowModuleModal(false)
                  setSelectedProgramme(null)
                  setProgrammeModules([])
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
