# Faculty Timetable Scheduling System

A comprehensive web application for managing academic schedules, faculty availability, and session planning with real-time conflict detection.

## 🎯 Features

### Core Modules
- **Department Management** - Organize academic departments
- **Programme/Course Management** - Manage academic programs with detailed allocation
- **Module Management** - Global module catalog with shared module support
- **Faculty Management** - Staff profiles with availability and leave tracking
- **Room/Venue Management** - Resource scheduling and utilization tracking
- **Scheduling Engine** - 6-step wizard with live conflict detection
- **Timetable Views** - Weekly grid and monthly calendar views
- **Dashboard** - Real-time analytics and alerts
- **PDF Export** - Generate timetables and reports
- **Reports** - Faculty, Programme, Module, and Room utilization reports
- **Audit Logging** - Complete activity tracking
- **Notifications** - Real-time alerts for conflicts and scheduling changes

### Role-Based Access Control
- **Admin** - Full system access, user management
- **Scheduler** - Create/edit sessions, view all data
- **Faculty** - View own timetable only

## 🛠 Tech Stack

- **Frontend**: React 18 + Tailwind CSS + shadcn/ui + Recharts
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF + html2canvas
- **Drag-and-Drop**: @dnd-kit
- **Deployment**: Vercel (frontend), Render (backend), Supabase (database)

## 📋 Project Structure

```
faculty-scheduler/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   ├── App.jsx         # Main app component
│   │   └── index.css       # Tailwind CSS
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── backend/
│   ├── routes/             # API route handlers
│   │   ├── auth.js
│   │   ├── departments.js
│   │   ├── programmes.js
│   │   ├── modules.js
│   │   ├── faculty.js
│   │   ├── rooms.js
│   │   ├── sessions.js
│   │   ├── conflicts.js
│   │   ├── audit.js
│   │   └── reports.js
│   ├── middleware/         # Express middleware
│   │   └── auth.js
│   ├── controllers/        # Business logic
│   ├── utils/             # Utility functions
│   ├── db/
│   │   └── schema.sql     # Database schema
│   ├── server.js          # Express app entry
│   └── package.json
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- PostgreSQL database (or Supabase account)
- Git

### Backend Setup

1. Clone the repository and navigate to backend:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:3000
```

5. Run the server:
```bash
npm run dev
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

5. Start development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:3000`

## 🔧 Database Setup

### Supabase Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy `backend/db/schema.sql` content
3. Go to SQL Editor in Supabase dashboard
4. Create a new query and paste the schema
5. Execute the SQL to create all tables

### Local PostgreSQL
If using local PostgreSQL instead of Supabase:
```bash
psql -U postgres -d your_database_name -f backend/db/schema.sql
```

## 📊 Database Schema

### Core Tables
- `departments` - Academic departments
- `programmes` - Academic programs/courses
- `modules` - Course modules
- `programme_modules` - Module assignments to programs
- `faculty` - Staff members
- `faculty_availability` - Weekly availability
- `faculty_leave` - Leave dates
- `rooms` - Venues/rooms
- `sessions` - Scheduled sessions
- `conflicts_log` - Conflict tracking
- `audit_log` - Activity logging
- `notifications` - User notifications
- `users` - System users
- `settings` - Configuration

## 🔐 Authentication

The system uses Supabase Auth with JWT tokens. After login, a token is stored in localStorage and included in all API requests.

### Demo Credentials
```
Email: admin@university.edu
Password: password123
Role: Admin
```

## 📱 UI/UX Features

- **Dark Mode Toggle** - Stored in localStorage
- **Responsive Design** - Mobile-optimized layouts
- **Real-time Validation** - Form validation with inline feedback
- **Toast Notifications** - User feedback on actions
- **Loading Skeletons** - Better perceived performance
- **Confirmation Modals** - Safety on destructive actions
- **Color-coded Status Badges** - Quick visual identification

## 🎨 Scheduling Engine

### 6-Step Wizard
1. **Select Programme** - Choose target program
2. **Select Module** - Pick module from program's assignment
3. **Select Faculty** - Faculty matching module level & availability
4. **Select Date & Time** - Date picker with time slot selector
5. **Select Room** - Optional room booking
6. **Confirm & Save** - Review with conflict check

### Conflict Detection

**Hard Conflicts** (Block Save):
- Faculty double-booking
- Room double-booking
- Duplicate programme session
- Faculty unavailable
- Faculty max hours exceeded
- Module hours exceeded

**Soft Warnings** (Allow Override):
- Module behind schedule
- Faculty high utilization (>80%)
- Over weekly module target
- Outside active programme weeks

## 📊 Reports

Available reports:
- **Faculty Report** - Hours, modules, leave, schedule
- **Programme Report** - Completion %, sessions, hours tracking
- **Module Report** - Usage across programmes, total hours
- **Room Report** - Utilization heatmap by time/day

All reports support:
- Date range filtering
- PDF export
- CSV export

## 🚢 Deployment

### Frontend (Vercel)
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL`
4. Deploy - auto-deploys on git push

### Backend (Render)
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect GitHub repository
4. Set environment variables
5. Deploy

### Database (Supabase)
1. Create Supabase project (free tier available)
2. Run schema SQL in SQL Editor
3. Supabase provides URL and keys automatically

## 📝 API Documentation

All API endpoints require authentication token in header:
```
Authorization: Bearer <token>
```

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Resources
- `GET/POST /api/departments` - Department CRUD
- `GET/POST /api/programmes` - Programme CRUD
- `GET/POST /api/modules` - Module CRUD
- `GET/POST /api/faculty` - Faculty CRUD
- `GET/POST /api/rooms` - Room CRUD
- `GET/POST /api/sessions` - Session CRUD with conflict check
- `GET /api/conflicts` - View conflict log
- `GET /api/reports/{type}/{id}` - Generate reports
- `GET /api/audit` - Audit trail (admin only)

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Or use different port
PORT=5001 npm run dev
```

### Database connection error
- Verify Supabase credentials in `.env`
- Check PostgreSQL is running (if local)
- Ensure schema is imported

### CORS errors
- Verify `FRONTEND_URL` in backend `.env`
- Check CORS middleware in `server.js`

### Module not found errors
```bash
cd frontend && npm install
cd ../backend && npm install
```

## 📄 License

MIT License - feel free to use this project commercially

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ for academic scheduling**
