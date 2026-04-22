/* ============================================
   CTU Room Management System - Helpers Module
   ============================================ */

/**
 * Convert time string to minutes
 * @param {string} timeStr - Time in "HH:MM" format
 * @returns {number} Minutes since midnight
 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Calculate duration between two times
 * @param {string} start - Start time "HH:MM"
 * @param {string} end - End time "HH:MM"
 * @returns {string} Formatted duration
 */
function calculateDuration(start, end) {
    if (!start || !end) return 'N/A';
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[date.getDay()];
    return `${dayName}<br>${day}-${month}-${year}`;
}

/**
 * Format date in short format
 * @param {string} dateString - ISO date string
 * @returns {string} Short formatted date
 */
function formatDateShort(dateString) {
    if (!dateString) return 'Not Set';
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateString === today) return 'Today';
    if (dateString === tomorrow.toISOString().split('T')[0]) return 'Tomorrow';

    return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * Format time in 12-hour AM/PM format
 * @param {string} timeString - Time in "HH:MM" format
 * @returns {string} Formatted time like "10:00 AM"
 */
function formatTime12(timeString) {
    if (!timeString) return '--:--';
    const [hours, minutes] = timeString.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/**
 * Normalize time string to HH:MM format
 * @param {string} timeString - Input time string
 * @returns {string} Normalized time string
 */
function normalizeTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(part => String(part).padStart(2, '0'));
    return `${hours}:${minutes}`;
}

/**
 * Get status color
 * @param {string} status - Status name
 * @returns {string} CSS color value
 */
function getStatusColor(status) {
    const colors = {
        'Available': 'var(--available)',
        'Meeting': 'var(--meeting)',
        'Locked': 'var(--locked)',
        'Maintenance': 'var(--maintenance)',
        'Pending': 'var(--pending)',
        'Approved': 'var(--available)',
        'Rejected': 'var(--rejected)'
    };
    return colors[status] || '#666';
}

/**
 * Check for time conflict
 * @param {Object} room - Room object
 * @param {string} date - Date to check
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {boolean} True if conflict exists
 */
function checkTimeConflict(room, date, startTime, endTime) {
    if (!date || !startTime || !endTime) return false;

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    // Check against existing schedules for this room
    const existingSchedules = allRooms.filter(r =>
        r.id === room.id &&
        r.type === 'schedule' &&
        r.date === date
    );

    for (let schedule of existingSchedules) {
        const existStart = timeToMinutes(schedule.startTime);
        const existEnd = timeToMinutes(schedule.endTime);

        if (newStart < existEnd && newEnd > existStart) {
            return true;
        }
    }

    // Check against approved pending requests
    const existingRequests = pendingRequests.filter(r =>
        r.roomId === room.id &&
        r.status === 'approved' &&
        r.date === date
    );

    for (let req of existingRequests) {
        const existStart = timeToMinutes(req.startTime);
        const existEnd = timeToMinutes(req.endTime);

        if (newStart < existEnd && newEnd > existStart) {
            return true;
        }
    }

    return false;
}

/**
 * Check for duplicate schedule
 * @param {number} roomId - Room ID
 * @param {string} date - Date
 * @param {string} startTime - Start time
 * @param {string} endTime - End time
 * @returns {Object|null} Conflicting schedule or null
 */
function checkDuplicateSchedule(roomId, date, startTime, endTime) {
    const roomSchedules = allRooms.filter(r => r.id === roomId && r.type === 'schedule');

    for (let schedule of roomSchedules) {
        if (schedule.date === date) {
            const newStart = timeToMinutes(startTime);
            const newEnd = timeToMinutes(endTime);
            const existingStart = timeToMinutes(schedule.startTime);
            const existingEnd = timeToMinutes(schedule.endTime);

            if (newStart < existingEnd && newEnd > existingStart) {
                return schedule;
            }
        }
    }

    return null;
}

/**
 * Start the system clock
 */
function startClock() {
    // Update immediately instead of waiting for interval
    const updateClock = () => {
        const now = new Date().toLocaleTimeString();
        const clockElements = document.querySelectorAll('.system-time');
        clockElements.forEach(el => {
            el.innerText = now;
        });

        // Update notifications if function exists
        if (typeof updateScheduleNotifications === 'function') {
            updateScheduleNotifications();
        }
    };

    // Call immediately on load
    updateClock();

    // Then update every second
    setInterval(updateClock, 1000);
}

/**
 * Toggle dropdown menu
 * @param {string} dropdownId - Dropdown element ID
 */
function toggleDropdown(dropdownId) {
    const dropdown = document.getElementById(dropdownId);
    if (dropdown) dropdown.classList.toggle('show');
}

/**
 * Close all dropdowns when clicking outside
 */
window.onclick = function (event) {
    if (!event.target.matches('.dropdown-toggle')) {
        var dropdowns = document.getElementsByClassName('dropdown-menu');
        for (var i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        timeToMinutes,
        calculateDuration,
        formatDate,
        formatDateShort,
        getStatusColor,
        checkTimeConflict,
        checkDuplicateSchedule,
        startClock,
        toggleDropdown
    };
}
