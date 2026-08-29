// Utility to attach the token
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
}

// Centralized Interceptor: Automatically handles 401/403 security lockouts
async function fetchWithAuth(url, options = {}) {
    options.headers = getHeaders();
    const res = await fetch(url, options);
    
    if (res.status === 401 || res.status === 403) {
        localStorage.clear();
        window.location.reload(); // Instantly boot them back to the Auth screen
        throw new Error('Session expired. Redirecting...');
    }
    
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'API Request Failed');
    return data;
}

// --- PUBLIC ROUTES ---
export async function loginUser(username, password) {
    const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

export async function registerUser(username, password) {
    const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
}

// --- PROTECTED ROUTES ---
export async function fetchProjects() {
    try {
        return await fetchWithAuth('/api/projects');
    } catch (error) {
        return null; // Gracefully trigger the empty state if network dies
    }
}

export function createProject(data) { 
    return fetchWithAuth('/api/projects', { method: 'POST', body: JSON.stringify(data) }); 
}

export function createGithubProject(data) { 
    return fetchWithAuth('/api/projects/github', { method: 'POST', body: JSON.stringify(data) }); 
}

export function startProject(id) { 
    return fetchWithAuth(`/api/projects/${id}/start`, { method: 'POST' }); 
}

export function stopProject(id) { 
    return fetchWithAuth(`/api/projects/${id}/stop`, { method: 'POST' }); 
}

export function getProjectInfo(id) { 
    return fetchWithAuth(`/api/projects/${id}`); 
}

export function getProjectLogs(id) { 
    return fetchWithAuth(`/api/projects/${id}/logs`); 
}

export function sendCommand(id, command) { 
    return fetchWithAuth(`/api/projects/${id}/command`, { method: 'POST', body: JSON.stringify({ command }) }); 
}

export function deleteProject(id) { 
    return fetchWithAuth(`/api/projects/${id}`, { method: 'DELETE' }); 
}

// --- ADMIN & PROFILE ROUTES ---
export function fetchUsers() { 
    return fetchWithAuth('/api/admin/users'); 
}

export function updateUserRole(userId, role) { 
    return fetchWithAuth(`/api/admin/users/${userId}/role`, { method: 'PUT', body: JSON.stringify({ role }) }); 
}

export function updateProfile(newUsername, newPassword) { 
    return fetchWithAuth('/api/users/profile', { method: 'PUT', body: JSON.stringify({ newUsername, newPassword }) }); 
}