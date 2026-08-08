const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { spawn } = require('child_process'); // The engine that runs your apps

// Track running processes in memory so we can kill them later
const runningProcesses = new Map();

// 1. Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create the projects table and ensure clean boot states
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        path TEXT,
        start_command TEXT,
        port INTEGER,
        status TEXT DEFAULT 'stopped'
    )`);
    
    // Safety check: If the core restarts, reset all apps to stopped
    db.run(`UPDATE projects SET status = 'stopped'`);
});

const PORT = 3000;

// Helper function to read native HTTP POST bodies
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

// 2. Create the ultra-lightweight HTTP Server
const server = http.createServer(async (req, res) => {
    
    // Parse the URL safely so we can handle dynamic IDs (like /start/1)
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --- API ROUTER ---

    // GET: Fetch all projects
    if (pathname === '/api/projects' && req.method === 'GET') {
        db.all("SELECT * FROM projects", [], (err, rows) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: err.message }));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(rows));
        });
        return;
    }

    // POST: Create a new project
    if (pathname === '/api/projects' && req.method === 'POST') {
        try {
            const data = await getBody(req);
            const { name, path: projectPath, start_command, port } = data;
            
            db.run(
                `INSERT INTO projects (name, path, start_command, port, status) VALUES (?, ?, ?, ?, 'stopped')`,
                [name, projectPath, start_command, port],
                function(err) {
                    if (err) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        return res.end(JSON.stringify({ error: err.message }));
                    }
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ id: this.lastID, message: "Service created successfully" }));
                }
            );
        } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Invalid JSON provided" }));
        }
        return;
    }

    // POST: Start a hosted web service
    const startMatch = pathname.match(/^\/api\/projects\/(\d+)\/start$/);
    if (startMatch && req.method === 'POST') {
        const id = parseInt(startMatch[1]);
        
        db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
            if (err || !project) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Project not found' }));
            }

            if (runningProcesses.has(id)) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ error: 'Service is already running' }));
            }

            // Cross-platform splitting for Windows/Linux (e.g., 'npm' and 'start')
            const parts = project.start_command.split(' ');
            const cmd = parts[0];
            const args = parts.slice(1);

            // Boot the child process directly on your host OS
            const child = spawn(cmd, args, { 
                cwd: project.path, 
                shell: true // Crucial for executing native cmd/bash commands smoothly
            });

            // Stream live terminal logs straight to our core console
            child.stdout.on('data', data => console.log(`[${project.name}] ${data.toString().trim()}`));
            child.stderr.on('data', data => console.error(`[${project.name} ERROR] ${data.toString().trim()}`));
            
            // Listen for natural crashes or stops
            child.on('close', (code) => {
                console.log(`[${project.name}] Exited with code ${code}`);
                runningProcesses.delete(id);
                db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id]);
            });

            // Lock it into memory and update the database
            runningProcesses.set(id, child);
            db.run(`UPDATE projects SET status = 'running' WHERE id = ?`, [id], () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Started successfully" }));
            });
        });
        return;
    }

    // POST: Suspend/Stop a hosted web service
    const stopMatch = pathname.match(/^\/api\/projects\/(\d+)\/stop$/);
    if (stopMatch && req.method === 'POST') {
        const id = parseInt(stopMatch[1]);
        
        const child = runningProcesses.get(id);
        if (child) {
            child.kill(); // Terminate the native process
            runningProcesses.delete(id);
            
            db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: "Suspended successfully" }));
            });
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service is not running' }));
        }
        return;
    }

    // --- STATIC FILE SERVER ---
    
    // Route traffic to our public folder (HTML, CSS, JS)
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    let extname = path.extname(filePath);
    
    // Assign proper MIME types so the browser reads them correctly
    let contentType = 'text/html';
    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404: File Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + err.code);
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
    
    // Log our actual memory usage to prove how light it is
    const memoryUsed = Math.round(process.memoryUsage().rss / 1024 / 1024);
    console.log(`🧠 Master Process RAM Usage: ${memoryUsed} MB`);
});