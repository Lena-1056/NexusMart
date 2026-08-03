package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
	"crypto/rand"
	"encoding/hex"

	_ "github.com/lib/pq"
)

type Product struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Seller string  `json:"seller"`
	Cat    string  `json:"cat"`
	Price  float64 `json:"price"`
	Status string  `json:"status"`
	Date   string  `json:"date"`
	Emoji  string  `json:"emoji"`
}

var db *sql.DB

func initDB() {
	var err error
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres" // Fallback for safety, though env should provide it
	}
	connStr := fmt.Sprintf("user=postgres password=%s dbname=ecommerce sslmode=disable", dbPassword)
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
}

func enableCors(w *http.ResponseWriter) {
	(*w).Header().Set("Access-Control-Allow-Origin", "*")
	(*w).Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS")
	(*w).Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

func generateID() string {
	bytes := make([]byte, 4)
	if _, err := rand.Read(bytes); err != nil {
		return "PDR-00000000"
	}
	return "PDR-" + hex.EncodeToString(bytes)
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if r.Method == http.MethodGet {
			rows, err := db.Query("SELECT id, name, seller, cat, price, status, date, emoji FROM products_schema.products")
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			defer rows.Close()

			var products []Product
			for rows.Next() {
				var p Product
				if err := rows.Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji); err != nil {
					continue
				}
				products = append(products, p)
			}
			if products == nil {
				products = []Product{}
			}
			json.NewEncoder(w).Encode(products)
		} else if r.Method == http.MethodPost {
			var req Product
			json.NewDecoder(r.Body).Decode(&req)
			
			id := generateID()
			date := time.Now().Format("2006-01-02")
			
			var p Product
			err := db.QueryRow("INSERT INTO products_schema.products (id, name, seller, cat, price, status, date, emoji) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7) RETURNING id, name, seller, cat, price, status, date, emoji", id, req.Name, req.Seller, req.Cat, req.Price, date, req.Emoji).Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(p)
		}
	})

	http.HandleFunc("/api/products/seller/", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			return
		}
		w.Header().Set("Content-Type", "application/json")
		
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) >= 5 && r.Method == http.MethodGet {
			sellerId := parts[4] // wait, it's matching /api/products/seller/{storeName}
			// Actually seller id or store name is stored in products table.
			
			rows, err := db.Query("SELECT id, name, seller, cat, price, status, date, emoji FROM products_schema.products WHERE seller = $1", sellerId)
			if err != nil {
				http.Error(w, err.Error(), 500)
				return
			}
			defer rows.Close()

			var products []Product
			for rows.Next() {
				var p Product
				if err := rows.Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji); err != nil {
					continue
				}
				products = append(products, p)
			}
			if products == nil {
				products = []Product{}
			}
			json.NewEncoder(w).Encode(products)
		}
	})

	http.HandleFunc("/api/products/", func(w http.ResponseWriter, r *http.Request) {
		enableCors(&w)
		if r.Method == "OPTIONS" {
			return
		}

		parts := strings.Split(r.URL.Path, "/")
		if len(parts) >= 5 && parts[4] == "status" && r.Method == http.MethodPut {
			id := parts[3]
			var req struct{ Status string }
			json.NewDecoder(r.Body).Decode(&req)

			var p Product
			err := db.QueryRow("UPDATE products_schema.products SET status = $1 WHERE id = $2 RETURNING id, name, seller, cat, price, status, date, emoji", req.Status, id).Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji)
			if err != nil {
				http.Error(w, "Not found", 404)
				return
			}
			json.NewEncoder(w).Encode(p)
		}
	})

	fmt.Println("Product Service running on port 8085...")
	log.Fatal(http.ListenAndServe(":8085", nil))
}
