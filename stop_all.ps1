# Stop all Java microservices (Spring Boot)
Write-Host "Stopping Java microservices..."
Stop-Process -Name "java" -Force -ErrorAction SilentlyContinue

# Stop all Python microservices (FastAPI)
Write-Host "Stopping Python microservices..."
Stop-Process -Name "python" -Force -ErrorAction SilentlyContinue

Write-Host "All background services have been stopped!"
