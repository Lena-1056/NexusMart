Write-Host "Starting Frontend Apps..."

# 1. Start the servers in the background
start-process cmd -ArgumentList "/c npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-customer-app" -WindowStyle Hidden
start-process cmd -ArgumentList "/c npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-seller-dashboard" -WindowStyle Hidden
start-process cmd -ArgumentList "/c npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-admin-dashboard" -WindowStyle Hidden
start-process cmd -ArgumentList "/c npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-delivery-partner-app" -WindowStyle Hidden
start-process cmd -ArgumentList "/c npm install && npm start" -WorkingDirectory "$PSScriptRoot\admin-onboarding\admin-onboarding-frontend" -WindowStyle Hidden

# 2. Wait 5 seconds to give Vite and Angular time to boot up
Write-Host "Waiting 5 seconds for servers to boot up..."
Start-Sleep -Seconds 5

# 3. Automatically open all URLs in your default web browser
Write-Host "Opening URLs in your browser..."
Start-Process "http://localhost:5173"
Start-Process "http://localhost:5174"
Start-Process "http://localhost:5175"
Start-Process "http://localhost:5178"
Start-Process "http://localhost:4200"

Write-Host "All frontends started and opened successfully!"

# Write-Host "Installing dependencies and starting Frontend Apps..."

# # 1. Start the servers in visible command windows so you can see the install progress
# start-process cmd -ArgumentList "/k npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-customer-app"
# start-process cmd -ArgumentList "/k npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-seller-dashboard"
# start-process cmd -ArgumentList "/k npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-admin-dashboard"
# start-process cmd -ArgumentList "/k npm install && npm run dev" -WorkingDirectory "$PSScriptRoot\frontend\react-delivery-partner-app"
# start-process cmd -ArgumentList "/k npm install && npm start" -WorkingDirectory "$PSScriptRoot\admin-onboarding\admin-onboarding-frontend"

# # 2. Wait 15 seconds to give npm install and the servers time to boot up
# Write-Host "Waiting 15 seconds for installations and servers to boot up..."
# Start-Sleep -Seconds 15

# # 3. Automatically open all URLs in your default web browser
# Write-Host "Opening URLs in your browser..."
# Start-Process "http://localhost:5173"
# Start-Process "http://localhost:5174"
# Start-Process "http://localhost:5175"
# Start-Process "http://localhost:5178"
# Start-Process "http://localhost:4200"

# Write-Host "All frontends are processing!"