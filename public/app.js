document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
});

async function fetchProjects() {
    const listElement = document.getElementById('projects-list');
    
    try {
        const response = await fetch('/api/projects');
        const projects = await response.json();
        
        if (projects.length === 0) {
            listElement.innerHTML = `
                <tr>
                    <td colspan="4" class="p-12 text-center text-gray-500">
                        <div class="text-lg mb-2">No services deployed yet.</div>
                        <div class="text-sm">Click "New Web Service" to host your first app.</div>
                    </td>
                </tr>
            `;
            return;
        }
        
        listElement.innerHTML = ''; // Clear loading state
        
        projects.forEach(project => {
            // Render's color coding logic
            const isRunning = project.status === 'running';
            const statusColor = isRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-gray-500';
            
            const row = document.createElement('tr');
            row.className = 'border-b border-renderBorder hover:bg-[#1e212b] transition';
            
            row.innerHTML = `
                <td class="p-4">
                    <div class="font-medium text-white text-base">${project.name}</div>
                    <div class="text-xs text-gray-500 mt-1 font-mono break-all">${project.path}</div>
                </td>
                <td class="p-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full ${statusColor}"></div>
                        <span class="text-sm capitalize ${isRunning ? 'text-green-400' : 'text-gray-400'}">${project.status}</span>
                    </div>
                </td>
                <td class="p-4">
                    <div class="text-sm text-gray-400 font-mono">${project.port ? `localhost:${project.port}` : '---'}</div>
                </td>
                <td class="p-4 text-right">
                    <button class="text-sm px-4 py-1.5 border border-renderBorder rounded hover:bg-gray-700 transition text-white">
                        ${isRunning ? 'Suspend' : 'Deploy'}
                    </button>
                </td>
            `;
            listElement.appendChild(row);
        });
        
    } catch (error) {
        listElement.innerHTML = `
            <tr>
                <td colspan="4" class="p-8 text-center text-red-400">
                    Failed to connect to the Mini-Render core. Is server.js running?
                </td>
            </tr>
        `;
        console.error("Fetch error:", error);
    }
}