#!/bin/bash

# ================================================
# START ALL SERVICES - ONE COMMAND TO RULE THEM ALL
# ================================================
# Bash script for Linux/Mac users

echo "🚀 Starting SABO ARENA - Complete Stack"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found! Please install Node.js${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing dependencies...${NC}"
    npm install
fi

if [ ! -d "api/node_modules" ]; then
    echo -e "${YELLOW}📥 Installing API dependencies...${NC}"
    cd api && npm install && cd ..
fi

# Create logs directory
mkdir -p logs

echo ""
echo -e "${YELLOW}🎯 Starting services...${NC}"
echo ""

# Kill existing processes
echo -e "${YELLOW}🔄 Cleaning up existing processes...${NC}"
lsof -ti:8080 -ti:3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start API Server
echo -e "${GREEN}🟢 Starting API Server (Port 3001)...${NC}"
cd api && node server.js > ../logs/api.log 2>&1 &
API_PID=$!
cd ..

sleep 3

# Start Frontend
echo -e "${GREEN}🟢 Starting Frontend (Port 8080)...${NC}"
npm run dev:frontend > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

sleep 5

# Health checks
echo ""
echo -e "${YELLOW}🏥 Running health checks...${NC}"

if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✅ API Server: Running${NC}"
else
    echo -e "${YELLOW}⚠️  API Server: Not responding yet${NC}"
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo -e "${GREEN}✅ Frontend: Running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Not responding yet${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}🎉 SABO ARENA is running!${NC}"
echo ""
echo -e "${CYAN}📱 Access Points:${NC}"
echo "   🌐 Frontend:  http://localhost:8080"
echo "   🔧 API:       http://localhost:3001"
echo "   👨‍💼 Admin:     http://localhost:8080/admin"
echo "   🤖 Agents:    http://localhost:8080/agent-center"
echo ""
echo -e "${CYAN}📊 Process IDs:${NC}"
echo "   API:      $API_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}🛑 To stop all services:${NC}"
echo "   kill $API_PID $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop..."
echo "========================================"

# Trap Ctrl+C
trap "kill $API_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for processes
wait
