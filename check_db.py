import psycopg2
import os

db_url = "postgresql://postgres:JErkDTGvxbqHFQjVcQwmdnBNbwErKkzq@tramway.proxy.rlwy.net:30068/railway"

try:
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = cur.fetchall()
    print(f"Tables: {tables}")
    
    if tables:
        for (table_name,) in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
            count = cur.fetchone()[0]
            print(f"Table {table_name}: {count} rows")
            
    cur.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
