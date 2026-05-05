const API_URL = "https://script.google.com/macros/s/AKfycbxmBPOJ26kN6ft34Rc22o2wqOEWK-p6Y8uSyvvM267Ya-tO2KpttvhM9-2UJEzHAlF1/exec";
const BONUS_API_URL = "https://script.google.com/macros/s/AKfycbxmBPOJ26kN6ft34Rc22o2wqOEWK-p6Y8uSyvvM267Ya-tO2KpttvhM9-2UJEzHAlF1/exec"; // Hozircha ikkalasiga ham bitta linkni qo'yib turaman, agar ikkinchisi boshqacha bo'lsa yangilaymiz.
let allClients = [];
let allBonusClients = [];

document.addEventListener("DOMContentLoaded", () => {
    fetchData();
    document.getElementById("refresh-btn").addEventListener("click", fetchData);
    
    // Filter listeners
    const searchInput = document.getElementById("search-input");
    const empFilter = document.getElementById("filter-employee");
    const startFilter = document.getElementById("filter-start");
    const deadlineFilter = document.getElementById("filter-deadline");
    
    if(searchInput) searchInput.addEventListener("input", applyFilters);
    if(empFilter) empFilter.addEventListener("change", applyFilters);
    if(startFilter) startFilter.addEventListener("change", applyFilters);
    if(deadlineFilter) deadlineFilter.addEventListener("change", applyFilters);

    // Modal Close logic
    const closeBtn = document.getElementById('closeModal');
    const modal = document.getElementById('projectModal');
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    if (modal) {
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.remove('active');
        });
    }

    // Tab Switching Logic
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');

            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update active tab content
            tabContents.forEach(tab => tab.classList.remove('active'));
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Bonus Filter Listeners
    const bonusSearch = document.getElementById("bonus-search-masul");
    const bonusStatusFilter = document.getElementById("bonus-filter-status");
    if(bonusSearch) bonusSearch.addEventListener("input", applyBonusFilters);
    if(bonusStatusFilter) bonusStatusFilter.addEventListener("change", applyBonusFilters);
});

