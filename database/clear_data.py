import psycopg2
import os

conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='ecommerce', user='postgres', password=os.environ.get('DB_PASSWORD', ''))
conn.autocommit = False
cur = conn.cursor()

tables = [
    'reviews_schema.reviews',
    'notifications_schema.notifications',
    'orders_schema.orders',
    'products_schema.products',
    'sellers_schema.sellers',
    'users_schema.users',
]

for t in tables:
    cur.execute(f'DELETE FROM {t}')
    print(f'[CLEARED] {t}')

conn.commit()
cur.close()
conn.close()
print('Done! All test data removed.')
