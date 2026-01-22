#!/bin/bash
# B2B Logistics Database Setup Script
# Run this after verifying your Supabase project credentials

echo "==================================="
echo "CJDQuick B2B Database Setup"
echo "==================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL not set. Please set it first:"
    echo ""
    echo "  export DATABASE_URL='postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres'"
    echo ""
    echo "Get your connection string from:"
    echo "  https://supabase.com/dashboard/project/<PROJECT_REF>/settings/database"
    echo ""
    exit 1
fi

echo "Testing database connection..."
python3 -c "
import psycopg2
import os

try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'], connect_timeout=10)
    conn.close()
    print('✅ Connection successful!')
    exit(0)
except Exception as e:
    print(f'❌ Connection failed: {e}')
    exit(1)
"

if [ $? -ne 0 ]; then
    echo ""
    echo "Please verify your Supabase project credentials and try again."
    exit 1
fi

echo ""
echo "Running migration..."
cd "$(dirname "$0")/.."
python3 -c "
import psycopg2
import os
from pathlib import Path

conn = psycopg2.connect(os.environ['DATABASE_URL'])
conn.autocommit = True
cursor = conn.cursor()

migration_file = Path('migrations/001_initial_schema.sql')
with open(migration_file, 'r') as f:
    sql = f.read()

cursor.execute(sql)
print('✅ Migration completed!')

cursor.execute('SELECT email, name, role FROM \"User\" WHERE role = \\'SUPER_ADMIN\\'')
for row in cursor.fetchall():
    print(f'   Admin: {row[0]} ({row[1]})')

conn.close()
"

echo ""
echo "==================================="
echo "Setup Complete!"
echo "==================================="
echo ""
echo "Login credentials:"
echo "  Email: admin@b2b-logistics.com"
echo "  Password: admin123"
echo ""
