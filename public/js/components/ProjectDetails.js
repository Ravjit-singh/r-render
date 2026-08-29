export function renderProjectDetails(project) {
    const isRunning = project.status === 'running';
    const isStatic = project.start_command === 'STATIC';
    
    return `
        <div class="flex justify-between items-center mb-8 animate-fade-in">
            <div class="flex items-center gap-4">
                <button id="backToDashBtn" class="w-10 h-10 rounded-full bg-elevated border border-borderline/10 flex items-center justify-center text-muted hover:text-accent transition-all">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
                </button>
                <div>
                    <h1 class="text-3xl font-bold tracking-tight text-accent">${project.name}</h1>
                    <p class="text-[11px] text-muted font-mono mt-1">${project.path}</p>
                </div>
            </div>
            <div class="flex gap-3">
                ${!isStatic ? `<button id="restartProjectBtn" class="px-5 py-2.5 rounded-xl bg-surface border border-borderline/10 text-sm font-bold text-accent hover:bg-borderline/10 transition-colors shadow-inner-input">Restart</button>` : ''}
                <button id="toggleProjectBtn" data-action="${isRunning ? 'stop' : 'start'}" class="px-6 py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,255,255,0.1)] ${isRunning ? 'bg-surface border border-borderline/10 text-red-400 hover:border-red-500/50' : 'bg-accent text-accentInv border border-accent'}">
                    ${isRunning ? 'Halt Process' : 'Ignite Process'}
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            <div class="glass-card p-6 border border-borderline/10">
                <h3 class="text-[11px] font-bold text-muted mb-1 uppercase tracking-widest">Environment Status</h3>
                <div class="text-lg font-bold text-accent mt-2 flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}"></span>
                    ${project.status.toUpperCase()}
                </div>
            </div>
            <div class="glass-card p-6 border border-borderline/10">
                <h3 class="text-[11px] font-bold text-muted mb-1 uppercase tracking-widest">Network Bind</h3>
                <div class="text-lg font-bold text-accent mt-2 font-mono">
                    ${isStatic ? 'STATIC HOST' : (project.port || 'Awaiting Allocation')}
                </div>
            </div>
            <div class="glass-card p-6 border border-borderline/10 flex items-center justify-between">
                <div>
                    <h3 class="text-[11px] font-bold text-muted mb-1 uppercase tracking-widest">Execution Core</h3>
                    <div class="text-sm font-bold text-accent mt-2 font-mono truncate max-w-[150px]">${project.start_command}</div>
                </div>
                <button id="deleteProjectBtn" class="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500/20 transition-all shrink-0">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </div>
        </div>

        <div class="mt-8 glass-card border border-borderline/10 overflow-hidden flex flex-col h-[50vh] min-h-[400px] animate-slide-up" style="animation-delay: 0.1s">
            <div class="bg-base/80 px-4 py-3 border-b border-borderline/10 flex items-center gap-3 shrink-0">
                <div class="flex gap-1.5">
                    <div class="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div class="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div class="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                </div>
                <span class="text-[11px] font-mono text-muted ml-2">sys_logs // ${project.name}</span>
            </div>
            
            <div id="terminal-output" class="flex-grow p-4 md:p-6 bg-black text-emerald-400 font-mono text-[13px] leading-relaxed overflow-y-auto hide-scroll flex flex-col gap-1">
                <span class="text-muted">Establishing secure stream...</span>
            </div>
            
            ${!isStatic ? `
            <form id="terminal-form" class="p-3 bg-base/80 border-t border-borderline/10 shrink-0">
                <div class="flex items-center bg-surface border border-borderline/10 rounded-lg overflow-hidden focus-within:border-accent/30 transition-all shadow-inner-input">
                    <span class="px-4 text-emerald-500 font-mono font-bold">$</span>
                    <input type="text" id="terminal-input" placeholder="Execute command..." class="w-full bg-transparent border-none py-3 text-sm font-mono text-accent outline-none">
                </div>
            </form>` : ''}
        </div>
    `;
}