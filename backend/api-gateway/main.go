package main

import (
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
)

func main() {
	// API Gateway routing map
	routes := map[string]string{
		"/api/users":         "http://localhost:8081", // User Service (Java)
		"/api/orders":        "http://localhost:8083", // Order Service (Java)
		"/api/admin":         "http://localhost:8084", // Admin Service (Python)
		"/api/notifications": "http://localhost:8086", // Notification Service (Python)
		"/api/products":      "http://localhost:8088", // Product Service (Go)
		"/api/reviews":       "http://localhost:8089", // Review Service (Python)
		"/api/sellers":       "http://localhost:8090", // Seller Service (Go)
		"/api/shipping":      "http://localhost:8094", // Shipping Service (Java)
	}

	for path, target := range routes {
		setupReverseProxy(path, target)
	}

	log.Println("API Gateway starting on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Gateway failed to start: %v", err)
	}
}

func setupReverseProxy(path string, targetURL string) {
	target, err := url.Parse(targetURL)
	if err != nil {
		log.Fatalf("Invalid target URL for %s: %v", path, err)
	}

	proxy := httputil.NewSingleHostReverseProxy(target)

	http.HandleFunc(path+"/", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Proxying request %s %s to %s", r.Method, r.URL.Path, targetURL)
		
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		proxy.ServeHTTP(w, r)
	})
	
	http.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Proxying request %s %s to %s", r.Method, r.URL.Path, targetURL)
		
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		proxy.ServeHTTP(w, r)
	})
}
