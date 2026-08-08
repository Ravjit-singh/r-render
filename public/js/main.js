import { renderAuthScreen } from './components/Auth.js';
import { 
    loginUser, registerUser, fetchProjects, createProject, startProject, stopProject, 
    getProjectInfo, getProjectLogs, sendCommand, deleteProject, createGithubProject 
} from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderServiceList } from './components/ServiceList.js';
import { renderDeployModal } from './components/DeployModal.js';
import { renderProjectDetails } from './components/ProjectDetails.js';

const app = document.getElementById('app');
let activeLogInterval = null;

// --- 1. THE ROUTER ---
export async function init() {
    const token = localStorage.getItem('token');
    clearInterval(activeLogInterval);
    
    if (!token) {
        // If not logged in, render the Auth view
        app.innerHTML = renderAuthScreen();
        setupAuthEvents();
    } else {
        // If logged in, render the persistent shell (Navbar & Modal)
        app.innerHTML = `
            ${renderNavbar()}
            <div id="main-content" class="flex-grow flex flex-col w-full"></div>
            ${renderDeployModal()}
        `;
        
        // Setup Global Shell Events
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            init(); // Re-boot the app into Auth mode
        });

        setupModalEvents();
        await loadDashboard();
    }
}

// --- 2. AUTHENTICATION LOGIC ---
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
        title.innerText = isLoginMode ? 'Sign In' : 'Request Access';
        subtitle.innerText = isLoginMode ? 'Welcome back to R-Render Core' : 'Register for an isolated environment';
        submitBtn.innerText = isLoginMode ? 'Sign In' : 'Submit Request';
        toggleBtn.innerHTML = isLoginMode ? 'Need an account? <span class="text-rAccent">Request Access</span>' : 'Already have access? <span class="text-rAccent">Sign In</span>';
        msgBox.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = document.getElementById('authUsername').value;
        const pass = document.getElementById('authPassword').value;
        
        submitBtn.disabled = true;
        submitBtn.innerText = 'Working...';
        msgBox.classList.add('hidden');

        try {
            if (isLoginMode) {
                const data = await loginUser(user, pass);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                init(); // Success: Load the dashboard
            } else {
                const data = await registerUser(user, pass);
                msgBox.innerText = data.message;
                msgBox.className = 'mt-4 text-center text-sm px-3 py-2 rounded-md bg-green-900/20 text-green-400 border border-green-900/50 block';
                form.reset();
            }
        } catch (err) {
            msgBox.innerText = err.message;
            msgBox.className = 'mt-4 text-center text-sm px-3 py-2 rounded-md bg-red-900/20 text-red-400 border border-red-900/50 block';
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = isLoginMode ? 'Sign In' : 'Submit Request';
        }
    });
}

// --- 3. DASHBOARD VIEW ---
async function loadDashboard() {
    clearInterval(activeLogInterval);
    const mainContent = document.getElementById('main-content');
    
    // Inject the loading skeleton into the dynamic content area
    mainContent.innerHTML = `
        <main class="max-w-[1000px] w-full mx-auto mt-10 px-6 pb-12 flex-grow">
            <div class="flex justify-between items-end mb-6">
                <h1 class="text-2xl font-semibold text-gray-100 tracking-tight">Dashboard</h1>
            </div>
            <div id="dashboard-content" class="animate-pulse flex space-x-4">
                <div class="h-32 bg-rElevated border border-rBorder rounded-lg w-full"></div>
            </div>
        </main>
    `;
    
    const contentArea = document.getElementById('dashboard-content');
    try {
        const projects = await fetchProjects();
        contentArea.className = ''; 
        contentArea.innerHTML = renderServiceList(projects);
        
        // Attach dynamic row clicks to the newly created area
        contentArea.addEventListener('click', async (e) => {
            const btn = e.target.closest('.action-btn');
            if (btn) {
                const id = btn.getAttribute('data-id');
                const action = btn.getAttribute('data-action');
                btn.innerText = 'Working...';
                if (action === 'start') await startProject(id);
                else await stopProject(id);
                return loadDashboard();
            }
            
            const row = e.target.closest('tr');
            if (row && !e.target.closest('button')) {
                const id = row.querySelector('.action-btn').getAttribute('data-id');
                loadProjectDetails(id);
            }
        });
    } catch (err) {
        contentArea.innerHTML = `<div class="p-4 text-red-400 bg-red-900/10 border border-red-900/50 rounded-md">Error loading projects. Token may have expired.</div>`;
    }
}

