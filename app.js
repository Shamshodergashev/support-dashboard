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
    
    // Filter listeners
    const searchInput = document.getElementById("search-input");
    const empFilter = document.getElementById("filter-employee");
    const startFilter = document.getElementById("filter-start");
    const deadlineFilter = document.getElementById("filter-deadline");
    
    if(searchInput) searchInput.addEventListener("input", applyFilters);
    if(empFilter) empFilter.addEventListener("change", applyFilters);
    if(startFilter) startFilter.addEventListener("change", applyFilters);
    if(deadlineFilter) deadlineFilter.addEventListener("change", applyFilters);

    // Modal Close
    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('projectModal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    // Tab Switching
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

    // Bonus Filters
    const bonusSearch = document.getElementById("bonus-search-masul");
    const bonusStatusFilter = document.getElementById("bonus-filter-status");
    if(bonusSearch) bonusSearch.addEventListener("input", applyBonusFilters);
    if(bonusStatusFilter) bonusStatusFilter.addEventListener("change", applyBonusFilters);
});

async function fetchData() {
    const btn = document.getElementById("refresh-btn");
    if (btn) {
        btn.innerHTML = "⏳ Yangilanmoqda...";
        btn.disabled = true;
    }

    try {
        console.log("Fetching Main Data...");
        const response = await fetch(API_URL);
        const data = await response.json();
        allClients = data.clients || [];
        processData(allClients);
    } catch (e) {
        console.error("Main API Error:", e);
    }

    try {
        console.log("Fetching Bonus Data...");
        const bResponse = await fetch(BONUS_API_URL);
        const bData = await bResponse.json();
        allBonusClients = bData.data || bData.clients || (Array.isArray(bData) ? bData : []);
        renderBonusTable(allBonusClients);
    } catch (e) {
        console.error("Bonus API Error:", e);
    }

    const statusText = document.getElementById("fetch-status");
    if (statusText) statusText.style.display = "none";
    if (btn) {
        btn.innerHTML = "🔄 Yangilash";
        btn.disabled = false;
    }
}

function processData(clients) {
    let emps = new Set();
    clients.forEach(c => {
        let done = 0;
        let pending = 0;
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
        if (c.employee) emps.add(c.employee);
    });

    // Populate Emp Dropdown
    const empSelect = document.getElementById("filter-employee");
    if (empSelect) {
        const currentVal = empSelect.value;
        empSelect.innerHTML = '<option value="all">Barcha xodimlar</option>';
        Array.from(emps).sort().forEach(emp => {
            const opt = document.createElement("option");
            opt.value = emp;
            opt.innerText = emp;
            empSelect.appendChild(opt);
        });
        empSelect.value = currentVal || "all";
    }

    applyFilters();
}

function applyFilters() {
    const search = document.getElementById("search-input") ? document.getElementById("search-input").value.toLowerCase() : "";
    const emp = document.getElementById("filter-employee") ? document.getElementById("filter-employee").value : "all";
    const startF = document.getElementById("filter-start") ? document.getElementById("filter-start").value : "";
    const deadlineF = document.getElementById("filter-deadline") ? document.getElementById("filter-deadline").value : "";

    const filtered = allClients.filter(c => {
        const mName = c.name.toLowerCase().includes(search);
        const mEmp = emp === "all" || c.employee === emp;
        
        let mStart = true;
        let mEnd = true;
        if (startF) {
            const dStart = new Date(startF); dStart.setHours(0,0,0,0);
            const cStart = parseDate(c.start);
            if (cStart < dStart) mStart = false;
        }
        if (deadlineF) {
            const dEnd = new Date(deadlineF); dEnd.setHours(23,59,59,999);
            const cEnd = parseDate(c.deadline);
            if (cEnd > dEnd) mEnd = false;
        }
        return mName && mEmp && mStart && mEnd;
    });

    renderDashboard(filtered);
}

