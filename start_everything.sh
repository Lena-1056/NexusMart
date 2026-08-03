#!/bin/bash

# Ensure the script runs from the directory it is located in
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

echo -e "\e[36m======================================"
echo -e " STARTING E-COMMERCE BACKEND SERVICES "
echo -e "======================================\e[0m"

# Load environment variables from .env file so Java services can read DB_PASSWORD
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
else
  export DB_PASSWORD="1234567890"
fi

# Java Services
(cd backend/auth-service && mvn.cmd spring-boot:run >/dev/null 2>&1 &)
(cd backend/cart-service && mvn.cmd spring-boot:run >/dev/null 2>&1 &)
(cd backend/order-service && mvn.cmd spring-boot:run >/dev/null 2>&1 &)
(cd backend/shipping-service && mvn.cmd spring-boot:run)
(cd backend/payment-service && mvn.cmd spring-boot:run)

# Python Services (using python for Windows/Git Bash)
(cd backend/admin-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8084 --reload >/dev/null 2>&1 &)
(cd backend/seller-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8090 --reload >/dev/null 2>&1 &)
(cd backend/search-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8087 --reload >/dev/null 2>&1 &)
(cd backend/wishlist-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8088 --reload >/dev/null 2>&1 &)
(cd backend/review-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8089 --reload >/dev/null 2>&1 &)
(cd backend/notification-service && python.exe -m uvicorn main:app --host 0.0.0.0 --port 8091 --reload >/dev/null 2>&1 &)

# Custom Python Mock
(cd backend/inventory-service && python.exe main.py >/dev/null 2>&1 &)

# Go Services
(cd backend/product-service && go.exe run main.go)
(cd backend/api-gateway && go.exe run main.go >/dev/null 2>&1 &)

echo -e "\e[33mWaiting 20 seconds for backend to boot up...\e[0m"
sleep 20

# Associative array for backend ports
declare -A backend_ports=(
    [8081]="Auth Service"
    [8086]="Cart Service"
    [8083]="Order Service"
    [8094]="Shipping Service"
    [8082]="Payment Service"
    [8084]="Admin Service"
    [8090]="Seller Service"
    [8087]="Search Service"
    [8088]="Wishlist Service"
    [8089]="Review Service"
    [8091]="Notification Service"
    [8098]="Inventory Service"
    [8085]="Product Service"
    [8080]="API Gateway"
)

echo -e "\n\e[36m--- BACKEND STATUS ---\e[0m"
for port in "${!backend_ports[@]}"; do
    # Using bash built-in /dev/tcp/ to check if the port is open
    if (echo > /dev/tcp/127.0.0.1/$port) >/dev/null 2>&1; then
        echo -e "\e[32m[SUCCESS] ${backend_ports[$port]} is RUNNING on Port $port\e[0m"
    else
        echo -e "\e[31m[ERROR]   ${backend_ports[$port]} FAILED to start on Port $port!\e[0m"
    fi
done

echo -e "\n\e[36m======================================"
echo -e " STARTING E-COMMERCE FRONTEND APPS    "
echo -e "======================================\e[0m"

(cd frontend/react-customer-app && npm.cmd run dev >/dev/null 2>&1 &)
(cd frontend/react-seller-dashboard && npm.cmd run dev >/dev/null 2>&1 &)
(cd frontend/react-admin-dashboard && npm.cmd run dev >/dev/null 2>&1 &)
(cd frontend/react-delivery-partner-app && npm.cmd run dev >/dev/null 2>&1 &)
(cd admin-onboarding/admin-onboarding-frontend && npm.cmd start >/dev/null 2>&1 &)

echo -e "\e[33mWaiting 15 seconds for frontends to boot up...\e[0m"
sleep 15

# Associative array for frontend ports
declare -A frontend_ports=(
    [5173]="Customer App"
    [5174]="Seller Dashboard"
    [5175]="Admin Dashboard"
    [5178]="Delivery Partner App"
    [4200]="Admin Onboarding App"
)

echo -e "\n\e[36m--- FRONTEND STATUS & URLS ---\e[0m"
for port in "${!frontend_ports[@]}"; do
    if (echo > /dev/tcp/127.0.0.1/$port) >/dev/null 2>&1; then
        echo -e "\e[32m[SUCCESS] ${frontend_ports[$port]} is RUNNING -> http://localhost:$port\e[0m"
    else
        echo -e "\e[31m[ERROR]   ${frontend_ports[$port]} FAILED to start on Port $port! Check if npm install was run.\e[0m"
    fi
done
echo -e "\n\e[36mAll processes initiated. Check the output above for any errors!\e[0m"