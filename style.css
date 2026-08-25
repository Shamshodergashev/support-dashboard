const API_URL = "https://script.google.com/macros/s/AKfycbx7RGnvVh9NrrWcayc2xE2PXjdhX1vDRh9u12lEI-M8IlOzr-QVyIicTCkNZvwPwlFK/exec";
let empProjChartInst = null;
let empTaskChartInst = null;
let allClients = [];
let activeCardFilter = "all";

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    document.getElementById("refresh-btn").addEventListener("click", fetchData);

    // Filter listeners
    const searchInput = document.getElementById("search-input");
    const empFilter = document.getElementById("filter-employee");
    const startFilter = document.getElementById("filter-start");
    const deadlineFilter = document.getElementById("filter-deadline");

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (empFilter) empFilter.addEventListener("change", applyFilters);
    if (startFilter) startFilter.addEventListener("change", applyFilters);
    if (deadlineFilter) deadlineFilter.addEventListener("change", applyFilters);

    // Stat cards click event listeners
    const cardFilters = {
        "card-proj-total": "all",
        "card-proj-done": "done_projects",
        "card-proj-pending": "pending_projects",
        "card-proj-using": "using_projects",
        "card-proj-stopped": "stopped_projects",
        "card-task-total": "total_tasks",
        "card-task-done": "done_tasks",
        "card-task-pending": "pending_tasks"
    };

    Object.keys(cardFilters).forEach(cardId => {
        const cardEl = document.getElementById(cardId);
        if (cardEl) {
            cardEl.addEventListener("click", () => {
                setCardFilter(cardFilters[cardId]);
            });
        }
    });

    // Modal Close logic
    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('projectModal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }
});

