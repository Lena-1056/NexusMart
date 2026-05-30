import psycopg2
import base64
import urllib.request
import datetime
import uuid

DB_DSN = "dbname=ecommerce user=postgres password=1234567890 host=127.0.0.1 port=5432"

more_products = [
    # Books
    {
        "name": "The Lord of the Rings: Deluxe Edition",
        "cat": "Books",
        "subcat": "Fantasy",
        "brand": "HarperCollins",
        "price": 85.00,
        "desc": "A gorgeous deluxe edition of J.R.R. Tolkien's classic masterpiece, featuring a slipcase, ribbon marker, and beautiful illustrations.",
        "image_urls": [
            "https://images.unsplash.com/photo-1608139589998-d8f997784013?w=500",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500",
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500"
        ]
    },
    {
        "name": "Atomic Habits by James Clear",
        "cat": "Books",
        "subcat": "Self-Help",
        "brand": "Penguin",
        "price": 19.99,
        "desc": "No matter your goals, Atomic Habits offers a proven framework for improving--every day. James Clear reveals practical strategies to form good habits.",
        "image_urls": [
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=500",
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500",
            "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500",
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500"
        ]
    },
    
    # Sports
    {
        "name": "Spalding NBA Official Game Basketball",
        "cat": "Sports",
        "subcat": "Basketball",
        "brand": "Spalding",
        "price": 149.99,
        "desc": "The official game ball of the NBA. Made with full-grain Horween leather that provides a fantastic grip and feel that improves the more you use it.",
        "image_urls": [
            "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=500",
            "https://images.unsplash.com/photo-1542652694-40abf526446e?w=500",
            "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=500",
            "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=500"
        ]
    },
    {
        "name": "Callaway Golf Men's Strata Complete Set",
        "cat": "Sports",
        "subcat": "Golf",
        "brand": "Callaway",
        "price": 399.00,
        "desc": "Designed for maximum performance right out of the box. Includes a driver, fairway wood, hybrid, 4 irons, putter, and a lightweight stand bag.",
        "image_urls": [
            "https://images.unsplash.com/photo-1535139262971-c51845709a48?w=500",
            "https://images.unsplash.com/photo-1587280501635-a197622fba7c?w=500",
            "https://images.unsplash.com/photo-1593111774240-d529f12cb4ec?w=500",
            "https://images.unsplash.com/photo-1592569420042-45e54d89fae0?w=500"
        ]
    },

    # Kitchen Appliances
    {
        "name": "KitchenAid Artisan Series 5-Qt. Stand Mixer",
        "cat": "Appliances",
        "subcat": "Kitchen Appliances",
        "brand": "KitchenAid",
        "price": 449.99,
        "desc": "Make up to 9 dozen cookies in a single batch with the KitchenAid Artisan Series 5 Quart Tilt-Head Stand Mixer. Features 10 speeds to thoroughly mix, knead and whip ingredients quickly and easily.",
        "image_urls": [
            "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=500",
            "https://images.unsplash.com/photo-1579620023605-23c21c3b6f00?w=500",
            "https://images.unsplash.com/photo-1589784365314-ecce18471bd7?w=500",
            "https://images.unsplash.com/photo-1594911772125-07fc7a2d8d9f?w=500"
        ]
    },
    {
        "name": "Breville Barista Express Espresso Machine",
        "cat": "Appliances",
        "subcat": "Coffee Makers",
        "brand": "Breville",
        "price": 699.95,
        "desc": "Create third wave specialty coffee at home from bean to espresso in less than a minute. The Barista Express allows you to grind the beans right before extraction.",
        "image_urls": [
            "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=500",
            "https://images.unsplash.com/photo-1521369909029-2afed882baee?w=500",
            "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=500",
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500"
        ]
    },

    # Fashion (More)
    {
        "name": "Ray-Ban Classic Aviator Sunglasses",
        "cat": "Fashion",
        "subcat": "Accessories",
        "brand": "Ray-Ban",
        "price": 160.00,
        "desc": "Currently one of the most iconic sunglass models in the world. Ray-Ban Aviator Classic sunglasses were originally designed for U.S. aviators in 1937.",
        "image_urls": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500",
            "https://images.unsplash.com/photo-1577803645773-f96470509666?w=500",
            "https://images.unsplash.com/photo-1508296695146-257a814070b4?w=500",
            "https://images.unsplash.com/photo-1589782806296-857eb098520f?w=500"
        ]
    },
    
    # Beauty (More)
    {
        "name": "Dyson Airwrap Multi-Styler Complete Long",
        "cat": "Beauty",
        "subcat": "Haircare",
        "brand": "Dyson",
        "price": 599.99,
        "desc": "Curl, shape, smooth, and hide flyaways with no extreme heat. Re-engineered attachments harness Enhanced Coanda airflow for faster, better styling.",
        "image_urls": [
            "https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500",
            "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500",
            "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=500"
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
    
    idx = 0
    for product in more_products:
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
                
        # Join images with ||
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
    print(f"Successfully appended {idx} more rich products!")

if __name__ == "__main__":
    seed()
