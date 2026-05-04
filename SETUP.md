# Faculty Timetable Scheduler - Development Setup

## Quick Start

### Prerequisites
- Node.js 16+ installed
- PostgreSQL (or Supabase account)
- Git

### Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### Environment Configuration

#### Backend (.env)
```
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env)
```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=http://localhost:5000/api
```

### Run Development Servers

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Database Setup (Supabase)

1. Create account at supabase.com
2. Create new project
3. Go to SQL Editor
4. Run `backend/db/schema.sql`
5. Copy URL and keys to `.env` files

## Creating Test User

```sql
INSERT INTO users (email, role, name) VALUES
('admin@university.edu', 'Admin', 'Admin User'),
('scheduler@university.edu', 'Scheduler', 'Scheduler User'),
('faculty@university.edu', 'Faculty', 'Faculty Member');
```

## Build for Production

### Frontend
```bash
cd frontend
npm run build
```
Output: `frontend/dist/`

### Backend
No build needed - use `npm start`

## Deployment

### Vercel (Frontend)
1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy

### Render (Backend)
1. Push to GitHub
2. Create Web Service
3. Connect repo
4. Add environment variables
5. Deploy

### Supabase (Database)
Already hosted - just use connection string
