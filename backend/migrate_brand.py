import psycopg2
import os

def run():
    conn = psycopg2.connect(
        host="127.0.0.1",
        port=5432,
        dbname="ecommerce",
        user="postgres",
        password=os.environ.get("DB_PASSWORD", "")
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        cur.execute("ALTER TABLE products_schema.products ADD COLUMN brand VARCHAR(100)")
        print("Added brand column.")
    except Exception as e:
        print("Column might already exist:", e)
        
    cur.execute("SELECT id, name FROM products_schema.products WHERE brand IS NULL")
    rows = cur.fetchall()
    
    for row in rows:
        pid, name = row
        brand = name.split(' ')[0]
        cur.execute("UPDATE products_schema.products SET brand = %s WHERE id = %s", (brand, pid))
        
    print(f"Backfilled {len(rows)} products with brand.")

run()
