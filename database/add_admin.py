import psycopg2
import bcrypt
import uuid
import datetime

conn = psycopg2.connect(
    dbname='ecommerce',
    user='postgres',
    password='1234567890',
    host='127.0.0.1'
)
cur = conn.cursor()

# Hash 'admin123'
hashed = bcrypt.hashpw(b'admin123', bcrypt.gensalt()).decode('utf-8')

# Insert Jagan as Admin
cur.execute(
    """INSERT INTO users_schema.users (id, email, name, role, status, password, joined) 
       VALUES (%s, %s, %s, %s, %s, %s, %s)
       ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', password = EXCLUDED.password""",
    (
        f'USR-{uuid.uuid4().hex[:8]}',
        'jaganmohanm2469@gmail.com',
        'Jagan Mohan',
        'ADMIN',
        'ACTIVE',
        hashed,
        datetime.date.today().isoformat()
    )
)

conn.commit()
cur.close()
conn.close()
print('Successfully created Admin Jagan!')