function renderDashboard(clients) {
    // Stats
    let totalP = clients.length;
    let doneP = clients.filter(c => c.progressVal === 100).length;
    let activeP = totalP - doneP;
    
    let totalT = 0, doneT = 0, pendingT = 0;
    let empStats = {};

    clients.forEach(c => {
        totalT += c.totalTasks;
        doneT += c.doneTasks;
        pendingT += c.pendingTasks;

        const e = c.employee || "Noma'lum";
        if (!empStats[e]) empStats[e] = { pDone: 0, pActive: 0, tDone: 0, tPending: 0 };
        if (c.progressVal === 100) empStats[e].pDone++; else empStats[e].pActive++;
        empStats[e].tDone += c.doneTasks;
        empStats[e].tPending += c.pendingTasks;
    });

    const el = (id, val) => { const e = document.getElementById(id); if(e) e.innerText = val; };
    el("stat-proj-total", totalP);
    el("stat-proj-done", doneP);
    el("stat-proj-pending", activeP);
    el("stat-task-total", totalT);
    el("stat-task-done", doneT);
    el("stat-task-pending", pendingT);

    renderCharts(empStats);
    renderTable(clients);
}

function renderCharts(stats) {
    const labels = Object.keys(stats);
    const pDone = labels.map(l => stats[l].pDone);
    const pActive = labels.map(l => stats[l].pActive);
    const tDone = labels.map(l => stats[l].tDone);
    const tPending = labels.map(l => stats[l].tPending);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } }
    };

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

    if (empTaskChartInst) empTaskChartInst.destroy();
    const ctx2 = document.getElementById('empTasksChart');
    if (ctx2) {
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

function renderTable(clients) {
    const tbody = document.getElementById("projects-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    clients.forEach(c => {
        const tr = document.createElement("tr");
        if (c.status === 'stopped') tr.style.opacity = "0.6";
        
        tr.innerHTML = `
            <td>${c.id || '-'}</td>
            <td><div class="client-name-cell"><strong>${c.name}</strong></div></td>
            <td>${c.employee || '-'}</td>
            <td>${formatShortDate(c.start)}</td>
            <td>${formatShortDate(c.deadline)}</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${c.progressVal}%"></div>
                    <span class="progress-text">${c.progressVal}%</span>
                </div>
            </td>
            <td><span class="status-badge ${c.progressVal === 100 ? 'status-completed' : 'status-active'}">${c.progressVal === 100 ? 'Bitgan' : 'Jarayonda'}</span></td>
            <td><button class="btn-view" onclick="showProjectDetails('${c.id}')">👁</button></td>
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
        tr.innerHTML = `
            <td>${b.no || '-'}</td>
            <td><strong>${b.mijoz || '-'}</strong></td>
            <td>${b.masul || '-'}</td>
            <td>${formatShortDate(b.boshlanish)}</td>
            <td>${formatShortDate(b.tugash)}</td>
            <td>${b.qolgan || '-'}</td>
            <td><div class="bonus-progress">${b.progress || '-'}</div></td>
            <td>${Number(b.summa || 0).toLocaleString()}</td>
            <td><span class="status-badge">${b.holat || '-'}</span></td>
            <td class="bonus-amount">${Number(b.bonus || 0).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
    });
    
    // Update Ranking
    updateBonusRanking(data);
}

function updateBonusRanking(data) {
    const stats = {};
    data.forEach(b => {
        if (b.masul && b.bonus) {
            stats[b.masul] = (stats[b.masul] || 0) + Number(b.bonus);
        }
    });

    const sorted = Object.keys(stats).map(name => ({ name, amount: stats[name] })).sort((a,b) => b.amount - a.amount);
    
    const rankingList = document.getElementById("bonus-ranking-list");
    if (rankingList) {
        rankingList.innerHTML = sorted.slice(0, 5).map((item, i) => `
            <div class="ranking-item">
                <span class="rank-num">${i+1}</span>
                <span class="rank-name">${item.name}</span>
                <span class="rank-amount">${item.amount.toLocaleString()} UZS</span>
            </div>
        `).join('');
    }
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
    document.getElementById("modalInfo").innerHTML = `
        <p><strong>Xodim:</strong> ${c.employee}</p>
        <p><strong>Muddati:</strong> ${formatShortDate(c.start)} - ${formatShortDate(c.deadline)}</p>
        <p><strong>Xizmatlar:</strong> ${c.services || '-'}</p>
    `;
    
    const taskList = document.getElementById("modalTaskList");
    taskList.innerHTML = "";
    if (c.tasks) {
        c.tasks.split('\n').forEach(t => {
            const li = document.createElement("li");
            li.innerText = t;
            taskList.appendChild(li);
        });
    }

    document.getElementById("projectModal").classList.add("active");
}

function parseDate(str) {
    if(!str) return new Date(9999,0,1);
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(9999,0,1) : d;
}

function formatShortDate(str) {
    if(!str || str === '-') return '-';
    const d = new Date(str);
    if(isNaN(d.getTime())) return str;
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
}
