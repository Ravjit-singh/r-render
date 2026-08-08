const http = require('http');
const fs = require('fs');
const path = require('path');
const util = require('util');
const sqlite3 = require('sqlite3').verbose();
const { spawn, exec } = require('child_process');
// Convert exec into a Promise so we can "await" git clone and npm install
const execPromise = util.promisify(exec);
const runningProcesses = new Map();
const projectLogs = new Map(); // Stores live terminal output: { id: ["log 1", "log 2"] }

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        path TEXT,
        start_command TEXT,
        port INTEGER,
        status TEXT DEFAULT 'stopped'
    )`);
    db.run(`UPDATE projects SET status = 'stopped'`);
});

const PORT = 3000;

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

    // POST: Create project
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

            // 1. Create a master folder for cloned apps if it doesn't exist
            const appsDir = path.join(__dirname, 'hosted_apps');
            if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir);

            // 2. Define the exact path for this specific new app
            const targetPath = path.join(appsDir, name);

            if (fs.existsSync(targetPath)) {
                return res.writeHead(400).end(JSON.stringify({ error: 'A folder with this app name already exists locally.' }));
            }

            // 3. Clone the repository
            console.log(`[System] Cloning ${repoUrl} into ${targetPath}...`);
            await execPromise(`git clone ${repoUrl} "${targetPath}"`);

            // 4. Run npm install (if it's a Node project)
            console.log(`[System] Installing dependencies for ${name}...`);
            const packageJsonPath = path.join(targetPath, 'package.json');
            
            if (fs.existsSync(packageJsonPath)) {
                // Cross-platform command to enter the directory and install
                await execPromise(`cd "${targetPath}" && npm install`);
                console.log(`[System] npm install complete for ${name}.`);
            } else {
                console.log(`[System] No package.json found. Skipping npm install.`);
            }

            // 5. Save the finished project to the database
            db.run(
                `INSERT INTO projects (name, path, start_command, port, status) VALUES (?, ?, ?, ?, 'stopped')`,
                [name, targetPath, start_command, port],
                function(err) {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: err.message }));
                    res.writeHead(201).end(JSON.stringify({ id: this.lastID, message: "Successfully cloned and installed!" }));
                }
            );

        } catch (error) {
            console.error("[GitHub Deploy Error]:", error);
            res.writeHead(500).end(JSON.stringify({ error: "Failed to clone or install. Check the URL and try again." }));
        }
        return;
    }
    // MATCH DYNAMIC ROUTES (e.g. /api/projects/1/something)
    const routeMatch = pathname.match(/^\/api\/projects\/(\d+)(?:\/(start|stop|logs|command|delete|info))?$/);
    if (routeMatch) {
        const id = parseInt(routeMatch[1]);
        const action = routeMatch[2] || 'info';

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
                
                // Echo command to logs
                const logs = projectLogs.get(id) || [];
                logs.push(`> ${command}`);
                projectLogs.set(id, logs);
                
                return res.writeHead(200).end(JSON.stringify({ message: "Sent" }));
            }
            return res.writeHead(400).end(JSON.stringify({ error: "Process not running or no stdin available" }));
        }

        // POST: Start
        if (action === 'start' && req.method === 'POST') {
            db.get("SELECT * FROM projects WHERE id = ?", [id], (err, project) => {
                if (err || !project) return res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
                if (runningProcesses.has(id)) return res.writeHead(400).end(JSON.stringify({ error: 'Running' }));

                const safePath = project.path.replace(/\\/g, '/');
                const parts = project.start_command.split(' ');

                // Initialize empty logs for this session
                projectLogs.set(id, [`--- System: Starting ${project.name} ---`]);
                const addLog = (text) => {
                    const logs = projectLogs.get(id) || [];
                    logs.push(text);
                    if (logs.length > 500) logs.shift(); // Keep last 500 lines to save RAM
                    projectLogs.set(id, logs);
                };

                try {
                    const child = spawn(parts[0], parts.slice(1), { cwd: safePath, shell: true });

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
                        res.writeHead(200).end(JSON.stringify({ message: "Started" }));
                    });
                } catch (err) {
                    res.writeHead(500).end(JSON.stringify({ error: "Fatal spawn error" }));
                }
            });
            return;
        }

        // POST: Stop
        if (action === 'stop' && req.method === 'POST') {
            const child = runningProcesses.get(id);
            if (child) {
                if (process.platform === 'win32') exec(`taskkill /pid ${child.pid} /T /F`);
                else child.kill('SIGINT');
                runningProcesses.delete(id);
            }
            db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                res.writeHead(200).end(JSON.stringify({ message: "Stopped" }));
            });
            return;
        }
    }

    // --- STATIC FILE SERVER ---
    let filePath = path.join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    let extname = path.extname(filePath);
    let contentType = 'text/html';
    if (extname === '.js') contentType = 'text/javascript';
    if (extname === '.css') contentType = 'text/css';

    fs.readFile(filePath, (err, content) => {
        if (err) res.writeHead(err.code === 'ENOENT' ? 404 : 500).end(err.code === 'ENOENT' ? '404' : 'Error');
        else res.writeHead(200, { 'Content-Type': contentType }).end(content, 'utf-8');
    });
});

server.listen(PORT, () => {
    console.log(`🚀 R-Render Core running on http://localhost:${PORT}`);
});