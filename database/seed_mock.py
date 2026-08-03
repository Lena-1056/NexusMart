import psycopg2

def seed_db():
    conn = psycopg2.connect(host='127.0.0.1', port=5432, dbname='ecommerce', user='postgres', password='1234567890')
    conn.autocommit = True
    cur = conn.cursor()

    try:
        # Seed Users
        cur.execute("INSERT INTO users_schema.users (id, email, name, role, status, joined) VALUES ('USR-12345678', 'john@example.com', 'John Doe', 'CUSTOMER', 'ACTIVE', '2026-08-01') ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO users_schema.users (id, email, name, role, status, joined) VALUES ('USR-87654321', 'jane@example.com', 'Jane Smith', 'CUSTOMER', 'ACTIVE', '2026-08-02') ON CONFLICT DO NOTHING")
        
        # Seed Sellers
        cur.execute("INSERT INTO sellers_schema.sellers (id, store, owner, email, cat, status, revenue, rating) VALUES ('SLR-abcdef12', 'Tech Haven', 'Alice Wang', 'alice@techhaven.com', 'Electronics', 'APPROVED', 1500.00, 4.8) ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO sellers_schema.sellers (id, store, owner, email, cat, status, revenue, rating) VALUES ('SLR-12abcdef', 'Green Grocers', 'Bob Lee', 'bob@greengrocers.com', 'Groceries', 'APPROVED', 320.50, 4.2) ON CONFLICT DO NOTHING")

        # Seed Products
        cur.execute("INSERT INTO products_schema.products (id, name, seller, cat, price, status, date, emoji, description) VALUES ('PDR-11111111', 'Wireless Mouse', 'SLR-abcdef12', 'Electronics', 25.99, 'APPROVED', '2026-08-01', '🖱️', 'Ergonomic wireless mouse.') ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO products_schema.products (id, name, seller, cat, price, status, date, emoji, description) VALUES ('PDR-22222222', 'Mechanical Keyboard', 'SLR-abcdef12', 'Electronics', 89.99, 'APPROVED', '2026-08-02', '⌨️', 'RGB mechanical keyboard.') ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO products_schema.products (id, name, seller, cat, price, status, date, emoji, description) VALUES ('PDR-33333333', 'Organic Apples', 'SLR-12abcdef', 'Groceries', 4.99, 'APPROVED', '2026-08-03', '🍎', 'Fresh organic apples.') ON CONFLICT DO NOTHING")

        # Seed Orders
        cur.execute("INSERT INTO orders_schema.orders (id, customer, seller, product, amount, status, payment, date) VALUES ('ORD-aaaaaaaa', 'USR-12345678', 'SLR-abcdef12', 'PDR-11111111', 25.99, 'DELIVERED', 'PAID', '2026-08-02') ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO orders_schema.orders (id, customer, seller, product, amount, status, payment, date) VALUES ('ORD-bbbbbbbb', 'USR-87654321', 'SLR-12abcdef', 'PDR-33333333', 4.99, 'PROCESSING', 'PAID', '2026-08-03') ON CONFLICT DO NOTHING")

        # Seed Notifications
        cur.execute("INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read) VALUES ('NTF-1111aaaa', 'ORDER_SHIPPED', 'Your order ORD-aaaaaaaa has been shipped.', 'USR-12345678', '2026-08-02T10:00:00Z', TRUE) ON CONFLICT DO NOTHING")
        cur.execute("INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read) VALUES ('NTF-2222bbbb', 'PROMO', '20% off all Electronics this week!', 'USR-87654321', '2026-08-03T10:00:00Z', FALSE) ON CONFLICT DO NOTHING")
        
        # Admin specific seed data if needed
        cur.execute("INSERT INTO notifications_schema.notifications (id, type, message, recipient, time, read) VALUES ('NTF-ADMIN1', 'SYSTEM_ALERT', 'New seller registration pending approval: Green Grocers', 'admin@ecommerce.local', '2026-08-03T10:00:00Z', FALSE) ON CONFLICT DO NOTHING")

        print("Mock data seeded successfully!")

    except Exception as e:
        print(f"Error seeding database: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    seed_db()
