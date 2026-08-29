export function renderAdminView(users, currentUser) {
    if (!users || users.length === 0) {
        return `<div class="p-8 text-center text-red-500 border border-red-500/20 bg-red-500/10 rounded-2xl font-bold shadow-inner-light">Access Denied or System Error</div>`;
    }

    const rows = users.map(u => {
        const isSelf = u.id === currentUser.id;
        const isRoot = u.role === 'root';
        
        return `
            <tr class="border-b border-borderline/5 hover:bg-borderline/5 transition-colors group">
                <td class="px-6 py-5">
                    <div class="font-bold text-accent flex items-center gap-2">${u.username} ${isSelf ? '<span class="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[9px] uppercase tracking-widest border border-blue-500/20">Self</span>' : ''}</div>
                    <div class="text-[11px] font-mono text-muted mt-1">ID_${u.id}</div>
                </td>
                <td class="px-6 py-5">
                    <span class="text-[13px] text-muted font-mono bg-elevated px-2 py-1 rounded-md border border-borderline/10 shadow-inner-light">${u.ram_limit} MB</span>
                </td>
                <td class="px-6 py-5">
                    <select id="role-select-${u.id}" class="w-full input-elite px-3 py-2 text-[13px] font-bold outline-none cursor-pointer appearance-none bg-surface" ${isRoot || isSelf ? 'disabled opacity-50' : ''}>
                        <option value="pending" ${u.role === 'pending' ? 'selected' : ''}>Pending Verification</option>
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Sandbox User</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>System Admin</option>
                        <option value="root" ${u.role === 'root' ? 'selected' : ''} disabled>Root Core</option>
                    </select>
                </td>
                <td class="px-6 py-5 text-right">
                    <button data-id="${u.id}" class="update-role-btn px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-inner-light ${isRoot || isSelf ? 'bg-elevated text-muted opacity-50 cursor-not-allowed' : 'bg-surface border border-borderline/10 text-accent hover:border-accent/30'}" ${isRoot || isSelf ? 'disabled' : ''}>
                        Apply
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="flex justify-between items-end mb-8 animate-fade-in">
            <div>
                <button id="backToDashFromAdminBtn" class="text-xs font-bold tracking-widest uppercase text-muted hover:text-accent flex items-center transition-colors mb-4 bg-elevated px-3 py-1.5 rounded-lg border border-borderline/10 shadow-inner-light">
                    <svg class="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
                    Return
                </button>
                <h1 class="text-3xl font-bold tracking-tight text-accent">Access Management</h1>
                <p class="text-[13px] text-muted mt-1 font-medium">Verify pending authorizations and allocate quotas.</p>
            </div>
        </div>
        
        <div class="glass-card overflow-hidden animate-slide-up border border-borderline/10">
            <div class="overflow-x-auto hide-scroll">
                <table class="w-full text-left whitespace-nowrap min-w-[700px]">
                    <thead class="bg-base/50 border-b border-borderline/10">
                        <tr>
                            <th class="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Identity</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Memory Allocation</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Access Tier</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Execution</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-borderline/5">
                        ${rows}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}