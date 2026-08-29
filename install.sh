### install.sh (Linux/Debian Installer)
This script is optimized for headless Linux environments. It handles root privileges, package managers, and dependency injection automatically.

```bash
#!/bin/bash

# R-Render ASCII Banner
echo -e "\033[34m"
cat << "EOF"
 ____      ____  _____ _   _ ____  _____ ____  
|  _ \    |  _ \| ____| \ | |  _ \| ____|  _ \ 
| |_) |___| |_) |  _| |  \| | | | |  _| | |_) |
|  _ <____|  _ <| |___| |\  | |_| | |___|  _ < 
|_| \_\   |_| \_\_____|_| \_|____/|_____|_| \_\
                                               
EOF
echo -e "\033[0m"
echo "Initializing R-Render Core Installation..."
echo "------------------------------------------"

# 1. Install prerequisites
echo "[1/4] Installing Git & build tools..."
sudo apt-get update -y
sudo apt-get install -y curl git build-essential

# 2. Install Node.js (LTS)
echo "[2/4] Provisioning Node.js environment..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Clone R-Render Core
echo "[3/4] Downloading R-Render architecture..."
git clone https://github.com/Ravjit-singh/r-render.git ~/r-render
cd ~/r-render

# 4. Install Dependencies
echo "[4/4] Installing NPM packages..."
npm install

echo "------------------------------------------"
echo "✅ Installation Complete!"
echo "To boot your server, run:"
echo "cd ~/r-render && npm start"
echo "Access the dashboard at: http://localhost:2999"