// --- 4. PROJECT DETAILS & TERMINAL VIEW ---
async function loadProjectDetails(id) {
    clearInterval(activeLogInterval);
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <main class="max-w-[1000px] w-full mx-auto mt-10 px-6 pb-12 flex-grow">
            <div class="h-64 bg-rElevated border border-rBorder rounded-lg w-full animate-pulse"></div>
        </main>
    `;

    try {
        const project = await getProjectInfo(id);
        mainContent.innerHTML = `
            <main class="max-w-[1000px] w-full mx-auto mt-10 px-6 pb-12 flex-grow">
                ${renderProjectDetails(project)}
            </main>
        `;
        setupDetailsEvents(project);
        startLogPolling(id);
    } catch (err) {
        loadDashboard(); // Fallback to list on error
    }
}

function setupDetailsEvents(project) {
    document.getElementById('backToDashBtn').addEventListener('click', loadDashboard);

    document.getElementById('terminal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('terminal-input');
        if (input.value.trim()) {
            await sendCommand(project.id, input.value.trim());
            input.value = ''; 
        }
    });

    document.getElementById('toggleProjectBtn').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerText = 'Working...';
        btn.disabled = true;
        const action = btn.getAttribute('data-action');
        if (action === 'start') await startProject(project.id);
        else await stopProject(project.id);
        loadProjectDetails(project.id); 
    });

    document.getElementById('restartProjectBtn').addEventListener('click', async (e) => {
        e.target.innerText = 'Restarting...';
        await stopProject(project.id);
        await new Promise(r => setTimeout(r, 1000)); 
        await startProject(project.id);
        loadProjectDetails(project.id);
    });

    document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${project.name}?`)) {
            await deleteProject(project.id);
            loadDashboard();
        }
    });
}

function startLogPolling(id) {
    const terminal = document.getElementById('terminal-output');
    const fetchLogs = async () => {
        try {
            const { logs } = await getProjectLogs(id);
            terminal.innerHTML = logs.map(line => `<span>${line}</span>`).join('');
            terminal.scrollTop = terminal.scrollHeight; // Auto-scroll
        } catch (e) { }
    };
    fetchLogs();
    activeLogInterval = setInterval(fetchLogs, 1000);
}

// --- 5. GLOBAL DEPLOY MODAL EVENTS ---
function setupModalEvents() {
    const modal = document.getElementById('deployModal');
    const toggleModal = (show) => {
        if (show) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('deployModalContent').classList.remove('scale-95'); }, 10); } 
        else { modal.classList.add('opacity-0'); document.getElementById('deployModalContent').classList.add('scale-95'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200); }
    };

    document.getElementById('newServiceBtn')?.addEventListener('click', () => toggleModal(true));
    document.getElementById('closeModalBtn')?.addEventListener('click', () => toggleModal(false));
    document.getElementById('cancelModalBtn')?.addEventListener('click', () => toggleModal(false));

    let activeTab = 'local';
    const tabLocal = document.getElementById('tabLocal');
    const tabGithub = document.getElementById('tabGithub');
    const groupLocal = document.getElementById('localPathGroup');
    const groupGithub = document.getElementById('githubUrlGroup');

    tabLocal?.addEventListener('click', () => {
        activeTab = 'local';
        tabLocal.className = 'flex-1 py-1.5 text-sm font-medium rounded-md bg-rElevated text-white shadow transition';
        tabGithub.className = 'flex-1 py-1.5 text-sm font-medium rounded-md text-gray-400 hover:text-gray-200 transition';
        groupLocal.classList.remove('hidden');
        groupGithub.classList.add('hidden');
    });

    tabGithub?.addEventListener('click', () => {
        activeTab = 'github';
        tabGithub.className = 'flex-1 py-1.5 text-sm font-medium rounded-md bg-rElevated text-white shadow transition';
        tabLocal.className = 'flex-1 py-1.5 text-sm font-medium rounded-md text-gray-400 hover:text-gray-200 transition';
        groupGithub.classList.remove('hidden');
        groupLocal.classList.add('hidden');
    });

    const submitBtn = document.getElementById('submitDeployBtn');
    document.getElementById('deployForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        
        try {
            if (activeTab === 'local') {
                const pathVal = document.getElementById('appPath').value;
                if (!pathVal) throw new Error('Please enter a local path.');
                
                submitBtn.innerText = 'Creating...';
                await createProject({
                    name: document.getElementById('appName').value,
                    path: pathVal,
                    start_command: document.getElementById('appCommand').value,
                    port: document.getElementById('appPort').value
                });
            } else {
                const repoVal = document.getElementById('appRepo').value;
                if (!repoVal) throw new Error('Please enter a GitHub URL.');
                
                submitBtn.innerText = 'Cloning & Installing...';
                await createGithubProject({
                    name: document.getElementById('appName').value,
                    repoUrl: repoVal,
                    start_command: document.getElementById('appCommand').value,
                    port: document.getElementById('appPort').value
                });
            }
            
            toggleModal(false);
            document.getElementById('deployForm').reset();
            loadDashboard();
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Boot the application
init();