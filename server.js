const http = require('http');
const fs = require('fs');
const path = require('path');
const util = require('util');
const net = require('net');
const sqlite3 = require('sqlite3').verbose();
const { spawn, exec } = require('child_process');

// Add our new security imports
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret key for signing login tokens (In production, put this in a .env file)
const JWT_SECRET = 'r-render-super-secret-key-2026'; 

const execPromise = util.promisify(exec);
const runningProcesses = new Map();
const projectLogs = new Map();

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Upgraded Multi-Tenant Database Schema
db.serialize(() => {
    // 1. Users Table: Handles identity, roles, and RAM limits
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'pending', -- Roles: 'root', 'admin', 'user', 'pending'
        ram_limit INTEGER DEFAULT 150 -- Default 150MB cap for standard users
    )`);

    // 2. Projects Table: Now includes owner_id to isolate apps
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER,
        name TEXT UNIQUE,
        path TEXT,
        start_command TEXT,
        port INTEGER,
        status TEXT DEFAULT 'stopped',
        FOREIGN KEY(owner_id) REFERENCES users(id)
    )`);

    db.run(`UPDATE projects SET status = 'stopped'`);

    // 3. Auto-Inject the Root Admin on first boot
    db.get("SELECT * FROM users WHERE role = 'root'", async (err, row) => {
        if (!row) {
            // Hash the password so it isn't stored in plain text
            const hashedPwd = await bcrypt.hash('admin123', 10);
            db.run(`INSERT INTO users (username, password, role, ram_limit) VALUES (?, ?, 'root', 999999)`, ['root', hashedPwd]);
            console.log(`[Security] Default Root Admin created. Username: root | Password: admin123`);
        }
    });
});
const PORT = 3000;

// Utility: Read native HTTP POST bodies
const getBody = (req) => {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body || '{}')); } 
            catch (e) { reject(e); }
        });
    });
};

// Utility: Authenticate JWT Token
const authenticate = (req) => {
    return new Promise((resolve, reject) => {
        // We will pass the token in the headers like: "Bearer <token>"
        const authHeader = req.headers['authorization'];
        if (!authHeader) return reject('No token provided');
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return reject('Invalid or expired token');
            resolve(decoded); // Returns { id, username, role, ram_limit }
        });
    });
};

