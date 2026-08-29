Write-Host -ForegroundColor Cyan "
 ____      ____  _____ _   _ ____  _____ ____  
|  _ \    |  _ \| ____| \ | |  _ \| ____|  _ \ 
| |_) |___| |_) |  _| |  \| | | | |  _| | |_) |
|  _ <____|  _ <| |___| |\  | |_| | |___|  _ < 
|_| \_\   |_| \_\_____|_| \_|____/|_____|_| \_\
"

Write-Host "Initializing R-Render Core Installation..."
Write-Host "------------------------------------------"

# 1. Check for Git
if (!(Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "[1/4] Git not found. Installing Git via Winget..."
    winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
} else {
    Write-Host "[1/4] Git is already installed."
}

# 2. Check for Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[2/4] Node.js not found. Installing Node.js via Winget..."
    winget install --id OpenJS.NodeJS -e --source winget --accept-package-agreements --accept-source-agreements
    
    # Reload environment variables so npm is recognized in this session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
} else {
    Write-Host "[2/4] Node.js is already installed."
}

# 3. Clone R-Render
Write-Host "[3/4] Downloading R-Render architecture..."
if (Test-Path "$HOME\r-render") {
    Write-Host "Directory already exists. Overwriting..."
    Remove-Item "$HOME\r-render" -Recurse -Force
}
git clone https://github.com/Ravjit-singh/r-render.git "$HOME\r-render"
Set-Location "$HOME\r-render"

# 4. Install Dependencies
Write-Host "[4/4] Installing NPM packages..."
npm install

Write-Host "------------------------------------------"
Write-Host -ForegroundColor Green "✅ Installation Complete!"
Write-Host "To boot your server, run:"
Write-Host "cd $HOME\r-render; npm start"
Write-Host "Access the dashboard at: http://localhost:2999"