$folders = "api-gateway", "auth-service", "product-service", "order-service", "seller-service"

foreach ($folder in $folders) {
    Write-Host "Installing dependencies for $folder"
    Push-Location $folder
    npm install
    Pop-Location
}
