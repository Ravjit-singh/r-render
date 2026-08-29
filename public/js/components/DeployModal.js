export function renderDeployModal() {
    return `
        <div id="deployModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm hidden items-center justify-center z-50 opacity-0 transition-opacity duration-200">
            <div class="bg-rElevated border border-rBorder w-full max-w-lg rounded-xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-200" id="deployModalContent">
                
                <div class="px-6 py-4 border-b border-rBorder flex justify-between items-center bg-rBase/50">
                    <h2 class="text-lg font-medium text-gray-100">Create Web Service</h2>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-200 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="deployForm" class="p-6 space-y-5">
                    
                    <!-- Deployment Source Toggle -->
                    <div class="flex space-x-2 p-1 bg-rBase border border-rBorder rounded-lg">
                        <button type="button" id="tabLocal" class="flex-1 py-1.5 text-sm font-medium rounded-md bg-rElevated text-white shadow transition">Local Folder</button>
                        <button type="button" id="tabGithub" class="flex-1 py-1.5 text-sm font-medium rounded-md text-gray-400 hover:text-gray-200 transition">GitHub Repo</button>
                    </div>

                    <!-- App Type Toggle -->
                    <div class="flex space-x-2 p-1 bg-rBase border border-rBorder rounded-lg mt-2">
                        <button type="button" id="typeNode" class="flex-1 py-1 text-xs font-medium rounded-md bg-rAccent text-white shadow transition">Node.js Server</button>
                        <button type="button" id="typeStatic" class="flex-1 py-1 text-xs font-medium rounded-md text-gray-400 hover:text-gray-200 transition">Static Site</button>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Service Name</label>
                        <input type="text" id="appName" required placeholder="e.g. skillmax-api" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition">
                    </div>
                    
                    <!-- Dynamic Input Groups -->
                    <div id="localPathGroup" class="block">
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Local Folder Path</label>
                        <input type="text" id="appPath" placeholder="C:\\Users\\Ravjit\\hosted_apps\\skillmax" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition font-mono">
                    </div>
                    
                    <div id="githubUrlGroup" class="hidden">
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Public GitHub URL</label>
                        <input type="url" id="appRepo" placeholder="https://github.com/Ravjit-singh/rmusic.git" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition font-mono">
                        <p class="text-xs text-gray-500 mt-1.5">R-Render will automatically clone the repo and run npm install.</p>
                    </div>
                    
                    <div id="nodeConfigGroup" class="flex space-x-4">
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-300 mb-1.5">Start Command</label>
                            <input type="text" id="appCommand" placeholder="npm start" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition font-mono">
                        </div>
                        <div class="w-24">
                            <label class="block text-sm font-medium text-gray-300 mb-1.5">Port</label>
                            <input type="number" id="appPort" placeholder="3000" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition font-mono">
                        </div>
                    </div>
                    
                    <div class="pt-4 flex justify-end space-x-3">
                        <button type="button" id="cancelModalBtn" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition">Cancel</button>
                        <button type="submit" id="submitDeployBtn" class="bg-rAccent hover:bg-rAccentHover text-white px-4 py-2 rounded-md text-sm font-medium transition shadow flex items-center">
                            Create Web Service
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}