#!/bin/bash

# BookAVan Setup Script
# This script helps set up the development environment

set -e

echo "🚐 BookAVan Setup Script"
echo "========================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

echo "✓ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✓ npm version: $(npm --version)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✓ .env file created. Please edit it with your configuration."
else
    echo "✓ .env file already exists"
fi

# Create uploads directory if it doesn't exist
if [ ! -d uploads ]; then
    echo ""
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
    touch uploads/.gitkeep
    echo "✓ uploads directory created"
else
    echo "✓ uploads directory already exists"
fi

# Check if PostgreSQL is available
echo ""
echo "🔍 Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    echo "✓ PostgreSQL client is installed"
    echo ""
    echo "To set up the database, run:"
    echo "  source .env"
    echo "  psql -h \$PGHOST -U \$PGUSER -d \$PGDATABASE -f database/schema.sql"
else
    echo "⚠️  PostgreSQL client not found. You'll need to set up the database manually."
fi

# Check if Docker is available
echo ""
echo "🐳 Checking Docker..."
if command -v docker &> /dev/null; then
    echo "✓ Docker is installed: $(docker --version)"
    echo ""
    echo "To run with Docker Compose:"
    echo "  docker-compose up -d"
else
    echo "⚠️  Docker not found. Install Docker to use containerized deployment."
fi

echo ""
echo "========================"
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env file with your configuration"
echo "  2. Set up PostgreSQL database (see database/schema.sql)"
echo "  3. Configure SendGrid API key"
echo "  4. Register Microsoft Entra ID application"
echo "  5. Run: npm start"
echo ""
echo "For detailed instructions, see README.md"
echo ""

