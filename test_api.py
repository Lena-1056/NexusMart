import urllib.request
import json
req = urllib.request.Request('http://localhost:9000/api/products', method='GET')
products = json.loads(urllib.request.urlopen(req).read().decode())
print(f'Total products: {len(products)}')
if products:
    p = products[0]
    print(f'Product {p["id"]} stock: {p["stock"]}')
    req = urllib.request.Request(f'http://localhost:9000/api/products/{p["id"]}/stock', method='PUT', data=json.dumps({"quantity": -1}).encode(), headers={'Content-Type': 'application/json'})
    res = urllib.request.urlopen(req)
    print(res.read().decode())
