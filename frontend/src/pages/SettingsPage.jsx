import React, { useState, useEffect } from 'react'
import { Save, Moon, Sun, Bell, Lock, User, CheckCircle2 } from 'lucide-react'

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true')
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    scheduleReminders: true,
    conflictAlerts: true,
    systemUpdates: false
  })
  const [systemSettings, setSystemSettings] = useState({
    schedulingPeriod: 12,
    maxSessionsPerDay: 5,
    minBreakTime: 15,
    defaultSessionDuration: 2
  })
  const [saved, setSaved] = useState(false)

  const handleDarkModeToggle = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleNotificationChange = (key) => {
    setNotifications({...notifications, [key]: !notifications[key]})
  }

  const handleSettingChange = (key, value) => {
    setSystemSettings({...systemSettings, [key]: value})
  }

  const handleSave = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications))
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Appearance Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          {darkMode ? <Moon size={24} className="text-blue-600" /> : <Sun size={24} className="text-yellow-600" />}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Enable dark theme for the application</p>
            </div>
            <button
              onClick={handleDarkModeToggle}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                darkMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                darkMode ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Bell size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive important updates via email' },
            { key: 'scheduleReminders', label: 'Schedule Reminders', desc: 'Get reminded about upcoming sessions' },
            { key: 'conflictAlerts', label: 'Conflict Alerts', desc: 'Be notified of scheduling conflicts' },
            { key: 'systemUpdates', label: 'System Updates', desc: 'Receive notifications about system changes' }
          ].map(setting => (
            <div key={setting.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{setting.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{setting.desc}</p>
              </div>
              <input
                type="checkbox"
                checked={notifications[setting.key]}
                onChange={() => handleNotificationChange(setting.key)}
                className="w-5 h-5 rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <Lock size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Scheduling Period (weeks)
              </label>
              <input
                type="number"
                min="4"
                max="52"
                value={systemSettings.schedulingPeriod}
                onChange={(e) => handleSettingChange('schedulingPeriod', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Sessions Per Day
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={systemSettings.maxSessionsPerDay}
                onChange={(e) => handleSettingChange('maxSessionsPerDay', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Break Time (minutes)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={systemSettings.minBreakTime}
                onChange={(e) => handleSettingChange('minBreakTime', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Session Duration (hours)
              </label>
              <input
                type="number"
                min="1"
                max="8"
                value={systemSettings.defaultSessionDuration}
                onChange={(e) => handleSettingChange('defaultSessionDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <User size={24} className="text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
            <p className="font-medium text-gray-900 dark:text-white">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).email : 'admin@university.edu'}</p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Role</p>
            <p className="font-medium text-gray-900 dark:text-white">{localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).role : 'Admin'}</p>
          </div>

          <button className="w-full px-4 py-2 border border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition">
            Change Password
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Save size={20} /> Save Settings
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 size={20} />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  )
}
