import psycopg2
import uuid
import datetime
import os

def run():
    conn = psycopg2.connect(
        dbname="ecommerce",
        user="postgres",
        password=os.environ.get("DB_PASSWORD", ""),
        host="localhost"
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    products = [
        ('Samsung 55" Smart TV', 'TV, Audio & Cameras', 'Televisions', 799.99, '📺', '4K Ultra HD Smart LED TV.'),
        ('Sony HT-A7000 Soundbar', 'TV, Audio & Cameras', 'Home Entertainment Systems', 1299.00, '🔊', 'Premium 7.1.2ch Soundbar.'),
        ('Sony WH-1000XM5', 'TV, Audio & Cameras', 'Headphones', 349.00, '🎧', 'Industry leading noise canceling headphones.'),
        ('Bose SoundLink Revolve', 'TV, Audio & Cameras', 'Speakers', 199.00, '🔊', 'Portable Bluetooth speaker.'),
        ('Yamaha AV Receiver', 'TV, Audio & Cameras', 'Home Audio & Theater', 450.00, '📻', '5.1 Channel Home Theater Receiver.'),
        ('GoPro HERO11 Black', 'TV, Audio & Cameras', 'Cameras', 399.00, '📷', 'Waterproof Action Camera.'),
        ('Canon EOS Rebel T7', 'TV, Audio & Cameras', 'DSLR Cameras', 479.00, '📸', 'DSLR Camera with 18-55mm Lens.'),
        ('Arlo Pro 4 Spotlight', 'TV, Audio & Cameras', 'Security Cameras', 199.00, '📹', 'Wire-Free Security Camera.'),
        ('SanDisk 128GB SDXC', 'TV, Audio & Cameras', 'Camera Accessories', 25.00, '💾', 'Extreme Pro Memory Card.'),
        ('Fender Stratocaster', 'TV, Audio & Cameras', 'Musical Instruments & Professional Audio', 799.00, '🎸', 'Electric Guitar.'),
        ('Nintendo Switch OLED', 'TV, Audio & Cameras', 'Gaming Consoles', 349.00, '🎮', 'Gaming Console with OLED screen.')
    ]
    
    date_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    for name, cat, sub_cat, price, emoji, desc in products:
        pid = 'PROD-' + str(uuid.uuid4())[:8]
        cur.execute('''
            INSERT INTO products_schema.products 
            (id, name, seller, cat, sub_category, price, emoji, status, date, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (pid, name, 'AdminStore', cat, sub_cat, price, emoji, 'APPROVED', date_str, desc))
    
    print('Inserted', len(products), 'products successfully.')

run()