async function fetchData() {
    const btn = document.getElementById("refresh-btn");
    btn.innerHTML = "⏳ Yangilanmoqda...";
    btn.disabled = true;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        processData(data.clients || []);

        const now = new Date();
        document.getElementById("last-updated").innerText = `Oxirgi yangilanish: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
        console.error("Xatolik yuz berdi:", error);
        alert("Ma'lumotlarni yuklab bo'lmadi!");
    } finally {
        btn.innerHTML = "🔄 Yangilash";
        btn.disabled = false;
    }
}

function processData(clients) {
    // 1. Calculate base data for all clients
    let emps = new Set();
    clients.forEach(c => {
        let done = 0;
        let pending = 0;
        if (c.tasks) {
            const lines = c.tasks.split('\n');
            lines.forEach(l => {
                if (l.trim().startsWith('✅')) done++;
                if (l.trim().startsWith('☐')) pending++;
            });
        }
        c.doneTasks = done;
        c.pendingTasks = pending;
        c.totalTasks = done + pending;
        c.progress = c.totalTasks === 0 ? 0 : Math.round((done / c.totalTasks) * 100);

        if (c.employee) emps.add(c.employee);
    });

    allClients = clients;

    // 2. Populate Employee Dropdown
    const empSelect = document.getElementById("filter-employee");
    const currentEmp = empSelect ? empSelect.value : "all";
    if (empSelect) {
        empSelect.innerHTML = '<option value="all">Barcha xodimlar</option>';
        Array.from(emps).sort().forEach(emp => {
            const option = document.createElement("option");
            option.value = emp;
            option.innerText = emp;
            empSelect.appendChild(option);
        });
        empSelect.value = currentEmp;
    }

    // 3. Trigger filters to render everything
    applyFilters();
}

function applyFilters() {
    const searchText = document.getElementById("search-input") ? document.getElementById("search-input").value.toLowerCase() : "";
    const empFilter = document.getElementById("filter-employee") ? document.getElementById("filter-employee").value : "all";
    const startFilter = document.getElementById("filter-start") ? document.getElementById("filter-start").value : "";
    const deadlineFilter = document.getElementById("filter-deadline") ? document.getElementById("filter-deadline").value : "";

    const filteredClients = allClients.filter(c => {
        const matchName = c.name.toLowerCase().includes(searchText);
        const matchEmp = empFilter === "all" || (c.employee || "Biriktirilmagan") === empFilter;

        let matchStart = true;
        let matchDeadline = true;

        if (startFilter) {
            const fDate = new Date(startFilter);
            fDate.setHours(0, 0, 0, 0);
            const cDate = parseDate(c.start);
            if (cDate.getFullYear() === 9999 || cDate < fDate) matchStart = false;
        }

        if (deadlineFilter) {
            const fDate = new Date(deadlineFilter);
            fDate.setHours(23, 59, 59, 999);
            const cDate = parseDate(c.deadline);
            if (cDate.getFullYear() === 9999 || cDate > fDate) matchDeadline = false;
        }

        return matchName && matchEmp && matchStart && matchDeadline;
    });

    renderDashboardElements(filteredClients);
}

function renderDashboardElements(clients) {
    let totalProjects = clients.length;
    let doneProjects = 0;
    let pendingProjects = 0;

    let totalTasks = 0;
    let totalDoneTasks = 0;
    let totalPendingTasks = 0;

    let employeeData = {};

    let stoppedProjects = 0;
    let usingProjects = 0;

    clients.forEach(c => {
        if (c.status === 'stopped') stoppedProjects++;
        else if (c.status === 'using') usingProjects++;
        else if (c.progress === 100) doneProjects++;
        else pendingProjects++;

        totalTasks += c.totalTasks;
        totalDoneTasks += c.doneTasks;
        totalPendingTasks += c.pendingTasks;

        const emp = c.employee || "Biriktirilmagan";
        if (!employeeData[emp]) {
            employeeData[emp] = { projDone: 0, projPending: 0, projUsing: 0, taskDone: 0, taskPending: 0 };
        }

        if (c.status === 'using') {
            employeeData[emp].projUsing++;
            employeeData[emp].taskDone += c.doneTasks;
            employeeData[emp].taskPending += c.pendingTasks;
        } else if (c.status !== 'stopped') {
            if (c.progress === 100) employeeData[emp].projDone++;
            else employeeData[emp].projPending++;
            employeeData[emp].taskDone += c.doneTasks;
            employeeData[emp].taskPending += c.pendingTasks;
        }
    });

    // Update Top Stats
    const tp = document.getElementById("stat-proj-total"); if (tp) tp.innerText = totalProjects;
    const dp = document.getElementById("stat-proj-done"); if (dp) dp.innerText = doneProjects;
    const pp = document.getElementById("stat-proj-pending"); if (pp) pp.innerText = pendingProjects;
    const up = document.getElementById("stat-proj-using-val"); if (up) up.innerText = usingProjects;
    const sp = document.getElementById("stat-proj-stopped-val"); if (sp) sp.innerText = stoppedProjects;

    const tt = document.getElementById("stat-task-total"); if (tt) tt.innerText = totalTasks;
    const dt = document.getElementById("stat-task-done"); if (dt) dt.innerText = totalDoneTasks;
    const pt = document.getElementById("stat-task-pending"); if (pt) pt.innerText = totalPendingTasks;

    // Filter lists, table and charts if activeCardFilter is set
    let cardFiltered = clients;
    if (activeCardFilter !== "all") {
        cardFiltered = clients.filter(c => {
            if (activeCardFilter === "done_projects") {
                return c.progress === 100 && c.status !== 'stopped' && c.status !== 'using';
            }
            if (activeCardFilter === "pending_projects") {
                return c.progress < 100 && c.status !== 'stopped' && c.status !== 'using';
            }
            if (activeCardFilter === "using_projects") {
                return c.status === 'using';
            }
            if (activeCardFilter === "stopped_projects") {
                return c.status === 'stopped';
            }
            if (activeCardFilter === "total_tasks") {
                return c.totalTasks > 0 && c.status !== 'stopped';
            }
            if (activeCardFilter === "done_tasks") {
                return c.doneTasks > 0 && c.status !== 'stopped';
            }
            if (activeCardFilter === "pending_tasks") {
                return c.pendingTasks > 0 && c.status !== 'stopped';
            }
            return true;
        });
    }

    // Compute chart data from filtered results
    let chartEmployeeData = {};
    cardFiltered.forEach(c => {
        const emp = c.employee || "Biriktirilmagan";
        if (!chartEmployeeData[emp]) {
            chartEmployeeData[emp] = { projDone: 0, projPending: 0, projUsing: 0, taskDone: 0, taskPending: 0 };
        }
        if (c.status === 'using') {
            chartEmployeeData[emp].projUsing++;
            chartEmployeeData[emp].taskDone += c.doneTasks;
            chartEmployeeData[emp].taskPending += c.pendingTasks;
        } else if (c.status !== 'stopped') {
            if (c.progress === 100) chartEmployeeData[emp].projDone++;
            else chartEmployeeData[emp].projPending++;
            chartEmployeeData[emp].taskDone += c.doneTasks;
            chartEmployeeData[emp].taskPending += c.pendingTasks;
        }
    });

    // Apply strict visualization filters to remove opposing colors in charts
    Object.keys(chartEmployeeData).forEach(emp => {
        if (activeCardFilter === "done_projects" || activeCardFilter === "done_tasks") {
            chartEmployeeData[emp].projPending = 0;
            chartEmployeeData[emp].projUsing = 0;
            chartEmployeeData[emp].taskPending = 0;
        } else if (activeCardFilter === "pending_projects" || activeCardFilter === "pending_tasks") {
            chartEmployeeData[emp].projDone = 0;
            chartEmployeeData[emp].projUsing = 0;
            chartEmployeeData[emp].taskDone = 0;
        } else if (activeCardFilter === "using_projects") {
            chartEmployeeData[emp].projDone = 0;
            chartEmployeeData[emp].projPending = 0;
        }
    });

    // Render Charts (filtered)
    renderCharts(chartEmployeeData);

    // Render Lists (Overdue, Upcoming, Completed)
    renderLists(cardFiltered);

    // Render Table
    renderTable(cardFiltered);
}

function renderCharts(employeeData) {
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
            y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
        },
        plugins: {
            legend: { labels: { color: '#f8fafc' } }
        },
        onClick: (e, activeElements, chart) => {
            if (activeElements.length > 0) {
                const dataIndex = activeElements[0].index;
                const empName = chart.data.labels[dataIndex];

                // Set the dropdown
                const empFilter = document.getElementById("filter-employee");
                if (empFilter) {
                    empFilter.value = empName;
                    applyFilters();

                    // Scroll to the table
                    document.querySelector('.projects-section').scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    };

    const empLabels = Object.keys(employeeData);

    // 1. Employee Projects
    const projDoneData = empLabels.map(l => employeeData[l].projDone);
    const projPendingData = empLabels.map(l => employeeData[l].projPending);
    const projUsingData = empLabels.map(l => employeeData[l].projUsing);

    if (empProjChartInst) empProjChartInst.destroy();
    const epCtx = document.getElementById('empProjectsChart');
    if (epCtx) {
        empProjChartInst = new Chart(epCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: empLabels,
                datasets: [
                    { label: 'Bitgan Loyihalar', data: projDoneData, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Qisman topshirilgan', data: projUsingData, backgroundColor: '#f59e0b', borderRadius: 4 },
                    { label: 'Jarayondagi', data: projPendingData, backgroundColor: '#3b82f6', borderRadius: 4 }
                ]
            },
            options: commonOptions
        });
    }

    // 2. Employee Tasks
    const taskDoneData = empLabels.map(l => employeeData[l].taskDone);
    const taskPendingData = empLabels.map(l => employeeData[l].taskPending);

    if (empTaskChartInst) empTaskChartInst.destroy();
    const etCtx = document.getElementById('empTasksChart');
    if (etCtx) {
        empTaskChartInst = new Chart(etCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: empLabels,
                datasets: [
                    { label: 'Tugatilgan (✅)', data: taskDoneData, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Jarayonda (☐)', data: taskPendingData, backgroundColor: '#3b82f6', borderRadius: 4 }
                ]
            },
            options: commonOptions
        });
    }
}

function formatShortDate(dateStr) {
    if (!dateStr || dateStr === '-' || dateStr.trim() === '') return '-';
    // Agar allaqachon DD.MM.YYYY bo'lsa
    if (dateStr.includes('.') && dateStr.length === 10) return dateStr;

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }
    return dateStr;
}

function parseDate(dateStr) {
    // DD.MM.YYYY
    if (!dateStr) return new Date(9999, 0, 1);
    const parts = dateStr.split('.');
    if (parts.length !== 3) return new Date(dateStr); // fallback
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function renderLists(clients) {
    const overdueList = document.getElementById("overdue-list");
    const upcomingList = document.getElementById("upcoming-list");
    const completedList = document.getElementById("completed-list");
    const stoppedList = document.getElementById("stopped-list");
    const usingList = document.getElementById("using-list");
    const inprogressList = document.getElementById("inprogress-list");

    if (overdueList) overdueList.innerHTML = "";
    if (upcomingList) upcomingList.innerHTML = "";
    if (completedList) completedList.innerHTML = "";
    if (stoppedList) stoppedList.innerHTML = "";
    if (usingList) usingList.innerHTML = "";
    if (inprogressList) inprogressList.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueArr = [];
    let upcomingArr = [];
    let completedArr = [];
    let stoppedArr = [];
    let usingArr = [];
    let inprogressArr = [];

    clients.forEach(c => {
        if (c.status === 'stopped') {
            stoppedArr.push(c);
        } else if (c.status === 'using') {
            usingArr.push(c);
        } else if (c.progress === 100) {
            completedArr.push(c);
        } else {
            inprogressArr.push(c); // barcha bitmaganlar

            if (c.deadline && c.deadline !== '-') {
                const dDate = parseDate(c.deadline);
                if (dDate < today) overdueArr.push(c);
                else upcomingArr.push(c);
            }
        }
    });

    // Strict visual filtering to match the intent of the clicked card
    if (typeof activeCardFilter !== 'undefined') {
        if (activeCardFilter === "done_projects" || activeCardFilter === "done_tasks") {
            overdueArr = [];
            upcomingArr = [];
            inprogressArr = [];
            usingArr = [];
        } else if (activeCardFilter === "pending_projects" || activeCardFilter === "pending_tasks") {
            completedArr = [];
            usingArr = [];
        } else if (activeCardFilter === "stopped_projects") {
            overdueArr = [];
            upcomingArr = [];
            completedArr = [];
            inprogressArr = [];
            usingArr = [];
        } else if (activeCardFilter === "using_projects") {
            overdueArr = [];
            upcomingArr = [];
            completedArr = [];
            inprogressArr = [];
            stoppedArr = [];
        }
    }

    // Sort by date
    overdueArr.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
    upcomingArr.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
    completedArr.sort((a, b) => parseDate(b.deadline) - parseDate(a.deadline));

    // Render Overdue
    overdueArr.forEach(d => {
        const li = document.createElement("li");
        li.className = `deadline-item danger`;
        let displayDate = formatShortDate(d.deadline);
        li.innerHTML = `
            <div class="deadline-info">
                <strong>${d.name}</strong>
                <span>👤 ${d.employee || '-'}</span>
                ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--red); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
            </div>
            <div class="deadline-date text-red">📅 ${displayDate}</div>
        `;
        li.style.cursor = "pointer";
        li.addEventListener('click', () => openProjectModal(d));
        overdueList.appendChild(li);
    });

    // Render Upcoming
    upcomingArr.forEach(d => {
        const li = document.createElement("li");
        li.className = `deadline-item warning`;
        let displayDate = formatShortDate(d.deadline);
        li.innerHTML = `
            <div class="deadline-info">
                <strong>${d.name}</strong>
                <span>👤 ${d.employee || '-'}</span>
                ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--yellow); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
            </div>
            <div class="deadline-date text-yellow">📅 ${displayDate}</div>
        `;
        li.style.cursor = "pointer";
        li.addEventListener('click', () => openProjectModal(d));
        upcomingList.appendChild(li);
    });

    // Render Completed
    completedArr.forEach(d => {
        const li = document.createElement("li");
        li.className = `deadline-item`;
        li.style.borderLeftColor = "var(--green)";
        li.style.background = "rgba(16, 185, 129, 0.05)";
        const delDate = parseDate(d.delivered);
        const deadDate = parseDate(d.deadline);

        let displayDate = d.delivered && d.delivered !== '-' ? formatShortDate(d.delivered) : formatShortDate(d.deadline);
        let dateLabel = d.delivered && d.delivered !== '-' ? 'Topshirildi' : '✅';
        let lateBadge = '';

        if (d.delivered && d.delivered !== '-') {
            const diffTime = delDate - deadDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                lateBadge = `<span style="font-size: 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 2px 5px; border-radius: 4px; margin-left: 5px; border: 1px solid #f59e0b;">🐌 Kechikkan</span>`;
            } else if (diffDays < 0) {
                lateBadge = `<span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 5px; border-radius: 4px; margin-left: 5px; border: 1px solid #10b981;">🚀 Vaqtidan oldin</span>`;
            } else {
                lateBadge = `<span style="font-size: 10px; background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 2px 5px; border-radius: 4px; margin-left: 5px; border: 1px solid #10b981;">🎯 Vaqtida</span>`;
            }
        }

        li.innerHTML = `
            <div class="deadline-info">
                <strong>${d.name}</strong>
                <span>👤 ${d.employee || '-'}</span>
                ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--green); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
            </div>
            <div class="deadline-date text-green" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                <span>${dateLabel}: ${displayDate !== '-' ? displayDate : 'Bitdi'}</span>
                ${lateBadge}
            </div>
        `;
        li.style.cursor = "pointer";
        li.addEventListener('click', () => openProjectModal(d));
        completedList.appendChild(li);
    });

    if (overdueArr.length === 0) overdueList.innerHTML = `<li style="color:#10b981; text-align:center; padding: 10px;">🎉 Muddati o'tgan ishlar yo'q!</li>`;
    if (upcomingArr.length === 0) upcomingList.innerHTML = `<li style="color:#94a3b8; text-align:center; padding: 10px;">Yaqin orada tugaydigan ishlar yo'q.</li>`;
    if (completedArr.length === 0) completedList.innerHTML = `<li style="color:#94a3b8; text-align:center; padding: 10px;">Hali bitgan ishlar yo'q.</li>`;

    // Render Stopped
    if (stoppedList) {
        stoppedArr.forEach(d => {
            const li = document.createElement("li");
            li.className = `deadline-item danger`;
            li.innerHTML = `
                <div class="deadline-info">
                    <strong>${d.name}</strong>
                    <span>👤 ${d.employee || '-'}</span>
                    ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--red); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
                </div>
                <div class="deadline-date text-red">🛑 To'xtatilgan</div>
            `;
            li.style.cursor = "pointer";
            li.addEventListener('click', () => openProjectModal(d));
            stoppedList.appendChild(li);
        });
        if (stoppedArr.length === 0) stoppedList.innerHTML = `<li style="color:#94a3b8; text-align:center; padding: 10px;">To'xtatilgan loyihalar yo'q.</li>`;
    }

    // Render Using (Qisman topshirilgan - Aktiv)
    if (usingList) {
        usingArr.forEach(d => {
            const li = document.createElement("li");
            li.className = `deadline-item using`;
            li.innerHTML = `
                <div class="deadline-info">
                    <strong>${d.name}</strong>
                    <span>👤 ${d.employee || '-'}</span>
                    ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--orange); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
                </div>
                <div class="deadline-date text-orange">🟡 Aktiv</div>
            `;
            li.style.cursor = "pointer";
            li.addEventListener('click', () => openProjectModal(d));
            usingList.appendChild(li);
        });
        if (usingArr.length === 0) usingList.innerHTML = `<li style="color:#94a3b8; text-align:center; padding: 10px;">Qisman topshirilgan loyihalar yo'q.</li>`;
    }

    // Render In Progress
    if (inprogressList) {
        // limit to 10
        inprogressArr.forEach(d => {
            const li = document.createElement("li");
            li.className = `deadline-item`;
            let displayDate = formatShortDate(d.deadline);
            li.innerHTML = `
                <div class="deadline-info">
                    <strong>${d.name}</strong>
                    <span>👤 ${d.employee || '-'}</span>
                    ${(d.comment && d.comment !== '-') ? `<div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; border-left: 2px solid var(--primary); padding-left: 6px; opacity: 0.8;">${d.comment}</div>` : ''}
                </div>
                <div class="deadline-date text-primary">⏳ ${displayDate}</div>
            `;
            li.style.cursor = "pointer";
            li.addEventListener('click', () => openProjectModal(d));
            inprogressList.appendChild(li);
        });
        if (inprogressArr.length === 0) inprogressList.innerHTML = `<li style="color:#94a3b8; text-align:center; padding: 10px;">Jarayondagi ishlar yo'q.</li>`;
    }
}

function renderTable(clients) {
    const tbody = document.querySelector("#projects-table tbody");
    tbody.innerHTML = "";

    clients.forEach(c => {
        const tr = document.createElement("tr");
        const progColor = c.progress === 100 ? 'var(--green)' : 'var(--primary)';
        let statusHtml = '';
        let deliveredHtml = '<span>-</span>';

        if (c.status === 'stopped') {
            statusHtml = `<span style="background: rgba(239, 68, 68, 0.15); color: var(--red); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--red); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">🛑 To'xtatilgan</span>`;
        } else if (c.status === 'using') {
            statusHtml = `<span style="background: rgba(245, 158, 11, 0.15); color: var(--orange); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--orange); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">🟡 Qisman topshirilgan</span>`;
        } else if (c.progress === 100) {
            statusHtml = `<span style="background: rgba(16, 185, 129, 0.15); color: var(--green); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--green); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">✅ Tugatilgan</span>`;

            if (c.delivered && c.delivered !== '-') {
                const diffTime = parseDate(c.delivered) - parseDate(c.deadline);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 0) {
                    deliveredHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid #f59e0b; display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">🐌 Kechikkan</span>
                            <span style="font-size: 10px; color: #f59e0b; font-weight: 500;">${formatShortDate(c.delivered)}</span>
                        </div>
                    `;
                } else if (diffDays < 0) {
                    deliveredHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="background: rgba(16, 185, 129, 0.15); color: var(--green); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--green); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">🚀 V.Oldin</span>
                            <span style="font-size: 10px; color: var(--green); font-weight: 500;">${formatShortDate(c.delivered)}</span>
                        </div>
                    `;
                } else {
                    deliveredHtml = `
                        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
                            <span style="background: rgba(16, 185, 129, 0.15); color: var(--green); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--green); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">🎯 Vaqtida</span>
                            <span style="font-size: 10px; color: var(--green); font-weight: 500;">${formatShortDate(c.delivered)}</span>
                        </div>
                    `;
                }
            }
        } else {
            statusHtml = `<span style="background: rgba(59, 130, 246, 0.15); color: var(--primary); padding: 4px 8px; border-radius: 6px; font-size: 11px; border: 1px solid var(--primary); display: inline-flex; align-items: center; justify-content: center; min-width: 90px;">⏳ Jarayonda</span>`;
        }

        tr.innerHTML = `
            <td style="font-weight: 600;">${c.name}</td>
            <td style="font-size: 13px; color: var(--text-secondary);">👤 ${c.employee || '-'}</td>
            <td style="font-size: 12px;">${formatShortDate(c.start)}</td>
            <td style="font-size: 12px; font-weight: 500;">${formatShortDate(c.deadline)}</td>
            <td style="text-align: center;">${deliveredHtml}</td>
            <td style="text-align: center;">${statusHtml}</td>
            <td style="font-size: 12px; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${c.comment || ''}">${c.comment || '-'}</td>
            <td>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${c.progress}%; background: ${progColor}"></div>
                </div>
                <span class="progress-text">${c.progress}%</span>
            </td>
        `;

        tr.addEventListener('click', () => openProjectModal(c));

        tbody.appendChild(tr);
    });
}

