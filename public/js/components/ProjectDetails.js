export function renderProjectDetails(project) {
    const isRunning = project.status === 'running';
    const statusColor = isRunning ? 'bg-green-500' : 'bg-gray-500';

    return `
        <div class="mb-4">
            <button id="backToDashBtn" class="text-sm text-gray-400 hover:text-white flex items-center transition">
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                Dashboard
            </button>
        </div>
        
        <div class="flex justify-between items-end mb-6 border-b border-rBorder pb-4">
            <div>
                <h1 class="text-2xl font-semibold text-gray-100 tracking-tight flex items-center">
                    ${project.name}
                    <div class="ml-4 flex items-center space-x-2 px-2.5 py-1 rounded-full bg-rElevated border border-rBorder">
                        <div class="w-2 h-2 rounded-full ${statusColor}"></div>
                        <span class="text-xs text-gray-300 capitalize">${project.status}</span>
                    </div>
                </h1>
                <p class="text-xs text-gray-500 mt-1 font-mono">${project.path} • Port: ${project.port}</p>
            </div>
            
            <div class="flex space-x-3">
                <button data-id="${project.id}" id="restartProjectBtn" class="text-sm font-medium text-gray-300 hover:text-white bg-rElevated border border-rBorder hover:bg-gray-800 px-4 py-2 rounded transition">
                    Restart
                </button>
                <button data-id="${project.id}" id="toggleProjectBtn" data-action="${isRunning ? 'stop' : 'start'}" class="text-sm font-medium text-gray-300 hover:text-white bg-rElevated border border-rBorder hover:bg-gray-800 px-4 py-2 rounded transition">
                    ${isRunning ? 'Suspend' : 'Manual Deploy'}
                </button>
                <button data-id="${project.id}" id="deleteProjectBtn" class="text-sm font-medium text-red-400 hover:text-white bg-rElevated border border-red-900/50 hover:bg-red-900/50 px-4 py-2 rounded transition">
                    Delete
                </button>
            </div>
        </div>

        <!-- Terminal Window -->
        <div class="bg-[#0a0a0c] border border-rBorder rounded-lg overflow-hidden flex flex-col h-[500px] shadow-2xl">
            <div class="bg-rElevated border-b border-rBorder px-4 py-2 flex justify-between items-center">
                <span class="text-xs font-medium text-gray-400">Application Logs</span>
                <div class="flex space-x-1.5">
                    <div class="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                    <div class="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                </div>
            </div>
            
            <div id="terminal-output" class="flex-grow p-4 overflow-y-auto font-mono text-sm text-green-400 whitespace-pre-wrap flex flex-col space-y-1">
                Loading logs...
            </div>
            
            <form id="terminal-form" class="border-t border-rBorder bg-rElevated flex">
                <span class="text-green-500 font-mono px-3 py-2 flex items-center text-sm">></span>
                <input type="text" id="terminal-input" autocomplete="off" placeholder="Push command to stdin (e.g. rs)" class="w-full bg-transparent text-gray-300 font-mono text-sm px-2 py-2 focus:outline-none placeholder-gray-600" ${!isRunning ? 'disabled' : ''}>
            </form>
        </div>
    `;
}