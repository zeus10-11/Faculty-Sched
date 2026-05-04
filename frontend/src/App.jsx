import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import './index.css'

// Pages
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DepartmentsPage from './pages/DepartmentsPage'
import ProgrammesPage from './pages/ProgrammesPage'
import ModulesPage from './pages/ModulesPage'
import FacultyPage from './pages/FacultyPage'
import RoomsPage from './pages/RoomsPage'
import SchedulePage from './pages/SchedulePage'
import ScheduleWizardPage from './pages/ScheduleWizardPage'
import AdvancedSchedulerPage from './pages/AdvancedSchedulerPage'
import ConflictLogPage from './pages/ConflictLogPage'
import ReportsPage from './pages/ReportsPage'
import AuditLogPage from './pages/AuditLogPage'
import SettingsPage from './pages/SettingsPage'
import UnavailablePeriodsPage from './pages/UnavailablePeriodsPage'
import NotFoundPage from './pages/NotFoundPage'

// Layout
import MainLayout from './components/MainLayout'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check for JWT token in localStorage (from our backend login)
        const token = localStorage.getItem('authToken')
        const userData = localStorage.getItem('user')
        
        if (token && userData) {
          setIsAuthenticated(true)
          setUser(JSON.parse(userData))
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for storage changes (logout from another tab)
    const handleStorageChange = () => {
      checkAuth()
    }

    // Listen for custom auth change event
    const handleAuthChanged = () => {
      checkAuth()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('authChanged', handleAuthChanged)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authChanged', handleAuthChanged)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        <MainLayout user={user}>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/programmes" element={<ProgrammesPage />} />
            <Route path="/modules" element={<ModulesPage />} />
            <Route path="/faculty" element={<FacultyPage />} />
            <Route path="/rooms" element={<RoomsPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/schedule/wizard" element={<ScheduleWizardPage />} />
            <Route path="/schedule/advanced" element={<AdvancedSchedulerPage />} />
            <Route path="/conflicts" element={<ConflictLogPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/unavailable-periods" element={<UnavailablePeriodsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </MainLayout>
      )}
    </Router>
  )
}

export default App
