# Faculty Scheduler - Implementation Guide for Remaining Features

## 🎯 Overview

This guide outlines exactly what needs to be built to complete the Faculty Scheduler system. The foundation is complete (60% done). This document provides implementation details, code templates, and step-by-step instructions for the remaining 40%.

---

## 📋 Priority Roadmap

### Phase 1: Core Scheduling (Weeks 1-2) 🔥 CRITICAL
Must complete before system is usable:
- [ ] Scheduling Wizard UI (6-step form)
- [ ] Timetable Grid View (weekly display)
- [ ] Timetable Calendar View (monthly display)

### Phase 2: Analytics & Reporting (Week 3)
Essential for stakeholders:
- [ ] Reports Page with data display
- [ ] Conflict Resolution Modal
- [ ] PDF export integration

### Phase 3: System Management (Week 4)
Admin operations:
- [ ] Audit Log Viewer
- [ ] Settings Panel
- [ ] Notifications System

### Phase 4: Polish & Testing (Week 5+)
Production readiness:
- [ ] Drag-and-drop sessions
- [ ] Performance optimization
- [ ] Unit tests
- [ ] E2E tests

---

## 🔧 Feature 1: Scheduling Wizard (CRITICAL)

### What It Does
6-step wizard form for creating new sessions with real-time conflict checking.

