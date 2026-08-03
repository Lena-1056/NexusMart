$env:DB_PASSWORD="1234567890"
# Do NOT set JWT_SECRET_KEY here so the Python/Java processes fall back to the .env file

# Java services
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\order-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\payment-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\cart-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\shipping-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\auth-service" -WindowStyle Hidden
#start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\inventory-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "$PSScriptRoot\backend\inventory-service" -WindowStyle Hidden
start-process mvn -ArgumentList "spring-boot:run" -WorkingDirectory "F:\ECommerce\backend\user-service" -WindowStyle Hidden

# Go services
#start-process go -ArgumentList "run main.go" -WorkingDirectory "F:\ECommerce\backend\product-service" -WindowStyle Hidden
#start-process go -ArgumentList "run main.go" -WorkingDirectory "F:\ECommerce\backend\api-gateway" -WindowStyle Hidden
start-process go -ArgumentList "run main.go" -WorkingDirectory "$PSScriptRoot\backend\product-service" -WindowStyle Hidden
start-process go -ArgumentList "run main.go" -WorkingDirectory "$PSScriptRoot\backend\api-gateway" -WindowStyle Hidden

# Python services
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\seller-service" -WindowStyle Hidden
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\admin-service" -WindowStyle Hidden
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\search-service" -WindowStyle Hidden
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\wishlist-service" -WindowStyle Hidden
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\review-service" -WindowStyle Hidden
start-process python -ArgumentList "main.py" -WorkingDirectory "F:\ECommerce\backend\notification-service" -WindowStyle Hidden

Write-Host "All backend services started."
