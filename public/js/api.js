export async function fetchProjects() {
    try {
        const response = await fetch('/api/projects');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        return null; // Return null on failure so the UI knows to show an error state
    }
}export async function createProject(projectData) {
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to create project');
        }
        
        return await response.json();
    } catch (error) {
        console.error("API POST Error:", error);
        throw error;
    }
}
export async function startProject(id) {
    try {
        const response = await fetch(`/api/projects/${id}/start`, { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to start service');
        }
        return await response.json();
    } catch (error) {
        console.error("Start API Error:", error);
        throw error;
    }
}

export async function stopProject(id) {
    try {
        const response = await fetch(`/api/projects/${id}/stop`, { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to stop service');
        }
        return await response.json();
    } catch (error) {
        console.error("Stop API Error:", error);
        throw error;
    }
}
export async function getProjectInfo(id) {
    const res = await fetch(`/api/projects/${id}`);
    return await res.json();
}

export async function getProjectLogs(id) {
    const res = await fetch(`/api/projects/${id}/logs`);
    return await res.json();
}

export async function sendCommand(id, command) {
    await fetch(`/api/projects/${id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
    });
}

export async function deleteProject(id) {
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
}