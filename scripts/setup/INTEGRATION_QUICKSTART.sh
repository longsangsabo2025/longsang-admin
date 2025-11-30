#!/bin/bash

echo "========================================"
echo "  Long Sang Forge - Integration Setup"
echo "  AI Automation System Full Stack"
echo "========================================"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker not found! Please install Docker."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo "[SETUP] Creating .env file from example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your API keys!"
    echo "   Required keys:"
    echo "   - OPENAI_API_KEY or ANTHROPIC_API_KEY"
    echo "   - VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    echo ""
    echo "Opening .env file for editing..."
    ${EDITOR:-nano} .env
fi

echo "[1/4] Checking environment configuration..."
if grep -q "OPENAI_API_KEY" .env; then
    echo "✓ OpenAI API key configured"
elif grep -q "ANTHROPIC_API_KEY" .env; then
    echo "✓ Anthropic API key configured"
else
    echo "⚠️  Warning: No AI API key found. System will use mock responses."
fi
echo ""

echo "[2/4] Building Docker images..."
docker-compose -f docker-compose.integration.yml build
if [ $? -ne 0 ]; then
    echo "[ERROR] Docker build failed!"
    exit 1
fi
echo "✓ Docker images built successfully"
echo ""

echo "[3/4] Starting services..."
docker-compose -f docker-compose.integration.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start services!"
    exit 1
fi
echo "✓ Services started"
echo ""

echo "[4/4] Waiting for services to be ready..."
sleep 10

# Check AI Backend
echo "Checking AI Backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✓ AI Backend is running"
else
    echo "⚠️  AI Backend not ready yet, might need a few more seconds..."
fi

# Check Frontend
echo "Checking Frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✓ Frontend is running"
else
    echo "⚠️  Frontend not ready yet, building..."
fi

echo ""
echo "========================================"
echo "  🎉 Integration Setup Complete!"
echo "========================================"
echo ""
echo "Services running:"
echo "  • Frontend:     http://localhost:5173"
echo "  • AI Backend:   http://localhost:8000"
echo "  • API Docs:     http://localhost:8000/docs"
echo "  • Qdrant UI:    http://localhost:6333/dashboard"
echo "  • Redis:        localhost:6379"
echo ""
echo "Automation Dashboard:"
echo "  → http://localhost:5173/automation"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.integration.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.integration.yml down"
echo ""

# Try to open browser (works on macOS and some Linux)
if command -v open &> /dev/null; then
    open http://localhost:5173/automation
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173/automation
fi

echo "System is running! Check your browser at http://localhost:5173/automation"
