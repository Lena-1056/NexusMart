import psycopg2
conn = psycopg2.connect('dbname=ecommerce user=postgres password=1234567890 host=127.0.0.1')
cur = conn.cursor()
cur.execute("INSERT INTO users_schema.users (id, email, name, role, status, password, joined) VALUES ('ADM-99999999', 'jaganmohanm2469@gmail.com', 'Jagan Mohan', 'ADMIN', 'ACTIVE', 'dummy_hash_for_now', '2026-08-03') ON CONFLICT (email) DO NOTHING")
conn.commit()
cur.close()
conn.close()
print('Admin seeded')
