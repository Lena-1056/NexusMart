from http.server import BaseHTTPRequestHandler, HTTPServer
import json

class RequestHandler(BaseHTTPRequestHandler):
    def _send_json(self, response_data, status=200):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode('utf-8'))

    def do_GET(self):
        self._send_json({"productId": "p1", "quantity": 100, "reserved": 0})

    def do_PUT(self):
        self._send_json({"status": "inventory updated"})

    def do_POST(self):
        if '/reserve' in self.path:
            self._send_json({"status": "stock reserved successfully"})
        elif '/release' in self.path:
            self._send_json({"status": "stock released successfully"})
        else:
            self._send_json({"error": "not found"}, 404)

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8098), RequestHandler)
    print('Starting mock inventory-service on port 8098...')
    server.serve_forever()
