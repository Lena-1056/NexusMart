import psycopg2
import os

# Step 1: Create the database
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='postgres', user='postgres', password=os.environ.get('DB_PASSWORD', ''))
conn.autocommit = True
cur = conn.cursor()
cur.execute("CREATE DATABASE ecommerce")
print("[OK] Database 'ecommerce' created")
cur.close()
conn.close()

# Step 2: Run the schema + seed data
conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='ecommerce', user='postgres', password=os.environ.get('DB_PASSWORD', ''))
conn.autocommit = False
cur = conn.cursor()

schema_sql = open("f:/ECommerce/database/init.sql", "r", encoding="utf-8").read()
cur.execute(schema_sql)
conn.commit()
print("[OK] Schema and seed data applied")
cur.close()
conn.close()
print("[OK] All done! PostgreSQL is ready.")
