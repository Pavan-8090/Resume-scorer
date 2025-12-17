#!/bin/bash
# ResumeChecker Frontend Deployment Script for Ubuntu VPS
# This script installs all dependencies and builds the frontend

set -e  # Exit on error

echo "=========================================="
echo "ResumeChecker Frontend Deployment"
echo "=========================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

cd "$FRONTEND_DIR"

echo "📦 Step 1: Installing system dependencies..."
sudo apt update
sudo apt install -y curl

# Install Node.js 18.x if not already installed
if ! command -v node &> /dev/null; then
    echo "   Installing Node.js 18.x..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "   ✅ Node.js already installed: $NODE_VERSION"
fi

# Verify Node.js and npm
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo "   Node.js: $NODE_VERSION"
echo "   npm: $NPM_VERSION"

echo ""
echo "📦 Step 2: Installing npm dependencies..."
npm install

echo ""
echo "📦 Step 3: Checking for .env.local file..."
if [ ! -f ".env.local" ]; then
    echo "   ⚠️  .env.local file not found. Creating template..."
    cat > .env.local << EOF
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:5000
EOF
    echo "   ✅ Template .env.local created. Please update with your backend URL."
else
    echo "   ✅ .env.local file exists"
fi

echo ""
echo "📦 Step 4: Building frontend (production build)..."
npm run build

echo ""
echo "=========================================="
echo "✅ Frontend deployment setup complete!"
echo "=========================================="
echo ""
echo "To start the frontend server:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "For development mode:"
echo "  npm run dev"
echo ""
echo "Note: Make sure NEXT_PUBLIC_API_URL in .env.local points to your backend URL"
echo ""



