export function renderNavbar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleColor = user.role === 'root' ? 'text-red-400' : user.role === 'admin' ? 'text-purple-400' : 'text-gray-400';

    return `
        <nav class="border-b border-rBorder bg-rBase px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <div class="flex items-center space-x-4">
                <div class="w-7 h-7 bg-white rounded flex items-center justify-center font-bold text-black text-sm">R</div>
                <span class="text-sm font-medium text-gray-200">Dashboard</span>
            </div>
            
            <div class="flex items-center space-x-5">
                <div class="flex flex-col items-end mr-2">
                    <span class="text-sm font-medium text-gray-200">${user.username || 'Guest'}</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider ${roleColor}">${user.role || ''}</span>
                </div>
                <button id="logoutBtn" class="text-sm text-gray-400 hover:text-white transition">Logout</button>
                <div class="h-4 w-px bg-rBorder"></div>
                <button id="newServiceBtn" class="bg-rAccent hover:bg-rAccentHover text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm">
                    New +
                </button>
            </div>
        </nav>
    `;
}