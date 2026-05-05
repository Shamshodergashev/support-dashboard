const API_URL = "https://script.google.com/macros/s/AKfycbxmBPOJ26kN6ft34Rc22o2wqOEWK-p6Y8uSyvvM267Ya-tO2KpttvhM9-2UJEzHAlF1/exec";
const BONUS_API_URL = "https://script.google.com/macros/s/AKfycbxmBPOJ26kN6ft34Rc22o2wqOEWK-p6Y8uSyvvM267Ya-tO2KpttvhM9-2UJEzHAlF1/exec";

let allClients = [];
let allBonusClients = [];
let empProjChartInst = null;
let empTaskChartInst = null;

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) refreshBtn.addEventListener("click", fetchData);
    
    const searchInput = document.getElementById("search-input");
    const empFilter = document.getElementById("filter-employee");
    const startFilter = document.getElementById("filter-start");
    const deadlineFilter = document.getElementById("filter-deadline");
    
    if(searchInput) searchInput.addEventListener("input", applyFilters);
    if(empFilter) empFilter.addEventListener("change", applyFilters);
    if(startFilter) startFilter.addEventListener("change", applyFilters);
    if(deadlineFilter) deadlineFilter.addEventListener("change", applyFilters);

    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('projectModal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            tabContents.forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(tabId);
            if(targetTab) targetTab.classList.add('active');
        });
    });

    const bonusSearch = document.getElementById("bonus-search-masul");
    const bonusStatusFilter = document.getElementById("bonus-filter-status");
    if(bonusSearch) bonusSearch.addEventListener("input", applyBonusFilters);
    if(bonusStatusFilter) bonusStatusFilter.addEventListener("change", applyBonusFilters);
});

async function fetchData() {
    const btn = document.getElementById("refresh-btn");
    const statusText = document.getElementById("fetch-status");
    if (btn) { btn.innerHTML = "⏳ Yangilanmoqda..."; btn.disabled = true; }
    if (statusText) statusText.style.display = "inline";

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allClients = data.clients || [];
        processData(allClients);
    } catch (e) { console.error("Main API Error:", e); }

    try {
        const bResponse = await fetch(BONUS_API_URL);
        const bData = await bResponse.json();
        allBonusClients = bData.data || bData.clients || (Array.isArray(bData) ? bData : []);
        renderBonusTable(allBonusClients);
    } catch (e) { console.error("Bonus API Error:", e); }

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const lastUpdated = document.getElementById("last-updated");
    if (lastUpdated) lastUpdated.innerText = `Yangilangan vaqti: ${timeStr}`;

    if (statusText) statusText.style.display = "none";
    if (btn) { btn.innerHTML = "🔄 Yangilash"; btn.disabled = false; }
}

function processData(clients) {
    clients.forEach(c => {
        let done = 0, pending = 0;
        if (c.tasks) {
            const lines = String(c.tasks).split('\n');
            lines.forEach(l => {
                if (l.trim().startsWith('✅') || l.trim().startsWith('☑')) done++;
                else if (l.trim().startsWith('☐')) pending++;
            });
        }
        c.doneTasks = done;
        c.pendingTasks = pending;
        c.totalTasks = done + pending;
        c.progressVal = c.totalTasks === 0 ? 0 : Math.round((done / c.totalTasks) * 100);
    });

    const emps = new Set();
    clients.forEach(c => { if(c.employee) emps.add(c.employee); });
    const empSelect = document.getElementById("filter-employee");
    if (empSelect) {
        const currentVal = empSelect.value;
        empSelect.innerHTML = '<option value="all">Barcha xodimlar</option>';
        Array.from(emps).sort().forEach(emp => {
            const opt = document.createElement("option");
            opt.value = emp; opt.innerText = emp;
            empSelect.appendChild(opt);
        });
        empSelect.value = currentVal || "all";
    }
    applyFilters();
}

function applyFilters() {
    const search = document.getElementById("search-input")?.value.toLowerCase() || "";
    const emp = document.getElementById("filter-employee")?.value || "all";
    const startF = document.getElementById("filter-start")?.value || "";
    const deadlineF = document.getElementById("filter-deadline")?.value || "";

    const filtered = allClients.filter(c => {
        const mName = c.name.toLowerCase().includes(search);
        const mEmp = emp === "all" || c.employee === emp;
        let mStart = true, mEnd = true;
        if (startF) {
            const dStart = new Date(startF); dStart.setHours(0,0,0,0);
            const cStart = parseDate(c.start); if (cStart < dStart) mStart = false;
        }
        if (deadlineF) {
            const dEnd = new Date(deadlineF); dEnd.setHours(23,59,59,999);
            const cEnd = parseDate(c.deadline); if (cEnd > dEnd) mEnd = false;
        }
        return mName && mEmp && mStart && mEnd;
    });
    renderDashboard(filtered);
}

function renderDashboard(clients) {
    let totalP = clients.length, doneP = clients.filter(c => c.progressVal === 100).length;
    let activeP = totalP - doneP;
    let totalT = 0, doneT = 0, pendingT = 0;
    let empStats = {};

    clients.forEach(c => {
        totalT += c.totalTasks; doneT += c.doneTasks; pendingT += c.pendingTasks;
        const e = c.employee || "Biriktirilmagan";
        if (!empStats[e]) empStats[e] = { pDone: 0, pActive: 0, tDone: 0, tPending: 0 };
        if (c.progressVal === 100) empStats[e].pDone++; else empStats[e].pActive++;
        empStats[e].tDone += c.doneTasks; empStats[e].tPending += c.pendingTasks;
    });

    const el = (id, val) => { const e = document.getElementById(id); if(e) e.innerText = val; };
    el("stat-proj-total", totalP); el("stat-proj-done", doneP); el("stat-proj-pending", activeP);
    el("stat-task-total", totalT); el("stat-task-done", doneT); el("stat-task-pending", pendingT);

    renderCharts(empStats);
    renderLists(clients);
    renderTable(clients);
}

