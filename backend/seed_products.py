import psycopg2
import base64
import urllib.request
import datetime
import uuid

DB_DSN = "dbname=ecommerce user=postgres password=1234567890 host=127.0.0.1 port=5432"

categories = {
    'Electronics': {
        'Smartphones': [
            ("iPhone 15 Pro", "Apple", 999.00, "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500"),
            ("Galaxy S24 Ultra", "Samsung", 1199.00, "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500")
        ],
        'Laptops': [
            ("MacBook Pro 16", "Apple", 2499.00, "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500"),
            ("Dell XPS 15", "Dell", 1899.00, "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500")
        ]
    },
    'Fashion': {
        'Men Clothing': [
            ("Classic Leather Jacket", "Zara", 120.00, "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500"),
            ("Denim Jeans", "Levi's", 60.00, "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500")
        ],
        'Women Clothing': [
            ("Summer Floral Dress", "H&M", 45.00, "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500"),
            ("Silk Blouse", "Mango", 55.00, "https://images.unsplash.com/photo-1588117260148-b47818741c74?w=500")
        ]
    },
    'Home': {
        'Furniture': [
            ("Velvet Sofa", "IKEA", 499.00, "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500"),
            ("Coffee Table", "West Elm", 150.00, "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=500")
        ],
        'Decor': [
            ("Table Lamp", "Philips", 35.00, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500"),
            ("Wall Art Print", "Artify", 75.00, "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500")
        ]
    },
    'Beauty': {
        'Skincare': [
            ("Hydrating Serum", "The Ordinary", 15.00, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500"),
            ("Vitamin C Cream", "Olay", 25.00, "https://images.unsplash.com/photo-1601049541289-9b1b7ceb4c68?w=500")
        ],
        'Fragrance': [
            ("Eau de Parfum", "Chanel", 135.00, "https://images.unsplash.com/photo-1594035910387-fea477274976?w=500"),
            ("Woody Cologne", "Tom Ford", 185.00, "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=500")
        ]
    },
    'Toys': {
        'Board Games': [
            ("Monopoly Classic", "Hasbro", 20.00, "https://images.unsplash.com/photo-1611382404068-d0dfc221ba2e?w=500"),
            ("Chess Set", "WoodCraft", 45.00, "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=500")
        ],
        'Action Figures': [
            ("Superhero Figure", "Marvel", 15.00, "https://images.unsplash.com/photo-1608889825103-eb5ed706fc64?w=500"),
            ("Sci-Fi Robot", "Bandai", 25.00, "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=500")
        ]
    }
}

sellers = ["STORE", "ASHOK LAYLOND STORE"]

def get_base64_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = response.read()
            b64 = base64.b64encode(data).decode('utf-8')
            return f"data:image/jpeg;base64,{b64}||"
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return "📦"

def seed():
    conn = psycopg2.connect(DB_DSN)
    cur = conn.cursor()
    
    date_str = datetime.datetime.now().strftime("%Y-%m-%d")
    
    idx = 0
    for cat, subcats in categories.items():
        for subcat, items in subcats.items():
            for item in items:
                name, brand, price, url = item
                # Alternate sellers
                seller = sellers[idx % 2]
                idx += 1
                
                print(f"Fetching image for {name}...")
                emoji = get_base64_image(url)
                
                prod_id = f"PRD-{str(uuid.uuid4())[:8]}"
                desc = f"High quality {name} by {brand}. Excellent choice for {subcat}."
                
                cur.execute("""
                    INSERT INTO products_schema.products 
                    (id, name, seller, cat, sub_category, brand, price, status, date, emoji, description)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s, %s, %s)
                """, (prod_id, name, seller, cat, subcat, brand, price, date_str, emoji, desc))
    
    conn.commit()
    cur.close()
    conn.close()
    print(f"Successfully seeded {idx} products!")

if __name__ == "__main__":
    seed()
