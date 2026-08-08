import { fetchProjects, createProject } from './api.js';
import { renderNavbar } from './components/Navbar.js';
import { renderServiceList } from './components/ServiceList.js';
import { renderDeployModal } from './components/DeployModal.js';
import { fetchProjects, createProject, startProject, stopProject } from './api.js';
const app = document.getElementById('app');

async function loadDashboardData() {
    const contentArea = document.getElementById('dashboard-content');
    const projects = await fetchProjects();
    contentArea.className = ''; 
    contentArea.innerHTML = renderServiceList(projects);
}

async function init() {
    // Inject base UI and the hidden Modal
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

    await loadDashboardData();

    // Modal DOM Elements
    const modal = document.getElementById('deployModal');
    const modalContent = document.getElementById('deployModalContent');
    const form = document.getElementById('deployForm');
    const submitBtn = document.getElementById('submitDeployBtn');

    // Toggle Modal Functions
    const toggleModal = (show) => {
        if (show) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
            // Slight delay to trigger Tailwind opacity transition
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
            }, 10);
        } else {
            modal.classList.add('opacity-0');
            modalContent.classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 200);
        }
    };

    // Event Listeners
    document.getElementById('newServiceBtn').addEventListener('click', () => toggleModal(true));
    document.getElementById('closeModalBtn').addEventListener('click', () => toggleModal(false));
    document.getElementById('cancelModalBtn').addEventListener('click', () => toggleModal(false));

    // Handle Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Provide visual feedback
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Creating...';
        submitBtn.disabled = true;

        const newProject = {
            name: document.getElementById('appName').value,
            path: document.getElementById('appPath').value,
            start_command: document.getElementById('appCommand').value,
            port: document.getElementById('appPort').value
        };

        try {
            await createProject(newProject);
            form.reset();
            toggleModal(false);
            
            // Reload the dashboard to show the newly added app
            document.getElementById('dashboard-content').innerHTML = `<div class="h-32 bg-rElevated border border-rBorder rounded-lg w-full animate-pulse"></div>`;
            await loadDashboardData();
        } catch (error) {
            alert(error.message);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

init();
// Handle Start/Stop Button Clicks dynamically
    document.getElementById('dashboard-content').addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return; // If they didn't click an action button, do nothing

        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        
        // Visual feedback
        const originalText = btn.innerText;
        btn.innerText = 'Working...';
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');

        try {
            if (action === 'start') {
                await startProject(id);
            } else {
                await stopProject(id);
            }
            // Reload the dashboard to show the new Running/Stopped status
            await loadDashboardData();
        } catch (error) {
            alert(error.message);
            // Revert button if it fails
            btn.innerText = originalText;
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });