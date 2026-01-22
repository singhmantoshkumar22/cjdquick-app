"""
Direct database migration for B2B Logistics using Supabase direct connection
"""
import psycopg2
from pathlib import Path

# Try different connection methods for Supabase Mumbai
# Method 1: Transaction pooler (port 5432) - for DDL operations
DATABASE_URLS = [
    # Transaction mode pooler
    "postgresql://postgres.ngrjnhfxrmcclqxorjwl:Aquapurite2026@aws-1-ap-south-1.pooler.supabase.com:5432/postgres",
    # Session mode pooler (standard)
    "postgresql://postgres.ngrjnhfxrmcclqxorjwl:Aquapurite2026@aws-1-ap-south-1.pooler.supabase.com:6543/postgres",
]

DATABASE_URL = None
for url in DATABASE_URLS:
    try:
        print(f"Trying: {url[:60]}...")
        test_conn = psycopg2.connect(url, connect_timeout=10)
        test_conn.close()
        DATABASE_URL = url
        print("Connection successful!")
        break
    except Exception as e:
        print(f"  Failed: {str(e)[:50]}")

print(f"Connecting to Supabase B2B database (Mumbai)...")

if not DATABASE_URL:
    print("\n❌ Could not connect to any Supabase URL")
    print("Please run the migration manually in Supabase SQL Editor:")
    print("  1. Go to https://supabase.com/dashboard/project/ngrjnhfxrmcclqxorjwl")
    print("  2. Click 'SQL Editor' in the left sidebar")
    print("  3. Copy the contents of: b2b/backend/migrations/001_initial_schema.sql")
    print("  4. Paste and run in the SQL Editor")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()

    print("Connected successfully!")

    # Read migration file
    migration_file = Path(__file__).parent.parent / "migrations" / "001_initial_schema.sql"
    with open(migration_file, "r") as f:
        migration_sql = f.read()

    print("Running migration...")

    # Execute the entire migration
    cursor.execute(migration_sql)

    print("Migration completed!")

    # Verify setup
    cursor.execute('SELECT email, name, role FROM "User" WHERE role = \'SUPER_ADMIN\'')
    rows = cursor.fetchall()

    print("\n=== Admin Users ===")
    for row in rows:
        print(f"  Email: {row[0]}")
        print(f"  Name: {row[1]}")
        print(f"  Role: {row[2]}")

    cursor.execute('SELECT code, name FROM "Company"')
    companies = cursor.fetchall()
    print("\n=== Companies ===")
    for company in companies:
        print(f"  {company[0]}: {company[1]}")

    cursor.close()
    conn.close()

    print("\n✅ B2B Database setup complete!")
    print("\nLogin credentials:")
    print("  Email: admin@b2b-logistics.com")
    print("  Password: admin123")

except Exception as e:
    print(f"Error: {e}")
