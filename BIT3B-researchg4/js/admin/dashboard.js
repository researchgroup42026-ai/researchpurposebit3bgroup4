/* ============================================
   CTU Room Management System - Admin Dashboard
   ============================================ */

// Current admin tab
let currentTab = 'dashboard';

/**
 * Initialize admin view
 */
function initAdminView() {
    renderTable();
    updateStatusCounts();
    updateDatabaseStats();
}

/**
 * Switch admin tab
 * @param {string} tab - Tab name ('dashboard', 'monitoring', 'requests', 'database')
 */
function switchTab(tab) {
    currentTab = tab;

    // Update active nav tab
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');

    // Get elements
    const sidebars = {
        dashboard: document.getElementById('dashboardSidebar'),
        monitoring: document.getElementById('monitoringSidebar'),
        analytics: document.getElementById('analyticsSidebar'),
        database: document.getElementById('databaseSidebar')
    };

    const views = {
        dashboard: document.getElementById('dashboardView'),
        monitoring: document.getElementById('monitoringView'),
        analytics: document.getElementById('analyticsView'),
        database: document.getElementById('databaseView')
    };

    // Hide all sidebars and views
    Object.values(sidebars).forEach(el => {
        if (el) el.style.display = 'none';
    });
    Object.values(views).forEach(el => {
        if (el) el.style.display = 'none';
    });

    // Show selected
    if (views[tab]) {
        views[tab].style.display = 'block';
    }
    if (sidebars[tab]) {
        sidebars[tab].style.display = 'flex';
        sidebars[tab].style.flexDirection = 'column';
    }

    // Render appropriate content
    if (tab === 'dashboard') {
        renderTable();
    } else if (tab === 'monitoring') {
        renderMonitoringTable();
    } else if (tab === 'analytics') {
        renderAnalyticsReport();
    } else if (tab === 'database') {
        renderDatabaseTable();
    }
}

/**
 * Toggle time input visibility for schedule editing
 * @param {HTMLElement} element - The formatted time display element
 */
function toggleTimeInputs(element) {
    const box = element.closest('.schedule-time-display-box');
    if (!box) return;
    
    const formatted = box.querySelector('.schedule-time-formatted');
    const timeRange = box.querySelector('.schedule-time-range');
    
    if (timeRange.style.display === 'none') {
        formatted.style.display = 'none';
        timeRange.style.display = 'flex';
        timeRange.querySelector('input[type="time"]').focus();
    }
}

/**
 * Update the formatted time display after editing
 * @param {HTMLElement} inputElement - The time input that changed
 */
function updateTimeDisplay(inputElement) {
    const timeRange = inputElement.closest('.schedule-time-range');
    const box = timeRange.closest('.schedule-time-display-box');
    const formatted = box.querySelector('.schedule-time-formatted');
    
    const startInput = timeRange.querySelector('.sched-time-start');
    const endInput = timeRange.querySelector('.sched-time-end');
    
    if (startInput.value && endInput.value) {
        formatted.textContent = `${formatTime12(startInput.value)} - ${formatTime12(endInput.value)}`;
        formatted.style.display = 'block';
        timeRange.style.display = 'none';
    }
}

/**
 * Update status counts in sidebar
 */
function updateStatusCounts() {
    const counts = { Available: 0, Locked: 0, Meeting: 0, Maintenance: 0 };

    allRooms.forEach(room => {
        if (counts.hasOwnProperty(room.status)) {
            counts[room.status]++;
        }
    });

    const countAll = document.getElementById('countAll');
    const countAvailable = document.getElementById('countAvailable');
    const countLocked = document.getElementById('countLocked');
    const countMeeting = document.getElementById('countMeeting');
    const countMaintenance = document.getElementById('countMaintenance');

    if (countAll) countAll.innerText = allRooms.length;
    if (countAvailable) countAvailable.innerText = counts.Available;
    if (countLocked) countLocked.innerText = counts.Locked;
    if (countMeeting) countMeeting.innerText = counts.Meeting;
    if (countMaintenance) countMaintenance.innerText = counts.Maintenance;
}

/**
 * Filter table by status
 * @param {string} status - Status to filter by
 */
function filterByStatus(status) {
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach((row, i) => {
        const room = allRooms[i];
        if (!room) {
            row.style.display = "none";
            return;
        }

        const roomStatus = room.status;
        if (status === 'all' || roomStatus === status) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }
    });

    const searchBar = document.getElementById('searchBar');
    if (searchBar) searchBar.value = (status === 'all' ? "" : status);
}

/**
 * Render main dashboard table
 */
