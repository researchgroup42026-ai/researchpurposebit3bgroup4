/* ============================================
   CTU Room Management System - Admin Room Manager
   ============================================ */

/**
 * Add a new room or schedule
 * @param {string} type - 'register' or 'schedule'
 */
function addNewRoom(type) {
    const id = document.getElementById('newRoomId').value;
    const name = document.getElementById('newInstructor').value;
    const cat = document.getElementById('newRoomCat').value;
    const date = document.getElementById('schedDate').value;
    const startTime = document.getElementById('schedStartTime').value;
    const endTime = document.getElementById('schedEndTime').value;

    if (!id) return alert("Please enter a Room Number.");

    if (type === 'schedule') {
        if (!date || !startTime || !endTime) {
            return alert("Please fill in date, start time, and end time for scheduling.");
        }

        const duplicateSchedule = checkDuplicateSchedule(parseInt(id), date, startTime, endTime);
        if (duplicateSchedule) {
            alert(`❌ Schedule conflict detected!\n\nRoom ${id} already has a schedule on ${date} from ${duplicateSchedule.startTime} to ${duplicateSchedule.endTime}.\n\nPlease choose a different time slot.`);
            return;
        }
    }

    const roomId = parseInt(id);
    const existingRoom = allRooms.find(r => r.id === roomId);

    if (type === 'register') {
        // Check if room is already registered with a borrower name
        if (existingRoom && existingRoom.instructor && existingRoom.type === 'register') {
            alert(`Room ${id} is already registered!`);
            return;
        }
    }

    let initialStatus = type === 'register' ? "Available" : "Meeting";
    let historyEntry = "";
    const time = new Date().toLocaleTimeString();

    if (type === 'register') {
        historyEntry = `${time} - 📋 Registered by ${name || 'Anonymous'}`;
    } else {
        historyEntry = `${time} - 📅 Scheduled by ${name || 'Anonymous'} for ${date} ${startTime}-${endTime}`;
    }

    // If room exists, update it instead of creating a duplicate
    if (existingRoom) {
        existingRoom.instructor = name;
        existingRoom.category = cat;
        existingRoom.date = date;
        existingRoom.startTime = startTime;
        existingRoom.endTime = endTime;
        existingRoom.status = initialStatus;
        existingRoom.history = historyEntry ? [historyEntry] : [];
        existingRoom.type = type;
        if (type === 'schedule') {
            existingRoom.scheduleId = Date.now();
        }
    } else {
        // Create new room if it doesn't exist
        const newRoom = {
            id: roomId,
            instructor: name,
            category: cat,
            date: date,
            startTime: startTime,
            endTime: endTime,
            status: initialStatus,
            history: historyEntry ? [historyEntry] : [],
            type: type,
            scheduleId: type === 'schedule' ? Date.now() : null
        };
        allRooms.push(newRoom);
    }

    const details = type === 'schedule' ? `Scheduled: ${date} ${startTime}-${endTime}` : 'Room registered';
    addLog(type, id, name || 'Anonymous', cat, details, initialStatus);

    saveToStorage();

    if (currentTab === 'dashboard') {
        renderTable();
    } else if (currentTab === 'monitoring') {
        renderMonitoringTable();
    } else {
        renderDatabaseTable();
    }

    updateScheduleNotifications();
    clearForm();
}

/**
 * Clear the add room form
 */
function clearForm() {
    document.getElementById('newRoomId').value = '';
    document.getElementById('newInstructor').value = '';
    document.getElementById('newRoomCat').selectedIndex = 0;
    document.getElementById('schedDate').value = '';
    document.getElementById('schedStartTime').value = '';
    document.getElementById('schedEndTime').value = '';

    const dropdown = document.getElementById('addDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function openQuickRegisterModal() {
    const modal = document.getElementById('quickRegisterModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeQuickRegisterModal() {
    const modal = document.getElementById('quickRegisterModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Reset all rooms to default state
 * ADMIN ONLY - Clears all registrations and schedules
 */
function resetAllRooms() {
    if (!confirm('⚠️ WARNING: This will reset ALL rooms to empty state!\n\nAre you absolutely sure?')) {
        return;
    }
    if (!confirm('🔴 FINAL CONFIRMATION: This action cannot be undone. Reset all rooms?')) {
        return;
    }

    // Reset each room to default state
    allRooms.forEach(room => {
        room.instructor = '';
        room.category = 'Comlab Room';
        room.date = '';
        room.startTime = '';
        room.endTime = '';
        room.status = 'Available';
        room.history = [];
        room.type = 'register';
        room.scheduleId = null;
    });

    // Clear all logs
    systemLogs = [];
    scheduleStatus = {};

    console.log('✅ All rooms have been reset to default state');
    alert('✅ All rooms have been reset successfully!\n\nYou can now re-register them.');

    saveToStorage();
    renderTable();
    updateStatusCounts();
    updateScheduleNotifications();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addNewRoom,
        clearForm,
        resetAllRooms
    };
}
