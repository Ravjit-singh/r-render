const http = require('http');
const fs = require('fs');
const path = require('path');
const util = require('util');
const net = require('net');
const sqlite3 = require('sqlite3').verbose();
const { spawn, exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'r-render-super-secret-key-2026'; 

const execPromise = util.promisify(exec);
const runningProcesses = new Map();
const projectLogs = new Map();

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'pending',
        ram_limit INTEGER DEFAULT 150
    )`);

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

    // EMERGENCY RESET BLOCK
    db.get("SELECT * FROM users WHERE role = 'root'", async (err, row) => {
        const hashedPwd = await bcrypt.hash('admin123', 10);
        if (!row) {
            db.run(`INSERT INTO users (username, password, role, ram_limit) VALUES (?, ?, 'root', 999999)`, ['root', hashedPwd]);
            console.log(`[Security] Default Root Admin created.`);
        } else {
            // TEMPORARY EMERGENCY RESET
            db.run(`UPDATE users SET password = ? WHERE role = 'root'`, [hashedPwd]);
            console.log(`\n[SECURITY OVERRIDE SUCCESSFUL]`);
            console.log(`Your Root Username is: ${row.username}`);
            console.log(`Your Password has been temporarily reset to: admin123\n`);
        }
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

function getFreePort(startingPort) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startingPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port)); 
        });
        server.on('error', () => {
            resolve(getFreePort(startingPort + 1)); 
        });
    });
}

// Security Checkpoint Middleware
const authenticate = (req) => {
    return new Promise((resolve, reject) => {
        const authHeader = req.headers['authorization'];
        if (!authHeader) return reject('No token provided');
        
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return reject('Invalid or expired token');
            resolve(decoded); 
        });
    });
};

const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const pathname = parsedUrl.pathname;

    // --- AUTHENTICATION ROUTER ---
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        try {
            const { username, password } = await getBody(req);
            if (!username || !password) return res.writeHead(400).end(JSON.stringify({ error: "Missing fields" }));
            const hashedPwd = await bcrypt.hash(password, 10);
            
            db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, 'pending')`, [username, hashedPwd], function(err) {
                if (err) return res.writeHead(400).end(JSON.stringify({ error: "Username already taken" }));
                res.writeHead(201).end(JSON.stringify({ message: "Registration successful. Awaiting root admin approval." }));
            });
        } catch (error) { res.writeHead(500).end(JSON.stringify({ error: "Server error" })); }
        return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const { username, password } = await getBody(req);
            db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
                if (err || !user) return res.writeHead(401).end(JSON.stringify({ error: "Invalid credentials" }));
                
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) return res.writeHead(401).end(JSON.stringify({ error: "Invalid credentials" }));
                
                const token = jwt.sign(
                    { id: user.id, username: user.username, role: user.role, ram_limit: user.ram_limit },
                    JWT_SECRET, { expiresIn: '24h' }
                );
                
                res.writeHead(200).end(JSON.stringify({ message: "Login successful", token, user: { username: user.username, role: user.role } }));
            });
        } catch (error) { res.writeHead(500).end(JSON.stringify({ error: "Server error" })); }
        return;
    }

    // --- ADMIN & PROFILE ROUTER ---
    if (pathname === '/api/admin/users' && req.method === 'GET') {
        try {
            const user = await authenticate(req);
            if (user.role !== 'root' && user.role !== 'admin') return res.writeHead(403).end(JSON.stringify({ error: "Forbidden: Admin access required" }));
            db.all("SELECT id, username, role, ram_limit FROM users", [], (err, rows) => {
                if (err) return res.writeHead(500).end(JSON.stringify({ error: err.message }));
                res.writeHead(200).end(JSON.stringify(rows));
            });
        } catch (err) { res.writeHead(401).end(JSON.stringify({ error: err })); }
        return;
    }

    const roleMatch = pathname.match(/^\/api\/admin\/users\/(\d+)\/role$/);
    if (roleMatch && req.method === 'PUT') {
        try {
            const user = await authenticate(req);
            if (user.role !== 'root') return res.writeHead(403).end(JSON.stringify({ error: "Forbidden: Root access required" }));
            
            const targetId = parseInt(roleMatch[1]);
            const { role } = await getBody(req);
            
            if (targetId === 1 && role !== 'root') return res.writeHead(400).end(JSON.stringify({ error: "Cannot demote the primary root account." }));
            db.run(`UPDATE users SET role = ? WHERE id = ?`, [role, targetId], () => {
                res.writeHead(200).end(JSON.stringify({ message: "User role updated successfully" }));
            });
        } catch (err) { res.writeHead(401).end(JSON.stringify({ error: err })); }
        return;
    }

    if (pathname === '/api/users/profile' && req.method === 'PUT') {
        try {
            const user = await authenticate(req);
            const { newUsername, newPassword } = await getBody(req);
            
            if (newPassword) {
                const hashedPwd = await bcrypt.hash(newPassword, 10);
                db.run(`UPDATE users SET username = ?, password = ? WHERE id = ?`, [newUsername || user.username, hashedPwd, user.id], (err) => {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: "Username might be taken." }));
                    res.writeHead(200).end(JSON.stringify({ message: "Profile updated." }));
                });
            } else if (newUsername) {
                db.run(`UPDATE users SET username = ? WHERE id = ?`, [newUsername, user.id], (err) => {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: "Username already taken." }));
                    res.writeHead(200).end(JSON.stringify({ message: "Username updated." }));
                });
            } else { res.writeHead(400).end(JSON.stringify({ error: "No changes provided." })); }
        } catch (err) { res.writeHead(401).end(JSON.stringify({ error: err })); }
        return;
    }

    // --- PROJECT ISOLATION ROUTER ---

    // GET: Fetch isolated projects
    if (pathname === '/api/projects' && req.method === 'GET') {
        try {
            const user = await authenticate(req);
            db.all("SELECT * FROM projects WHERE owner_id = ?", [user.id], (err, rows) => {
                if (err) return res.writeHead(500).end(JSON.stringify({ error: err.message }));
                res.writeHead(200).end(JSON.stringify(rows));
            });
        } catch (err) { res.writeHead(401).end(JSON.stringify({ error: err })); }
        return;
    }

    // POST: Create local project
    if (pathname === '/api/projects' && req.method === 'POST') {
        try {
            const user = await authenticate(req);
            const { name, path: projectPath, start_command, port } = await getBody(req);
            db.run(
                `INSERT INTO projects (owner_id, name, path, start_command, port, status) VALUES (?, ?, ?, ?, ?, 'stopped')`,
                [user.id, name, projectPath, start_command, port],
                function(err) {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: err.message }));
                    res.writeHead(201).end(JSON.stringify({ id: this.lastID, message: "Created" }));
                }
            );
        } catch (error) { res.writeHead(401).end(JSON.stringify({ error: error })); }
        return;
    }

    // POST: GitHub Deploy
    if (pathname === '/api/projects/github' && req.method === 'POST') {
        try {
            const user = await authenticate(req);
            const { name, repoUrl, start_command, port } = await getBody(req);

            const appsDir = path.join(__dirname, 'hosted_apps');
            if (!fs.existsSync(appsDir)) fs.mkdirSync(appsDir);

            const targetPath = path.join(appsDir, name);
            if (fs.existsSync(targetPath)) return res.writeHead(400).end(JSON.stringify({ error: 'Folder already exists.' }));

            await execPromise(`git clone ${repoUrl} "${targetPath}"`);

            const packageJsonPath = path.join(targetPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) await execPromise(`cd "${targetPath}" && npm install`);

            db.run(
                `INSERT INTO projects (owner_id, name, path, start_command, port, status) VALUES (?, ?, ?, ?, ?, 'stopped')`,
                [user.id, name, targetPath, start_command, port],
                function(err) {
                    if (err) return res.writeHead(400).end(JSON.stringify({ error: err.message }));
                    res.writeHead(201).end(JSON.stringify({ id: this.lastID, message: "Successfully cloned and installed!" }));
                }
            );
        } catch (error) { res.writeHead(500).end(JSON.stringify({ error: "Deployment failed." })); }
        return;
    }

    // DYNAMIC PROJECT ACTIONS
    const routeMatch = pathname.match(/^\/api\/projects\/(\d+)(?:\/(start|stop|logs|command|info))?$/);
    if (routeMatch) {
        try {
            const user = await authenticate(req);
            const id = parseInt(routeMatch[1]);
            const action = routeMatch[2] || 'info';

            res.setHeader('Content-Type', 'application/json');

            // 1. Enforce strict isolation
            const project = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM projects WHERE id = ?", [id], (err, row) => {
                    if (err) reject(err); else resolve(row);
                });
            });

            if (!project) return res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
            if (project.owner_id !== user.id) return res.writeHead(403).end(JSON.stringify({ error: 'Forbidden: You do not own this service' }));

            // 2. Process Actions
            if (action === 'info' && req.method === 'GET') {
                return res.writeHead(200).end(JSON.stringify(project));
            }

            if (action === 'info' && req.method === 'DELETE') {
                const child = runningProcesses.get(id);
                if (child && process.platform === 'win32') exec(`taskkill /pid ${child.pid} /T /F`);
                runningProcesses.delete(id);
                projectLogs.delete(id);
                
                db.run("DELETE FROM projects WHERE id = ?", [id], () => {
                    res.writeHead(200).end(JSON.stringify({ message: "Deleted" }));
                });
                return;
            }

            if (action === 'logs' && req.method === 'GET') {
                const logs = projectLogs.get(id) || ["Waiting for process to start..."];
                return res.writeHead(200).end(JSON.stringify({ logs }));
            }

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
                return res.writeHead(400).end(JSON.stringify({ error: "Process not running" }));
            }

            if (action === 'start' && req.method === 'POST') {
                if (runningProcesses.has(id)) return res.writeHead(400).end(JSON.stringify({ error: 'Running' }));
                const safePath = project.path.replace(/\\/g, '/');
                const parts = project.start_command.split(' ');

                const requestedPort = project.port || 3001;
                const actualPort = await getFreePort(requestedPort);

                if (actualPort !== requestedPort) {
                    db.run(`UPDATE projects SET port = ? WHERE id = ?`, [actualPort, id]);
                }

                projectLogs.set(id, [`--- System: Starting ${project.name} on port ${actualPort} ---`]);
                const addLog = (text) => {
                    const logs = projectLogs.get(id) || [];
                    logs.push(text);
                    if (logs.length > 500) logs.shift();
                    projectLogs.set(id, logs);
                };

                try {
                    const env = Object.assign({}, process.env, { PORT: actualPort });
                    const child = spawn(parts[0], parts.slice(1), { cwd: safePath, shell: true, env: env });

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
                } catch (err) { res.writeHead(500).end(JSON.stringify({ error: "Fatal spawn error" })); }
                return;
            }

            if (action === 'stop' && req.method === 'POST') {
                const child = runningProcesses.get(id);
                if (child) {
                    if (process.platform === 'win32') exec(`taskkill /pid ${child.pid} /T /F`);
                    else child.kill('SIGINT');
                    runningProcesses.delete(id);
                    db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                        res.writeHead(200).end(JSON.stringify({ message: "Stopped" }));
                    });
                } else {
                    db.run(`UPDATE projects SET status = 'stopped' WHERE id = ?`, [id], () => {
                        res.writeHead(200).end(JSON.stringify({ message: "Cleaned up ghost state" }));
                    });
                }
                return;
            }

        } catch (err) { return res.writeHead(401).end(JSON.stringify({ error: "Unauthorized" })); }
        return;
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