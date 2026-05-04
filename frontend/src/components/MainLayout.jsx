import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Moon, Sun, LogOut } from 'lucide-react'
import NotificationsPanel from './NotificationsPanel'

export default function MainLayout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    localStorage.setItem('darkMode', newDarkMode)
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/departments', label: 'Curriculums', icon: '🏢' },
    { path: '/programmes', label: 'Programmes', icon: '📚' },
    { path: '/modules', label: 'Modules', icon: '📖' },
    { path: '/faculty', label: 'Faculty', icon: '👥' },
    { path: '/rooms', label: 'Rooms', icon: '🏫' },
    { path: '/schedule', label: 'Schedule', icon: '📅' },
    { path: '/schedule/advanced', label: 'Advanced Scheduler', icon: '🤖' },
    { path: '/conflicts', label: 'Conflict Log', icon: '⚠️' },
    { path: '/reports', label: 'Reports', icon: '📈' },
    ...(user?.role === 'Admin' || user?.role === 'Scheduler' ? [
      { path: '/unavailable-periods', label: 'Unavailable Periods', icon: '🚫' },
      { path: '/audit', label: 'Audit Log', icon: '🔍' },
      { path: '/settings', label: 'Settings', icon: '⚙️' }
    ] : [])
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col`}>
          {/* Logo */}
          <div className="p-4 flex items-center justify-between border-b dark:border-gray-700">
            {sidebarOpen && <h1 className="font-bold text-lg text-blue-600">FacultySched</h1>}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'User'}</p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty Timetable Scheduler</h2>
            <div className="flex items-center gap-4">
              <NotificationsPanel />
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {darkMode ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-gray-700" />}
              </button>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
