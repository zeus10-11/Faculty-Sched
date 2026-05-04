#!/bin/bash

# Faculty Scheduler - Setup Script

echo "=========================================="
echo "Faculty Timetable Scheduler - Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ from nodejs.org"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if directories exist
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "Installing dependencies..."
echo ""

# Install backend dependencies
echo "📦 Backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Frontend dependencies..."
cd ../frontend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

echo "✅ Frontend dependencies installed"
echo ""

# Create .env files if they don't exist
echo "Setting up environment variables..."
echo ""

if [ ! -f "backend/.env" ]; then
    echo "Creating backend/.env..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your Supabase credentials"
fi

if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env..."
    cp frontend/.env.example frontend/.env
    echo "⚠️  Please update frontend/.env with your Supabase credentials"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update environment variables in backend/.env and frontend/.env"
echo "2. Run: npm run dev (in backend directory)"
echo "3. Run: npm run dev (in frontend directory)"
echo "4. Visit http://localhost:3000"
echo ""
echo "See QUICK_START.md for more details"
