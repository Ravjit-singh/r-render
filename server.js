const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 1. Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Create the projects table if it doesn't exist yet
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        path TEXT,
        start_command TEXT,
        port INTEGER,
        status TEXT DEFAULT 'stopped'
    )`);
});

const PORT = 3000;

// 2. Create the ultra-lightweight HTTP Server
const server = http.createServer((req, res) => {
    
    // --- API ROUTER ---
    // Fetch all hosted projects from the database
    if (req.url === '/api/projects' && req.method === 'GET') {
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

    // --- STATIC FILE SERVER ---
    // Route traffic to our public folder (HTML, CSS, JS)
    let filePath = path.join(__dirname, 'public', req.url === '/' ? 'index.html' : req.url);
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
    console.log(`🚀 Mini-Render Core running on http://localhost:${PORT}`);
    
    // Log our actual memory usage to prove how light it is
    const memoryUsed = Math.round(process.memoryUsage().rss / 1024 / 1024);
    console.log(`🧠 Master Process RAM Usage: ${memoryUsed} MB`);
});