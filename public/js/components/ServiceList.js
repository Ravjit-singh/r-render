export function renderServiceList(projects) {
    if (!projects || projects.length === 0) {
        return `
            <div class="flex flex-col items-center justify-center mt-[15vh] text-center px-4 animate-fade-in">
                <div class="w-20 h-20 bg-elevated/50 rounded-[2rem] flex items-center justify-center mb-6 border border-borderline/10 rotate-12 overflow-hidden shadow-elite">
                    <svg class="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h2 class="text-2xl font-bold mb-2 tracking-tight text-accent">No Active Services</h2>
                <p class="text-muted max-w-sm text-sm font-medium leading-relaxed">Initialize a new local environment or link a GitHub repository to begin.</p>
            </div>
        `;
    }

    const cardsHtml = projects.map((p, index) => {
        const isRunning = p.status === 'running';
        const isStatic = p.start_command === 'STATIC';
        const statusColor = isRunning ? 'text-emerald-500' : 'text-muted';
        const statusBg = isRunning ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted';
        const portDisplay = isStatic ? 'STATIC FILE HOST' : `PORT :${p.port || '---'}`;
        const staggerDelay = index * 0.05;

        return `
            <div class="glass-card flex flex-col w-full animate-slide-up" style="animation-delay: ${staggerDelay}s">
                <div class="p-6 md:p-7 pb-5">
                    <div class="flex justify-between items-start">
                        <div class="max-w-[75%] cursor-pointer group action-btn" data-id="${p.id}" data-action="details">
                            <h3 class="text-xl md:text-2xl font-bold tracking-tight text-accent truncate group-hover:text-blue-400 transition-colors">${p.name}</h3>
                            <div class="flex items-center gap-2 mt-1.5">
                                <span class="w-1.5 h-1.5 rounded-full ${statusBg} ${isRunning && !isStatic ? 'animate-pulse' : ''}"></span>
                                <span class="text-[9px] ${statusColor} font-bold tracking-widest uppercase">${p.status}</span>
                                <span class="text-[9px] text-muted font-bold tracking-widest uppercase border-l border-borderline/20 pl-2 ml-1">${portDisplay}</span>
                            </div>
                        </div>
                        <div class="flex gap-2 shrink-0">
                            ${isRunning ? 
                                `<button data-id="${p.id}" data-action="stop" class="action-btn w-10 h-10 rounded-full bg-surface border border-borderline/10 flex items-center justify-center text-accent hover:border-red-500/50 hover:text-red-500 transition-all shadow-inner-input" title="Halt Service">
                                    <svg class="w-4 h-4 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"></rect></svg>
                                </button>` 
                                : 
                                `<button data-id="${p.id}" data-action="start" class="action-btn w-10 h-10 rounded-full bg-accent border border-accent flex items-center justify-center text-accentInv active:scale-95 transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)]" title="Ignite Service">
                                    <svg class="w-4 h-4 ml-0.5 pointer-events-none" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
                                </button>`
                            }
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 mt-6">
                        ${isRunning && isStatic ? `<a href="/site/${p.name}" target="_blank" class="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Open App</a>` : ''}
                        ${isRunning && !isStatic ? `<a href="http://localhost:${p.port}" target="_blank" class="px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Localhost</a>` : ''}
                        <button class="action-btn px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase border border-borderline/20 bg-elevated text-accent hover:bg-borderline/10 transition-colors" data-id="${p.id}" data-action="details">View Details</button>
                    </div>
                </div>
                
                <div class="w-full px-6 py-3 border-t border-borderline/5 flex justify-between items-center text-xs font-mono text-muted bg-base/50 rounded-b-[24px]">
                    <span class="truncate">${p.path}</span>
                </div>
            </div>
        `;
    }).join('');

    return `<div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 max-w-[1800px] mx-auto w-full">${cardsHtml}</div>`;
}