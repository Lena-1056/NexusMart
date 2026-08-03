import psycopg2
conn = psycopg2.connect(
    dbname='ecommerce',
    user='postgres',
    password='1234567890',
    host='127.0.0.1'
)
cur = conn.cursor()

# Delete everything in correct order
cur.execute('DELETE FROM carts_schema.carts')
cur.execute('DELETE FROM wishlists_schema.wishlists')
cur.execute('DELETE FROM reviews_schema.reviews')
cur.execute('DELETE FROM notifications_schema.notifications')
cur.execute('DELETE FROM orders_schema.orders')
cur.execute('DELETE FROM products_schema.products')
cur.execute('DELETE FROM sellers_schema.sellers')
cur.execute('DELETE FROM users_schema.addresses')
cur.execute('DELETE FROM users_schema.payments')

# Delete all users EXCEPT the admin account we just created
cur.execute("DELETE FROM users_schema.users WHERE email != 'jaganmohanm2469@gmail.com'")

conn.commit()
cur.close()
conn.close()
print('All mock data cleared successfully!')