### Steps
1. Select Programme (with active academic year filter)
2. Select Module (from programme's allocated modules)
3. Select Faculty (matching module level & availability)
4. Date & Time (calendar picker + time slots 6am-9pm)
5. Room Selection (optional, shows capacity)
6. Confirm & Save (shows all conflicts for decision)

### File to Create
```
frontend/src/components/ScheduleWizard.jsx (500-700 lines)
```

### Component Structure
```javascript
import React, { useState } from 'react'
import { sessionService } from '../services/api'

export function ScheduleWizard() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    programme_id: null,
    module_id: null,
    faculty_id: null,
    session_date: null,
    start_time: null,
    room_id: null
  })
  const [conflicts, setConflicts] = useState({ hard: [], soft: [] })
  
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }
  
  const handlePrevious = () => setStep(Math.max(1, step - 1))
  
  const handleSubmit = async () => {
    if (conflicts.hard.length > 0) {
      alert('Hard conflicts detected')
      return
    }
    
    if (conflicts.soft.length > 0 && !window.confirm('Soft conflicts detected. Override?')) {
      return
    }
    
    await sessionService.create(formData)
    // Reset form, show success
  }
  
  return (
    <div className="max-w-2xl">
      {step === 1 && <Step1_SelectProgramme />}
      {step === 2 && <Step2_SelectModule />}
      {step === 3 && <Step3_SelectFaculty />}
      {step === 4 && <Step4_DateTime />}
      {step === 5 && <Step5_Room />}
      {step === 6 && <Step6_Confirm />}
      
      <div className="flex gap-2 mt-6">
        {step > 1 && <button onClick={handlePrevious}>← Back</button>}
        {step < 6 && <button onClick={handleNext}>Next →</button>}
        {step === 6 && <button onClick={handleSubmit}>✓ Create Session</button>}
      </div>
    </div>
  )
}
```

### Step 1: Select Programme
```javascript
const Step1_SelectProgramme = () => {
  const [programmes, setProgrammes] = useState([])
  
  useEffect(() => {
    programmeService.getAll().then(setProgrammes)
  }, [])
  
  return (
    <div>
      <h3>Step 1: Select Programme</h3>
      <select value={formData.programme_id} onChange={(e) => 
        setFormData({...formData, programme_id: e.target.value})
      }>
        <option value="">Choose programme...</option>
        {programmes.map(p => (
          <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
        ))}
      </select>
    </div>
  )
}
```

### API Integration Points
- `programmeService.getAll()` - List all programmes
- `moduleService.getByProgrammeId(id)` - Get modules for selected programme
- `facultyService.getByLevel(level)` - Get faculty matching module level
- `roomService.getAll()` - List available rooms
- `sessionService.checkConflicts(data)` - Validate before save
- `sessionService.create(data)` - Save new session

### Conflict Check Integration
```javascript
const checkForConflicts = async (formData) => {
  const response = await sessionService.checkConflicts(formData)
  setConflicts(response)
  
  if (response.hard.length > 0) {
    setError('Cannot proceed: Hard conflicts exist')
  }
}
```

### Estimated Time: 6-8 hours

---

## 🔧 Feature 2: Timetable Grid View (CRITICAL)

### What It Does
Displays sessions in a weekly grid format (7 days × 15 hours).

### File to Create
```
frontend/src/components/TimetableGrid.jsx (400-500 lines)
```

### Component Structure
```javascript
export function TimetableGrid({ sessions, selectedProgramme }) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const hours = Array.from({length: 15}, (_, i) => i + 6) // 6am-9pm
  
  const getSessionsForSlot = (day, hour) => {
    return sessions.filter(s => 
      new Date(s.session_date).toLocaleString('en-US', {weekday: 'long'}) === day &&
      parseInt(s.start_time.split(':')[0]) === hour
    )
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full border">
        <thead>
          <tr>
            <th>Time</th>
            {days.map(day => <th key={day}>{day}</th>)}
          </tr>
        </thead>
        <tbody>
          {hours.map(hour => (
            <tr key={hour}>
              <td className="border px-2 py-1">{hour}:00</td>
              {days.map(day => (
                <td key={day} className="border px-2 py-1">
                  {getSessionsForSlot(day, hour).map(session => (
                    <div key={session.id} 
                         className="bg-blue-500 text-white p-1 rounded text-xs mb-1"
                         onClick={() => showSessionDetails(session)}>
                      {session.module_code}
                      <br/>
                      {session.faculty_name}
                    </div>
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Features to Include
- [ ] Time slot display (6am-9pm hourly)
- [ ] Day columns (Monday-Saturday)
- [ ] Session cards with color coding
- [ ] Click to view session details
- [ ] Drag-to-move sessions (optional first phase)
- [ ] Filter by programme/faculty
- [ ] Date navigation (week previous/next)

### Data Flow
1. Fetch sessions from backend
2. Filter by selected date range
3. Render grid with sessions in correct time slots
4. Handle click to show details
5. Support drag-drop to move sessions

### Estimated Time: 5-7 hours

---

## 🔧 Feature 3: Timetable Calendar View (CRITICAL)

### What It Does
Monthly calendar showing sessions as dots/badges per day.

### File to Create
```
frontend/src/components/TimetableCalendar.jsx (300-400 lines)
```

### Component Structure
```javascript
import { useState } from 'react'

export function TimetableCalendar({ sessions }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const getSessionsForDay = (day) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return sessions.filter(s => s.session_date === dateStr)
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1))}>←</button>
        <h2>{currentMonth.toLocaleString('en', {month: 'long', year: 'numeric'})}</h2>
        <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1))}>→</button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="font-bold text-center">{day}</div>
        ))}
        
        {Array(getFirstDayOfMonth(currentMonth)).fill(null).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        
        {Array(getDaysInMonth(currentMonth)).fill(null).map((_, i) => {
          const day = i + 1
          const daySessionCount = getSessionsForDay(day).length
          
          return (
            <div key={day} className="border rounded p-2 min-h-24 cursor-pointer hover:bg-gray-100">
              <div className="font-bold">{day}</div>
              {daySessionCount > 0 && (
                <div className="mt-2">
                  <span className="inline-block bg-blue-500 text-white rounded-full px-2 py-1 text-xs">
                    {daySessionCount} session{daySessionCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Features to Include
- [ ] Month navigation
- [ ] Session count badges
- [ ] Click day to see sessions
- [ ] Color-code by module/faculty
- [ ] Highlight weekends
- [ ] Holiday markers (optional)

### Estimated Time: 4-6 hours

---

## 📊 Feature 4: Reports Page

### What It Does
Display generated reports with filtering and PDF export.

### File to Update
```
frontend/src/pages/ReportsPage.jsx (600-800 lines)
```

### Report Types to Implement

#### 4.1 Faculty Report
```javascript
const FacultyReport = () => {
  const [reportData, setReportData] = useState(null)
  
  const generateReport = async (facultyId, dateRange) => {
    const data = await reportService.generateFacultyReport(facultyId, dateRange)
    setReportData(data)
  }
  
  return (
    <div>
      <h3>Faculty Load Report</h3>
      <select onChange={(e) => generateReport(e.target.value, dateRange)}>
        <option>Select Faculty...</option>
        {faculty.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
      
      {reportData && (
        <table className="w-full mt-4">
          <thead>
            <tr>
              <th>Module</th>
              <th>Hours</th>
              <th>Sessions</th>
              <th>Leave Days</th>
            </tr>
          </thead>
          <tbody>
            {reportData.modules.map(m => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.total_hours}</td>
                <td>{m.session_count}</td>
                <td>{m.leave_days}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      
      <button onClick={() => exportPDF(reportData)}>📄 Export PDF</button>
    </div>
  )
}
```

#### 4.2 Programme Report
```javascript
// Similar structure showing:
// - Module allocation vs actual usage
// - Completion percentage
// - Sessions per module
// - Faculty assignments
```

#### 4.3 Module Report
```javascript
// Shows:
// - Usage across programmes
// - Total sessions scheduled
// - Faculty teaching it
// - Rooms used
```

#### 4.4 Room Report
```javascript
// Shows:
// - Utilization percentage by day/time
// - Peak hours
// - Bookings heatmap
```

### Estimated Time: 8-10 hours

---

## 🔧 Feature 5: Conflict Resolution Modal

### What It Does
Display conflicts and allow schedulers to resolve them.

### File to Create
```
frontend/src/components/ConflictResolutionModal.jsx (200-300 lines)
```

### Component Structure
```javascript
export function ConflictResolutionModal({ conflict, onResolve, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md">
        <h2>Resolve Conflict</h2>
        
        <div className="my-4">
          <h3 className="font-bold text-red-600">{conflict.type}</h3>
          <p>{conflict.description}</p>
          
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <strong>Details:</strong>
            <ul>
              {conflict.details.map((d, i) => <li key={i}>• {d}</li>)}
            </ul>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onResolve(conflict.id)} className="bg-blue-500 text-white">
            Override & Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Integration
Show modal when hard conflicts (with override reason):
- Faculty override (reschedule other session)
- Room override (book different room)
- Schedule override (extend hours, adjust time)

### Estimated Time: 3-4 hours

---

## 📋 Feature 6: Audit Log Viewer

### What It Does
Display audit trail of all system changes.

### File to Update
```
frontend/src/pages/AuditLogPage.jsx (300-400 lines)
```

### Component Structure
```javascript
export function AuditLogPage() {
  const [auditLog, setAuditLog] = useState([])
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    user_id: '',
    date_from: '',
    date_to: ''
  })
  
  useEffect(() => {
    auditService.getLog(filters).then(setAuditLog)
  }, [filters])
  
  return (
    <div>
      <h1>Audit Log</h1>
      
      {/* Filters */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <select value={filters.action} onChange={(e) => setFilters({...filters, action: e.target.value})}>
          <option value="">All Actions</option>
          <option value="CREATE">Create</option>
          <option value="UPDATE">Update</option>
          <option value="DELETE">Delete</option>
        </select>
        {/* Similar selects for other filters */}
      </div>
      
      {/* Table */}
      <table className="w-full">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>User</th>
            <th>Action</th>
            <th>Entity</th>
            <th>Changes</th>
          </tr>
        </thead>
        <tbody>
          {auditLog.map(log => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.user_email}</td>
              <td><span className={`badge badge-${log.action.toLowerCase()}`}>{log.action}</span></td>
              <td>{log.entity_type} #{log.entity_id}</td>
              <td>
                <button onClick={() => showChanges(log)}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

### Features
- [ ] Filter by action (CREATE, UPDATE, DELETE)
- [ ] Filter by entity type
- [ ] Date range filtering
- [ ] View old/new values in modal
- [ ] Export audit trail
- [ ] User action history

### Estimated Time: 4-5 hours

---

## ⚙️ Feature 7: Settings Panel

### What It Does
Admin configuration for institution settings.

### File to Update
```
frontend/src/pages/SettingsPage.jsx (400-500 lines)
```

### Settings to Configure
```javascript
const SettingsForm = () => {
  const [settings, setSettings] = useState({
    institution_name: '',
    institution_logo: '',
    academic_year_start: '',
    academic_year_end: '',
    default_session_duration: 60,
    work_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    work_hours_start: 6,
    work_hours_end: 21,
    max_faculty_hours_per_week: 30,
    max_sessions_per_day: 8,
    color_theme: 'blue',
    time_format: '24h'
  })
  
  const handleSave = async () => {
    await settingsService.update(settings)
  }
  
  return (
    <form onSubmit={handleSave}>
      <input type="text" value={settings.institution_name} onChange={(e) => setSettings({...settings, institution_name: e.target.value})} />
      
      <input type="date" value={settings.academic_year_start} onChange={(e) => setSettings({...settings, academic_year_start: e.target.value})} />
      
      {/* More form fields for each setting */}
      
      <button type="submit">Save Settings</button>
    </form>
  )
}
```

### Estimated Time: 5-6 hours

---

## 🎯 Implementation Timeline

### Week 1
- Mon-Tue: Scheduling Wizard (Steps 1-3)
- Wed: Scheduling Wizard (Steps 4-6)
- Thu-Fri: Timetable Grid View

### Week 2
- Mon: Timetable Calendar View
- Tue-Wed: Reports Page (all 4 report types)
- Thu: Conflict Resolution Modal
- Fri: Testing & debugging

### Week 3
- Mon-Tue: Audit Log Viewer
- Wed-Thu: Settings Panel
- Fri: Polish & optimize

---

## 🔗 API Endpoints Needed (Already Implemented)

### Scheduling
- `POST /api/sessions` - Create session with conflict check
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get single session
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Conflicts
- `POST /api/sessions/check-conflicts` - Check for conflicts
- `GET /api/conflicts` - List conflicts
- `PUT /api/conflicts/:id/resolve` - Resolve conflict

### Reports
- `GET /api/reports/faculty/:id` - Faculty report
- `GET /api/reports/programme/:id` - Programme report
- `GET /api/reports/module/:id` - Module report
- `GET /api/reports/room/:id` - Room report

### Audit
- `GET /api/audit` - Get audit log

### Settings
- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update settings

All endpoints are already implemented in backend!

---

## 📚 Code Templates

### Toast Notification Pattern
```javascript
import { useToast } from '@/hooks/useToast'

const { toast } = useToast()

// Usage:
toast.success('Session created successfully')
toast.error('Conflict detected')
toast.info('Loading...')
```

### Modal Pattern
```javascript
const [isOpen, setIsOpen] = useState(false)

return (
  <>
    <button onClick={() => setIsOpen(true)}>Open</button>
    
    {isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded">
          {/* Modal content */}
          <button onClick={() => setIsOpen(false)}>Close</button>
        </div>
      </div>
    )}
  </>
)
```

### Async Data Loading Pattern
```javascript
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState(null)

useEffect(() => {
  service.fetchData()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false))
}, [])

if (loading) return <div>Loading...</div>
if (error) return <div>Error: {error.message}</div>
return <div>{/* render data */}</div>
```

---

## ✅ Testing Checklist

### Unit Tests
- [ ] Conflict detection logic
- [ ] Date calculations
- [ ] Role-based access

### Integration Tests
- [ ] Create session end-to-end
- [ ] Generate report end-to-end
- [ ] Update settings end-to-end

### E2E Tests
- [ ] Login → Schedule → Confirm
- [ ] View timetable for all views
- [ ] Generate and export PDF

---

## 🚀 Deployment Checklist

Before going to production:
- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Database schema verified
- [ ] API endpoints tested
- [ ] Error handling verified
- [ ] Performance optimized
- [ ] Security headers set
- [ ] CORS properly configured
- [ ] Logging configured
- [ ] Backup strategy defined

---

## 📞 Support References

- Recharts Documentation: https://recharts.org/
- Date-fns: https://date-fns.org/
- Tailwind UI Components: https://tailwindui.com/
- React Hook Form: https://react-hook-form.com/

---

**Total Estimated Remaining Time**: 40-50 development hours  
**Recommended Team Size**: 2-3 developers  
**Next Session Start Time**: 2-3 hours

When ready, start with Feature 1: Scheduling Wizard
