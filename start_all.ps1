$env:DB_PASSWORD="1234567890"
# Do NOT set JWT_SECRET_KEY here so the Python/Java processes fall back to the .env file

# Java services
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\order-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\payment-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\cart-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\shipping-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\auth-service" -WindowStyle Hidden
#start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\inventory-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\inventory-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c mvn spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\user-service" -WindowStyle Hidden

# Go services
#start-process cmd -ArgumentList "/c go run main.go" -WorkingDirectory "$PSScriptRoot\backend\product-service" -WindowStyle Hidden
#start-process cmd -ArgumentList "/c go run main.go" -WorkingDirectory "$PSScriptRoot\backend\api-gateway" -WindowStyle Hidden
start-process cmd -ArgumentList "/c go run main.go" -WorkingDirectory "$PSScriptRoot\backend\product-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c go run main.go" -WorkingDirectory "$PSScriptRoot\backend\api-gateway" -WindowStyle Hidden

# Python services
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\seller-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\admin-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\search-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\wishlist-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\review-service" -WindowStyle Hidden
start-process cmd -ArgumentList "/c python main.py" -WorkingDirectory "$PSScriptRoot\backend\notification-service" -WindowStyle Hidden

Write-Host "All backend services started."
