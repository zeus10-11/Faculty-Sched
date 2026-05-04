import React, { useState, useEffect } from 'react'
import { moduleService } from '../services/api'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'

export default function ModulesPage() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    level: 'Level 4',
    default_hours: 30,
    type: 'Lecture',
    description: '',
    is_shared: false
  })

  const levels = ['Level 3', 'Level 4', 'Level 5', 'Level 6', 'Other']
  const types = ['Lecture', 'Lab', 'Workshop', 'Short Course', 'Assessment', 'Schematic']

  useEffect(() => {
    fetchModules()
  }, [])

  const fetchModules = async () => {
    try {
      const res = await moduleService.getAll()
      setModules(res.data || [])
    } catch (error) {
      console.error('Error fetching modules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await moduleService.update(editingId, formData)
        setModules(modules.map(m => m.id === editingId ? { ...m, ...formData } : m))
      } else {
        const res = await moduleService.create(formData)
        setModules([...modules, res.data])
      }
      resetForm()
    } catch (error) {
      console.error('Error saving module:', error)
      alert('Error saving module: ' + error.response?.data?.error || error.message)
    }
  }

  const handleEdit = (module) => {
    setEditingId(module.id)
    setFormData(module)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await moduleService.delete(id)
        setModules(modules.filter(m => m.id !== id))
      } catch (error) {
        console.error('Error deleting module:', error)
        alert('Error deleting module: ' + error.response?.data?.error || error.message)
      }
    }
  }

  const handleResetAll = async () => {
    if (window.confirm('⚠️ WARNING: This will DELETE ALL modules. This action cannot be undone. Are you sure?')) {
      setLoading(true)
      try {
        let successCount = 0
        let failedCount = 0
        const errors = []
        
        for (const mod of modules) {
          try {
            await moduleService.delete(mod.id)
            successCount++
          } catch (error) {
            failedCount++
            errors.push(`${mod.name}: ${error.response?.data?.error || error.message}`)
          }
        }
        
        if (failedCount === 0) {
          setModules([])
          alert('✅ All modules have been deleted successfully')
        } else {
          alert(`⚠️ Deleted ${successCount} modules, but ${failedCount} failed:\n\n${errors.join('\n')}`)
          // Refresh the list
          const res = await moduleService.getAll()
          setModules(res.data || [])
        }
      } catch (error) {
        console.error('Error resetting modules:', error)
        alert(`❌ Error deleting modules: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      level: 'Level 4',
      default_hours: 30,
      type: 'Lecture',
      description: '',
      is_shared: false
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Modules</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Add Module
          </button>
          {modules.length > 0 && (
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
            {editingId ? 'Edit Module' : 'Add New Module'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Module Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Data Structures"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Module Code *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., CS201"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Level *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {levels.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Default Hours *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.default_hours}
                  onChange={(e) => setFormData({...formData, default_hours: parseInt(e.target.value)})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 pt-8">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({...formData, is_shared: e.target.checked})}
                    className="rounded"
                  />
                  Shared Module
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                placeholder="Module description"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {editingId ? 'Update Module' : 'Create Module'}
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

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : modules.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No modules found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Add First Module
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Level</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Shared</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {modules.map(module => (
                <tr key={module.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{module.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{module.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{module.level}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{module.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{module.default_hours}h</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      module.is_shared 
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}>
                      {module.is_shared ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEdit(module)}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400 rounded transition"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(module.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 rounded transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