function openProjectModal(c) {
    document.getElementById('modal-title').innerText = c.name;
    document.getElementById('modal-emp').innerText = c.employee || '-';
    document.getElementById('modal-start').innerText = formatShortDate(c.start);
    document.getElementById('modal-deadline').innerText = formatShortDate(c.deadline);

    // Agar bitgan bo'lsa va topshirilgan vaqti bo'lsa, shuni ko'rsatamiz
    if (c.progress === 100 && c.delivered && c.delivered !== '-') {
        document.getElementById('modal-deadline').innerHTML = `<s>${formatShortDate(c.deadline)}</s> <br><span style="color:var(--green)">✅ Topshirildi: ${formatShortDate(c.delivered)}</span>`;
    }

    document.getElementById('modal-comment').innerText = c.comment && c.comment !== '-' ? c.comment : '-';

    let statusHtml = '';
    if (c.status === 'stopped') {
        statusHtml = `<span style="background: rgba(239, 68, 68, 0.2); color: var(--red); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--red);">🛑 To'xtatilgan</span>`;
    } else if (c.status === 'using') {
        statusHtml = `<span style="background: rgba(245, 158, 11, 0.2); color: var(--orange); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--orange);">🟡 Qisman topshirilgan - Aktiv</span>`;
    } else if (c.progress === 100) {
        if (c.delivered && c.delivered !== '-') {
            const diffTime = parseDate(c.delivered) - parseDate(c.deadline);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                statusHtml = `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid #f59e0b;">🐌 ${diffDays} kun kechikkan</span>`;
            } else if (diffDays < 0) {
                statusHtml = `<span style="background: rgba(16, 185, 129, 0.2); color: var(--green); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--green);">🚀 ${Math.abs(diffDays)} kun oldin topshirildi</span>`;
            } else {
                statusHtml = `<span style="background: rgba(16, 185, 129, 0.2); color: var(--green); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--green);">🎯 Vaqtida topshirildi</span>`;
            }
        } else {
            statusHtml = `<span style="background: rgba(16, 185, 129, 0.2); color: var(--green); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--green);">✅ Tugatilgan</span>`;
        }
    } else {
        statusHtml = `<span style="background: rgba(59, 130, 246, 0.2); color: var(--primary); padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: 500; border: 1px solid var(--primary);">⏳ Jarayonda</span>`;
    }

    const statusContainer = document.getElementById('modal-status-container');
    if (statusContainer) {
        statusContainer.innerHTML = statusHtml;
    }

    document.getElementById('modal-progress').style.width = c.progress + '%';
    document.getElementById('modal-progress').style.background = c.progress === 100 ? 'var(--green)' : 'var(--primary)';
    document.getElementById('modal-progress-text').innerText = c.progress + '%';

    const tasksList = document.getElementById('modal-tasks-list');
    tasksList.innerHTML = '';

    if (c.tasks) {
        const lines = c.tasks.split('\n');
        lines.forEach(l => {
            const line = l.trim();
            if (!line) return;
            const li = document.createElement('li');

            let statusIcon = '';
            let isDone = false;
            let rawText = line;

            if (line.startsWith('✅') || line.startsWith('☑')) {
                statusIcon = '✅';
                isDone = true;
                rawText = line.substring(1).trim();
                li.className = 'modal-task-item done';
            } else if (line.startsWith('☐')) {
                statusIcon = '⏳';
                rawText = line.substring(1).trim();
                li.className = 'modal-task-item pending';
            } else {
                li.className = 'modal-task-item';
            }

            // Extract comment
            let taskName = rawText;
            let taskComment = '';
            const match = rawText.match(/^(.+?)\s*[—-]\s*(.+)$/);
            if (match) {
                taskName = match[1].trim();
                taskComment = match[2].trim();
            }

            let innerHtml = `<div style="display: flex; align-items: center;">`;
            if (statusIcon) innerHtml += `<span style="font-size:16px; margin-right:8px;">${statusIcon}</span>`;
            innerHtml += `<span>${taskName}</span></div>`;

            if (taskComment) {
                const color = isDone ? 'var(--green)' : 'var(--primary)';
                innerHtml += `<div style="font-size: 11px; color: var(--text-secondary); margin-left: ${statusIcon ? '28px' : '0'}; margin-top: 6px; padding-left: 8px; border-left: 2px solid ${color}; opacity: 0.8;">${taskComment}</div>`;
            }

            li.innerHTML = innerHtml;
            tasksList.appendChild(li);
        });
    } else {
        tasksList.innerHTML = '<li style="color:var(--text-secondary); padding: 10px;">Vazifalar topilmadi.</li>';
    }

    document.getElementById('projectModal').classList.add('active');
}

