export function renderAdminView(users, currentUser) {
    if (!users || users.length === 0) {
        return `<div class="p-8 text-center text-red-400 border border-red-900/50 bg-red-900/10 rounded-md">Error loading users or access denied.</div>`;
    }

    const rows = users.map(u => {
        const isSelf = u.id === currentUser.id;
        const isRoot = u.role === 'root';
        
        return `
            <tr class="border-b border-rBorder hover:bg-white/[0.02] transition group">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-200">${u.username} ${isSelf ? '<span class="text-xs text-gray-500 ml-2">(You)</span>' : ''}</div>
                    <div class="text-xs text-gray-500 mt-0.5">ID: ${u.id}</div>
                </td>
                <td class="px-6 py-4">
                    <span class="text-sm text-gray-400 font-mono">${u.ram_limit} MB</span>
                </td>
                <td class="px-6 py-4">
                    <select id="role-select-${u.id}" class="bg-rBase border border-rBorder text-gray-300 text-sm rounded-md focus:ring-rAccent focus:border-rAccent block w-full p-2" ${isRoot || isSelf ? 'disabled' : ''}>
                        <option value="pending" ${u.role === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>User (Sandbox)</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="root" ${u.role === 'root' ? 'selected' : ''} disabled>Root</option>
                    </select>
                </td>
                <td class="px-6 py-4 text-right">
                    <button data-id="${u.id}" class="update-role-btn text-xs font-medium text-gray-400 hover:text-white bg-rBorder hover:bg-gray-700 px-3 py-1.5 rounded transition ${isRoot || isSelf ? 'opacity-50 cursor-not-allowed' : ''}" ${isRoot || isSelf ? 'disabled' : ''}>
                        Save Role
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    return `
        <div class="flex justify-between items-end mb-6">
            <div>
                <button id="backToDashFromAdminBtn" class="text-sm text-gray-400 hover:text-white flex items-center transition mb-4">
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    Back to Services
                </button>
                <h1 class="text-2xl font-semibold text-gray-100 tracking-tight">Access Management</h1>
                <p class="text-sm text-gray-500 mt-1">Approve pending accounts and manage resource quotas.</p>
            </div>
        </div>
        
        <div class="border border-rBorder rounded-lg overflow-x-auto bg-rElevated shadow-xl">
            <table class="w-full text-left whitespace-nowrap min-w-[600px]">
                <thead class="bg-rBase/50 border-b border-rBorder">
                    <tr>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">RAM Quota</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;
}
