export function renderSettingsModal(user) {
    return `
        <div id="settingsModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm hidden items-center justify-center z-50 opacity-0 transition-opacity duration-200">
            <div class="bg-rElevated border border-rBorder w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform scale-95 transition-transform duration-200" id="settingsModalContent">
                
                <div class="px-6 py-4 border-b border-rBorder flex justify-between items-center bg-rBase/50">
                    <h2 class="text-lg font-medium text-gray-100">Account Settings</h2>
                    <button id="closeSettingsBtn" class="text-gray-400 hover:text-gray-200 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <form id="settingsForm" class="p-6 space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                        <input type="text" id="updateUsername" value="${user.username}" required class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                        <input type="password" id="updatePassword" placeholder="Leave blank to keep current" class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition">
                    </div>
                    
                    <div class="pt-4 flex justify-end space-x-3">
                        <button type="button" id="cancelSettingsBtn" class="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition">Cancel</button>
                        <button type="submit" id="submitSettingsBtn" class="bg-rAccent hover:bg-rAccentHover text-white px-4 py-2 rounded-md text-sm font-medium transition shadow flex items-center">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}