async function fetchData() {
    const btn = document.getElementById("refresh-btn");
    btn.innerHTML = "⏳ Yangilanmoqda...";
    btn.disabled = true;

    try {
        // Fetch Project Data
        const projResponse = await fetch(API_URL);
        const projData = await projResponse.json();
        processData(projData.clients || []);
        
        // Fetch Bonus Data
        const bonusResponse = await fetch(BONUS_API_URL);
        const bonusData = await bonusResponse.json();
        allBonusClients = bonusData.data || bonusData.clients || bonusData;
        renderBonusTable(allBonusClients);
        
        const now = new Date();
        document.getElementById("last-updated").innerText = `Oxirgi yangilanish: ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    } catch (error) {
        console.error("Xatolik tafsiloti:", error);
        alert("Xatolik yuz berdi! Google Sheets API bilan bog'lanib bo'lmadi. Skript 'Anyone' ruxsati bilan deploy qilinganini tekshiring.");
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
            fDate.setHours(0,0,0,0);
            const cDate = parseDate(c.start);
            if (cDate.getFullYear() === 9999 || cDate < fDate) matchStart = false;
        }

        if (deadlineFilter) {
            const fDate = new Date(deadlineFilter);
            fDate.setHours(23,59,59,999);
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

    clients.forEach(c => {
        if (c.status === 'stopped') stoppedProjects++;
        else if (c.progress === 100) doneProjects++;
        else pendingProjects++;

        totalTasks += c.totalTasks;
        totalDoneTasks += c.doneTasks;
        totalPendingTasks += c.pendingTasks;

        const emp = c.employee || "Biriktirilmagan";
        if (!employeeData[emp]) {
            employeeData[emp] = { projDone: 0, projPending: 0, taskDone: 0, taskPending: 0 };
        }
        
        if (c.status !== 'stopped') {
            if (c.progress === 100) employeeData[emp].projDone++;
            else employeeData[emp].projPending++;
            employeeData[emp].taskDone += c.doneTasks;
            employeeData[emp].taskPending += c.pendingTasks;
        }
    });

    // Update Top Stats
    const tp = document.getElementById("stat-proj-total"); if(tp) tp.innerText = totalProjects;
    const dp = document.getElementById("stat-proj-done"); if(dp) dp.innerText = doneProjects;
    const pp = document.getElementById("stat-proj-pending"); if(pp) pp.innerText = pendingProjects;
    
    const tt = document.getElementById("stat-task-total"); if(tt) tt.innerText = totalTasks;
    const dt = document.getElementById("stat-task-done"); if(dt) dt.innerText = totalDoneTasks;
    const pt = document.getElementById("stat-task-pending"); if(pt) pt.innerText = totalPendingTasks;

    // Render Charts
    renderCharts(employeeData);

    // Render Lists (Overdue, Upcoming, Completed)
    renderLists(clients);

    // Render Table
    renderTable(clients);
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

    if (empProjChartInst) empProjChartInst.destroy();
    const epCtx = document.getElementById('empProjectsChart');
    if (epCtx) {
        empProjChartInst = new Chart(epCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: empLabels,
                datasets: [
                    { label: 'Bitgan Loyihalar', data: projDoneData, backgroundColor: '#10b981', borderRadius: 4 },
                    { label: 'Jarayondagi', data: projPendingData, backgroundColor: '#f59e0b', borderRadius: 4 }
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
    if(!dateStr) return new Date(9999, 0, 1);
    const parts = dateStr.split('.');
    if(parts.length !== 3) return new Date(dateStr); // fallback
    return new Date(parts[2], parts[1] - 1, parts[0]);
}

function renderLists(clients) {
    const overdueList = document.getElementById("overdue-list");
    const upcomingList = document.getElementById("upcoming-list");
    const completedList = document.getElementById("completed-list");
    const stoppedList = document.getElementById("stopped-list");
    const inprogressList = document.getElementById("inprogress-list");
    
    if (overdueList) overdueList.innerHTML = "";
    if (upcomingList) upcomingList.innerHTML = "";
    if (completedList) completedList.innerHTML = "";
    if (stoppedList) stoppedList.innerHTML = "";
    if (inprogressList) inprogressList.innerHTML = "";

    const today = new Date();
    today.setHours(0,0,0,0);
    
    let overdueArr = [];
    let upcomingArr = [];
    let completedArr = [];
    let stoppedArr = [];
    let inprogressArr = [];

    clients.forEach(c => {
        if (c.status === 'stopped') {
            stoppedArr.push(c);
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

    // Sort by date
    overdueArr.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
    upcomingArr.sort((a, b) => parseDate(a.deadline) - parseDate(b.deadline));
    completedArr.sort((a, b) => parseDate(b.deadline) - parseDate(a.deadline));

    // Render Overdue
    overdueArr.slice(0, 5).forEach(d => {
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
    upcomingArr.slice(0, 5).forEach(d => {
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
    completedArr.slice(0, 5).forEach(d => {
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

    // Render In Progress
    if (inprogressList) {
        // limit to 5 to avoid long list or display all if preferred, let's display up to 10
        inprogressArr.slice(0, 10).forEach(d => {
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
let bonusStatusChartInst = null;
let bonusPerformanceChartInst = null;

function renderBonusTable(bonuses) {
    const tbody = document.querySelector("#bonus-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    let totalSum = 0;
    let confirmedBonus = 0;
    let pendingBonus = 0;
    let employeeBonuses = {};

    bonuses.forEach(b => {
        const tr = document.createElement("tr");
        
        let statusClass = "text-primary";
        if (b.holat === "Tasdiqlandi") statusClass = "text-green";
        if (b.holat === "Bekor") statusClass = "text-red";
        if (b.holat === "Kutilmoqda") statusClass = "text-yellow";

        const bonusValNum = typeof b.bonus === 'number' ? b.bonus : 0;
        const summaValNum = typeof b.summa === 'number' ? b.summa : 0;
        
        totalSum += summaValNum;
        if (b.holat === "Tasdiqlandi") {
            confirmedBonus += bonusValNum;
        } else {
            pendingBonus += bonusValNum;
        }

        // Employee stats for chart
        if (b.masul) {
            if (!employeeBonuses[b.masul]) employeeBonuses[b.masul] = 0;
            employeeBonuses[b.masul] += bonusValNum;
        }

        const bonusVal = bonusValNum.toLocaleString() + " so'm";
        const summaVal = summaValNum.toLocaleString() + " so'm";

        tr.innerHTML = `
            <td>${b.no || '-'}</td>
            <td style="font-weight: 600;">${b.mijoz}</td>
            <td style="font-size: 13px; color: var(--text-secondary);">👤 ${b.masul}</td>
            <td style="font-size: 12px;">${formatShortDate(b.boshlanish)}</td>
            <td style="font-size: 12px;">${formatShortDate(b.tugash)}</td>
            <td style="text-align: center; font-weight: 500;">${b.qolgan} k.</td>
            <td>
                <div style="font-size: 10px; margin-bottom: 4px; color: var(--text-secondary);">${b.progress}</div>
                <div class="progress-bar-bg" style="height: 6px;">
                    <div class="progress-bar-fill" style="width: ${parseInt(b.progress) || 0}%; background: var(--primary)"></div>
                </div>
            </td>
            <td style="font-weight: 600;">${summaVal}</td>
            <td class="${statusClass}" style="font-weight: 600; font-size: 13px;">${b.holat}</td>
            <td class="text-green" style="font-weight: 700;">${bonusVal}</td>
        `;
        tbody.appendChild(tr);
    });

    // Update Stats
    document.getElementById("bonus-stat-total-sum").innerText = totalSum.toLocaleString() + " so'm";
    document.getElementById("bonus-stat-confirmed").innerText = confirmedBonus.toLocaleString() + " so'm";
    document.getElementById("bonus-stat-pending").innerText = (totalSum - confirmedBonus).toLocaleString() + " so'm";
    
    // Update Central Display
    const totalDisplay = document.getElementById("total-bonus-display");
    if(totalDisplay) totalDisplay.innerText = confirmedBonus.toLocaleString();

    // Render WOW Charts
    renderWowCharts(confirmedBonus, pendingBonus, employeeBonuses);

    // Render Rankings
    renderRankings(employeeBonuses);
}

function applyBonusFilters() {
    const searchVal = document.getElementById("bonus-search-masul").value.toLowerCase();
    const statusVal = document.getElementById("bonus-filter-status").value;

    const filtered = allBonusClients.filter(b => {
        const matchesName = (b.masul || "").toLowerCase().includes(searchVal);
        const matchesStatus = statusVal === "all" || b.holat === statusVal;
        return matchesName && matchesStatus;
    });

    renderBonusTable(filtered);
}

function renderRankings(empBonuses) {
    const container = document.getElementById("bonus-ranking-container");
    if (!container) return;
    container.innerHTML = "";

    const sortedEmps = Object.entries(empBonuses)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const medals = ["🥇", "🥈", "🥉"];

    sortedEmps.forEach(([name, bonus], index) => {
        const card = document.createElement("div");
        card.className = `ranking-card rank-${index + 1}`;
        card.innerHTML = `
            <div class="rank-badge">${medals[index]}</div>
            <div class="rank-info">
                <span class="rank-name">${name}</span>
                <span class="rank-bonus text-green">${bonus.toLocaleString()} so'm</span>
            </div>
        `;
        container.appendChild(card);
    });

    if (sortedEmps.length === 0) {
        container.innerHTML = "<div style='color: var(--text-secondary);'>Ma'lumotlar yetarli emas.</div>";
    }
}

function renderWowCharts(confirmed, pending, empData) {
    // 1. Status Doughnut Chart
    const statusCtx = document.getElementById('bonusStatusChart');
    if (statusCtx) {
        if (bonusStatusChartInst) bonusStatusChartInst.destroy();
        bonusStatusChartInst = new Chart(statusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Tasdiqlangan', 'Kutilmoqda'],
                datasets: [{
                    data: [confirmed, pending],
                    backgroundColor: ['#10b981', 'rgba(245, 158, 11, 0.2)'],
                    borderColor: ['#10b981', '#f59e0b'],
                    borderWidth: 2,
                    hoverOffset: 10,
                    cutout: '75%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                animation: { animateRotate: true, duration: 2000 }
            }
        });
    }

    // 2. Performance Gradient Bar Chart
    const perfCtx = document.getElementById('bonusPerformanceChart');
    if (perfCtx) {
        const ctx = perfCtx.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 400, 0);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.8)');

        if (bonusPerformanceChartInst) bonusPerformanceChartInst.destroy();
        
        const labels = Object.keys(empData);
        const values = Object.values(empData);

        bonusPerformanceChartInst = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bonus yig\'imi (so\'m)',
                    data: values,
                    backgroundColor: gradient,
                    borderRadius: 10,
                    borderSkipped: false,
                    barThickness: 25
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: { 
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8', font: { family: 'Outfit' }, callback: v => v.toLocaleString() }
                    },
                    y: { 
                        grid: { display: false },
                        ticks: { color: 'white', font: { family: 'Outfit', weight: '500' } }
                    }
                }
            }
        });
    }
}

