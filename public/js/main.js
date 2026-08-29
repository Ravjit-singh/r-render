import { renderAuthScreen } from './components/Auth.js';
import { 
    loginUser, registerUser, fetchProjects, createProject, startProject, stopProject, 
    getProjectInfo, getProjectLogs, sendCommand, deleteProject, createGithubProject,
    fetchUsers, updateUserRole, updateProfile
} from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderServiceList } from './components/ServiceList.js';
import { renderDeployModal } from './components/DeployModal.js';
import { renderProjectDetails } from './components/ProjectDetails.js';
import { renderSettingsModal } from './components/SettingsModal.js';
import { renderAdminView } from './components/AdminView.js';

const app = document.getElementById('app');
let activeLogInterval = null;

// --- CUSTOM TOAST SYSTEM ---
function showToast(msg, type = "success") {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 md:top-auto md:left-auto md:bottom-8 md:right-8 bg-surface border border-borderline/10 text-accent px-5 py-3.5 rounded-2xl flex items-center gap-3 transform -translate-y-20 md:translate-y-20 opacity-0 pointer-events-none transition-all duration-300 z-[100] min-w-[200px] shadow-inner-light';
        document.body.appendChild(toast);
    }
    
    const iconHtml = type === 'error' 
        ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>'
        : '<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';
    
    const colorClass = type === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500';

    toast.innerHTML = `
        <div class="w-6 h-6 shrink-0 rounded-full flex items-center justify-center border ${colorClass}">${iconHtml}</div>
        <span class="text-sm font-bold tracking-tight">${msg}</span>
    `;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.remove(window.innerWidth < 768 ? '-translate-y-20' : 'translate-y-20');
    toast.classList.add('translate-y-0');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('translate-y-0');
        toast.classList.add(window.innerWidth < 768 ? '-translate-y-20' : 'translate-y-20');
    }, 3000);
}

// --- 1. THE ROUTER ---
export async function init() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    clearInterval(activeLogInterval);
    
    if (!token) {
        app.innerHTML = renderAuthScreen();
        setupAuthEvents();
    } else {
        app.innerHTML = `
            ${renderNavbar()}
            <div id="main-content" class="flex-grow flex flex-col w-full"></div>
            ${renderDeployModal()}
            ${renderSettingsModal(user)}
        `;
        
        setupNavbarEvents();
        setupModalEvents();
        setupSettingsEvents();
        await loadDashboard();
    }
}

// --- 2. GLOBAL UI EVENTS ---
function setupNavbarEvents() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        init(); 
    });

    document.getElementById('adminPanelBtn')?.addEventListener('click', loadAdminView);
    
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        document.getElementById('settingsModal').classList.add('active');
    });
}

function setupSettingsEvents() {
    const modal = document.getElementById('settingsModal');
    const closeSequence = () => modal.classList.remove('active');

    document.getElementById('closeSettingsBtn')?.addEventListener('click', closeSequence);
    document.getElementById('cancelSettingsBtn')?.addEventListener('click', closeSequence);
    document.getElementById('mobileSettingsClose')?.addEventListener('click', closeSequence);
    
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeSequence();
    });

    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submitSettingsBtn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Synchronizing...';
        submitBtn.disabled = true;

        try {
            const newUsername = document.getElementById('updateUsername').value;
            const newPassword = document.getElementById('updatePassword').value;
            await updateProfile(newUsername, newPassword);
            
            showToast('Vault secured. Re-authenticating...', 'success');
            
            // Auto redirect sequence
            setTimeout(() => {
                localStorage.clear();
                init();
            }, 2000);
            
        } catch (error) {
            showToast(error.message, 'error');
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// --- 3. AUTHENTICATION LOGIC ---
function setupAuthEvents() {
    let isLoginMode = true;
    const form = document.getElementById('authForm');
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('authSubmitBtn');
    const toggleBtn = document.getElementById('toggleAuthModeBtn');
    const msgBox = document.getElementById('authMessage');

    toggleBtn.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        title.innerText = isLoginMode ? 'Secure Access' : 'Request Provisioning';
        subtitle.innerText = isLoginMode ? 'Authenticate to enter the core' : 'Register for an isolated environment';
        submitBtn.innerText = isLoginMode ? 'Initialize Session' : 'Transmit Request';
        toggleBtn.innerHTML = isLoginMode ? 'Require access? <span class="text-accent underline decoration-borderline/30 underline-offset-4">Request Provisioning</span>' : 'Authorized? <span class="text-accent underline decoration-borderline/30 underline-offset-4">Secure Access</span>';
        msgBox.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('authUsername').value;
        const pass = document.getElementById('authPassword').value;
        
        submitBtn.disabled = true;
        submitBtn.innerText = 'Processing...';
        msgBox.classList.add('hidden');

        try {
            if (isLoginMode) {
                const data = await loginUser(user, pass);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                init(); 
            } else {
                const data = await registerUser(user, pass);
                msgBox.innerText = data.message;
                msgBox.className = 'mt-4 text-center text-[13px] px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold block shadow-inner-light';
                form.reset();
            }
        } catch (err) {
            msgBox.innerText = err.message;
            msgBox.className = 'mt-4 text-center text-[13px] px-4 py-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold block shadow-inner-light';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? 'Initialize Session' : 'Transmit Request';
        }
    });
}

