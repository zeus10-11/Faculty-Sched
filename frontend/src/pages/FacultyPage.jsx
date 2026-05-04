import React, { useState, useEffect } from 'react'
import { facultyService, departmentService, moduleService, facultyModuleService } from '../services/api'
import { Plus, Edit, Trash2, AlertCircle, BookOpen, X } from 'lucide-react'

export default function FacultyPage() {
  const [faculty, setFaculty] = useState([])
  const [departments, setDepartments] = useState([])
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [selectedFacultyForModules, setSelectedFacultyForModules] = useState(null)
  const [assignedModules, setAssignedModules] = useState([])
  const [moduleExpertiseLevel, setModuleExpertiseLevel] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    staff_id: '',
    dept_id: '',
    max_weekly_hours: 40,
    email: '',
    phone: '',
    status: 'Active',
    notes: ''
  })
  const [availableDays, setAvailableDays] = useState({
    0: false, // Sunday
    1: true,  // Monday
    2: true,  // Tuesday
    3: true,  // Wednesday
    4: true,  // Thursday
    5: true,  // Friday
    6: false  // Saturday
  })
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('17:00')

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [facRes, deptRes, modRes] = await Promise.all([
        facultyService.getAll(),
        departmentService.getAll(),
        moduleService.getAll()
      ])
      setFaculty(facRes.data)
      setDepartments(deptRes.data)
      setModules(modRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      // Convert empty dept_id to null for proper database handling
      const submitData = {
        ...formData,
        dept_id: formData.dept_id || null
      }
      
      let facultyId
      if (editingId) {
        await facultyService.update(editingId, submitData)
        setFaculty(faculty.map(f => f.id === editingId ? { ...f, ...submitData } : f))
        facultyId = editingId
      } else {
        const res = await facultyService.create(submitData)
        setFaculty([...faculty, res.data])
        facultyId = res.data.id
      }

      // Save availability for selected days
      for (let day = 0; day < 7; day++) {
        if (availableDays[day]) {
          try {
            await facultyService.addAvailability(facultyId, {
              day_of_week: day,
              start_time: startTime,
              end_time: endTime
            })
          } catch (error) {
            console.error(`Error adding availability for day ${day}:`, error)
          }
        }
      }

      resetForm()
      alert('Faculty member saved successfully!')
    } catch (error) {
      console.error('Error saving faculty:', error)
      alert('Error saving faculty member: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleEdit = (member) => {
    setFormData(member)
    setEditingId(member.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this faculty member?')) {
      try {
        await facultyService.delete(id)
        setFaculty(faculty.filter(f => f.id !== id))
      } catch (error) {
        console.error('Error deleting faculty:', error)
      }
    }
  }

  const openModuleModal = async (fac) => {
    setSelectedFacultyForModules(fac)
    try {
      const res = await facultyModuleService.getByFaculty(fac.id)
      const assigned = res.data || []
      setAssignedModules(assigned)
      
      // Build expertise level map
      const expertiseMap = {}
      assigned.forEach(fm => {
        expertiseMap[fm.module_id] = fm.expertise_level || 'Standard'
      })
      setModuleExpertiseLevel(expertiseMap)
    } catch (error) {
      console.error('Error fetching assigned modules:', error)
      setAssignedModules([])
      setModuleExpertiseLevel({})
    }
    setShowModuleModal(true)
  }

  const handleAssignModule = async (moduleId) => {
    try {
      // Check if module is already assigned
      const isAlreadyAssigned = assignedModules.some(am => am.module_id === moduleId)
      if (isAlreadyAssigned) {
        alert('This module is already assigned to this faculty member. Change the expertise level instead.')
        return
      }

      await facultyModuleService.assign({
        faculty_id: selectedFacultyForModules.id,
        module_id: moduleId,
        expertise_level: moduleExpertiseLevel[moduleId] || 'Standard'
      })
      
      // Refresh assigned modules
      const res = await facultyModuleService.getByFaculty(selectedFacultyForModules.id)
      const assigned = res.data || []
      setAssignedModules(assigned)
    } catch (error) {
      console.error('Error assigning module:', error)
      alert('Error assigning module: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleRemoveModule = async (moduleId) => {
    try {
      // Find the faculty_modules entry to delete
      const entry = assignedModules.find(am => am.module_id === moduleId)
      if (entry) {
        await facultyModuleService.remove(entry.id)
        setAssignedModules(assignedModules.filter(am => am.module_id !== moduleId))
        
        const newLevels = { ...moduleExpertiseLevel }
        delete newLevels[moduleId]
        setModuleExpertiseLevel(newLevels)
      }
    } catch (error) {
      console.error('Error removing module:', error)
      alert('Error removing module: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleExpertiseLevelChange = async (moduleId, level) => {
    try {
      // Find the faculty-modules entry
      const entry = assignedModules.find(am => am.module_id === moduleId)
      if (entry) {
        // Update on backend
        await facultyModuleService.update(entry.id, { expertise_level: level })
      }
      
      // Update local state
      setModuleExpertiseLevel({
        ...moduleExpertiseLevel,
        [moduleId]: level
      })
    } catch (error) {
      console.error('Error updating expertise level:', error)
      alert('Error updating expertise level: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleResetAll = async () => {
    if (window.confirm('⚠️ WARNING: This will DELETE ALL faculty members. This action cannot be undone. Are you sure?')) {
      setLoading(true)
      try {
        let successCount = 0
        let failedCount = 0
        const errors = []
        
        for (const fac of faculty) {
          try {
            await facultyService.delete(fac.id)
            successCount++
          } catch (error) {
            failedCount++
            errors.push(`${fac.name}: ${error.response?.data?.error || error.message}`)
          }
        }
        
        if (failedCount === 0) {
          setFaculty([])
          alert('✅ All faculty members have been deleted successfully')
        } else {
          alert(`⚠️ Deleted ${successCount} faculty members, but ${failedCount} failed:\n\n${errors.join('\n')}`)
          // Refresh the list
          const res = await facultyService.getAll()
          setFaculty(res.data || [])
        }
      } catch (error) {
        console.error('Error resetting faculty:', error)
        alert(`❌ Error deleting faculty: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      staff_id: '',
      dept_id: '',
      max_weekly_hours: 40,
      email: '',
      phone: '',
      status: 'Active',
      notes: ''
    })
    setAvailableDays({
      0: false,
      1: true,
      2: true,
      3: true,
      4: true,
      5: true,
      6: false
    })
    setStartTime('08:00')
    setEndTime('17:00')
    setEditingId(null)
    setShowForm(false)
  }

  const getLoadIndicator = (hourScheduled, maxHours) => {
    const percentage = (hourScheduled / maxHours) * 100
    if (percentage > 100) return 'red'
    if (percentage > 80) return 'amber'
    return 'green'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Faculty Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Add Faculty
          </button>
          {faculty.length > 0 && (
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
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Faculty Member' : 'New Faculty Member'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Staff ID"
                value={formData.staff_id}
                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={formData.dept_id}
                onChange={(e) => setFormData({ ...formData, dept_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Curriculum</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />

              <input
                type="number"
                placeholder="Max Weekly Hours"
                value={formData.max_weekly_hours}
                onChange={(e) => setFormData({ ...formData, max_weekly_hours: parseInt(e.target.value) })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white h-20"
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Available Days & Hours</h3>
              
              <div className="grid grid-cols-4 gap-2 mb-4">
                {dayNames.map((day, idx) => (
                  <label key={idx} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availableDays[idx]}
                      onChange={(e) => setAvailableDays({...availableDays, [idx]: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time (available days)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time (available days)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading faculty...</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Staff ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Level</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Max Hours</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faculty.map((member) => (
                <tr key={member.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{member.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.staff_id}</td>

                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.max_weekly_hours}h</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{member.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button onClick={() => handleEdit(member)} className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => openModuleModal(member)} className="text-green-600 hover:text-green-800 dark:hover:text-green-400">
                      <BookOpen size={18} />
                    </button>
                    <button onClick={() => handleDelete(member.id)} className="text-red-600 hover:text-red-800 dark:hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModuleModal && selectedFacultyForModules && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-6 py-4 flex items-center justify-between border-b">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Assign Modules to {selectedFacultyForModules.name}
              </h3>
              <button
                onClick={() => {
                  setShowModuleModal(false)
                  setSelectedFacultyForModules(null)
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Available Modules</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {modules.filter(m => m.status !== 'Inactive').map(mod => {
                    const isAssigned = assignedModules.some(am => am.module_id === mod.id)
                    const expertise = moduleExpertiseLevel[mod.id] || 'Standard'
                    
                    return (
                      <div key={mod.id} className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{mod.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{mod.code}</div>
                        </div>
                        
                        {isAssigned ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={expertise}
                              onChange={(e) => handleExpertiseLevelChange(mod.id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white"
                            >
                              <option value="Basic">Basic</option>
                              <option value="Standard">Standard</option>
                              <option value="Expert">Expert</option>
                              <option value="Other">Other</option>
                            </select>
                            <button
                              onClick={() => handleRemoveModule(mod.id)}
                              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              handleExpertiseLevelChange(mod.id, 'Standard')
                              handleAssignModule(mod.id)
                            }}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setShowModuleModal(false)
                    setSelectedFacultyForModules(null)
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
