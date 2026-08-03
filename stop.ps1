Write-Host "Stopping all E-Commerce Services..."

# 1. Stop Frontend processes (Node.js/Vite/Angular)
Write-Host "Stopping Node (Frontend) microservices..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# 2. Stop Java processes (Spring Boot)
Write-Host "Stopping Java (Backend) microservices..."
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue

# 3. Stop Python processes (FastAPI)
Write-Host "Stopping Python (Backend) microservices..."
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

# 4. Stop Go processes
Write-Host "Stopping Go (Backend) microservices..."
Stop-Process -Name "go" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "main" -Force -ErrorAction SilentlyContinue

# 5. Close the extra Command Prompt windows that were opened for the frontend
Write-Host "Closing terminal windows..."
Stop-Process -Name "cmd" -Force -ErrorAction SilentlyContinue

Write-Host "All frontend and backend services have been successfully stopped!"