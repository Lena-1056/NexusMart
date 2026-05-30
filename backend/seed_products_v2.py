import psycopg2
import base64
import urllib.request
import datetime
import uuid
import random

DB_DSN = "dbname=ecommerce user=postgres password=1234567890 host=127.0.0.1 port=5432"

products_data = [
    {
        "name": "Apple iPhone 15 Pro Max (256 GB) - Natural Titanium",
        "cat": "Electronics",
        "subcat": "Smartphones",
        "brand": "Apple",
        "price": 1199.00,
        "desc": "Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action button, and a more versatile Pro camera system. 6.7-inch Super Retina XDR display with ProMotion. 5G capable. Ceramic Shield front.",
        "image_urls": [
            "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500",
            "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500",
            "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500",
            "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=500",
            "https://images.unsplash.com/photo-1611791485440-24e8fc1d11ce?w=500"
        ]
    },
    {
        "name": "Samsung Galaxy S24 Ultra 5G AI Smartphone (Titanium Black, 12GB, 512GB Storage)",
        "cat": "Electronics",
        "subcat": "Smartphones",
        "brand": "Samsung",
        "price": 1299.99,
        "desc": "Welcome to the era of mobile AI. With Galaxy S24 Ultra in your hands, you can unleash whole new levels of creativity, productivity and possibility. Armor Aluminum frame, IP68 water resistance. S Pen included.",
        "image_urls": [
            "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500",
            "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500",
            "https://images.unsplash.com/photo-1598327105666-5b89351cb31b?w=500",
            "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=500"
        ]
    },
    {
        "name": "Sony WH-1000XM5 Wireless Noise Canceling Headphones",
        "cat": "Electronics",
        "subcat": "Audio",
        "brand": "Sony",
        "price": 398.00,
        "desc": "Industry-leading noise cancellation optimized to you. Magnificent Sound, engineered to perfection. Crystal clear hands-free calling. Up to 30-hour battery life with quick charging (3 min charge for 3 hours of playback).",
        "image_urls": [
            "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=500",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=500",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500"
        ]
    },
    {
        "name": "LG 65-Inch Class OLED evo C3 Series Smart TV 4K",
        "cat": "Electronics",
        "subcat": "Televisions",
        "brand": "LG",
        "price": 1596.99,
        "desc": "Powered by the a9 AI Processor Gen6—made exclusively for LG OLED—for beautiful picture and performance. WebOS 23. Game Optimizer and FreeSync Premium. 120Hz refresh rate. Dolby Vision and Dolby Atmos.",
        "image_urls": [
            "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=500",
            "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500",
            "https://images.unsplash.com/photo-1509281373149-e957c6296406?w=500",
            "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500"
        ]
    },
    {
        "name": "Levi's Men's 501 Original Fit Jeans",
        "cat": "Fashion",
        "subcat": "Men Clothing",
        "brand": "Levi's",
        "price": 59.50,
        "desc": "The original blue jean since 1873. Regular fit through the thigh with a straight leg. Button fly. 100% Cotton. Machine washable. A cultural icon worn by generations.",
        "image_urls": [
            "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500",
            "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=500",
            "https://images.unsplash.com/photo-1560243563-062bfc001d68?w=500",
            "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=500"
        ]
    },
    {
        "name": "Nike Men's Air Force 1 '07 Sneakers",
        "cat": "Fashion",
        "subcat": "Footwear",
        "brand": "Nike",
        "price": 110.00,
        "desc": "The radiance lives on in the Nike Air Force 1 '07, the b-ball icon that puts a fresh spin on what you know best. Crisp leather, bold colors and the perfect amount of flash to make you shine.",
        "image_urls": [
            "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500",
            "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
            "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500",
            "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=500",
            "https://images.unsplash.com/photo-1552346154-21d32810baa3?w=500"
        ]
    },
    {
        "name": "Nespresso VertuoPlus Coffee and Espresso Maker",
        "cat": "Home",
        "subcat": "Kitchen",
        "brand": "De'Longhi",
        "price": 159.00,
        "desc": "Brew a great cup of coffee or espresso at the touch of a button. Versatile automatic coffee maker. Centrifusion extraction technology gently extracts the perfect cup every time.",
        "image_urls": [
            "https://images.unsplash.com/photo-1517551065191-456637b83d8b?w=500",
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500",
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500",
            "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500"
        ]
    },
    {
        "name": "Dyson V15 Detect Cordless Vacuum Cleaner",
        "cat": "Home",
        "subcat": "Appliances",
        "brand": "Dyson",
        "price": 749.99,
        "desc": "The most powerful, intelligent cordless vacuum. Laser reveals microscopic dust. Intelligently optimizes suction and run time. Scientific proof of a deep clean on the LCD screen.",
        "image_urls": [
            "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500",
            "https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?w=500",
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500",
            "https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=500"
        ]
    },
    {
        "name": "COSRX Snail Mucin 96% Power Repairing Essence",
        "cat": "Beauty",
        "subcat": "Skincare",
        "brand": "COSRX",
        "price": 17.50,
        "desc": "Formulated with 96.3% Snail Secretion Filtrate, this essence repairs and rejuvenates the skin from dryness and aging. It improves skin vitality by reducing dullness and soothing dehydrated skin.",
        "image_urls": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500",
            "https://images.unsplash.com/photo-1617897903246-719242758050?w=500",
            "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500",
            "https://images.unsplash.com/photo-1601049541289-9b1b7ceb4c68?w=500",
            "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=500"
        ]
    },
    {
        "name": "LEGO Star Wars Millennium Falcon 75192",
        "cat": "Toys",
        "subcat": "Building Sets",
        "brand": "LEGO",
        "price": 849.99,
        "desc": "Build the ultimate LEGO Star Wars Millennium Falcon! With 7,541 pieces, this is one of the largest LEGO models ever created. Features intricate exterior detailing, upper and lower quad laser cannons, and a 4-minifigure cockpit.",
        "image_urls": [
            "https://images.unsplash.com/photo-1596727147705-61a539a67811?w=500",
            "https://images.unsplash.com/photo-1611382404068-d0dfc221ba2e?w=500",
            "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=500",
            "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=500"
        ]
    }
]

sellers = ["STORE", "ASHOK LAYLOND STORE"]

def get_base64_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            b64 = base64.b64encode(data).decode('utf-8')
            return f"data:image/jpeg;base64,{b64}"
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

def seed():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()
    
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    # First, truncate existing products since user said "this seed data is not perfect"
    cur.execute("TRUNCATE TABLE products_schema.products CASCADE;")
    
    idx = 0
    for product in products_data:
        name = product["name"]
        brand = product["brand"]
        price = product["price"]
        cat = product["cat"]
        subcat = product["subcat"]
        desc = product["desc"]
        image_urls = product["image_urls"]
        
        seller = sellers[idx % 2]
        idx += 1
        
        print(f"Processing {name} (Fetching {len(image_urls)} images)...")
        
        base64_images = []
        for url in image_urls:
            img = get_base64_image(url)
            if img:
                base64_images.append(img)
                
        # Join images with || without trailing ||
        emoji_str = "||".join(base64_images)
        if not emoji_str:
            emoji_str = "📦"
            
        prod_id = f"PRD-{str(uuid.uuid4())[:8]}"
        
        cur.execute("""
            INSERT INTO products_schema.products 
            (id, name, seller, cat, sub_category, brand, price, status, date, emoji, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s, %s, %s)
        """, (prod_id, name, seller, cat, subcat, brand, price, date_str, emoji_str, desc))
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Successfully seeded {idx} rich products with multiple images!")

if __name__ == "__main__":
    seed()
