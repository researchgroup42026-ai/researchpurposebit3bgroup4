/* ============================================
   CTU Room Management System - Storage Module
   SYNC ENABLED VERSION - Real-time across devices
   ============================================ */

// Data Keys (kept for localStorage fallback)
const STORAGE_KEYS = {
    ROOMS: 'ctu_rooms',
    LOGS: 'ctu_logs',
    SCHEDULE_STATUS: 'ctu_schedule_status',
    REQUESTS: 'ctu_requests',
    USERS: 'ctu_users',
    CURRENT_USER: 'ctu_current_user'
};

// Categories
const CATEGORIES = ["Comlab Room", "Machine Room", "Library Room", "Office Room"];

// Default Data
const DEFAULT_ROOMS = [
    { id: 101, instructor: "", category: "Comlab Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" },
    { id: 102, instructor: "", category: "Comlab Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" },
    { id: 201, instructor: "", category: "Machine Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" },
    { id: 202, instructor: "", category: "Machine Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" },
    { id: 301, instructor: "", category: "Library Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" },
    { id: 401, instructor: "", category: "Office Room", date: "", startTime: "", endTime: "", status: "Available", history: [], type: "register" }
];

const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    fullName: 'System Administrator',
    email: 'admin@ctu.edu.ph',
    role: 'admin',
    createdAt: new Date().toISOString(),
    lastLogin: null,
    loginCount: 0,
    isNewAccount: false
};

// ============================================
// SYNC CONFIGURATION
// ============================================

// Local-only storage mode
// This app now uses browser localStorage for persistence without server sync.

// ============================================
// DATA VARIABLES
// ============================================

let allRooms = [...DEFAULT_ROOMS];
let systemLogs = [];
let scheduleStatus = {};
let pendingRequests = [];
let usersDatabase = [DEFAULT_ADMIN];

// ============================================
// STORAGE FUNCTIONS
// ============================================

/**
 * Initialize storage mode
 */
function initSync() {
    loadFromLocalStorage();
    console.log('✅ LocalStorage-only mode enabled; no server sync.');
}

/**
 * Push current data to server
 */
function pushToServer() {
    console.log('📥 LocalStorage-only mode: no server push performed.');
}

/**
 * Notify other clients of request action
 */
function notifyRequestAction(action) {
    console.log('📥 LocalStorage-only mode: request action not sent to any server.', action);
}

/**
 * Refresh UI after sync
 */
function refreshUI() {
    // Call render functions if they exist (admin pages)
    if (typeof renderTable === 'function') renderTable();
    if (typeof renderMonitoringTable === 'function') renderMonitoringTable();
    if (typeof renderRequestsTable === 'function') renderRequestsTable();
    if (typeof renderDatabaseTable === 'function') renderDatabaseTable();
    if (typeof updateStatusCounts === 'function') updateStatusCounts();
    if (typeof updateScheduleNotifications === 'function') updateScheduleNotifications();

    // Call render functions if they exist (instructor pages)
    if (typeof renderInstructorAvailableRooms === 'function') renderInstructorAvailableRooms();
    if (typeof renderMySchedules === 'function') renderMySchedules();
    if (typeof renderMyRequests === 'function') renderMyRequests();
    if (typeof updateInstructorStats === 'function') updateInstructorStats();
}

// ============================================
// LOCALSTORAGE FALLBACK FUNCTIONS
// ============================================

/**
 * Save to localStorage (backup)
 */
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(allRooms));
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(systemLogs));
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_STATUS, JSON.stringify(scheduleStatus));
        localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(pendingRequests));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersDatabase));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

/**
 * Load from localStorage (fallback)
 */
function loadFromLocalStorage() {
    try {
        allRooms = JSON.parse(localStorage.getItem(STORAGE_KEYS.ROOMS)) || DEFAULT_ROOMS;
        systemLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS)) || [];
        scheduleStatus = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCHEDULE_STATUS)) || {};
        pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.REQUESTS)) || [];
        usersDatabase = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [DEFAULT_ADMIN];
        console.log('📦 Loaded from localStorage');
    } catch (e) {
        console.error('Error loading from localStorage:', e);
    }
}

// ============================================
// MAIN FUNCTIONS (Modified for Sync)
// ============================================

/**
 * Save all data - NOW SYNCS TO SERVER!
 */
function saveToStorage() {
    // Save locally only
    saveToLocalStorage();
}

/**
 * Save users database
 */
function saveUsersDatabase() {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(usersDatabase));
    console.log('✅ Users database saved to localStorage only.');
}

/**
 * Save current session
 */
function saveSession(session) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
}

/**
 * Get current session
 */
function getSession() {
    const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return session ? JSON.parse(session) : null;
}

/**
 * Clear current session
 */
function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

/**
 * Add a system log entry
 */
function addLog(action, roomId, user, category, details, status) {
    const log = {
        timestamp: new Date().toISOString(),
        roomId: roomId,
        action: action,
        user: user || 'Anonymous',
        category: category || 'N/A',
        details: details || '',
        status: status || 'N/A'
    };
    systemLogs.unshift(log);
    saveToStorage();
}

/**
 * Clear all system logs
 */
function clearAllLogsData() {
    systemLogs = [];
    scheduleStatus = {};
    allRooms.forEach(room => {
        room.history = [];
    });
    saveToStorage();
}

/**
 * Export all data as JSON
 */
function exportData() {
    return {
        exportDate: new Date().toISOString(),
        rooms: allRooms,
        logs: systemLogs,
        scheduleStatus: scheduleStatus,
        requests: pendingRequests,
        users: usersDatabase
    };
}

/**
 * Reset all data to defaults
 */
function resetAllData() {
    allRooms = [...DEFAULT_ROOMS];
    systemLogs = [];
    scheduleStatus = {};
    pendingRequests = [];
    saveToStorage();
}

// ============================================
// INITIALIZATION
// ============================================

// Initialize sync when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSync);
} else {
    initSync();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        STORAGE_KEYS,
        CATEGORIES,
        DEFAULT_ROOMS,
        allRooms,
        systemLogs,
        scheduleStatus,
        pendingRequests,
        usersDatabase,
        saveToStorage,
        saveUsersDatabase,
        saveSession,
        getSession,
        clearSession,
        addLog,
        clearAllLogsData,
        exportData,
        resetAllData,
        notifyRequestAction,
        isConnected: () => isConnected
    };
}