import React, { useState, useEffect } from 'react'
import { Bell, AlertTriangle, AlertCircle, Trash2 } from 'lucide-react'

export default function NotificationsPanel() {
  const [notifications, setNotifications] = useState([])
  const [showPanel, setShowPanel] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    loadNotifications()
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadNotifications = () => {
    // Get notifications from localStorage
    const stored = localStorage.getItem('notifications') || '[]'
    const notifs = JSON.parse(stored)
    setNotifications(notifs)
    const unread = notifs.filter(n => !n.read).length
    setUnreadCount(unread)
  }

  const addNotification = (message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      message,
      type, // 'info', 'warning', 'error', 'success'
      timestamp: new Date(),
      read: false
    }
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]')
    notifs.unshift(newNotif)
    if (notifs.length > 50) notifs.pop() // Keep only last 50
    localStorage.setItem('notifications', JSON.stringify(notifs))
    loadNotifications()
  }

  const markAsRead = (id) => {
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n)
    localStorage.setItem('notifications', JSON.stringify(updated))
    loadNotifications()
  }

  const deleteNotification = (id) => {
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]').filter(n => n.id !== id)
    localStorage.setItem('notifications', JSON.stringify(notifs))
    loadNotifications()
  }

  const markAllAsRead = () => {
    const notifs = JSON.parse(localStorage.getItem('notifications') || '[]')
    const updated = notifs.map(n => ({ ...n, read: true }))
    localStorage.setItem('notifications', JSON.stringify(updated))
    loadNotifications()
  }

  const clearAll = () => {
    localStorage.setItem('notifications', JSON.stringify([]))
    loadNotifications()
    setShowPanel(false)
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400" />
      case 'error':
        return <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
      default:
        return <Bell size={16} className="text-blue-600 dark:text-blue-400" />
    }
  }

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700'
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {showPanel && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell size={18} /> Notifications
              {unreadCount > 0 && <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell size={32} className="mx-auto mb-2 opacity-30" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-3 cursor-pointer transition border-l-4 ${
                      notif.read
                        ? 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 opacity-60'
                        : `${getNotificationStyle(notif.type)} border-blue-300 dark:border-blue-700 hover:shadow-md`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getNotificationIcon(notif.type)}
                      <div className="flex-1">
                        <p className={`text-sm ${notif.read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold text-gray-900 dark:text-white'}`}>
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notif.id)
                        }}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={clearAll}
                className="flex-1 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close panel when clicking outside */}
      {showPanel && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowPanel(false)}
        ></div>
      )}
    </div>
  )
}

// Export function to trigger notifications from anywhere
export const triggerNotification = (message, type = 'info') => {
  const notif = {
    id: Date.now(),
    message,
    type,
    timestamp: new Date(),
    read: false
  }
  const notifs = JSON.parse(localStorage.getItem('notifications') || '[]')
  notifs.unshift(notif)
  if (notifs.length > 50) notifs.pop()
  localStorage.setItem('notifications', JSON.stringify(notifs))
  
  // Dispatch custom event so NotificationsPanel updates
  window.dispatchEvent(new CustomEvent('notificationAdded', { detail: notif }))
}