// --- 4. ADMIN VIEW LOGIC ---
async function loadAdminView() {
    clearInterval(activeLogInterval);
    const mainContent = document.getElementById('main-content');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    mainContent.innerHTML = `
        <main class="max-w-[1200px] w-full mx-auto mt-8 md:mt-12 px-6 pb-20 flex-grow">
            <div class="h-64 glass-card animate-pulse border border-borderline/5"></div>
        </main>
    `;

    try {
        const allUsers = await fetchUsers();
        mainContent.innerHTML = `
            <main class="max-w-[1200px] w-full mx-auto mt-8 md:mt-12 px-4 sm:px-6 pb-20 flex-grow">
                ${renderAdminView(allUsers, user)}
            </main>
        `;

        document.getElementById('backToDashFromAdminBtn')?.addEventListener('click', loadDashboard);

        mainContent.querySelectorAll('.update-role-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.target.getAttribute('data-id');
                const selectEl = document.getElementById(`role-select-${id}`);
                const newRole = selectEl.value;
                
                const originalText = e.target.innerText;
                e.target.innerText = 'Working...';
                e.target.disabled = true;

                try {
                    await updateUserRole(id, newRole);
                    showToast('Role synchronized successfully', 'success');
                    loadAdminView(); 
                } catch (err) {
                    showToast(err.message, 'error');
                    e.target.innerText = originalText;
                    e.target.disabled = false;
                }
            });
        });
    } catch (error) {
        showToast("Authorization fault: " + error.message, 'error');
        loadDashboard();
    }
}

// --- 5. DASHBOARD VIEW ---
async function loadDashboard() {
    clearInterval(activeLogInterval);
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <main class="max-w-[1400px] w-full mx-auto mt-8 md:mt-12 px-6 pb-20 flex-grow">
            <div class="h-32 glass-card border border-borderline/5 w-full animate-pulse"></div>
        </main>
    `;
    
    try {
        const projects = await fetchProjects();
        mainContent.innerHTML = `
            <main id="dashboard-content" class="max-w-[1400px] w-full mx-auto mt-8 md:mt-12 px-4 sm:px-6 pb-20 flex-grow">
                ${renderServiceList(projects)}
            </main>
        `;
        
        const contentArea = document.getElementById('dashboard-content');
        contentArea.addEventListener('click', async (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const action = btn.getAttribute('data-action');
                
                if (action === 'start' || action === 'stop') {
                    btn.style.opacity = '0.5';
                    btn.style.pointerEvents = 'none';
                    if (action === 'start') {
                        await startProject(id);
                        showToast('Service ignited', 'success');
                    } else {
                        await stopProject(id);
                        showToast('Service halted', 'success');
                    }
                    return loadDashboard();
                } else if (action === 'details') {
                    loadProjectDetails(id);
                }
            }
        });
    } catch (err) {
        mainContent.innerHTML = `<div class="max-w-[1400px] mx-auto mt-10 px-6"><div class="p-6 text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl font-bold shadow-inner-light">API Fault. Session token may be compromised.</div></div>`;
    }
}

// --- 6. PROJECT DETAILS & TERMINAL VIEW ---
async function loadProjectDetails(id) {
    clearInterval(activeLogInterval);
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <main class="max-w-[1200px] w-full mx-auto mt-8 md:mt-12 px-6 pb-20 flex-grow">
            <div class="h-64 glass-card border border-borderline/5 w-full animate-pulse"></div>
        </main>
    `;

    try {
        const project = await getProjectInfo(id);
        mainContent.innerHTML = `
            <main class="max-w-[1200px] w-full mx-auto mt-8 md:mt-12 px-4 sm:px-6 pb-20 flex-grow">
                ${renderProjectDetails(project)}
            </main>
        `;
        setupDetailsEvents(project);
        startLogPolling(id);
    } catch (err) {
        loadDashboard(); 
    }
}

