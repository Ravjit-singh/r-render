export function renderServiceList(projects) {
    if (!projects) {
        return `<div class="p-8 text-center text-red-400 border border-red-900/50 bg-red-900/10 rounded-md">Error connecting to local core.</div>`;
    }

    if (projects.length === 0) {
        return `
            <div class="border border-rBorder border-dashed rounded-lg p-12 text-center bg-rElevated flex flex-col items-center">
                <div class="w-12 h-12 bg-rBorder rounded-full flex items-center justify-center mb-4">
                    <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                </div>
                <h3 class="text-gray-200 font-medium text-lg">No services found</h3>
                <p class="text-gray-500 text-sm mt-1 max-w-sm">Deploy your first web service, background worker, or database from your local machine.</p>
            </div>
        `;
    }

    const rows = projects.map(project => {
        const isRunning = project.status === 'running';
        const statusColor = isRunning ? 'bg-green-500' : 'bg-gray-500';
        
        return `
            <tr class="border-b border-rBorder hover:bg-white/[0.02] transition cursor-pointer group">
                <td class="px-6 py-4 flex items-center space-x-3">
                    <div class="w-8 h-8 rounded bg-rBorder flex items-center justify-center text-gray-400">
                        <!-- Web Service Icon -->
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                    </div>
                    <div>
                        <div class="font-medium text-gray-200 group-hover:text-white group-hover:underline decoration-gray-500 underline-offset-2">${project.name}</div>
                        <div class="text-xs text-gray-500 mt-0.5">Web Service</div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <div class="w-2 h-2 rounded-full ${statusColor}"></div>
                        <span class="text-sm text-gray-300 capitalize">${project.status}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-400 font-mono">
                    ${project.port ? `localhost:${project.port}` : '--'}
                </td>
                <td class="px-6 py-4 text-right">
                    <button class="text-xs font-medium text-gray-400 hover:text-white bg-rBorder hover:bg-gray-700 px-3 py-1.5 rounded transition">
                        ${isRunning ? 'Stop' : 'Manual Deploy'}
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="border border-rBorder rounded-lg overflow-hidden bg-rElevated">
            <table class="w-full text-left">
                <thead class="bg-rBase/50 border-b border-rBorder">
                    <tr>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Name</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}