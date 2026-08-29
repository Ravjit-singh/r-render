export function renderAuthScreen() {
    return `
        <div class="min-h-screen flex items-center justify-center p-6 bg-base">
            <div class="glass-card w-full max-w-md overflow-hidden p-8 animate-slide-up">
                
                <div class="text-center mb-8">
                    <div class="w-12 h-12 bg-accent text-accentInv rounded-xl flex items-center justify-center font-bold text-xl mx-auto mb-4 shadow-elite">
                        R
                    </div>
                    <h2 class="text-2xl font-bold tracking-tight text-accent" id="authTitle">Secure Access</h2>
                    <p class="text-[13px] text-muted mt-2 font-medium" id="authSubtitle">Authenticate to enter the core</p>
                </div>
                
                <form id="authForm" class="space-y-5">
                    <div>
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Identity</label>
                        <input type="text" id="authUsername" required class="w-full input-elite px-4 py-3.5 text-sm outline-none">
                    </div>
                    
                    <div>
                        <label class="block text-[11px] font-bold text-muted mb-2 uppercase tracking-widest">Passkey</label>
                        <input type="password" id="authPassword" required class="w-full input-elite px-4 py-3.5 text-sm outline-none">
                    </div>
                    
                    <button type="submit" id="authSubmitBtn" class="w-full bg-accent text-accentInv font-bold py-3.5 rounded-xl mt-4 active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(255,255,255,0.1)]">
                        Initialize Session
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <button type="button" id="toggleAuthModeBtn" class="text-xs font-semibold text-muted hover:text-accent transition-colors">
                        Require access? <span class="text-accent underline decoration-borderline/30 underline-offset-4">Request Provisioning</span>
                    </button>
                </div>

                <div id="authMessage" class="mt-4 text-center text-sm hidden px-3 py-2 rounded-xl font-medium"></div>
            </div>
        </div>
    `;
}