function setupDetailsEvents(project) {
    document.getElementById('backToDashBtn').addEventListener('click', loadDashboard);

    const termForm = document.getElementById('terminal-form');
    if (termForm) {
        termForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const input = document.getElementById('terminal-input');
            if (input.value.trim()) {
                await sendCommand(project.id, input.value.trim());
                input.value = ''; 
            }
        });
    }

    document.getElementById('toggleProjectBtn').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerText = 'Transmitting...';
        btn.disabled = true;
        const action = btn.getAttribute('data-action');
        if (action === 'start') {
            await startProject(project.id);
            showToast('Service ignited', 'success');
        } else {
            await stopProject(project.id);
            showToast('Service halted', 'success');
        }
        loadProjectDetails(project.id); 
    });

    document.getElementById('restartProjectBtn')?.addEventListener('click', async (e) => {
        e.target.innerText = 'Restarting...';
        await stopProject(project.id);
        await new Promise(r => setTimeout(r, 1000)); 
        await startProject(project.id);
        showToast('Service restarted', 'success');
        loadProjectDetails(project.id);
    });

    // Custom non-blocking confirm overlay
    document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
        const confirmDelete = window.confirm(`Confirm destructive action: Annihilate ${project.name}?`);
        if (confirmDelete) {
            await deleteProject(project.id);
            showToast('Architecture annihilated', 'success');
            loadDashboard();
        }
    });
}

function startLogPolling(id) {
    const terminal = document.getElementById('terminal-output');
    if(!terminal) return;
    
    const fetchLogs = async () => {
        try {
            const { logs } = await getProjectLogs(id);
            terminal.innerHTML = logs.map(line => `<span>${line}</span>`).join('');
            terminal.scrollTop = terminal.scrollHeight; 
        } catch (e) { }
    };
    fetchLogs();
    activeLogInterval = setInterval(fetchLogs, 1000);
}

// --- 7. GLOBAL DEPLOY MODAL EVENTS ---
function setupModalEvents() {
    const modal = document.getElementById('deployModal');
    const closeSequence = () => modal.classList.remove('active');

    document.getElementById('newServiceBtn')?.addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('closeModalBtn')?.addEventListener('click', closeSequence);
    document.getElementById('cancelModalBtn')?.addEventListener('click', closeSequence);
    document.getElementById('mobileCloseIndicator')?.addEventListener('click', closeSequence);
    
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeSequence();
    });

    let activeTab = 'local';
    const tabLocal = document.getElementById('tabLocal');
    const tabGithub = document.getElementById('tabGithub');
    const groupLocal = document.getElementById('localPathGroup');
    const groupGithub = document.getElementById('githubUrlGroup');

    tabLocal?.addEventListener('click', () => {
        activeTab = 'local';
        tabLocal.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-elevated text-accent shadow-inner-light transition-all';
        tabGithub.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all';
        groupLocal.classList.remove('hidden');
        groupGithub.classList.add('hidden');
    });

    tabGithub?.addEventListener('click', () => {
        activeTab = 'github';
        tabGithub.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-elevated text-accent shadow-inner-light transition-all';
        tabLocal.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all';
        groupGithub.classList.remove('hidden');
        groupLocal.classList.add('hidden');
    });

    let activeType = 'node';
    const typeNode = document.getElementById('typeNode');
    const typeStatic = document.getElementById('typeStatic');
    const nodeConfigGroup = document.getElementById('nodeConfigGroup');

    typeNode?.addEventListener('click', () => {
        activeType = 'node';
        typeNode.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-accent text-accentInv transition-all';
        typeStatic.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all';
        nodeConfigGroup.classList.remove('hidden');
        nodeConfigGroup.classList.add('flex');
    });

    typeStatic?.addEventListener('click', () => {
        activeType = 'static';
        typeStatic.className = 'flex-1 py-2 text-xs font-bold rounded-lg bg-accent text-accentInv transition-all';
        typeNode.className = 'flex-1 py-2 text-xs font-bold rounded-lg text-muted hover:text-accent transition-all';
        nodeConfigGroup.classList.add('hidden');
        nodeConfigGroup.classList.remove('flex');
    });

    const submitBtn = document.getElementById('submitDeployBtn');
    document.getElementById('deployForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        
        try {
            if (activeTab === 'local') {
                const pathVal = document.getElementById('appPath').value;
                if (!pathVal) throw new Error('Directory target required.');
                
                submitBtn.innerText = 'Allocating Container...';
                await createProject({
                    name: document.getElementById('appName').value,
                    path: pathVal,
                    start_command: activeType === 'static' ? 'STATIC' : (document.getElementById('appCommand').value || 'npm start'),
                    port: activeType === 'static' ? 0 : (document.getElementById('appPort').value || 3000)
                });
            } else {
                const repoVal = document.getElementById('appRepo').value;
                if (!repoVal) throw new Error('Repository URL required.');
                
                submitBtn.innerText = 'Cloning Architecture...';
                await createGithubProject({
                    name: document.getElementById('appName').value,
                    repoUrl: repoVal,
                    start_command: activeType === 'static' ? 'STATIC' : (document.getElementById('appCommand').value || 'npm start'),
                    port: activeType === 'static' ? 0 : (document.getElementById('appPort').value || 3000)
                });
            }
            
            closeSequence();
            document.getElementById('deployForm').reset();
            showToast('Deployment configured successfully', 'success');
            loadDashboard();
        } catch (error) {
            showToast(error.message, 'error');
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Boot the application
init();