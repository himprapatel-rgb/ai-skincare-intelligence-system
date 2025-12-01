#!/bin/bash

# Post-create script for GitHub Codespaces
# Automatically sets up the development environment

echo "🚀 Setting up AI Skincare Intelligence System..."

# Install Python dependencies
echo "📦 Installing Python packages..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file from example
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Remember to add your DATABASE_URL to .env!"
fi

# Create backend folders
echo "📁 Creating backend structure..."
mkdir -p app/{models,schemas,services,api/v1/endpoints,tests}
touch app/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/services/__init__.py
touch app/api/__init__.py
touch app/api/v1/__init__.py
touch app/api/v1/endpoints/__init__.py
touch app/tests/__init__.py

cd ..

# Install Node.js dependencies (for future frontend)
echo "📦 Installing Node.js packages (placeholder)..."
# npm install will go here when web/mobile are added

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Add your DATABASE_URL to backend/.env"
echo "2. Copy code files from docs/SPRINT-1.1-CODE-FILES.md"
echo "3. Run: cd backend && pytest"
echo "4. Run: uvicorn app.main:app --reload"
echo ""
echo "📚 Documentation: docs/QUICK-START.md"
