# Quick Start Guide

## 5-Minute Setup

### Prerequisites
- Node.js 16+
- Git
- Supabase account (free)

### Step 1: Clone & Install (2 min)
```bash
# Navigate to project
cd faculty-scheduler

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 2: Setup Environment (2 min)
1. Go to [supabase.com](https://supabase.com), create account
2. Create new project (note: Project URL & Anon Key)
3. Go to SQL Editor → create new query
4. Copy contents of `backend/db/schema.sql` → paste & execute
5. Create `.env` files:

**backend/.env:**
```
NODE_ENV=development
PORT=5000
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
JWT_SECRET=my-secret-key-12345
FRONTEND_URL=http://localhost:3000
```

**frontend/.env:**
```
VITE_SUPABASE_URL=https://[your-project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Run (1 min)
**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Demo Credentials
```
Email: admin@university.edu
Password: password123
```

## Troubleshooting
- Port 5000 in use? Kill with: `lsof -ti:5000 | xargs kill -9`
- Database error? Re-run schema.sql in Supabase SQL Editor
- Need help? Check SETUP.md and DEPLOYMENT.md

## Next Steps
1. Add departments via Programmes menu
2. Create modules
3. Add faculty members
4. Start scheduling via Dashboard
