#!/bin/bash
# Phase 0 Verification Script
# Run this to verify the Phase 0 setup is complete

set -e

echo "=========================================="
echo "CJDQuick OMS - Phase 0 Verification"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check function
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Navigate to backend directory
cd "$(dirname "$0")/../backend"
echo "Working directory: $(pwd)"
echo ""

# Step 1: Check Python version
echo "1. Checking Python version..."
python3 --version
check "Python 3.x installed"
echo ""

# Step 2: Create virtual environment if not exists
echo "2. Setting up virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Created new virtual environment"
fi
source venv/bin/activate
check "Virtual environment activated"
echo ""

# Step 3: Install dependencies
echo "3. Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q
check "Dependencies installed"
echo ""

# Step 4: Verify imports
echo "4. Verifying module imports..."
python3 -c "
from app.core.config import settings
from app.core.database import engine, get_session
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user, require_roles, CompanyFilter
print('  - Core modules: OK')

from app.models import User, Company, Location, Zone, Bin, Brand
from app.models import UserRole, LocationType, ZoneType
from app.models.base import BaseModel, TimestampMixin, UUIDMixin
print('  - Models: OK')

from sqlmodel import SQLModel
print('  - SQLModel: OK')

from alembic.config import Config
print('  - Alembic: OK')

print('')
print('All imports successful!')
"
check "All modules import correctly"
echo ""

# Step 5: Check database connection (if Docker is running)
echo "5. Checking database connection..."
if command -v docker &> /dev/null; then
    if docker ps | grep -q "oms-postgres"; then
        python3 -c "
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT version()'))
    version = result.fetchone()[0]
    print(f'  PostgreSQL: {version[:50]}...')
"
        check "Database connection successful"
    else
        echo -e "${YELLOW}!${NC} Docker container not running. Start with: docker compose up -d postgres"
    fi
else
    echo -e "${YELLOW}!${NC} Docker not available. Install Docker Desktop to test locally."
fi
echo ""

# Step 6: Check Alembic configuration
echo "6. Checking Alembic configuration..."
if [ -f "alembic.ini" ] && [ -d "alembic" ]; then
    check "Alembic configuration found"
else
    echo -e "${RED}✗${NC} Alembic configuration missing"
fi
echo ""

# Step 7: List created files
echo "7. Phase 0 files created:"
echo "   Core:"
echo "   - app/core/config.py"
echo "   - app/core/database.py"
echo "   - app/core/security.py"
echo "   - app/core/deps.py"
echo ""
echo "   Models:"
echo "   - app/models/base.py"
echo "   - app/models/enums.py"
echo "   - app/models/user.py"
echo "   - app/models/company.py"
echo "   - app/models/brand.py"
echo ""
echo "   Alembic:"
echo "   - alembic.ini"
echo "   - alembic/env.py"
echo "   - alembic/script.py.mako"
echo ""

echo "=========================================="
echo -e "${GREEN}Phase 0 Verification Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start Docker: docker compose up -d postgres"
echo "2. Run initial migration: cd backend && alembic revision --autogenerate -m 'initial'"
echo "3. Apply migration: alembic upgrade head"
echo ""
