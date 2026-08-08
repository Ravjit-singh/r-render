export function renderAuthScreen() {
    return `
        <div class="min-h-screen flex items-center justify-center p-6 bg-rBase">
            <div class="bg-rElevated border border-rBorder w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-8">
                
                <div class="text-center mb-8">
                    <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center font-bold text-black text-xl mx-auto mb-4">
                        R
                    </div>
                    <h2 class="text-2xl font-semibold text-gray-100 tracking-tight" id="authTitle">Sign In</h2>
                    <p class="text-sm text-gray-500 mt-2" id="authSubtitle">Welcome back to R-Render Core</p>
                </div>
                
                <form id="authForm" class="space-y-5">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Username</label>
                        <input type="text" id="authUsername" required class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                        <input type="password" id="authPassword" required class="w-full bg-rBase border border-rBorder rounded-md px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-rAccent focus:ring-1 focus:ring-rAccent transition">
                    </div>
                    
                    <button type="submit" id="authSubmitBtn" class="w-full bg-rAccent hover:bg-rAccentHover text-white py-2.5 rounded-md text-sm font-medium transition shadow flex justify-center items-center mt-2">
                        Sign In
                    </button>
                </form>

                <div class="mt-6 text-center">
                    <button type="button" id="toggleAuthModeBtn" class="text-sm text-gray-400 hover:text-white transition">
                        Need an account? <span class="text-rAccent">Request Access</span>
                    </button>
                </div>

                <div id="authMessage" class="mt-4 text-center text-sm hidden px-3 py-2 rounded-md"></div>
            </div>
        </div>
    `;
}