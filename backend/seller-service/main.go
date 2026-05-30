package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

// ─── Models ──────────────────────────────────────────────────────────────────

type Seller struct {
	ID      string  `json:"id"`
	Store   string  `json:"store"`
	Owner   string  `json:"owner"`
	Email   string  `json:"email"`
	Cat     string  `json:"cat"`
	Status  string  `json:"status"`
	Revenue float64 `json:"revenue"`
	Rating  float64 `json:"rating"`
}

type Product struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Seller      string  `json:"seller"`
	Cat         string  `json:"cat"`
	Price       float64 `json:"price"`
	Status      string  `json:"status"`
	Date        string  `json:"date"`
	Emoji       string  `json:"emoji"`
	Description string  `json:"description"`
}

type Order struct {
	ID       string  `json:"id"`
	Customer string  `json:"customer"`
	Seller   string  `json:"seller"`
	Product  string  `json:"product"`
	Amount   float64 `json:"amount"`
	Status   string  `json:"status"`
	Payment  string  `json:"payment"`
	Date     string  `json:"date"`
}

type DashboardStats struct {
	Revenue         float64 `json:"revenue"`
	TotalOrders     int     `json:"totalOrders"`
	ActiveProducts  int     `json:"activeProducts"`
	PendingOrders   int     `json:"pendingOrders"`
	DeliveredOrders int     `json:"deliveredOrders"`
	TotalProducts   int     `json:"totalProducts"`
}

// ─── DB ──────────────────────────────────────────────────────────────────────

var db *sql.DB

func initDB() {
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	connStr := fmt.Sprintf("user=postgres password=%s dbname=ecommerce host=127.0.0.1 sslmode=disable", dbPassword)
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to open DB: %v", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatalf("Failed to ping DB: %v", err)
	}
	log.Println("✅ Connected to PostgreSQL successfully")

	// Auto-migrate password column if missing
	_, err = db.Exec(`ALTER TABLE sellers_schema.sellers ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'password'`)
	if err != nil {
		log.Printf("Migration warning: %v", err)
	} else {
		log.Println("✅ DB migration OK")
	}
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func cors(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func json200(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("JSON encode error: %v", err)
	}
}

func errResp(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	http.Error(w, msg, code)
}

func genID(prefix string) string {
	b := make([]byte, 4)
	if _, err := rand.Read(b); err != nil {
		return prefix + "00000000"
	}
	return prefix + hex.EncodeToString(b)
}

func pathSegment(r *http.Request, idx int) string {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if idx < len(parts) {
		s, _ := url.PathUnescape(parts[idx])
		return s
	}
	return ""
}

// ─── Seller Handlers ─────────────────────────────────────────────────────────

// GET /api/sellers
func handleGetSellers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`SELECT id, store, owner, email, cat, status, revenue, rating FROM sellers_schema.sellers ORDER BY store`)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	sellers := []Seller{}
	for rows.Next() {
		var s Seller
		if err := rows.Scan(&s.ID, &s.Store, &s.Owner, &s.Email, &s.Cat, &s.Status, &s.Revenue, &s.Rating); err == nil {
			sellers = append(sellers, s)
		}
	}
	json200(w, sellers)
}

// POST /api/sellers/register
func handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Store    string `json:"store"`
		Owner    string `json:"owner"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Cat      string `json:"cat"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid request body", 400)
		return
	}
	if req.Email == "" || req.Password == "" || req.Store == "" {
		errResp(w, "store, email and password are required", 400)
		return
	}

	id := genID("SLR-")
	var s Seller
	err := db.QueryRow(
		`INSERT INTO sellers_schema.sellers (id, store, owner, email, password, cat, status, revenue, rating)
		 VALUES ($1,$2,$3,$4,$5,$6,'PENDING',0,0)
		 RETURNING id, store, owner, email, cat, status, revenue, rating`,
		id, req.Store, req.Owner, req.Email, req.Password, req.Cat,
	).Scan(&s.ID, &s.Store, &s.Owner, &s.Email, &s.Cat, &s.Status, &s.Revenue, &s.Rating)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			errResp(w, "Email already registered", 409)
		} else {
			errResp(w, err.Error(), 500)
		}
		return
	}
	w.WriteHeader(http.StatusCreated)
	json200(w, s)
}

// POST /api/sellers/login
func handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid request body", 400)
		return
	}

	var s Seller
	var dbPass string
	err := db.QueryRow(
		`SELECT id, store, owner, email, password, cat, status, revenue, rating
		 FROM sellers_schema.sellers WHERE email = $1`, req.Email,
	).Scan(&s.ID, &s.Store, &s.Owner, &s.Email, &dbPass, &s.Cat, &s.Status, &s.Revenue, &s.Rating)

	if err == sql.ErrNoRows {
		errResp(w, "No account found with that email", 401)
		return
	} else if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	if dbPass != req.Password {
		errResp(w, "Incorrect password", 401)
		return
	}
	json200(w, s)
}