function setCardFilter(filterName) {
    if (activeCardFilter === filterName) {
        activeCardFilter = "all";
    } else {
        activeCardFilter = filterName;
    }
    updateCardStyles();
    applyFilters();
}

function updateCardStyles() {
    const cards = {
        "all": { id: "card-proj-total", cls: "active-all" },
        "done_projects": { id: "card-proj-done", cls: "active-green" },
        "pending_projects": { id: "card-proj-pending", cls: "active-yellow" },
        "using_projects": { id: "card-proj-using", cls: "active-orange" },
        "stopped_projects": { id: "card-proj-stopped", cls: "active-red" },
        "total_tasks": { id: "card-task-total", cls: "active-blue" },
        "done_tasks": { id: "card-task-done", cls: "active-green" },
        "pending_tasks": { id: "card-task-pending", cls: "active-yellow" }
    };

    Object.values(cards).forEach(c => {
        const el = document.getElementById(c.id);
        if (el) {
            el.classList.remove("active-all", "active-green", "active-yellow", "active-red", "active-blue", "active-orange");
        }
    });

    if (activeCardFilter && cards[activeCardFilter]) {
        const activeCard = cards[activeCardFilter];
        const el = document.getElementById(activeCard.id);
        if (el) {
            el.classList.add(activeCard.cls);
        }
    }
}
