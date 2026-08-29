export function renderSettingsModal(user) {
    return `
        <div id="settingsModal" class="fixed inset-0 bg-base/80 z-50 flex items-end md:items-center justify-center modal-overlay p-0 md:p-6 transition-all">
            <div class="glass-card w-full h-[90vh] md:h-auto md:max-h-[90vh] md:max-w-[450px] flex flex-col modal-content rounded-t-[32px] md:rounded-[24px] bg-surface shadow-float" id="settingsModalContent">
                
                <div class="w-full flex justify-center pt-4 pb-2 md:hidden shrink-0" id="mobileSettingsClose">
                    <div class="w-12 h-1.5 bg-borderline/20 rounded-full"></div>
                </div>

                <div class="px-6 md:px-8 py-5 border-b border-borderline/10 flex justify-between items-center shrink-0">
                    <h2 class="text-lg font-bold tracking-tight text-accent flex items-center gap-2">Core Preferences</h2>
                    <button id="closeSettingsBtn" class="text-muted hover:text-accent p-1.5 rounded-full bg-elevated hover:bg-borderline/10 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="settingsForm" class="p-6 md:p-8 space-y-6 overflow-y-auto hide-scroll flex-grow">
                    <div>
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Master Alias</label>
                        <input type="text" id="updateUsername" value="${user.username || ''}" required class="w-full input-elite px-4 py-3.5 text-sm outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Cryptographic Key</label>
                        <input type="password" id="updatePassword" placeholder="Leave blank to maintain current" class="w-full input-elite px-4 py-3.5 text-sm outline-none">
                    </div>
                    
                    <div class="pt-6 border-t border-borderline/10 flex justify-end space-x-3">
                        <button type="button" id="cancelSettingsBtn" class="px-5 py-3 rounded-xl text-sm font-semibold text-muted bg-elevated hover:text-accent transition-colors border border-borderline/5">Abort</button>
                        <button type="submit" id="submitSettingsBtn" class="px-6 py-3 bg-accent text-accentInv rounded-xl text-sm font-bold active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(255,255,255,0.1)]">
                            Synchronize
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}