function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    if (allRooms.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #999;">No rooms found. Add a room using the form above.</td></tr>';
        updateStatusCounts();
        return;
    }

    tbody.innerHTML = allRooms.map((room, index) => {
        // Skip 'schedule' type rooms - they're duplicates, only show 'register' type
        if (room.type === 'schedule') {
            return '';
        }

        let statusClass = room.status === "Available" ? "bg-available" :
            room.status === "Meeting" ? "bg-meeting" :
                room.status === "Maintenance" ? "bg-maintenance" : "bg-locked";

        const hasSchedules = room.schedules && room.schedules.length > 0;
        const instructorName = hasSchedules ? room.schedules[0].instructor : room.instructor;
        const capitalizedName = instructorName ? instructorName.charAt(0).toUpperCase() + instructorName.slice(1) : '';
        const displayDate = hasSchedules ? room.schedules[0].date : room.date;
        const displayStart = hasSchedules ? room.schedules[0].startTime : room.startTime;
        const displayEnd = hasSchedules ? room.schedules[0].endTime : room.endTime;
        const scheduleInfo = (displayDate && displayStart && displayEnd) ? `
            <br><small style="color: var(--accent);">${displayDate}</small>
            <br><small style="font-size: 0.75rem; color: #666;">
                ${formatTime12(displayStart)} - ${formatTime12(displayEnd)}
            </small>
            <br><small style="font-size: 0.75rem; color: #666;">
                <strong>Room Status:</strong> ${room.status}
            </small>
        ` : '';

        return `
        <tr data-room-index="${index}">
            <td><input type="number" class="room-no-input" value="${room.id}" onchange="updateData(${index}, 'id', this.value)"></td>
            <td>
                <input type="text" class="instructor-input" placeholder="Name..." value="${capitalizedName}" onchange="updateData(${index}, 'instructor', this.value)">
                ${scheduleInfo}
            </td>
            <td>
                <select class="cat-select" onchange="updateData(${index}, 'category', this.value)">
                    ${CATEGORIES.map(cat => `<option value="${cat}" ${room.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </td>
            <td>
                <div class="schedule-cell">
                    <input type="date" class="sched-minimal" value="${room.date || ''}" onchange="updateData(${index}, 'date', this.value)">
                    <div class="schedule-time-display-box">
                        <div class="schedule-time-formatted" onclick="toggleTimeInputs(this)" style="cursor: pointer;">
                            ${room.startTime && room.endTime ? `${formatTime12(room.startTime)} - ${formatTime12(room.endTime)}` : 'Set time'}
                        </div>
                        <div class="schedule-time-range" style="display: none;">
                            <input type="time" class="sched-time-start" value="${normalizeTime(room.startTime) || ''}" onchange="updateData(${index}, 'startTime', this.value); updateTimeDisplay(this);">
                            <span>-</span>
                            <input type="time" class="sched-time-end" value="${normalizeTime(room.endTime) || ''}" onchange="updateData(${index}, 'endTime', this.value); updateTimeDisplay(this);">
                        </div>
                    </div>
                    <span class="reset-link" onclick="resetSchedule(${index})">↺ Reset Sched</span>
                </div>
            </td>
            <td>
                <select class="status-selector ${statusClass}" onchange="changeStatus(${index}, this.value)">
                    <option value="Locked" ${room.status === 'Locked' ? 'selected' : ''}>🔒 LOCKED</option>
                    <option value="Available" ${room.status === 'Available' ? 'selected' : ''}>🔓 AVAILABLE</option>
                    <option value="Meeting" ${room.status === 'Meeting' ? 'selected' : ''}>👥 MEETING</option>
                    <option value="Maintenance" ${room.status === 'Maintenance' ? 'selected' : ''}>⚙️ MAINTENANCE</option>
                </select>
                <details>
                    <summary>▼ History (${room.history.length})</summary>
                    <div style="margin-top:5px;">
                        ${room.history.length > 0
                ? room.history.slice(-4).reverse().map(h => `<div class="history-item">${h}</div>`).join('')
                : '<div class="history-item" style="color:#999; font-style: italic;">No activity yet.</div>'}
                        ${room.history.length > 0 ? `<span class="clear-history" onclick="clearHistory(${index})">🗑 Clear History</span>` : ''}
                    </div>
                </details>
            </td>
            <td>
                ${hasSchedules && room.schedules[0] && room.schedules[0].queueStatus === 'active' ? `<button class="btn-complete" onclick="openCompleteSessionModal(${index})" title="Mark session as complete and activate next schedule">✓ Complete</button>` : ''}
                <button class="btn-update" onclick="updateRoom(${index})">Update</button>
                <button class="btn-remove" onclick="removeRoom(${index})">Remove</button>
            </td>
        </tr>`;
    }).filter(row => row !== '').join('');

    updateStatusCounts();
    updateMonitoringStats();
    updateScheduleNotifications();

    updateStatusCounts();
    updateMonitoringStats();
    updateScheduleNotifications();
}

/**
 * Filter table by search
 */
function filterTable() {
    const query = document.getElementById('searchBar').value.toLowerCase();
    const rows = document.querySelectorAll('#tableBody tr');

    rows.forEach((row, i) => {
        const room = allRooms[i];
        if (!room) {
            row.style.display = "none";
            return;
        }

        // Smart search: if query is a number, use exact room ID match. If text, use contains match
        let match = false;
        if (/^\d+$/.test(query)) {
            // Numeric search - exact room ID match only
            match = room.id.toString() === query;
        } else if (query) {
            // Text search - match instructor or status only
            match = (room.instructor && room.instructor.toLowerCase().includes(query)) ||
                room.status.toLowerCase().includes(query);
        } else {
            // Empty search - show all
            match = true;
        }

        row.style.display = match ? "" : "none";
    });
}

/**
 * Update room data
 * @param {number} index - Room index
 * @param {string} field - Field to update
 * @param {string} value - New value
 */
function updateData(index, field, value) {
    const oldValue = allRooms[index][field];
    if (field === 'startTime' || field === 'endTime') {
        value = normalizeTime(value);
    }
    allRooms[index][field] = field === 'id' ? parseInt(value) : value;

    if (field === 'instructor' || field === 'category') {
        addLog('update', allRooms[index].id, allRooms[index].instructor || 'Anonymous', allRooms[index].category, `${field}: ${oldValue} → ${value}`, allRooms[index].status);
    }

    saveToStorage();
    updateStatusCounts();
    updateScheduleNotifications();
}

/**
 * Update a room from the dashboard row values
 * @param {number} index - Room index
 */
function updateRoom(index) {
    const room = allRooms[index];
    const row = document.querySelector(`#tableBody tr[data-room-index="${index}"]`);
    if (!room || !row) return;

    const idInput = row.querySelector('.room-no-input');
    const instructorInput = row.querySelector('.instructor-input');
    const categorySelect = row.querySelector('.cat-select');
    const dateInput = row.querySelector('.sched-minimal');
    const timeInputs = row.querySelectorAll('.schedule-time-range input[type="time"]');
    const startTimeInput = timeInputs[0];
    const endTimeInput = timeInputs[1];

    const newValues = {
        id: parseInt(idInput?.value || room.id, 10) || room.id,
        instructor: instructorInput?.value || room.instructor,
        category: categorySelect?.value || room.category,
        date: dateInput?.value || room.date,
        startTime: startTimeInput?.value || room.startTime,
        endTime: endTimeInput?.value || room.endTime
    };

    // Only update when values are different
    Object.keys(newValues).forEach(field => {
        const newValue = newValues[field];
        if (room[field] !== newValue) {
            updateData(index, field, newValue);
        }
    });

    if (room.schedules && room.schedules.length > 0) {
        const currentSchedule = room.schedules[0];
        ['instructor', 'date', 'startTime', 'endTime'].forEach(field => {
            if (currentSchedule[field] !== newValues[field]) {
                currentSchedule[field] = newValues[field];
            }
        });
    }

    saveToStorage();
    renderTable();
    if (typeof renderMonitoringTable === 'function') {
        renderMonitoringTable();
    }
    if (currentTab === 'monitoring' && typeof renderMonitoringTable === 'function') {
        renderMonitoringTable();
    }
    updateStatusCounts();
    updateScheduleNotifications();
}

/**
 * Change room status
 * @param {number} index - Room index
 * @param {string} newStatus - New status
 */
function changeStatus(index, newStatus) {
    const room = allRooms[index];
    const oldStatus = room.status;
    const time = new Date().toLocaleTimeString();

    room.status = newStatus;
    let icon = newStatus === "Available" ? "🔓" : newStatus === "Meeting" ? "👥" : newStatus === "Maintenance" ? "⚙️" : "🔒";
    room.history.push(`${time} - ${icon} ${newStatus} by ${room.instructor || 'Anonymous'}`);

    addLog('status', room.id, room.instructor || 'Anonymous', room.category, `Status: ${oldStatus} → ${newStatus}`, newStatus);

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
}

/**
 * Reset schedule for a room - clears all schedules and sets status to Available
 * @param {number} index - Room index
 */
function resetSchedule(index) {
    const room = allRooms[index];
    const scheduleCount = room.schedules ? room.schedules.length : 0;
    const oldInstructor = room.instructor;

    // Clear all schedules if they exist
    if (room.schedules && room.schedules.length > 0) {
        room.schedules = [];
    }

    // Clear borrower name
    room.instructor = "";

    // Clear date and time
    room.date = "";
    room.startTime = "";
    room.endTime = "";

    // Set status back to Available
    room.status = 'Available';

    // Convert to register type if needed
    if (room.type === 'schedule') {
        room.type = 'register';
    }

    const time = new Date().toLocaleTimeString();
    const scheduleInfo = scheduleCount > 0 ? ` (${scheduleCount} schedule(s) cleared)` : '';
    room.history.push(`${time} - ↺ Schedule reset by Admin${scheduleInfo} - ${oldInstructor || 'Anonymous'} removed`);

    addLog('reset', room.id, 'Admin', room.category, `Schedule reset${scheduleInfo} - Borrower and schedule cleared`, 'Available');

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
}

/**
 * Clear all schedules from a room (instructor queue)
 * @param {number} index - Room index
 */
function clearRoomSchedules(index) {
    const room = allRooms[index];
    if (!confirm(`Clear all schedules for Room ${room.id}? This will remove all instructors from the queue.`)) return;

    const scheduleCount = room.schedules ? room.schedules.length : 0;
    room.schedules = [];
    room.date = "";
    room.startTime = "";
    room.endTime = "";
    room.instructor = "";

    const time = new Date().toLocaleTimeString();
    room.history.push(`${time} - 🗑 Cleared ${scheduleCount} schedules`);

    addLog('clear', room.id, 'Admin', room.category, `Cleared ${scheduleCount} instructor schedules`, room.status);

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
}

/**
 * Clear room history
 * @param {number} index - Room index
 */
function clearHistory(index) {
    if (confirm(`Clear all logs for Room ${allRooms[index].id}?`)) {
        allRooms[index].history = [];
        saveToStorage();
        renderTable();
    }
}

/**
 * Remove a room
 * @param {number} index - Room index
 */
function removeRoom(index) {
    const room = allRooms[index];
    if (!confirm("Remove this room/schedule?")) return;

    const key = `${room.id}-${room.date}-${room.startTime}`;
    if (scheduleStatus[key]) {
        delete scheduleStatus[key];
    }

    const action = room.type === 'schedule' ? 'remove_schedule' : 'remove';
    const details = room.type === 'schedule' ? `Schedule removed: ${room.date} ${room.startTime}-${room.endTime}` : 'Room unregistered';
    addLog(action, room.id, room.instructor || 'Anonymous', room.category, details, room.status);

    allRooms.splice(index, 1);

    saveToStorage();

    if (currentTab === 'dashboard') {
        renderTable();
    } else if (currentTab === 'monitoring') {
        renderMonitoringTable();
    } else {
        renderDatabaseTable();
    }

    updateScheduleNotifications();
}

/**
 * Open modal to confirm session completion and show next schedule
 * @param {number} index - Room index
 */
function openCompleteSessionModal(index) {
    const room = allRooms[index];
    if (!room.schedules || room.schedules.length === 0) {
        alert('No schedules found for this room');
        return;
    }

    const currentSchedule = room.schedules[0];
    const nextSchedule = room.schedules.length > 1 ? room.schedules[1] : null;

    // Build modal content
    let modalHTML = `
        <div class="modal" id="completeSessionModal" onclick="if (event.target === this) closeCompleteSessionModal()">
            <div class="modal-content complete-session-modal" style="max-width: 600px;">
                <div class="modal-header" style="border-bottom: 2px solid var(--success); background: rgba(39, 174, 96, 0.1);">
                    <h3>✓ Complete Session</h3>
                    <button class="btn-close" onclick="closeCompleteSessionModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-info-box" style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: var(--accent);">Current Session - Ending Now</h4>
                        <div style="font-size: 0.95rem;">
                            <p style="margin: 5px 0;"><strong>Room No:</strong> ${room.id}</p>
                            <p style="margin: 5px 0;"><strong>Instructor:</strong> ${currentSchedule.instructor}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${room.category}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${currentSchedule.date}</p>
                            <p style="margin: 5px 0;"><strong>Time:</strong> ${currentSchedule.startTime} - ${currentSchedule.endTime}</p>
                        </div>
                    </div>

                    ${nextSchedule ? `
                        <div class="session-info-box" style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid var(--success); margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: var(--success);">Next Schedule</h4>
                            <div style="font-size: 0.95rem;">
                                <p style="margin: 5px 0;"><strong>Instructor:</strong> ${nextSchedule.instructor}</p>
                                <p style="margin: 5px 0;"><strong>Date:</strong> ${nextSchedule.date}</p>
                                <p style="margin: 5px 0;"><strong>Time:</strong> ${nextSchedule.startTime} - ${nextSchedule.endTime}</p>
                                <p style="margin: 5px 0;"><strong>Category:</strong> ${room.category}</p>
                            </div>
                            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn-action" onclick="activateNextSchedule(${index})" style="background: #27ae60; color: white; flex: 1; min-width: 100px; font-weight: 700; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">▶ Next</button>
                                <button class="btn-action" onclick="removeNextSchedule(${index})" style="background: #e74c3c; color: white; flex: 1; min-width: 100px; font-weight: 700; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">🗑 Remove</button>
                            </div>
                        </div>

                        ${room.schedules.length > 2 ? `
                            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid var(--success); margin-bottom: 20px;">
                                <h4 style="margin: 0 0 12px 0; color: var(--success); font-size: 0.95rem;">📋 Queue (${room.schedules.length - 1} total)</h4>
                                <div style="max-height: 250px; overflow-y: auto;">
                                    ${room.schedules.slice(1).map((sched, idx) => {
        let statusColor = '#27ae60';
        let statusIcon = '🔓';
        if (room.status === 'Locked') {
            statusColor = '#c0392b';
            statusIcon = '🔒';
        } else if (room.status === 'Meeting') {
            statusColor = '#8e44ad';
            statusIcon = '👥';
        } else if (room.status === 'Maintenance') {
            statusColor = '#f39c12';
            statusIcon = '⚙️';
        }
        return `
                                        <div style="background: white; padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid var(--success); font-size: 0.9rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                            <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 6px;">
                                                <div style="flex: 1;">
                                                    <p style="margin: 0;"><strong style="color: var(--success);">#${idx + 2}</strong> <strong>${sched.instructor}</strong></p>
                                                </div>
                                                <span style="background: ${statusColor}; color: white; padding: 6px 10px; border-radius: 3px; font-size: 0.7rem; font-weight: 700; white-space: nowrap;">
                                                    ${statusIcon} ${room.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style="font-size: 0.85rem; color: #666;">
                                                <p style="margin: 0 0 2px 0;">📅 ${sched.date}</p>
                                                <p style="margin: 0;">🕐 ${sched.startTime} - ${sched.endTime}</p>
                                            </div>
                                        </div>
                                        `;
    }).join('')}
                                </div>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="session-info-box" style="background: #fce4ec; padding: 15px; border-radius: 8px; border-left: 4px solid var(--warning); margin-bottom: 20px;">
                            <h4 style="margin: 0 0 10px 0; color: var(--warning);">⚠️ No More Schedules</h4>
                            <p style="margin: 5px 0; font-size: 0.95rem;">This is the last instructor. Room will be marked as <strong>Available</strong> after completion.</p>
                            <div style="margin-top: 15px;">
                                <button class="btn-action" onclick="completeFinalSession(${index})" style="background: #27ae60; color: white; width: 100%; font-weight: 700; border: none; padding: 12px 16px; border-radius: 6px; cursor: pointer; font-size: 0.95rem;">✓ Complete Session</button>
                            </div>
                        </div>
                    `}

                    <p style="margin: 20px 0 10px 0; font-size: 0.9rem; color: #666; font-style: italic;">
                        ✓ Key received and session completed | Instructors will be notified
                    </p>
                </div>
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="closeCompleteSessionModal()">Cancel</button>
                    <button class="btn-confirm" onclick="completeCurrentSession(${index})" style="background: var(--success); color: white;">✓ Confirm Completion</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('completeSessionModal').style.display = 'flex';
}

/**
 * Close the complete session modal
 */
function closeCompleteSessionModal() {
    const modal = document.getElementById('completeSessionModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Complete current session and activate next schedule
 * @param {number} index - Room index
 */
function completeCurrentSession(index) {
    const room = allRooms[index];
    if (!room.schedules || room.schedules.length === 0) {
        alert('No schedules found');
        return;
    }

    const time = new Date().toLocaleTimeString();
    const currentSchedule = room.schedules[0];
    const currentInstructor = currentSchedule.instructor;

    // Mark current session as completed
    currentSchedule.queueStatus = 'completed';
    const completionTime = new Date().toLocaleString();
    currentSchedule.completedAt = completionTime;

    // Log the completion
    room.history.push(`${time} - ✓ Session completed by ${currentInstructor}`);

    // If there's a next schedule, activate it
    let nextInstructor = null;
    if (room.schedules.length > 1) {
        const nextSchedule = room.schedules[1];
        nextSchedule.queueStatus = 'active';
        nextInstructor = nextSchedule.instructor;

        // Update room info to reflect next active instructor
        room.instructor = nextInstructor;
        room.status = 'Meeting';  // Mark as meeting since next person is now active

        room.history.push(`${time} - 👥 Next schedule activated for ${nextInstructor}`);

        addLog('schedule_completed', room.id, currentInstructor, room.category,
            `Session completed. Next: ${nextInstructor} (${nextSchedule.startTime}-${nextSchedule.endTime})`, 'Meeting');
    } else {
        // No more schedules - mark room as available
        room.status = 'Available';
        room.instructor = '';
        room.history.push(`${time} - 🔓 No more schedules - room marked as Available`);

        addLog('schedule_completed', room.id, currentInstructor, room.category,
            'Session completed. Room is now available.', 'Available');
    }

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
    closeCompleteSessionModal();

    // Send notifications
    notifySessionCompletion(room, currentInstructor, nextInstructor);
}

/**
 * Send notifications for session completion
 * @param {object} room - Room object
 * @param {string} currentInstructor - Current instructor name
 * @param {string|null} nextInstructor - Next instructor name (if any)
 */
function notifySessionCompletion(room, currentInstructor, nextInstructor) {
    // Show admin notification
    if (typeof showNotification === 'function') {
        showNotification(
            '✓ Session Completed',
            `${currentInstructor}'s session in Room ${room.id} has ended.`,
            'success',
            5000
        );

        // If there's a next instructor, notify them
        if (nextInstructor) {
            setTimeout(() => {
                showNotification(
                    '👥 Your Turn!',
                    `Room ${room.id} is ready! ${nextInstructor}, your schedule has started.`,
                    'info',
                    5000
                );
            }, 1000);
        }
    }

    // Also show browser alert for immediate feedback
    let alertMsg = `✓ Session completed for ${currentInstructor} in Room ${room.id}!`;
    if (nextInstructor) {
        alertMsg += `\n\n👥 ${nextInstructor}'s session is now active!`;
        alertMsg += `\nRoom is ready to be used.`;
    } else {
        alertMsg += '\n\n🔓 Room is now available.';
    }
    alert(alertMsg);
}

/**
 * Activate next schedule immediately without completing current
 * @param {number} index - Room index
 */
function activateNextSchedule(index) {
    const room = allRooms[index];
    if (!room.schedules || room.schedules.length < 2) {
        alert('No next schedule available');
        return;
    }

    const time = new Date().toLocaleTimeString();
    const currentSchedule = room.schedules[0];
    const nextSchedule = room.schedules[1];
    const nextInstructor = nextSchedule.instructor;
    const previousInstructor = currentSchedule.instructor;

    // Remove the first schedule completely
    room.schedules.shift();

    // Now the next schedule is at index 0 and is the active one
    room.schedules[0].queueStatus = 'active';

    // Update room info - instructor name changes to next person
    room.instructor = nextInstructor;
    // Keep the same status - don't change it

    room.history.push(`${time} - ▶ ${previousInstructor} finished. Next schedule activated for ${nextInstructor}`);

    addLog('schedule_activated', room.id, nextInstructor, room.category,
        `Next schedule activated: ${nextSchedule.date} ${nextSchedule.startTime}-${nextSchedule.endTime}`, room.status);

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
    closeCompleteSessionModal();

    // Show notifications
    if (typeof showNotification === 'function') {
        showNotification(
            '▶ Next Schedule Activated',
            `${nextInstructor}'s schedule is now active in Room ${room.id}!`,
            'success',
            5000
        );
    }

    alert(`✓ Next schedule activated!\n\n${nextInstructor} can now use Room ${room.id}.\nTime: ${nextSchedule.startTime} - ${nextSchedule.endTime}`);
}

/**
 * Remove next schedule and notify the instructor
 * @param {number} index - Room index
 */
function removeNextSchedule(index) {
    const room = allRooms[index];
    if (!room.schedules || room.schedules.length < 2) {
        alert('No next schedule available to remove');
        return;
    }

    if (!confirm('Remove the next instructor\'s schedule? They will be notified.')) {
        return;
    }

    const time = new Date().toLocaleTimeString();
    const nextSchedule = room.schedules[1];
    const nextInstructor = nextSchedule.instructor;

    // Remove the next schedule from the queue
    const removedSchedule = room.schedules.splice(1, 1)[0];

    room.history.push(`${time} - 🗑 Removed schedule for ${nextInstructor}`);

    addLog('schedule_removed', room.id, nextInstructor, room.category,
        `Schedule removed by admin: ${nextSchedule.date} ${nextSchedule.startTime}-${nextSchedule.endTime}`, room.status);

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
    closeCompleteSessionModal();

    // Send notification to instructor
    if (typeof showNotification === 'function') {
        showNotification(
            '⚠️ Schedule Removed',
            `${nextInstructor}'s schedule in Room ${room.id} has been removed by admin.`,
            'warning',
            5000
        );
    }

    alert(`✓ Schedule removed!\n\n${nextInstructor}'s schedule in Room ${room.id} has been cancelled.\nThey will be notified of this change.`);
}

/**
 * Complete the final (only) schedule and reset room to normal
 * @param {number} index - Room index
 */
function completeFinalSession(index) {
    const room = allRooms[index];
    if (!room.schedules || room.schedules.length === 0) {
        alert('No schedule found');
        return;
    }

    const time = new Date().toLocaleTimeString();
    const lastSchedule = room.schedules[0];
    const instructorName = lastSchedule.instructor;

    // Mark as completed
    lastSchedule.queueStatus = 'completed';
    lastSchedule.completedAt = new Date().toLocaleString();

    // Clear all schedules
    room.schedules = [];

    // Reset room to normal state
    room.instructor = '';
    room.date = '';
    room.startTime = '';
    room.endTime = '';
    room.status = 'Available';

    // Log the completion
    room.history.push(`${time} - ✓ Final session completed by ${instructorName}. Room reset to Available.`);

    addLog('session_completed', room.id, instructorName, room.category,
        'Final session completed. Room reset to Available state.', 'Available');

    saveToStorage();
    renderTable();
    updateScheduleNotifications();
    closeCompleteSessionModal();

    // Show notifications
    if (typeof showNotification === 'function') {
        showNotification(
            '✓ Session Completed',
            `${instructorName}'s session in Room ${room.id} has ended. Room is now Available.`,
            'success',
            5000
        );
    }

    alert(`✓ Session completed!\n\n${instructorName}'s session in Room ${room.id} has finished.\nRoom is now Available.`);
}

/**
 * Open create admin modal
 */
function openCreateAdminModal() {
    const modal = document.getElementById('createAdminModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.getElementById('adminUsername').focus();
    }
}

/**
 * Close create admin modal
 */
function closeCreateAdminModal() {
    const modal = document.getElementById('createAdminModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        clearCreateAdminForm();
    }
}

/**
 * Clear create admin form
 */
function clearCreateAdminForm() {
    document.getElementById('adminUsername').value = '';
    document.getElementById('adminFullName').value = '';
    document.getElementById('adminEmail').value = '';
    document.getElementById('adminPassword').value = '';
    document.getElementById('adminConfirmPassword').value = '';
    document.getElementById('adminUsernameStatus').style.display = 'none';
    document.getElementById('adminPasswordMatch').style.display = 'none';
    document.getElementById('adminCreateMessage').style.display = 'none';
}

/**
 * Check if username is available
 */
function checkAdminUsernameAvailability() {
    const username = document.getElementById('adminUsername').value.trim().toLowerCase();
    const statusEl = document.getElementById('adminUsernameStatus');

    if (!username) {
        statusEl.style.display = 'none';
        return false;
    }

    if (username.length < 3) {
        statusEl.textContent = 'Username must be at least 3 characters';
        statusEl.style.color = '#d32f2f';
        statusEl.style.display = 'block';
        return false;
    }

    // Check if username exists
    const existingUser = usersDatabase.find(u => u.username.toLowerCase() === username);

    if (existingUser) {
        statusEl.textContent = `❌ Username "${username}" is already taken`;
        statusEl.style.color = '#d32f2f';
        statusEl.style.display = 'block';
        return false;
    } else {
        statusEl.textContent = '✓ Username is available';
        statusEl.style.color = '#4caf50';
        statusEl.style.display = 'block';
        return true;
    }
}

/**
 * Check if passwords match
 */
function checkAdminPasswordMatch() {
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const matchEl = document.getElementById('adminPasswordMatch');

    if (!password || !confirmPassword) {
        matchEl.style.display = 'none';
        return false;
    }

    if (password.length < 6) {
        matchEl.textContent = 'Password must be at least 6 characters';
        matchEl.style.color = '#d32f2f';
        matchEl.style.display = 'block';
        return false;
    }

    if (password !== confirmPassword) {
        matchEl.textContent = '❌ Passwords do not match';
        matchEl.style.color = '#d32f2f';
        matchEl.style.display = 'block';
        return false;
    } else {
        matchEl.textContent = '✓ Passwords match';
        matchEl.style.color = '#4caf50';
        matchEl.style.display = 'block';
        return true;
    }
}

/**
 * Create new admin account
 */
function createAdminAccount() {
    const username = document.getElementById('adminUsername').value.trim().toLowerCase();
    const fullName = document.getElementById('adminFullName').value.trim();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('adminConfirmPassword').value;
    const messageEl = document.getElementById('adminCreateMessage');

    // Validation checks
    if (!username || username.length < 3) {
        messageEl.textContent = 'Please enter a valid username (at least 3 characters)';
        messageEl.style.color = '#d32f2f';
        messageEl.style.display = 'block';
        return;
    }

    if (!fullName) {
        messageEl.textContent = 'Please enter full name';
        messageEl.style.color = '#d32f2f';
        messageEl.style.display = 'block';
        return;
    }

    // Check username availability
    const existingUser = usersDatabase.find(u => u.username.toLowerCase() === username);
    if (existingUser) {
        messageEl.textContent = `Username "${username}" is already taken`;
        messageEl.style.color = '#d32f2f';
        messageEl.style.display = 'block';
        return;
    }

    // Check password
    if (password.length < 6) {
        messageEl.textContent = 'Password must be at least 6 characters';
        messageEl.style.color = '#d32f2f';
        messageEl.style.display = 'block';
        return;
    }

    if (password !== confirmPassword) {
        messageEl.textContent = 'Passwords do not match';
        messageEl.style.color = '#d32f2f';
        messageEl.style.display = 'block';
        return;
    }

    // Create new admin account
    const newAdmin = {
        username: username,
        password: password,
        fullName: fullName,
        email: email || null,
        role: 'admin',
        createdAt: new Date().toISOString(),
        createdBy: getSession().username,
        lastLogin: null,
        loginCount: 0
    };

    usersDatabase.push(newAdmin);
    saveUsersDatabase();

    // Show success message
    messageEl.innerHTML = `<span style="color: #4caf50;">✓ Admin account created successfully!</span><br><strong>Username:</strong> ${username}<br><strong>Name:</strong> ${fullName}`;
    messageEl.style.display = 'block';

    // Log the action
    addLog('admin-create', 'N/A', username, 'Admin', `New admin account created: ${fullName} (${username})`, 'Admin');

    // Clear form and close after 2 seconds
    setTimeout(() => {
        clearCreateAdminForm();
        closeCreateAdminModal();
        showNotification(`✓ Admin account "${username}" created successfully!`, 'success');
    }, 2000);
}

/**
 * Render analytics and reports tab
 */
function renderAnalyticsReport() {
    renderUsageStatistics();
    renderPeakUsageTimes();
    renderMostFrequentRooms();
    updateAnalyticsSidebar();
}

/**
 * Render room usage statistics
 */
function renderUsageStatistics() {
    const tbody = document.getElementById('usageStatsBody');
    const noMsg = document.getElementById('noUsageMsg');
    if (!tbody) return;

    // Calculate usage for each room
    const roomStats = allRooms
        .filter(r => r.type === 'register')
        .map(room => {
            let bookings = 0;
            let totalHours = 0;
            
            if (room.schedules && room.schedules.length > 0) {
                bookings = room.schedules.length;
                room.schedules.forEach(s => {
                    const duration = calculateDuration(s.startTime, s.endTime);
                    const hours = parseFloat(duration.match(/\d+(?=h)/)?.[0] || '0') + 
                                  (parseFloat(duration.match(/\d+(?=m)/)?.[0] || '0') / 60);
                    totalHours += hours;
                });
            }

            return {
                id: room.id,
                category: room.category,
                bookings: bookings,
                hours: totalHours.toFixed(1),
                usage: bookings > 0 ? 'Active' : 'Unused'
            };
        })
        .sort((a, b) => b.bookings - a.bookings);

    if (roomStats.length === 0) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';
    tbody.innerHTML = roomStats.map(stat => `
        <tr>
            <td><strong>${stat.id}</strong></td>
            <td>${stat.category}</td>
            <td>${stat.bookings}</td>
            <td>${stat.hours}h</td>
            <td><span style="color: ${stat.bookings > 0 ? '#27ae60' : '#999'}; font-weight: 600;">${stat.usage}</span></td>
        </tr>
    `).join('');
}

/**
 * Render peak usage times
 */
function renderPeakUsageTimes() {
    const tbody = document.getElementById('peakTimesBody');
    const noMsg = document.getElementById('noPeakMsg');
    if (!tbody) return;

    const timeSlots = {};
    const timeRanges = ['00:00-04:00', '04:00-08:00', '08:00-12:00', '12:00-16:00', '16:00-20:00', '20:00-24:00'];
    
    // Initialize time slots
    timeRanges.forEach(range => timeSlots[range] = 0);

    // Count bookings by time range
    allRooms.forEach(room => {
        if (room.schedules && room.schedules.length > 0) {
            room.schedules.forEach(schedule => {
                if (schedule.startTime) {
                    const hour = parseInt(schedule.startTime.split(':')[0]);
                    const rangeIndex = Math.floor(hour / 4);
                    const range = timeRanges[rangeIndex];
                    if (range) timeSlots[range]++;
                }
            });
        }
    });

    const peakData = Object.entries(timeSlots)
        .map(([range, count]) => ({ range, count }))
        .sort((a, b) => b.count - a.count);

    if (peakData.every(d => d.count === 0)) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';
    tbody.innerHTML = peakData.map(data => `
        <tr>
            <td>${data.range}</td>
            <td>${data.count}</td>
            <td><div style="width: ${Math.min(data.count * 20, 100)}px; height: 20px; background: #3498db; border-radius: 3px;"></div></td>
        </tr>
    `).join('');
}

/**
 * Render most frequently used rooms
 */
function renderMostFrequentRooms() {
    const tbody = document.getElementById('frequentRoomsBody');
    const noMsg = document.getElementById('noFrequentMsg');
    if (!tbody) return;

    const frequentRooms = allRooms
        .filter(r => r.type === 'register' && r.schedules && r.schedules.length > 0)
        .map((room, idx) => {
            const bookings = room.schedules.length;
            let totalHours = 0;
            
            room.schedules.forEach(s => {
                const duration = calculateDuration(s.startTime, s.endTime);
                const hours = parseFloat(duration.match(/\d+(?=h)/)?.[0] || '0') + 
                              (parseFloat(duration.match(/\d+(?=m)/)?.[0] || '0') / 60);
                totalHours += hours;
            });

            const avgHours = (totalHours / bookings).toFixed(1);
            return {
                rank: idx + 1,
                id: room.id,
                category: room.category,
                bookings: bookings,
                avgHours: avgHours
            };
        })
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 10);

    if (frequentRooms.length === 0) {
        tbody.innerHTML = '';
        noMsg.style.display = 'block';
        return;
    }

    noMsg.style.display = 'none';
    tbody.innerHTML = frequentRooms.map((room, idx) => `
        <tr>
            <td><strong>#${idx + 1}</strong></td>
            <td><strong>${room.id}</strong></td>
            <td>${room.category}</td>
            <td><span style="background: #27ae60; color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">${room.bookings}</span></td>
            <td>${room.avgHours}h</td>
        </tr>
    `).join('');
}

/**
 * Update analytics sidebar with stats
 */
function updateAnalyticsSidebar() {
    const totalBookingsEl = document.getElementById('totalBookings');
    const utilizationEl = document.getElementById('utilizationRate');
    const mostUsedEl = document.getElementById('mostUsedRoom');

    if (!totalBookingsEl) return;

    // Calculate total bookings
    let totalBookings = 0;
    allRooms.forEach(room => {
        if (room.schedules && room.schedules.length > 0) {
            totalBookings += room.schedules.length;
        }
    });
    totalBookingsEl.innerText = totalBookings;

    // Calculate utilization rate
    const registeredRooms = allRooms.filter(r => r.type === 'register').length;
    const usedRooms = allRooms.filter(r => r.type === 'register' && r.schedules && r.schedules.length > 0).length;
    const utilizationRate = registeredRooms > 0 ? Math.round((usedRooms / registeredRooms) * 100) : 0;
    utilizationEl.innerText = utilizationRate + '%';

    // Find most used room
    let mostUsed = '--';
    let maxBookings = 0;
    allRooms.forEach(room => {
        if (room.schedules && room.schedules.length > maxBookings) {
            maxBookings = room.schedules.length;
            mostUsed = `Room ${room.id}`;
        }
    });
    mostUsedEl.innerText = mostUsed;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        currentTab,
        initAdminView,
        switchTab,
        updateStatusCounts,
        filterByStatus,
        renderTable,
        filterTable,
        updateData,
        changeStatus,
        resetSchedule,
        clearRoomSchedules,
        clearHistory,
        removeRoom,
        openCompleteSessionModal,
        closeCompleteSessionModal,
        completeCurrentSession,
        activateNextSchedule,
        removeNextSchedule,
        completeFinalSession
    };
}