function renderCharts(stats) {
    const labels = Object.keys(stats);
    const pDone = labels.map(l => stats[l].pDone);
    const pActive = labels.map(l => stats[l].pActive);
    const options = { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true } } };
    if (empProjChartInst) empProjChartInst.destroy();
    const ctx1 = document.getElementById('empProjectsChart');
    if (ctx1) {
        empProjChartInst = new Chart(ctx1.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [
                { label: 'Bitgan', data: pDone, backgroundColor: '#10b981' },
                { label: 'Jarayonda', data: pActive, backgroundColor: '#f59e0b' }
            ]},
            options
        });
    }
    const ctx2 = document.getElementById('empTasksChart');
    if (ctx2) {
        const tDone = labels.map(l => stats[l].tDone);
        const tPending = labels.map(l => stats[l].tPending);
        if (empTaskChartInst) empTaskChartInst.destroy();
        empTaskChartInst = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: { labels, datasets: [
                { label: '✅', data: tDone, backgroundColor: '#10b981' },
                { label: '☐', data: tPending, backgroundColor: '#3b82f6' }
            ]},
            options
        });
    }
}

function renderLists(clients) {
    const overdueList = document.getElementById("overdue-list");
    const upcomingList = document.getElementById("upcoming-list");
    const completedList = document.getElementById("completed-list");
    const stoppedList = document.getElementById("stopped-list");
    const activeTaskList = document.getElementById("active-task-list");
    if(overdueList) overdueList.innerHTML = "";
    if(upcomingList) upcomingList.innerHTML = "";
    if(completedList) completedList.innerHTML = "";
    if(stoppedList) stoppedList.innerHTML = "";
    if(activeTaskList) activeTaskList.innerHTML = "";
    const now = new Date(); now.setHours(0,0,0,0);
    clients.forEach(c => {
        const dLine = parseDate(c.deadline);
        const itemHtml = `<div class="status-item"><span>${c.name}</span> <small>${c.employee || '-'}</small></div>`;
        if (c.status === 'stopped') { if(stoppedList) stoppedList.innerHTML += itemHtml; }
        else if (c.progressVal === 100) { if(completedList) completedList.innerHTML += itemHtml; }
        else {
            if (dLine < now && dLine.getFullYear() !== 9999) { if(overdueList) overdueList.innerHTML += itemHtml; }
            else if (dLine <= new Date(now.getTime() + 3*24*60*60*1000)) { if(upcomingList) upcomingList.innerHTML += itemHtml; }
            if(activeTaskList) activeTaskList.innerHTML += itemHtml;
        }
    });
}

function renderTable(clients) {
    const tbody = document.getElementById("projects-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    clients.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${c.name}</strong></td>
            <td>${c.employee || '-'}</td>
            <td>${formatShortDate(c.start)}</td>
            <td>${formatShortDate(c.deadline)}</td>
            <td>${formatShortDate(c.delivered) || '-'}</td>
            <td><span class="status-badge ${c.progressVal === 100 ? 'status-completed' : 'status-active'}">${c.progressVal === 100 ? 'Bitgan' : 'Jarayonda'}</span></td>
            <td>${c.comment || '-'}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${c.progressVal}%"></div>
                    <span class="progress-text">${c.progressVal}%</span>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBonusTable(data) {
    const tbody = document.getElementById("bonus-body");
    if (!tbody) return;
    tbody.innerHTML = "";
    data.forEach(b => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${b.no || '-'}</td><td><strong>${b.mijoz || '-'}</strong></td><td>${b.masul || '-'}</td><td>${formatShortDate(b.boshlanish)}</td><td>${formatShortDate(b.tugash)}</td><td>${b.qolgan || '-'}</td><td><div class="bonus-progress">${b.progress || '-'}</div></td><td>${Number(b.summa || 0).toLocaleString()}</td><td><span class="status-badge">${b.holat || '-'}</span></td><td class="bonus-amount">${Number(b.bonus || 0).toLocaleString()}</td>`;
        tbody.appendChild(tr);
    });
}

function applyBonusFilters() {
    const search = document.getElementById("bonus-search-masul")?.value.toLowerCase() || "";
    const status = document.getElementById("bonus-filter-status")?.value || "all";
    const filtered = allBonusClients.filter(b => {
        const mName = (b.masul || "").toLowerCase().includes(search);
        const mStatus = status === "all" || b.holat === status;
        return mName && mStatus;
    });
    renderBonusTable(filtered);
}

function showProjectDetails(id) {
    const c = allClients.find(p => String(p.id) === String(id));
    if (!c) return;
    document.getElementById("modalTitle").innerText = c.name;
    document.getElementById("modalInfo").innerHTML = `<p><strong>Xodim:</strong> ${c.employee}</p><p><strong>Muddati:</strong> ${formatShortDate(c.start)} - ${formatShortDate(c.deadline)}</p>`;
    const taskList = document.getElementById("modalTaskList");
    taskList.innerHTML = "";
    if (c.tasks) c.tasks.split('\n').forEach(t => { const li = document.createElement("li"); li.innerText = t; taskList.appendChild(li); });
    document.getElementById("projectModal").classList.add("active");
}

function parseDate(str) { if(!str) return new Date(9999,0,1); const d = new Date(str); return isNaN(d.getTime()) ? new Date(9999,0,1) : d; }
function formatShortDate(str) { if(!str || str === '-') return '-'; const d = new Date(str); if(isNaN(d.getTime())) return str; return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; }
