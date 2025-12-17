#!/bin/bash
# ResumeChecker Backend Deployment Script for Ubuntu VPS
# This script installs all dependencies and sets up the backend

set -e  # Exit on error

echo "=========================================="
echo "ResumeChecker Backend Deployment"
echo "=========================================="
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend_python"

cd "$BACKEND_DIR"

echo "📦 Step 1: Installing system dependencies..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv python3-dev build-essential \
    libffi-dev libssl-dev libjpeg-dev zlib1g-dev libpng-dev \
    libopenblas-dev liblapack-dev libatlas-base-dev gfortran

echo ""
echo "📦 Step 2: Creating Python virtual environment..."
if [ -d "venv" ]; then
    echo "   Virtual environment already exists, skipping..."
else
    python3 -m venv venv
    echo "   ✅ Virtual environment created"
fi

echo ""
echo "📦 Step 3: Activating virtual environment and installing Python packages..."
source venv/bin/activate

# Upgrade pip first
pip install --upgrade pip setuptools wheel

# Install requirements
echo "   Installing Python dependencies (this may take several minutes)..."
pip install -r requirements.txt

echo ""
echo "📦 Step 4: Checking for .env file..."
if [ ! -f ".env" ]; then
    echo "   ⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Server Configuration
PORT=5000

# Hugging Face Hub Configuration
HF_TOKEN=your_huggingface_token_here

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000

# Model Configuration (Optional)
HF_MODEL_ID=all-MiniLM-L6-v2
OPENAI_MODEL=gpt-4
HF_INFERENCE_MODEL=mistralai/Mistral-7B-Instruct-v0.2
USE_AI_ONLY=true
EOF
    echo "   ✅ Template .env file created. Please edit it with your actual tokens."
else
    echo "   ✅ .env file exists"
fi

echo ""
echo "📦 Step 5: Testing backend installation..."
cd "$BACKEND_DIR"
source venv/bin/activate
python3 -c "import fastapi, uvicorn; print('✅ FastAPI and Uvicorn imported successfully')" || {
    echo "❌ Error: Failed to import required packages"
    exit 1
}

# Test that fitz import works (check for frontend conflict)
python3 -c "import fitz; print('✅ PyMuPDF (fitz) imported successfully')" || {
    echo "⚠️  Warning: PyMuPDF import test failed, but this may be OK if frontend directory exists"
}

echo ""
echo "=========================================="
echo "✅ Backend deployment setup complete!"
echo "=========================================="
echo ""
echo "To start the backend server:"
echo "  cd backend_python"
echo "  source venv/bin/activate"
echo "  uvicorn main:app --host 0.0.0.0 --port 5000"
echo ""
echo "Or use systemd service (see DEPLOY_UBUNTU.md)"
echo ""



