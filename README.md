![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge) ![Build](https://img.shields.io/badge/Build-Stable-brightgreen?style=for-the-badge) ![Platform](https://img.shields.io/badge/Platform-Linux_%7C_Windows-lightgrey?style=for-the-badge)[cite: 6]

> [!NOTE][cite: 6]
> **R-Render Core**
> R-Render Core is a high-performance, self-hosted Platform as a Service (PaaS) designed to run on bare-metal servers, mini PCs, and local development machines. Engineered for maximum efficiency, the platform features a robust Node.js backend for process management and a premium, glassmorphic Tailwind CSS frontend known as the "Rashboard". It replaces heavy cloud infrastructure by allowing you to deploy Node.js APIs and static sites instantly with zero-configuration routing.

## Table of Contents[cite: 6]
 1. [Architecture Overview](#architecture-overview)
 2. [Core Features](#core-features)
 3. [Prerequisites](#prerequisites)
 4. [Deployment & Installation](#deployment--installation)
 5. [System Administration](#system-administration)
 6. [Security Infrastructure](#security-infrastructure)
 7. [License](#license)

## Architecture Overview[cite: 6]
R-Render follows a monolithic, client-server architecture built specifically for isolated containerization and process persistence.

| Component | Primary Technologies | Functionality & Purpose |
|---|---|---|
| **Backend API** | Node.js, native `child_process` | Manages RESTful routing, secure JWT authentication, port allocation, and terminal process spawning. |
| **Database** | SQLite3 (C++ Native) | A zero-configuration SQL database engine storing user states, role-based access limits, and project configurations.[cite: 6] |
| **Process Manager** | In-Memory Map | Tracks PID (Process IDs), monitors memory consumption, and captures continuous `stdout`/`stderr` streams. |
| **Web Interface** | HTML5, Tailwind CSS, JS | The "Rashboard": A responsive, DOM-manipulated graphical interface featuring glassmorphic Material-inspired components and custom WebKit trackers.[cite: 6] |

## Core Features[cite: 6]

### Automated Deployment Engine
 * **Zero-Config GitHub Pulls:** Provide a repository URL, and R-Render will automatically clone the source code and execute `npm install` securely on the server.
 * **Local Directory Sync:** Link existing local code folders directly to the daemon for instant execution.
 * **Dynamic Port Allocation:** Automatically scans for and binds available network ports to prevent collision across multiple Node.js environments.

### Static File Delivery
 * **0MB RAM Footprint:** Deploy native HTML/CSS/JS applications via the `STATIC` bypass, allowing the backend to stream files directly to the web without spawning heavy background node processes.

### Terminal & Log Monitoring
 * **Live Telemetry:** Stream system logs, application errors, and standard output directly to the dashboard's simulated terminal in real time.
 * **Interactive Shell:** Send commands directly to the running process's `stdin` via the web interface.

## Prerequisites[cite: 6]
The automated installation scripts are designed to handle complete dependency resolution from a barebones OS.[cite: 6]

Supported environments include:[cite: 6]
 * **Linux:** Debian/Ubuntu-based distributions (requires `curl`)
 * **Windows:** Windows 10/11 (requires PowerShell)

## Deployment & Installation[cite: 6]
R-Render features universal, zero-dependency installation scripts. The scripts dynamically detect the OS, utilize `winget` or `apt` to install Node.js and Git, and clone the architecture.

> [!IMPORTANT][cite: 6]
> **Linux Automated Installation**
> Execute the following command in your terminal to begin the automated setup:
> ```bash
> curl -fsSL [https://raw.githubusercontent.com/Ravjit-singh/r-render/main/install.sh](https://raw.githubusercontent.com/Ravjit-singh/r-render/main/install.sh) | bash
> ```

> [!IMPORTANT]
> **Windows Automated Installation**
> Open PowerShell as an Administrator and execute:
> ```powershell
> iwr -useb [https://raw.githubusercontent.com/Ravjit-singh/r-render/main/install.ps1](https://raw.githubusercontent.com/Ravjit-singh/r-render/main/install.ps1) | iex
> ```

> [!CAUTION][cite: 6]
> **First Boot Initialization**
> Upon successful installation, the server will boot automatically on port `2999`. 
> 1. Access the platform at: `http://localhost:2999`
> 2. Log in using the default emergency credentials (Username: `root`, Password: `admin123`).
> 3. Navigate immediately to the **Settings** panel to secure the cryptographic key.

## System Administration[cite: 6]
R-Render is built with a strict, approval-based user lifecycle. By default, newly registered accounts are placed in a `pending` state and cannot deploy services until explicitly approved by the Root Administrator.[cite: 6]

### Administrator Capabilities
 * **Account Approval:** Review and authorize pending user registrations via the Admin Panel.[cite: 6]
 * **Role-Based Access Control (RBAC):** Assign tiers (`pending`, `user`, `admin`, `root`) to strictly sandbox environments.
 * **Resource Quotas:** Monitor and restrict RAM limits (MB) per user account to prevent server throttling.

## Security Infrastructure[cite: 6]
 * **Authentication:** Stateless authentication utilizing JSON Web Tokens (JWT) signed with a secure cryptographic secret.[cite: 6]
 * **Password Cryptography:** All user passwords are salted and hashed utilizing the bcrypt algorithm prior to database insertion.[cite: 6]
 * **Rate Limiting:** In-memory request throttling restricts the `/api/auth/login` endpoint to 10 attempts per 15 minutes to mitigate brute-force dictionary attacks. General APIs are restricted to 200 requests per 15 minutes.[cite: 6]
 * **Header Hardening:** Injects strict `X-Content-Type-Options`, `X-Frame-Options`, and `X-XSS-Protection` headers into every response.

## License[cite: 6]
This software is released under the MIT License.[cite: 6]

Copyright (c) 2026 Ravjit Singh Saini[cite: 6]

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:[cite: 6]

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.[cite: 6]

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.[cite: 6]