// PUT /api/sellers/{id}/status
func handleUpdateSellerStatus(w http.ResponseWriter, r *http.Request) {
	id := pathSegment(r, 2) // /api/sellers/{id}/status
	var req struct{ Status string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid body", 400)
		return
	}
	var s Seller
	err := db.QueryRow(
		`UPDATE sellers_schema.sellers SET status=$1 WHERE id=$2
		 RETURNING id, store, owner, email, cat, status, revenue, rating`,
		req.Status, id,
	).Scan(&s.ID, &s.Store, &s.Owner, &s.Email, &s.Cat, &s.Status, &s.Revenue, &s.Rating)
	if err != nil {
		errResp(w, "Seller not found", 404)
		return
	}
	json200(w, s)
}

// PUT /api/sellers/{email}/revenue
func handleUpdateSellerRevenue(w http.ResponseWriter, r *http.Request) {
	email, _ := url.PathUnescape(pathSegment(r, 2))
	amountStr := r.URL.Query().Get("amount")
	if amountStr == "" {
		errResp(w, "amount query parameter required", 400)
		return
	}
	_, err := db.Exec(`UPDATE sellers_schema.sellers SET revenue = revenue + $1 WHERE store = $2`, amountStr, email)
	if err != nil {
		errResp(w, "Failed to update revenue", 500)
		return
	}
	json200(w, map[string]string{"status": "success"})
}

// GET /api/sellers/dashboard/{storeName}
func handleDashboard(w http.ResponseWriter, r *http.Request) {
	// path: /api/sellers/dashboard/{storeName}  → segments: api(0) sellers(1) dashboard(2) storeName(3)
	storeName := pathSegment(r, 3)
	if storeName == "" {
		errResp(w, "store name required", 400)
		return
	}

	var stats DashboardStats

	// Products stats
	db.QueryRow(
		`SELECT COUNT(*), COUNT(*) FILTER (WHERE status='APPROVED') FROM products_schema.products WHERE seller=$1`, storeName,
	).Scan(&stats.TotalProducts, &stats.ActiveProducts)

	// Orders stats
	db.QueryRow(
		`SELECT COUNT(*),
		        COALESCE(SUM(amount) FILTER (WHERE status != 'CANCELLED'), 0),
		        COUNT(*) FILTER (WHERE status IN ('PENDING','PROCESSING')),
		        COUNT(*) FILTER (WHERE status = 'DELIVERED')
		 FROM orders_schema.orders WHERE seller=$1`, storeName,
	).Scan(&stats.TotalOrders, &stats.Revenue, &stats.PendingOrders, &stats.DeliveredOrders)

	json200(w, stats)
}

// ─── Product Handlers ─────────────────────────────────────────────────────────

// GET /api/products/seller/{storeName}
func handleGetProductsBySeller(w http.ResponseWriter, r *http.Request) {
	storeName := pathSegment(r, 3) // /api/products/seller/{storeName}
	rows, err := db.Query(
		`SELECT id, name, seller, cat, price, status, date, emoji, description FROM products_schema.products WHERE seller=$1 ORDER BY date DESC`,
		storeName,
	)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	products := []Product{}
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji, &p.Description); err == nil {
			products = append(products, p)
		}
	}
	json200(w, products)
}

