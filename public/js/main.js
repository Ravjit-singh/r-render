import { fetchProjects, createProject, startProject, stopProject, getProjectInfo, getProjectLogs, sendCommand, deleteProject, createGithubProject } from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderServiceList } from './components/ServiceList.js';
import { renderDeployModal } from './components/DeployModal.js';
import { renderProjectDetails } from './components/ProjectDetails.js';

const app = document.getElementById('app');
let activeLogInterval = null; 

async function loadDashboard() {
    clearInterval(activeLogInterval);
    
    app.innerHTML = `
        ${renderNavbar()}
        <main class="max-w-[1000px] w-full mx-auto mt-10 px-6 pb-12 flex-grow">
            <div class="flex justify-between items-end mb-6">
                <h1 class="text-2xl font-semibold text-gray-100 tracking-tight">Dashboard</h1>
            </div>
            <div id="dashboard-content" class="animate-pulse flex space-x-4">
                <div class="h-32 bg-rElevated border border-rBorder rounded-lg w-full"></div>
            </div>
        </main>
        ${renderDeployModal()}
    `;
    
    const contentArea = document.getElementById('dashboard-content');
    const projects = await fetchProjects();
    contentArea.className = ''; 
    contentArea.innerHTML = renderServiceList(projects);
    setupDashboardEvents();
}

async function loadProjectDetails(id) {
    clearInterval(activeLogInterval);
    
    app.innerHTML = `
        ${renderNavbar()}
        <main id="details-content" class="max-w-[1000px] w-full mx-auto mt-10 px-6 pb-12 flex-grow">
            <div class="h-64 bg-rElevated border border-rBorder rounded-lg w-full animate-pulse"></div>
        </main>
    `;

    const project = await getProjectInfo(id);
    document.getElementById('details-content').innerHTML = renderProjectDetails(project);
    
    setupDetailsEvents(project);
    startLogPolling(id);
}

function startLogPolling(id) {
    const terminal = document.getElementById('terminal-output');
    
    const fetchLogs = async () => {
        try {
            const { logs } = await getProjectLogs(id);
            terminal.innerHTML = logs.map(line => `<span>${line}</span>`).join('');
            terminal.scrollTop = terminal.scrollHeight; // Auto-scroll to bottom
        } catch (e) { }
    };
    
    fetchLogs();
    activeLogInterval = setInterval(fetchLogs, 1000);
}

function setupDetailsEvents(project) {
    document.getElementById('backToDashBtn').addEventListener('click', loadDashboard);

    // Terminal Input
    const termForm = document.getElementById('terminal-form');
    termForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('terminal-input');
        if (input.value.trim()) {
            await sendCommand(project.id, input.value.trim());
            input.value = ''; // clear input
        }
    });

    // Start/Stop
    document.getElementById('toggleProjectBtn').addEventListener('click', async (e) => {
        const btn = e.target;
        btn.innerText = 'Working...';
        btn.disabled = true;
        const action = btn.getAttribute('data-action');
        if (action === 'start') await startProject(project.id);
        else await stopProject(project.id);
        loadProjectDetails(project.id); // Reload view to update status
    });

    // Restart
    document.getElementById('restartProjectBtn').addEventListener('click', async (e) => {
        e.target.innerText = 'Restarting...';
        await stopProject(project.id);
        await new Promise(r => setTimeout(r, 1000)); // Brief pause
        await startProject(project.id);
        loadProjectDetails(project.id);
    });

    // Delete
    document.getElementById('deleteProjectBtn').addEventListener('click', async () => {
        if (confirm(`Are you sure you want to delete ${project.name}?`)) {
            await deleteProject(project.id);
            loadDashboard();
        }
    });
}

function setupDashboardEvents() {
    const modal = document.getElementById('deployModal');
    const toggleModal = (show) => {
        if (show) { modal.classList.remove('hidden'); modal.classList.add('flex'); setTimeout(() => { modal.classList.remove('opacity-0'); document.getElementById('deployModalContent').classList.remove('scale-95'); }, 10); } 
        else { modal.classList.add('opacity-0'); document.getElementById('deployModalContent').classList.add('scale-95'); setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200); }
    };

    document.getElementById('newServiceBtn').addEventListener('click', () => toggleModal(true));
    document.getElementById('closeModalBtn').addEventListener('click', () => toggleModal(false));
    document.getElementById('cancelModalBtn').addEventListener('click', () => toggleModal(false));

    // Tab Logic
    let activeTab = 'local';
    const tabLocal = document.getElementById('tabLocal');
    const tabGithub = document.getElementById('tabGithub');
    const groupLocal = document.getElementById('localPathGroup');
    const groupGithub = document.getElementById('githubUrlGroup');

    tabLocal.addEventListener('click', () => {
        activeTab = 'local';
        tabLocal.className = 'flex-1 py-1.5 text-sm font-medium rounded-md bg-rElevated text-white shadow transition';
        tabGithub.className = 'flex-1 py-1.5 text-sm font-medium rounded-md text-gray-400 hover:text-gray-200 transition';
        groupLocal.classList.remove('hidden');
        groupGithub.classList.add('hidden');
    });

    tabGithub.addEventListener('click', () => {
        activeTab = 'github';
        tabGithub.className = 'flex-1 py-1.5 text-sm font-medium rounded-md bg-rElevated text-white shadow transition';
        tabLocal.className = 'flex-1 py-1.5 text-sm font-medium rounded-md text-gray-400 hover:text-gray-200 transition';
        groupGithub.classList.remove('hidden');
        groupLocal.classList.add('hidden');
    });

    // Form Submission
    const submitBtn = document.getElementById('submitDeployBtn');
    document.getElementById('deployForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        
        try {
            if (activeTab === 'local') {
                const pathVal = document.getElementById('appPath').value;
                if (!pathVal) return alert('Please enter a local path.');
                
                submitBtn.innerText = 'Creating...';
                await createProject({
                    name: document.getElementById('appName').value,
                    path: pathVal,
                    start_command: document.getElementById('appCommand').value,
                    port: document.getElementById('appPort').value
                });
            } else {
                const repoVal = document.getElementById('appRepo').value;
                if (!repoVal) return alert('Please enter a GitHub URL.');
                
                // Keep the user informed since cloning takes time
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

    // Click project row to view details
    document.getElementById('dashboard-content').addEventListener('click', async (e) => {
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
}

loadDashboard(); // Boot the app