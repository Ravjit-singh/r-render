export function renderNavbar() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const roleColor = user.role === 'root' ? 'text-red-500 bg-red-500/10' : user.role === 'admin' ? 'text-purple-500 bg-purple-500/10' : 'text-muted bg-elevated';
    const showAdmin = (user.role === 'root' || user.role === 'admin');

    return `
        <header class="bg-base/60 backdrop-blur-2xl border-b border-borderline/5 px-6 md:px-10 py-5 flex justify-between items-center z-40 sticky top-0">
            <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-elite overflow-hidden border border-borderline/10 bg-accent text-accentInv font-bold text-xl">
                    R
                </div>
                <div>
                    <h1 class="text-xl font-bold tracking-tight text-accent leading-tight">R-Render Core</h1>
                    <p class="text-[11px] text-muted font-bold tracking-widest uppercase">System Dashboard</p>
                </div>
            </div>
            
            <div class="flex items-center gap-3">
                <div class="hidden md:flex flex-col items-end mr-3">
                    <span class="text-sm font-bold text-accent">${user.username || 'Guest'}</span>
                    <span class="text-[9px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${roleColor}">${user.role || ''}</span>
                </div>
                
                ${showAdmin ? `<button id="adminPanelBtn" class="w-10 h-10 rounded-full bg-elevated border border-borderline/10 flex items-center justify-center text-muted hover:text-accent transition-all hidden md:flex" title="Access Management"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></button>` : ''}
                
                <button id="settingsBtn" class="w-10 h-10 rounded-full bg-elevated border border-borderline/10 flex items-center justify-center text-muted hover:text-accent transition-all" title="Preferences">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </button>
                
                <button id="logoutBtn" class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all" title="End Session">
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                </button>

                <div class="w-px h-6 bg-borderline/10 mx-1"></div>
                
                <button id="newServiceBtn" class="bg-accent text-accentInv px-5 py-2.5 rounded-full text-sm font-bold active:scale-[0.98] transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,255,255,0.15)]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4"></path></svg>
                    <span class="hidden md:inline">Deploy</span>
                </button>
            </div>
        </header>
    `;
}