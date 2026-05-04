# 👨‍💻 DEVELOPER REFERENCE - TECHNICAL ARCHITECTURE

## 🏗️ System Architecture Overview

### Technology Stack
- **Frontend:** React 18.2 + Vite 4.4.9 + Tailwind CSS 3.3
- **Backend:** Express.js + Node.js on localhost:5000
- **Database:** Supabase PostgreSQL (14 tables)
- **Authentication:** JWT (stored in localStorage as 'authToken')
- **Charts:** Recharts 2.10
- **Icons:** Lucide React 0.263
- **PDF/Excel:** jsPDF 2.5.1 + XLSX 0.18.5
- **API Client:** Axios 1.5 with interceptor

---

## 📁 Project Structure

```
faculty final/
├── backend/
│   ├── server.js (Express entry point)
│   ├── package.json
│   ├── Dockerfile
│   ├── controllers/ (Business logic)
│   ├── middleware/
│   │   └── auth.js (JWT verification + role-based access)
│   ├── routes/
│   │   ├── auth.js (Login/Register)
│   │   ├── departments.js (CRUD)
│   │   ├── programmes.js (CRUD + date validation)
│   │   ├── modules.js (CRUD)
│   │   ├── programme-modules.js (Many-to-many relationships)
│   │   ├── faculty.js (CRUD + availability + NEWLY ADDED: /leave/all)
│   │   ├── rooms.js (CRUD)
│   │   ├── sessions.js (CRUD + conflict detection backend)
│   │   ├── conflicts.js (Conflict log queries)
│   │   ├── audit.js (Audit trail)
│   │   └── reports.js (Analytics queries)
│   ├── utils/ (Utilities)
│   ├── db/
│   │   └── schema.sql (14 tables definition)
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx (Entry point)
│   │   ├── App.jsx (Router setup)
│   │   ├── index.css (Tailwind + custom styles)
│   │   ├── components/
│   │   │   ├── MainLayout.jsx (UPDATED: Added NotificationsPanel)
│   │   │   ├── NotificationsPanel.jsx (NEW: Bell icon + dropdown)
│   │   │   └── ... (other components)
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ScheduleWizardPage.jsx (COMPLETELY OVERHAULED: 6 steps + conflict detection)
│   │   │   ├── SchedulePage.jsx (COMPLETELY REPLACED: Interactive + filtering)
│   │   │   ├── FacultyDetailPage.jsx (NEW: Analytics dashboard)
│   │   │   ├── FacultyPage.jsx (Faculty list with detail link)
│   │   │   ├── ReportsPage.jsx (COMPLETELY REPLACED: 4 report types + Excel/PDF)
│   │   │   ├── ProgrammesPage.jsx
│   │   │   ├── ModulesPage.jsx
│   │   │   ├── RoomsPage.jsx
│   │   │   ├── DepartmentsPage.jsx
│   │   │   ├── SettingsPage.jsx (Partial implementation)
│   │   │   ├── ConflictLogPage.jsx
│   │   │   ├── AuditLogPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   ├── api.js (Axios service with all API calls)
│   │   │   ├── pdfGenerator.js (NEW: 4 PDF generation functions)
│   │   │   └── ... (other services)
│   │   └── utils/
│   │       ├── conflicts.js (Conflict detection logic)
│   │       ├── formatting.js
│   │       └── pdf.js
│   ├── package.json (All dependencies installed)
│   ├── vite.config.js (Vite configuration)
│   ├── tailwind.config.js (Dark mode + custom colors)
│   └── Dockerfile
│
└── Documentation/
    ├── FEATURE_COMPLETION_SUMMARY.md (NEW: Feature overview)
    ├── NEW_FEATURES_QUICK_START.md (NEW: User guide)
    ├── README.md (System overview)
    ├── API_DOCUMENTATION.md
    └── ... (other docs)
```

---

## 🔌 API Service Layer (`frontend/src/services/api.js`)

All backend calls go through centralized Axios service:

```javascript
// Example API calls
sessionService.create(sessionData)      // POST /api/sessions
sessionService.getAll()                 // GET /api/sessions
sessionService.getById(id)              // GET /api/sessions/:id
sessionService.update(id, data)         // PUT /api/sessions/:id
sessionService.delete(id)               // DELETE /api/sessions/:id

facultyService.getAvailability(id)      // GET /api/faculty/:id/availability
facultyService.getLeave(id)             // GET /api/faculty/:id/leave
// NEW ENDPOINT:
fetch('/api/faculty/leave/all')         // GET /api/faculty/leave/all

// All calls include JWT token via interceptor
```

---

## 📊 Key Data Models

