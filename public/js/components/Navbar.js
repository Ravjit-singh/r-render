export function renderNavbar() {
    return `
        <nav class="border-b border-rBorder bg-rBase px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <div class="flex items-center space-x-4">
                <!-- R-Render Logo -->
                <div class="w-7 h-7 bg-white rounded flex items-center justify-center font-bold text-black text-sm">
                    R
                </div>
                <span class="text-sm font-medium text-gray-200 hover:text-white cursor-pointer transition">Dashboard</span>
            </div>
            
            <div class="flex items-center space-x-4">
                <a href="#" class="text-sm text-gray-400 hover:text-white transition">Docs</a>
                <button id="newServiceBtn" class="bg-rAccent hover:bg-rAccentHover text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm">
                    New +
                </button>
            </div>
        </nav>
    `;
}