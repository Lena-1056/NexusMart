package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/api/inventory/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		
		switch r.Method {
		case http.MethodGet:
			// GET /api/inventory/{id}
			fmt.Fprintf(w, `{"productId": "p1", "quantity": 100, "reserved": 0}`)
		case http.MethodPut:
			// PUT /api/inventory/{id}
			fmt.Fprintf(w, `{"status": "inventory updated"}`)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	http.HandleFunc("/api/inventory/reserve", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			fmt.Fprintf(w, `{"status": "stock reserved successfully"}`)
		}
	})

	http.HandleFunc("/api/inventory/release", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			fmt.Fprintf(w, `{"status": "stock released successfully"}`)
		}
	})

	log.Println("Inventory Service starting on port 8087...")
	log.Fatal(http.ListenAndServe(":8087", nil))
}