// POST /api/products
func handleCreateProduct(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string  `json:"name"`
		Seller      string  `json:"seller"`
		Cat         string  `json:"cat"`
		Price       float64 `json:"price"`
		Emoji       string  `json:"emoji"`
		Description string  `json:"description"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid body", 400)
		return
	}
	if req.Name == "" || req.Seller == "" {
		errResp(w, "name and seller are required", 400)
		return
	}

	id := genID("PDR-")
	date := time.Now().Format("2006-01-02")
	var p Product
	err := db.QueryRow(
		`INSERT INTO products_schema.products (id, name, seller, cat, price, status, date, emoji, description)
		 VALUES ($1,$2,$3,$4,$5,'PENDING',$6,$7,$8)
		 RETURNING id, name, seller, cat, price, status, date, emoji, description`,
		id, req.Name, req.Seller, req.Cat, req.Price, date, req.Emoji, req.Description,
	).Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji, &p.Description)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json200(w, p)
}

// PUT /api/products/{id}/status
func handleUpdateProductStatus(w http.ResponseWriter, r *http.Request) {
	id := pathSegment(r, 2) // /api/products/{id}/status
	var req struct{ Status string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid body", 400)
		return
	}
	var p Product
	err := db.QueryRow(
		`UPDATE products_schema.products SET status=$1 WHERE id=$2
		 RETURNING id, name, seller, cat, price, status, date, emoji, description`,
		req.Status, id,
	).Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji, &p.Description)
	if err != nil {
		errResp(w, "Product not found", 404)
		return
	}
	json200(w, p)
}

// ─── Order Handlers ───────────────────────────────────────────────────────────

// GET /api/orders/seller/{storeName}
func handleGetOrdersBySeller(w http.ResponseWriter, r *http.Request) {
	storeName := pathSegment(r, 3) // /api/orders/seller/{storeName}
	rows, err := db.Query(
		`SELECT id, customer, seller, product, amount, status, payment, date FROM orders_schema.orders WHERE seller=$1 ORDER BY date DESC`,
		storeName,
	)
	if err != nil {
		errResp(w, err.Error(), 500)
		return
	}
	defer rows.Close()
	orders := []Order{}
	for rows.Next() {
		var o Order
		if err := rows.Scan(&o.ID, &o.Customer, &o.Seller, &o.Product, &o.Amount, &o.Status, &o.Payment, &o.Date); err == nil {
			orders = append(orders, o)
		}
	}
	json200(w, orders)
}

// PUT /api/orders/{id}/status
func handleUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := pathSegment(r, 2) // /api/orders/{id}/status
	var req struct{ Status string }
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		errResp(w, "Invalid body", 400)
		return
	}
	var o Order
	err := db.QueryRow(
		`UPDATE orders_schema.orders SET status=$1 WHERE id=$2
		 RETURNING id, customer, seller, product, amount, status, payment, date`,
		req.Status, id,
	).Scan(&o.ID, &o.Customer, &o.Seller, &o.Product, &o.Amount, &o.Status, &o.Payment, &o.Date)
	if err != nil {
		errResp(w, "Order not found", 404)
		return
	}
	json200(w, o)
}

// ─── Router ───────────────────────────────────────────────────────────────────

func makeHandler(fn func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cors(w)
		log.Printf("%-7s %s", r.Method, r.URL.Path)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		fn(w, r)
	}
}

func main() {
	initDB()
	defer db.Close()

	mux := http.NewServeMux()

	// Sellers
	mux.HandleFunc("/api/sellers/register", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleRegister(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	mux.HandleFunc("/api/sellers/login", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleLogin(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	mux.HandleFunc("/api/sellers/dashboard/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleDashboard(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	mux.HandleFunc("/api/sellers/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		// /api/sellers/{id}/status  → parts[3] == "status"
		if len(parts) == 4 && parts[3] == "status" && r.Method == http.MethodPut {
			handleUpdateSellerStatus(w, r)
			return
		}
		if len(parts) == 4 && parts[3] == "revenue" && r.Method == http.MethodPut {
			handleUpdateSellerRevenue(w, r)
			return
		}
		errResp(w, "Not found", 404)
	}))

	mux.HandleFunc("/api/sellers", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetSellers(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	// Products
	mux.HandleFunc("/api/products/seller/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetProductsBySeller(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	mux.HandleFunc("/api/products/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		// /api/products/{id}/status
		if len(parts) == 4 && parts[3] == "status" && r.Method == http.MethodPut {
			handleUpdateProductStatus(w, r)
			return
		}
		errResp(w, "Not found", 404)
	}))

	mux.HandleFunc("/api/products", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			handleCreateProduct(w, r)
		} else if r.Method == http.MethodGet {
			// list all (admin use)
			rows, err := db.Query(`SELECT id, name, seller, cat, price, status, date, emoji, description FROM products_schema.products ORDER BY date DESC`)
			if err != nil {
				errResp(w, err.Error(), 500)
				return
			}
			defer rows.Close()
			products := []Product{}
			for rows.Next() {
				var p Product
				if err := rows.Scan(&p.ID, &p.Name, &p.Seller, &p.Cat, &p.Price, &p.Status, &p.Date, &p.Emoji, &p.Description); err == nil {
					products = append(products, p)
				}
			}
			json200(w, products)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	// Orders
	mux.HandleFunc("/api/orders/seller/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			handleGetOrdersBySeller(w, r)
		} else {
			errResp(w, "Method not allowed", 405)
		}
	}))

	mux.HandleFunc("/api/orders/", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		// /api/orders/{id}/status
		if len(parts) == 4 && parts[3] == "status" && r.Method == http.MethodPut {
			handleUpdateOrderStatus(w, r)
			return
		}
		errResp(w, "Not found", 404)
	}))

	// Health check
	mux.HandleFunc("/health", makeHandler(func(w http.ResponseWriter, r *http.Request) {
		json200(w, map[string]string{"status": "ok", "service": "seller-service"})
	}))

	fmt.Println("🚀 Seller Service running on http://localhost:8090")
	log.Fatal(http.ListenAndServe(":8090", mux))
}
