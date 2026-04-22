/* ============================================
   CTU Room Management System - Admin Monitoring
   ============================================ */

/**
 * Render monitoring table
 */
function renderMonitoringTable() {
    const tbody = document.getElementById('monitoringBody');
    const table = document.getElementById('monitoringTable');
    const noMsg = document.getElementById('noScheduleMsg');

    if (!tbody) return;

    // Get today's date to filter only today's schedules
    const today = new Date().toISOString().split('T')[0];

    // Get register type rooms with schedules (not schedule type duplicates)
    // Filter to include direct room schedule fields as fallback for monitoring
    const scheduledRooms = allRooms.filter(r => {
        if (r.type !== 'register') return false;
        if (r.schedules && r.schedules.length > 0) {
            return r.schedules.some(s => s.date === today);
        }
        return r.date === today && r.startTime && r.endTime;
    });

    scheduledRooms.sort((a, b) => {
        const aSchedule = a.schedules && a.schedules.length > 0
            ? a.schedules.find(s => s.date === today)
            : { date: a.date, startTime: a.startTime };
        const bSchedule = b.schedules && b.schedules.length > 0
            ? b.schedules.find(s => s.date === today)
            : { date: b.date, startTime: b.startTime };

        if (aSchedule.date !== bSchedule.date) {
            return new Date(aSchedule.date) - new Date(bSchedule.date);
        }
        return timeToMinutes(aSchedule.startTime) - timeToMinutes(bSchedule.startTime);
    });

    if (scheduledRooms.length === 0) {
        tbody.innerHTML = '';
        if (noMsg) noMsg.style.display = 'block';
        if (table) table.style.display = 'none';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';
    if (table) table.style.display = 'table';

    // Expand rooms with multiple scheduled times
    let allRows = [];
    scheduledRooms.forEach(room => {
        const todaySchedules = room.schedules && room.schedules.length > 0
            ? room.schedules.filter(s => s.date === today)
            : [];

        const displaySchedules = todaySchedules.length > 0
            ? todaySchedules
            : (room.date === today && room.startTime && room.endTime ? [{
                instructor: room.instructor || 'Anonymous',
                date: room.date,
                startTime: room.startTime,
                endTime: room.endTime,
                queueStatus: 'active'
            }] : []);

        displaySchedules.forEach((schedule, index) => {
            allRows.push({
                room: room,
                schedule: schedule,
                isFirst: index === 0,
                isLast: index === displaySchedules.length - 1,
                queuePosition: index + 1,
                totalInQueue: displaySchedules.length
            });
        });
    });

    tbody.innerHTML = allRows.map((row, idx) => {
        const statusClass = row.room.status.toLowerCase();
        const formattedDate = formatDate(row.schedule.date);
        const duration = calculateDuration(row.schedule.startTime, row.schedule.endTime);
        const queueIndicator = row.totalInQueue > 1 ?
            `<span style="color: #c0392b; font-weight: bold;">[${row.queuePosition}/${row.totalInQueue}]</span>` : '';

        return `
        <tr style="${row.isFirst ? '' : 'background: #f9f9f9;'}" data-date="${row.schedule.date}" data-status="${row.room.status}" data-instructor="${row.schedule.instructor.toLowerCase()}" data-category="${row.room.category.toLowerCase()}" data-room="${row.room.id}">
            <td><strong>${row.room.id}</strong></td>
            <td>${queueIndicator} ${row.schedule.instructor}</td>
            <td>${row.room.category}</td>
            <td class="monitor-date">${formattedDate}</td>
            <td class="monitor-time">${formatTime12(row.schedule.startTime)}</td>
            <td class="monitor-time">${formatTime12(row.schedule.endTime)}</td>
            <td><span class="duration-badge">${duration}</span></td>
            <td>
                <span class="monitor-status ${statusClass}">${row.room.status}</span>
            </td>
        </tr>`;
    }).join('');

    updateMonitoringStats();
}

/**
 * Filter monitoring table
 */
function filterMonitoring() {
    const searchInput = document.getElementById('monitorSearch');
    const dateInput = document.getElementById('monitorDateFilter');
    const statusInput = document.getElementById('monitorStatusFilter');

    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const dateFilter = dateInput ? dateInput.value : '';
    const statusFilter = statusInput ? statusInput.value : 'all';

    const rows = document.querySelectorAll('#monitoringBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const rowDate = row.dataset.date || '';
        const rowStatus = row.dataset.status || '';
        const rowInstructor = row.dataset.instructor || '';
        const rowCategory = row.dataset.category || '';
        const rowRoom = row.dataset.room || '';

        // Smart search: if search is a number, use exact room match. If text, use contains match
        let matchSearch = false;
        if (/^\d+$/.test(search)) {
            // Numeric search - exact room number match only
            matchSearch = rowRoom === search;
        } else if (search) {
            // Text search - match instructor or category only
            matchSearch = rowInstructor.includes(search) || rowCategory.includes(search);
        } else {
            // Empty search - show all
            matchSearch = true;
        }

        const matchDate = !dateFilter || rowDate === dateFilter;
        const matchStatus = statusFilter === 'all' || rowStatus === statusFilter;

        if (matchSearch && matchDate && matchStatus) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    const noMsg = document.getElementById('noScheduleMsg');
    const table = document.getElementById('monitoringTable');

    if (noMsg) noMsg.style.display = visibleCount === 0 ? 'block' : 'none';
    if (table) table.style.display = visibleCount === 0 ? 'none' : 'table';
}

/**
 * Update monitoring statistics
 */
function updateMonitoringStats() {
    const totalEl = document.getElementById('totalScheduled');
    const todayEl = document.getElementById('activeToday');

    if (!totalEl || !todayEl) return;

    // Count rooms with schedules, including direct dashboard schedule fields
    const scheduledRooms = allRooms.filter(r =>
        r.type === 'register' &&
        ((r.schedules && r.schedules.length > 0) || (r.date && r.startTime && r.endTime))
    );
    totalEl.innerText = scheduledRooms.length;

    const today = new Date().toISOString().split('T')[0];
    const activeToday = allRooms.filter(r =>
        r.type === 'register' &&
        (
            (r.schedules && r.schedules.some(s => s.date === today)) ||
            (r.date === today && r.startTime && r.endTime)
        )
    ).length;
    todayEl.innerText = activeToday;
}

/**
 * View room schedule queue modal
 * @param {number} roomId - Room ID
 * @param {string} date - Date in YYYY-MM-DD format
 */
function viewRoomQueue(roomId, date) {
    const room = allRooms.find(r => r.type === 'register' && r.id === roomId);
    if (!room) return;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'roomQueueModal';
    modal.style.display = 'flex';
    modal.onclick = function (event) {
        if (event.target === modal) {
            closeRoomQueueModal();
        }
    };

    const schedules = (room.schedules || []).filter(s => s.date === date);
    const formattedDate = formatDate(date);

    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3>📅 Room ${room.id} ${room.category} - Schedule Queue</h3>
                <button class="btn-close" onclick="closeRoomQueueModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px; padding: 12px; background: #f0f0f0; border-radius: 8px;">
                    <p style="margin: 0; font-weight: 600;">Date: ${formattedDate}</p>
                    <p style="margin: 8px 0 0 0; color: #666;">Total Scheduled: ${schedules.length}</p>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${schedules.length === 0 ?
            '<p style="color: #999; text-align: center; padding: 20px;">No schedules found</p>' :
            schedules.map((schedule, idx) => `
                            <div style="padding: 12px; background: ${idx === 0 ? '#e8f5e9' : '#f5f5f5'}; border-radius: 8px; border-left: 4px solid ${idx === 0 ? '#27ae60' : '#bdc3c7'};">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <span style="font-weight: 600; font-size: 14px;">
                                        ${idx === 0 ? '🟢 CURRENT' : `#${idx}`} - ${schedule.instructor}
                                    </span>
                                    <span style="background: #c0392b; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                                        ${schedule.startTime} - ${schedule.endTime}
                                    </span>
                                </div>
                                <div style="font-size: 12px; color: #666;">
                                    <p style="margin: 4px 0;">Purpose: ${schedule.purpose || 'Schedule'}</p>
                                    <p style="margin: 4px 0;">Status: ${schedule.requestedStatus || 'Scheduled'}</p>
                                </div>
                            </div>
                        `).join('')
        }
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeRoomQueueModal()">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Close room queue modal
 */
function closeRoomQueueModal() {
    const modal = document.getElementById('roomQueueModal');
    if (modal) {
        modal.remove();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderMonitoringTable,
        filterMonitoring,
        updateMonitoringStats,
        viewRoomQueue,
        closeRoomQueueModal
    };
}
