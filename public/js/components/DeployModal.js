export function renderDeployModal() {
    return `
        <div id="deployModal" class="fixed inset-0 bg-base/80 z-50 flex items-end md:items-center justify-center modal-overlay p-0 md:p-6 transition-all">
            <div class="glass-card w-full h-[90vh] md:h-auto md:max-h-[90vh] md:max-w-[600px] flex flex-col modal-content rounded-t-[32px] md:rounded-[24px] bg-surface shadow-float" id="deployModalContent">
                
                <div class="w-full flex justify-center pt-4 pb-2 md:hidden shrink-0" id="mobileCloseIndicator">
                    <div class="w-12 h-1.5 bg-borderline/20 rounded-full"></div>
                </div>

                <div class="px-6 md:px-8 py-5 border-b border-borderline/10 flex justify-between items-center shrink-0">
                    <h2 class="text-lg font-bold tracking-tight text-accent flex items-center gap-2">Deploy Configuration</h2>
                    <button id="closeModalBtn" class="text-muted hover:text-accent p-1.5 rounded-full bg-elevated hover:bg-borderline/10 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="deployForm" class="p-6 md:p-8 space-y-6 overflow-y-auto hide-scroll flex-grow">
                    
                    <div class="flex space-x-2 p-1.5 bg-base border border-borderline/10 rounded-xl shadow-inner-input">
                        <button type="button" id="tabLocal" class="flex-1 py-2 text-xs font-bold rounded-lg bg-elevated text-accent shadow-inner-light transition-all">Local Sync</button>
                        <button type="button" id="tabGithub" class="flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all">GitHub Pull</button>
                    </div>

                    <div class="flex space-x-2 p-1.5 bg-base border border-borderline/10 rounded-xl shadow-inner-input">
                        <button type="button" id="typeNode" class="flex-1 py-2 text-xs font-bold rounded-lg bg-accent text-accentInv transition-all">Node Environment</button>
                        <button type="button" id="typeStatic" class="flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all">Static Delivery</button>
                    </div>
                    
                    <div>
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Service Alias</label>
                        <input type="text" id="appName" required placeholder="e.g. nexus-api" class="w-full input-elite px-4 py-3.5 text-sm outline-none">
                    </div>
                    
                    <div id="localPathGroup" class="block">
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Directory Target</label>
                        <input type="text" id="appPath" placeholder="/var/www/nexus" class="w-full input-elite px-4 py-3.5 text-sm outline-none font-mono">
                    </div>
                    
                    <div id="githubUrlGroup" class="hidden">
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Repository URL</label>
                        <input type="url" id="appRepo" placeholder="https://github.com/..." class="w-full input-elite px-4 py-3.5 text-sm outline-none font-mono">
                    </div>
                    
                    <div id="nodeConfigGroup" class="flex space-x-4">
                        <div class="flex-1">
                            <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Execution Shell</label>
                            <input type="text" id="appCommand" placeholder="npm start" class="w-full input-elite px-4 py-3.5 text-sm outline-none font-mono">
                        </div>
                        <div class="w-24">
                            <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Port</label>
                            <input type="number" id="appPort" placeholder="3000" class="w-full input-elite px-4 py-3.5 text-sm outline-none font-mono">
                        </div>
                    </div>
                    
                    <div class="pt-6 border-t border-borderline/10 flex justify-end space-x-3">
                        <button type="button" id="cancelModalBtn" class="px-5 py-3 rounded-xl text-sm font-semibold text-muted bg-elevated hover:text-accent transition-colors border border-borderline/5">Abort</button>
                        <button type="submit" id="submitDeployBtn" class="px-6 py-3 bg-accent text-accentInv rounded-xl text-sm font-bold active:scale-[0.98] transition-transform shadow-[0_4px_14px_rgba(255,255,255,0.1)]">
                            Engage Deployment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}