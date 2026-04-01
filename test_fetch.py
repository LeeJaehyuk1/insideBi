import psycopg2
from psycopg2.extras import RealDictCursor

db_url = "postgresql://postgres:JErkDTGvxbqHFQjVcQwmdnBNbwErKkzq@tramway.proxy.rlwy.net:30068/railway"

def test_fetch(table_id, limit=2000):
    try:
        conn = psycopg2.connect(db_url)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(f'SELECT * FROM "{table_id}" LIMIT %s', (limit,))
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return rows
    except Exception as e:
        print(f"Error: {e}")
        return []

rows = test_fetch("npl_trend")
print(f"Count: {len(rows)}")
if rows:
    print(f"First row: {dict(rows[0])}")