### Session Object
```javascript
{
  id: UUID,
  programme_id: UUID,
  module_id: UUID,
  faculty_id: UUID,
  room_id: UUID (nullable),
  session_date: DATE,
  start_time: TIME,
  duration_hours: INTEGER,
  session_type: STRING (Lecture/Lab/Workshop/Tutorial/Assessment),
  is_locked: BOOLEAN,
  is_extra: BOOLEAN,          // Extra sessions don't count toward module hours
  notes: TEXT,
  created_by: UUID,
  created_at: TIMESTAMP,
  updated_at: TIMESTAMP
}
```

### Faculty Object
```javascript
{
  id: UUID,
  name: STRING,
  staff_id: STRING,
  email: STRING,
  phone: STRING,
  dept_id: UUID,
  qualification_level: INTEGER (1-5),
  max_weekly_hours: INTEGER (default 40),
  status: STRING (Active/Inactive/Leave),
  notes: TEXT,
  created_at: TIMESTAMP
}
```

### Faculty Availability Object
```javascript
{
  id: UUID,
  faculty_id: UUID,
  day_of_week: INTEGER (0-6, Sunday-Saturday),
  start_time: TIME,
  end_time: TIME,
  is_available: BOOLEAN
}
```

### Faculty Leave Object
```javascript
{
  id: UUID,
  faculty_id: UUID,
  leave_date: DATE,
  reason: STRING,
  created_at: TIMESTAMP
}
```

---

## 🔐 Authentication & Authorization

### JWT Token Flow
```
1. Login → Backend validates credentials
2. Backend returns JWT token
3. Frontend stores in localStorage as 'authToken'
4. Axios interceptor adds token to all requests: Authorization: Bearer {token}
5. Backend middleware verifies token on each request
```

### Role-Based Access Control (RBAC)
```javascript
// In auth.js middleware
const roles = {
  'Admin': ['view', 'create', 'update', 'delete', 'admin'],
  'Scheduler': ['view', 'create', 'update'],
  'Faculty': ['view']
}

// Usage: requireRole('Admin')(req, res, next)
```

---

## 🎯 Key Implementation Details

### 1. Conflict Detection System

**Hard Conflicts (Block):**
```javascript
1. Faculty Double-Booking
   - Check: faculty already scheduled at same time

2. Room Double-Booking
   - Check: room already scheduled at same time

3. Faculty on Leave
   - Check: faculty_leave table for leave_date

4. Faculty Not Available
   - Check: faculty_availability table for day/time

5. Faculty Exceeds Max Hours
   - Check: weekly hours > max_weekly_hours

6. Module Exceeds Allocated Hours
   - Check: (excluding is_extra=true) > allotted_hours

7. Programme Double-Booking
   - Check: programme already has session at same time
```

**Soft Conflicts (Warning):**
```javascript
1. Faculty Near Max Capacity
   - Warning if: weekly hours > 80% of max

2. Module Behind Schedule
   - Warning if: scheduled < 70% of allocated

3. Outside Programme Dates
   - Warning if: session date < start_date OR > end_date
```

### 2. Notifications System

**Storage:**
```javascript
// localStorage key: 'notifications'
// Format: Array of notification objects
[
  {
    id: timestamp,
    message: "Session scheduled successfully",
    type: "success", // info|warning|error|success
    timestamp: Date,
    read: false
  }
]
```

**Trigger from Anywhere:**
```javascript
import { triggerNotification } from '@/components/NotificationsPanel'

triggerNotification('Session created!', 'success')
triggerNotification('Conflict detected!', 'warning')
```

### 3. PDF Export Service

**Functions:**
```javascript
// Generate various PDFs
generateSessionPDF(session, faculty, module, room)
generateWeeklyTimetablePDF(sessions, programmes, modules, ...)
generateMonthlySummaryPDF(sessions, programmes, modules, ...)
generateFacultySchedulePDF(faculty_id, sessions, programmes, ...)

// Download helper
downloadPDF(pdf, filename)
```

### 4. Report Generation

**Real-Time Calculation:**
```javascript
// All reports calculate from actual session data
const facultyHours = sessions
  .filter(s => s.faculty_id === faculty.id)
  .reduce((sum, s) => sum + s.duration_hours, 0)

const completion = (totalScheduled / programme.allotted_hours) * 100
```

---

## 🎨 UI Component Patterns

### 1. Page Layout Pattern
```javascript
export default function PageName() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await service.getAll()
      setData(res.data || [])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Page Title</h1>
      {loading ? <Spinner /> : <Content data={data} />}
    </div>
  )
}
```

### 2. Form Pattern
```javascript
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
})

const handleChange = (e) => {
  const { name, value } = e.target
  setFormData(prev => ({ ...prev, [name]: value }))
}

const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    await service.create(formData)
    triggerNotification('Created!', 'success')
  } catch (error) {
    triggerNotification('Error: ' + error.message, 'error')
  }
}
```