// 2. Create the master HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTER ---

    // GET: Fetch all projects
    if (pathname === '/api/projects' && req.method === 'GET') {
        db.all("SELECT * FROM projects", [], (err, rows) => {
            if (err) return res.writeHead(500).end(JSON.stringify({ error: err.message }));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return;
    }

    // POST: Register a new user (Defaults to 'pending')
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        try {
            const { username, password } = await getBody(req);
            if (!username || !password) return res.writeHead(400).end(JSON.stringify({ error: "Missing fields" }));
            
            // Scramble the password cryptographically
            const hashedPwd = await bcrypt.hash(password, 10);
            
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, 'pending')`, [username, hashedPwd], function(err) {
                if (err) return res.writeHead(400).end(JSON.stringify({ error: "Username already taken" }));
                res.writeHead(201).end(JSON.stringify({ message: "Registration successful. Awaiting root admin approval." }));
            });
        } catch (error) {
            res.writeHead(500).end(JSON.stringify({ error: "Server error" }));
        }
        return;
    }

    // POST: Login and generate token
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const { username, password } = await getBody(req);
            
            db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
                if (err || !user) return res.writeHead(401).end(JSON.stringify({ error: "Invalid credentials" }));
                
                // Compare the typed password with the scrambled hash in the DB
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.writeHead(401).end(JSON.stringify({ error: "Invalid credentials" }));
                
                // Generate a 24-hour digital ID badge (JWT)
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role, ram_limit: user.ram_limit },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.writeHead(200).end(JSON.stringify({ 
                    message: "Login successful", 
                    token, 
                    user: { username: user.username, role: user.role } 
                }));
            });
        } catch (error) {
            res.writeHead(500).end(JSON.stringify({ error: "Server error" }));
        }
        return;
    }
    // POST: Create local project
    if (pathname === '/api/projects' && req.method === 'POST') {
        try {
            const { name, path: projectPath, start_command, port } = await getBody(req);
            db.run(
                `INSERT INTO projects (name, path, start_command, port, status) VALUES (?, ?, ?, ?, 'stopped')`,
                [name, projectPath, start_command, port],
                function(err) {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: err.message }));
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: this.lastID, message: "Created" }));
                }
            );
        } catch (error) {
            res.writeHead(400).end(JSON.stringify({ error: "Invalid JSON" }));
        }
        return;
    }

    // POST: Clone and Deploy from Public GitHub URL
    if (pathname === '/api/projects/github' && req.method === 'POST') {
        try {
            const { name, repoUrl, start_command, port } = await getBody(req);

            const appsDir = path.join(__dirname, 'hosted_apps');
            if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir);

            const targetPath = path.join(appsDir, name);
            if (fs.existsSync(targetPath)) {
                return res.writeHead(400).end(JSON.stringify({ error: 'A folder with this app name already exists locally.' }));
            }

            console.log(`[System] Cloning ${repoUrl} into ${targetPath}...`);
            await execPromise(`git clone ${repoUrl} "${targetPath}"`);

            const packageJsonPath = path.join(targetPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                console.log(`[System] Installing dependencies for ${name}...`);
                await execPromise(`cd "${targetPath}" && npm install`);
            }

            db.run(
                `INSERT INTO projects (name, path, start_command, port, status) VALUES (?, ?, ?, ?, 'stopped')`,
                [name, targetPath, start_command, port],
                function(err) {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: err.message }));
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: this.lastID, message: "Successfully cloned and installed!" }));
                }
            );
        } catch (error) {
            console.error("[GitHub Deploy Error]:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Failed to clone or install. Check the URL and try again." }));
        }
        return;
    }

    // MATCH DYNAMIC ROUTES for specific projects (e.g. /api/projects/1/start)
    const routeMatch = pathname.match(/^\/api\/projects\/(\d+)(?:\/(start|stop|logs|command|info))?$/);
    if (routeMatch) {
        const id = parseInt(routeMatch[1]);
        const action = routeMatch[2] || 'info'; // Fallback to 'info' if no action is provided

        res.setHeader('Content-Type', 'application/json');

        // GET: Single Project Info
        if (action === 'info' && req.method === 'GET') {
            db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
                if (err || !project) return res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
                res.writeHead(200).end(JSON.stringify(project));
            });
            return;
        }

        // DELETE: Remove Project
        if (action === 'info' && req.method === 'DELETE') {
            const child = runningProcesses.get(id);
            if (child && process.platform === 'win32') {
                exec(`taskkill /pid ${child.pid} /T /F`);
            }
            runningProcesses.delete(id);
            projectLogs.delete(id);
            
            db.run("DELETE FROM projects WHERE id = ?", [id], () => {
                res.writeHead(200).end(JSON.stringify({ message: "Deleted" }));
            });
            return;
        }

        // GET: Terminal Logs
        if (action === 'logs' && req.method === 'GET') {
            const logs = projectLogs.get(id) || ["Waiting for process to start..."];
            return res.writeHead(200).end(JSON.stringify({ logs }));
        }

        // POST: Send Command to Terminal
        if (action === 'command' && req.method === 'POST') {
            const { command } = await getBody(req);
            const child = runningProcesses.get(id);
            if (child && child.stdin) {
                child.stdin.write(command + '\n');
                
                const logs = projectLogs.get(id) || [];
                logs.push(`> ${command}`);
                projectLogs.set(id, logs);
                
                return res.writeHead(200).end(JSON.stringify({ message: "Sent" }));
            }
            return res.writeHead(400).end(JSON.stringify({ error: "Process not running or no stdin available" }));
        }

        // POST: Start with Auto-Port Scanner
        if (action === 'start' && req.method === 'POST') {
            db.get("SELECT * FROM projects WHERE id = ?", [id], async (err, project) => {
                if (err || !project) return res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
                if (runningProcesses.has(id)) return res.writeHead(400).end(JSON.stringify({ error: 'Running' }));

                const safePath = project.path.replace(/\\/g, '/');
                const parts = project.start_command.split(' ');

                // 1. Scan for a guaranteed free port
                const requestedPort = project.port || 3001;
                const actualPort = await getFreePort(requestedPort);

                // 2. Update DB if port was auto-incremented
                if (actualPort !== requestedPort) {
                    db.run(`UPDATE projects SET port = ? WHERE id = ?`, [actualPort, id]);
                }

                // 3. Setup log streaming
                projectLogs.set(id, [`--- System: Starting ${project.name} on port ${actualPort} ---`]);
                const addLog = (text) => {
                    const logs = projectLogs.get(id) || [];
                    logs.push(text);
                    if (logs.length > 500) logs.shift(); // Keep last 500 lines to save RAM
                    projectLogs.set(id, logs);
                };

                try {
                    // 4. Inject dynamic port into the app environment
                    const env = Object.assign({}, process.env, { PORT: actualPort });

                    const child = spawn(parts[0], parts.slice(1), { 
                        cwd: safePath, 
                        shell: true,
                        env: env 
                    });

                    child.stdout.on('data', data => addLog(data.toString().trim()));
                    child.stderr.on('data', data => addLog(`[ERR] ${data.toString().trim()}`));
                    child.on('error', err => addLog(`[CRITICAL] ${err.message}`));
                    
                    child.on('close', (code) => {
                        addLog(`--- System: Process exited with code ${code} ---`);
                        runningProcesses.delete(id);
                        db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id]);
                    });

                    runningProcesses.set(id, child);
                    db.run(`UPDATE projects SET status = 'running' WHERE id = ?`, [id], () => {
                        res.writeHead(200).end(JSON.stringify({ message: "Started", port: actualPort }));
                    });
                } catch (err) {
                    res.writeHead(500).end(JSON.stringify({ error: "Fatal spawn error" }));
                }
            });
            return;
        }

        // POST: Stop with Force-Kill
        if (action === 'stop' && req.method === 'POST') {
            const child = runningProcesses.get(id);
            if (child) {
                if (process.platform === 'win32') {
                    exec(`taskkill /pid ${child.pid} /T /F`, (err) => {
                        if (err) console.error(`[Stop Error] Failed to taskkill PID ${child.pid}`);
                    });
                } else {
                    child.kill('SIGINT');
                }
                runningProcesses.delete(id);
                
                db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                    res.writeHead(200).end(JSON.stringify({ message: "Service forcefully stopped" }));
                });
            } else {
                db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                    res.writeHead(200).end(JSON.stringify({ message: "Cleaned up ghost state" }));
                });
            }
            return;
        }
    }

    // --- STATIC FILE SERVER ---
    
    // Route traffic to our public folder
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    let extname = path.extname(filePath);
    
    // MIME types mapping
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404).end('404: File Not Found');
            } else {
                res.writeHead(500).end('Server Error: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// 3. Boot up the Core
server.listen(PORT, () => {
    console.log(`🚀 R-Render Core running on http://localhost:${PORT}`);
    
    const memoryUsed = Math.round(process.memoryUsage().rss / 1024 / 1024);
    console.log(`🧠 Master Process RAM Usage: ${memoryUsed} MB`);
});