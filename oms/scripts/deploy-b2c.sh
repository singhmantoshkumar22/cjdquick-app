#!/bin/bash

# =============================================================================
# B2C Client Deployment Script
# =============================================================================
# This script helps deploy a new B2C backend instance
# Usage: ./scripts/deploy-b2c.sh [client-name]
# =============================================================================

set -e

CLIENT_NAME=${1:-"b2c-client"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  CJDQuick B2C Backend Deployment"
echo "  Client: $CLIENT_NAME"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Verify we're in the right directory
print_step "Verifying project structure..."
if [ ! -f "$ROOT_DIR/backend/render-b2c.yaml" ]; then
    print_error "render-b2c.yaml not found. Are you in the oms directory?"
    exit 1
fi
echo "  ✓ Project structure verified"

# Step 2: Check for required tools
print_step "Checking required tools..."
command -v git >/dev/null 2>&1 || { print_error "git is required but not installed."; exit 1; }
echo "  ✓ git found"

# Step 3: Display deployment instructions
echo ""
echo "=============================================="
echo "  DEPLOYMENT INSTRUCTIONS"
echo "=============================================="
echo ""
echo "1. CREATE SUPABASE PROJECT (if not done):"
echo "   - Go to https://supabase.com/dashboard"
echo "   - Create new project for this B2C client"
echo "   - Note the connection string"
echo ""
echo "2. INITIALIZE DATABASE SCHEMA:"
echo "   - Go to Supabase SQL Editor"
echo "   - Run: backend/migrations/b2c_schema.sql"
echo ""
echo "3. CREATE RENDER SERVICE:"
echo "   - Go to https://dashboard.render.com"
echo "   - New > Web Service"
echo "   - Connect your GitHub repo"
echo "   - Settings:"
echo "     - Name: cjdquick-${CLIENT_NAME}-api"
echo "     - Root Directory: oms/backend"
echo "     - Build Command: pip install -r requirements.txt"
echo "     - Start Command: uvicorn app.main:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "4. SET ENVIRONMENT VARIABLES in Render:"
echo "   - DATABASE_URL: <your-supabase-connection-string>"
echo "   - SECRET_KEY: <generate-with: openssl rand -hex 32>"
echo "   - FRONTEND_URL: https://${CLIENT_NAME}.vercel.app"
echo "   - PYTHON_VERSION: 3.11.0"
echo "   - APP_NAME: CJDQuick ${CLIENT_NAME} API"
echo ""
echo "5. DEPLOY FRONTEND TO VERCEL:"
echo "   - Import project from GitHub"
echo "   - Set Root Directory: oms/apps/web"
echo "   - Set Environment Variables:"
echo "     NEXT_PUBLIC_API_URL=https://cjdquick-${CLIENT_NAME}-api.onrender.com"
echo "     AUTH_SECRET=<generate-with: openssl rand -base64 32>"
echo "     NEXTAUTH_SECRET=<same-as-AUTH_SECRET>"
echo "     NEXTAUTH_URL=https://${CLIENT_NAME}.vercel.app"
echo "     AUTH_TRUST_HOST=true"
echo "     INTERNAL_API_KEY=<must-match-backend>"
echo ""
echo "6. TEST THE DEPLOYMENT:"
echo "   - Backend Health: curl https://cjdquick-${CLIENT_NAME}-api.onrender.com/health"
echo "   - Frontend: https://${CLIENT_NAME}.vercel.app"
echo "   - Login with: admin@b2c-client.com / admin123"
echo ""
echo "=============================================="
echo ""

# Step 4: Generate secrets
print_step "Generating suggested secrets..."
if command -v openssl >/dev/null 2>&1; then
    SECRET_KEY=$(openssl rand -hex 32)
    AUTH_SECRET=$(openssl rand -base64 32)
    INTERNAL_KEY=$(openssl rand -hex 32)
    echo ""
    echo "  Backend (Render):"
    echo "    SECRET_KEY: $SECRET_KEY"
    echo "    INTERNAL_API_KEY: $INTERNAL_KEY"
    echo ""
    echo "  Frontend (Vercel):"
    echo "    AUTH_SECRET: $AUTH_SECRET"
    echo "    NEXTAUTH_SECRET: $AUTH_SECRET"
    echo "    INTERNAL_API_KEY: $INTERNAL_KEY"
else
    echo "  Install openssl to auto-generate secrets"
fi

echo ""
print_step "Deployment preparation complete!"
echo ""
echo "Configuration files created:"
echo "  - backend/render-b2c.yaml        (Render deployment config)"
echo "  - backend/.env.b2c.example       (Backend env template)"
echo "  - backend/migrations/b2c_schema.sql (Database schema)"
echo "  - apps/web/.env.b2c.example      (Frontend env template)"
echo ""
echo "Next: Follow the instructions above to complete deployment."
echo ""
