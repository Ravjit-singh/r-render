export function renderNavbar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleColor = user.role === 'root' ? 'text-red-400' : user.role === 'admin' ? 'text-purple-400' : 'text-gray-400';
    const showAdmin = (user.role === 'root' || user.role === 'admin');

    return `
        <nav class="border-b border-rBorder bg-rBase px-4 sm:px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <div class="flex items-center space-x-3">
                <div class="w-7 h-7 bg-white rounded flex items-center justify-center font-bold text-black text-sm">R</div>
                <span class="text-sm font-medium text-gray-200 hidden sm:block">Dashboard</span>
            </div>
            
            <div class="flex items-center space-x-3 sm:space-x-5">
                <div class="flex-col items-end mr-1 hidden sm:flex">
                    <span class="text-sm font-medium text-gray-200">${user.username || 'Guest'}</span>
                    <span class="text-[10px] uppercase font-bold tracking-wider ${roleColor}">${user.role || ''}</span>
                </div>
                
                ${showAdmin ? `<button id="adminPanelBtn" class="text-sm text-gray-400 hover:text-white transition hidden sm:block">Admin</button>` : ''}
                <button id="settingsBtn" class="text-sm text-gray-400 hover:text-white transition">Settings</button>
                <button id="logoutBtn" class="text-sm text-gray-400 hover:text-white transition">Logout</button>
                
                <div class="h-4 w-px bg-rBorder mx-1"></div>
                <button id="newServiceBtn" class="bg-rAccent hover:bg-rAccentHover text-white px-3 py-1.5 rounded-md text-sm font-medium transition shadow-sm">
                    New +
                </button>
            </div>
        </nav>
    `;
}