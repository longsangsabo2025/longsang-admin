#!/usr/bin/env python3
"""Quick script to check database tables and data"""

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def check_database():
    conn = psycopg2.connect(os.getenv('VITE_SUPABASE_DB_URL'))
    cursor = conn.cursor()
    
    tables = [
        'agents',
        'tools',
        'workflows',
        'agent_executions',
        'workflow_executions',
        'projects',
        'consultation_bookings',
        'seo_pages'
    ]
    
    print("\n" + "="*60)
    print("DATABASE STATUS CHECK")
    print("="*60 + "\n")
    
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM public.{table}")
            count = cursor.fetchone()[0]
            print(f"✅ {table:<30} {count:>5} rows")
            
            # Show sample data for tables with data
            if count > 0 and count <= 10:
                cursor.execute(f"SELECT * FROM public.{table} LIMIT 3")
                rows = cursor.fetchall()
                if rows:
                    print(f"   Sample: {rows[0][:3] if len(rows[0]) > 3 else rows[0]}")
                    
        except Exception as e:
            print(f"❌ {table:<30} Error: {str(e)[:40]}")
    
    print("\n" + "="*60)
    
    # Check total
    total_rows = 0
    for table in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM public.{table}")
            total_rows += cursor.fetchone()[0]
        except:
            pass
    
    print(f"Total rows across all tables: {total_rows}")
    print("="*60 + "\n")
    
    if total_rows > 0:
        print("🎉 Database has data!")
    else:
        print("⚠️  Database is empty")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_database()
