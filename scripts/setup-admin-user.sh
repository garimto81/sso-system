#!/bin/bash

# Setup Admin User (Bash Wrapper)
# Handles dependency resolution for setup-admin-user.js
#
# Usage:
#   bash scripts/setup-admin-user.sh
#   bash scripts/setup-admin-user.sh --email=admin@example.com --password=secret123

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/server"

echo -e "${BLUE}🔧 SSO Admin User Setup${NC}\n"

# Check if server directory exists
if [ ! -d "$SERVER_DIR" ]; then
  echo -e "${RED}❌ Error: server/ directory not found${NC}"
  exit 1
fi

# Check if server/.env exists
if [ ! -f "$SERVER_DIR/.env" ]; then
  echo -e "${RED}❌ Error: server/.env not found${NC}"
  echo "   Run: cd server && cp .env.example .env"
  exit 1
fi

# Check if server/node_modules exists
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  echo -e "${YELLOW}⚠️  server/node_modules not found${NC}"
  echo -e "${BLUE}ℹ  Installing dependencies...${NC}"
  cd "$SERVER_DIR"
  npm install
  cd "$PROJECT_ROOT"
fi

# Run script from server directory (where dependencies are installed)
echo -e "${BLUE}ℹ  Running admin setup script...${NC}\n"

cd "$SERVER_DIR"
node scripts/setup-admin.js "$@"
EXIT_CODE=$?

# Alternative: Use SQL script if Node.js method fails
if [ $EXIT_CODE -ne 0 ]; then
  echo -e "\n${YELLOW}⚠️  Node.js method failed, trying SQL alternative...${NC}\n"

  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ Error: psql command not found${NC}"
    echo "   Please install PostgreSQL client tools"
    exit 1
  fi

  # Check if Supabase is running
  if ! curl -s http://127.0.0.1:54321/health &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase not running${NC}"
    echo "   Run: npx supabase start"
    exit 1
  fi

  # Run SQL script
  echo -e "${BLUE}ℹ  Running SQL setup script...${NC}"
  PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f "$SCRIPT_DIR/setup-admin-user.sql"
fi

echo -e "\n${GREEN}✅ Setup complete!${NC}"