### 3. Dark Mode Support
```javascript
// All pages use Tailwind dark: prefix
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  
// MainLayout toggles dark mode
const [darkMode, setDarkMode] = useState(...)
if (newDarkMode) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
```

---

## 📈 Performance Considerations

### 1. Timetable Filtering
- **Best Practice:** Apply filters first, then render
- **Performance:** Filters reduce rendering by 80% with large datasets

### 2. Chart Rendering
- **Best Practice:** Calculate data before passing to chart
- **Performance:** Recharts efficiently re-renders only on data changes

### 3. PDF Generation
- **Consideration:** html2canvas can be slow with large tables
- **Solution:** Limit data shown in PDF (last 8 weeks, etc.)

### 4. Database Queries
- **Best Practice:** Use join queries instead of N+1 queries
- **Status:** All endpoints optimized with Supabase

---

## 🚀 How to Extend the System

### Add a New Report Type

```javascript
// In ReportsPage.jsx
const [reportType, setReportType] = useState('faculty-hours')

// Add new option in report selector
{ value: 'new-report', label: 'New Report', icon: '📊' }

// Add case in generateReport()
if (reportType === 'new-report') {
  reportData = calculateNewReportData()
  fullDetailData = getDetailedData()
}

// Add rendering in renderChart()
case 'new-report':
  return <ResponsiveContainer>
    <BarChart data={data}>{...}</BarChart>
  </ResponsiveContainer>
```

### Add a New Filter

```javascript
// In SchedulePage.jsx - add filter state
const [filters, setFilters] = useState({
  programme: '',
  faculty: '',
  module: '',
  room: '',
  newFilter: '' // Add this
})

// Add filter UI
<select value={filters.newFilter} onChange={handleFilterChange}>
  {/* options */}
</select>

// Update getFilteredSessions()
.filter(s => {
  if (filters.newFilter && s.new_field !== filters.newFilter) return false
  return true
})
```

### Add PDF Export Button

```javascript
import { generateWeeklyTimetablePDF, downloadPDF } from '@/services/pdfGenerator'

<button onClick={handleExportPDF}>
  <Download size={20} /> Export PDF
</button>

const handleExportPDF = async () => {
  const pdf = await generateWeeklyTimetablePDF(...)
  downloadPDF(pdf, 'filename.pdf')
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Sessions not showing in timetable
**Solution:** Check localStorage for authToken, verify session data loads in console

### Issue: Conflict detection not working
**Solution:** Ensure faculty_availability and faculty_leave tables have data

### Issue: PDF export fails
**Solution:** Check browser console for errors, ensure html2canvas is loaded

### Issue: Notifications don't persist
**Solution:** Verify browser localStorage is enabled and not full

---

## 📚 Code Style Guidelines

### Naming Conventions
```javascript
// Components: PascalCase
function MyComponent() {}

// Variables/Functions: camelCase
const myVariable = ''
const myFunction = () => {}

// API calls: Descriptive
sessionService.getById(id)
facultyService.getAvailability(id)

// Event handlers: handleActionNoun
const handleCreateSession = () => {}
const handleDeleteSession = (id) => {}
```

### Component Structure
```javascript
// Order of sections:
1. Imports
2. Hook state (useState)
3. Hook effects (useEffect)
4. Helper functions
5. Event handlers
6. JSX return
7. Export default
```

### Styling Classes Order
```javascript
// Tailwind order:
1. Layout (flex, grid, w-, h-)
2. Spacing (p-, m-, gap-)
3. Colors (bg-, text-, border-)
4. Typography (text-, font-)
5. Transitions (hover:, transition)
6. Responsive (md:, lg:)
7. Dark mode (dark:)
```

---

## 📞 Debugging Tips

### 1. Redux/State Debug
```javascript
// In React DevTools, check component state
// Or in console:
console.log('Component state:', { data, loading, formData })
```

### 2. API Call Debug
```javascript
// Add logging in api.js
axios.interceptors.response.use(
  response => {
    console.log('API Response:', response.data)
    return response
  }
)
```

### 3. Dark Mode Debug
```javascript
// In console:
document.documentElement.classList.contains('dark')
```

### 4. Database Debug
```javascript
// Check Supabase dashboard:
// 1. Go to Supabase console
// 2. View table contents
// 3. Check query logs
```

---

## 🔄 Deployment Checklist

- [ ] All environment variables set (.env)
- [ ] Backend server running on port 5000
- [ ] Database migrations completed
- [ ] Frontend builds without errors: `npm run build`
- [ ] PDF exports working in production
- [ ] Notifications persisting (localStorage enabled)
- [ ] Dark mode toggle functional
- [ ] All routes accessible
- [ ] API endpoints returning data
- [ ] Authentication flow complete

---

**Last Updated:** Latest Implementation  
**Next Developer:** Add your notes here for continuity!
