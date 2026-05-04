# Deployment Guide - Faculty Timetable Scheduler

## Table of Contents
1. [Local Development](#local-development)
2. [Production Deployment](#production-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Database Migration](#database-migration)
5. [Troubleshooting](#troubleshooting)

## Local Development

### Using Docker Compose (Recommended)

```bash
# Clone and navigate to project
cd faculty-scheduler

# Create .env file from example
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update environment variables in backend/.env and frontend/.env

# Start all services
docker-compose up

# Services will be available at:
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# PostgreSQL: localhost:5432
```

### Without Docker

**Terminal 1 - Backend**
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Production Deployment

### Frontend Deployment (Vercel)

1. **Prepare Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/faculty-scheduler.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select "frontend" as root directory
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_anon_key
     VITE_API_URL=https://your-backend-url/api
     ```
   - Click "Deploy"

3. **Auto-deployment**
   - Every push to main branch auto-deploys
   - Vercel provides a production URL

### Backend Deployment (Render)

1. **Prepare Backend**
   ```bash
   # Ensure backend/.env.example is updated
   git add backend/
   git commit -m "Backend configuration"
   git push
   ```

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Click "New Web Service"
   - Connect your GitHub repo
   - Settings:
     - **Name:** faculty-scheduler-backend
     - **Root Directory:** backend
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`
     - **Environment Variables:** (see below)

3. **Set Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET=generate_random_string
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy

### Database Deployment (Supabase - Free Tier)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up (free tier available)

2. **Create Project**
   - Click "New Project"
   - Choose region close to your users
   - Set admin password
   - Note: database_password (save this)

3. **Initialize Database Schema**
   - Go to SQL Editor in your Supabase project
   - Create new query
   - Copy contents of `backend/db/schema.sql`
   - Paste and execute
   - You'll see all tables created

4. **Get Connection Credentials**
   - Go to Project Settings → API
   - Copy:
     - Project URL → `SUPABASE_URL`
     - Anon key → `SUPABASE_ANON_KEY`
     - Service Role key → `SUPABASE_SERVICE_KEY`

5. **Create Test Users**
   ```sql
   -- Go to Authentication → Users
   -- Or use SQL:
   INSERT INTO users (email, role, name, created_at) VALUES
   ('admin@university.edu', 'Admin', 'Admin User', NOW()),
   ('scheduler@university.edu', 'Scheduler', 'Scheduler User', NOW()),
   ('faculty@university.edu', 'Faculty', 'Faculty Member', NOW());
   ```

## Environment Configuration

### Backend (.env)
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
JWT_SECRET=your-secret-key-min-32-chars
FRONTEND_URL=https://your-vercel-url.vercel.app
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_API_URL=https://your-render-backend-url/api
```

## Database Migration

### Backup Database (Supabase)
```bash
# Supabase automated backups available in dashboard
# Go to Database → Backups → Add backup
```

### Restore Schema
If you need to recreate the schema:
1. Go to SQL Editor in Supabase
2. Run the schema.sql again
3. Or use pg_restore if you have a backup

## Security Considerations

1. **Never commit `.env` files**
   - Always use `.env.example` template
   - Add `.env` to `.gitignore`

2. **JWT Secret**
   ```bash
   # Generate strong JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Supabase Service Role Key**
   - Only use on backend, never expose to frontend
   - Frontend uses ANON_KEY (limited permissions)

4. **CORS Configuration**
   - Backend CORS is set to accept FRONTEND_URL
   - Update when moving to production

## Monitoring & Maintenance

### Vercel Dashboard
- View deployment logs
- Monitor performance
- Set up analytics

### Render Dashboard
- View application logs
- Monitor resource usage
- Restart service if needed

### Supabase Dashboard
- Monitor database connections
- View query performance
- Check storage usage

## Troubleshooting

### Connection Refused (Backend)
```bash
# Verify backend is running
curl http://localhost:5000/api/health

# Check if port is in use
lsof -i :5000
```

### Database Connection Error
1. Verify Supabase credentials in backend/.env
2. Check Supabase project is active
3. Run schema.sql again in SQL Editor

### CORS Errors
1. Check FRONTEND_URL in backend .env
2. Verify Vercel URL is set correctly
3. Backend CORS middleware must match deployment domain

### Deployment Stuck
- Vercel: Check build logs in deployment panel
- Render: Check runtime logs in dashboard
- Try redeploying from dashboard

## Cost Estimates (Free Tier)

- **Vercel Frontend**: Free tier includes 100GB bandwidth/month
- **Render Backend**: Free tier includes 750 hours/month
- **Supabase Database**: Free tier includes 500MB storage, 2GB bandwidth
- **Total Cost**: $0 with free tier limitations

For production use, consider:
- Vercel Pro: $20/month
- Render Pro: $12/month
- Supabase Pro: $25/month
- **Estimated Total**: ~$57/month

## Upgrading Services

### Vercel Upgrade
1. Go to Team settings
2. Billing → Select Pro
3. Pay monthly or yearly

### Render Upgrade
1. Go to Dashboard
2. Select service → Settings
3. Change plan tier

### Supabase Upgrade
1. Go to Project Settings
2. Billing → Change plan
3. Select desired tier
