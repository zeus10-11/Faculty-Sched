import React, { useState, useEffect } from 'react'
import { roomService } from '../services/api'
import { Plus, Edit, Trash2 } from 'lucide-react'

export default function RoomsPage() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    capacity: 30,
    type: 'Lecture Hall',
    floor: '',
    building: '',
    notes: ''
  })

  const types = ['Lecture Hall', 'Lab', 'Workshop', 'Simulation Room']

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const res = await roomService.getAll()
      setRooms(res.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        await roomService.update(editingId, formData)
        setRooms(rooms.map(r => r.id === editingId ? { ...r, ...formData } : r))
      } else {
        const res = await roomService.create(formData)
        setRooms([...rooms, res.data])
      }
      resetForm()
    } catch (error) {
      console.error('Error saving room:', error)
    }
  }

  const handleEdit = (room) => {
    setFormData(room)
    setEditingId(room.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Delete this room?')) {
      try {
        await roomService.delete(id)
        setRooms(rooms.filter(r => r.id !== id))
      } catch (error) {
        console.error('Error deleting room:', error)
      }
    }
  }

  const handleResetAll = async () => {
    if (window.confirm('⚠️ WARNING: This will DELETE ALL rooms. This action cannot be undone. Are you sure?')) {
      setLoading(true)
      try {
        let successCount = 0
        let failedCount = 0
        const errors = []
        
        for (const room of rooms) {
          try {
            await roomService.delete(room.id)
            successCount++
          } catch (error) {
            failedCount++
            errors.push(`${room.name}: ${error.response?.data?.error || error.message}`)
          }
        }
        
        if (failedCount === 0) {
          setRooms([])
          alert('✅ All rooms have been deleted successfully')
        } else {
          alert(`⚠️ Deleted ${successCount} rooms, but ${failedCount} failed:\n\n${errors.join('\n')}`)
          // Refresh the list
          const res = await roomService.getAll()
          setRooms(res.data || [])
        }
      } catch (error) {
        console.error('Error resetting rooms:', error)
        alert(`❌ Error deleting rooms: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      capacity: 30,
      type: 'Lecture Hall',
      floor: '',
      building: '',
      notes: ''
    })
    setEditingId(null)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rooms & Venues</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} /> Add Room
          </button>
          {rooms.length > 0 && (
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
            {editingId ? 'Edit Room' : 'New Room'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Room Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                required
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input
                type="text"
                placeholder="Floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
              <input
                type="text"
                placeholder="Building"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white h-20"
            />
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
          <div className="p-6 text-center">Loading rooms...</div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Code</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Capacity</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Building</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Floor</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{room.code}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.capacity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.building}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{room.floor}</td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button onClick={() => handleEdit(room)} className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(room.id)} className="text-red-600 hover:text-red-800 dark:hover:text-red-400">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
