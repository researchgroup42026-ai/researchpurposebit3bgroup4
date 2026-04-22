/* ============================================
   CTU Room Management System - Admin Requests
   ============================================ */

/**
 * Render requests table
 * @param {string} filter - Filter by status ('all', 'pending', 'approved', 'rejected')
 */
function renderRequestsTable(filter = 'all') {
    const tbody = document.getElementById('requestsBody');
    const table = document.getElementById('requestsTable');
    const noMsg = document.getElementById('noRequestsMsg');

    if (!tbody) return;

    // Get today's date to filter only today's requests
    const today = new Date().toISOString().split('T')[0];

    let filteredRequests = pendingRequests.filter(r => r.date === today);
    if (filter !== 'all') {
        filteredRequests = filteredRequests.filter(r => r.status === filter);
    }

    // Update summary counts (only for today's requests)
    const todayRequests = pendingRequests.filter(r => r.date === today);
    document.getElementById('totalRequestsCount').textContent = todayRequests.length;
    document.getElementById('pendingRequestsCount').textContent = todayRequests.filter(r => r.status === 'pending').length;
    document.getElementById('approvedRequestsCount').textContent = todayRequests.filter(r => r.status === 'approved').length;
    document.getElementById('rejectedRequestsCount').textContent = todayRequests.filter(r => r.status === 'rejected').length;

    if (filteredRequests.length === 0) {
        tbody.innerHTML = '';
        if (noMsg) noMsg.style.display = 'block';
        if (table) table.style.display = 'none';
        return;
    }

    if (noMsg) noMsg.style.display = 'none';
    if (table) table.style.display = 'table';

    tbody.innerHTML = filteredRequests.map(req => `
        <tr>
            <td><strong>#${req.id.toString().slice(-6)}</strong></td>
            <td>${req.instructor}</td>
            <td><strong>Room ${req.roomId}</strong></td>
            <td>${req.roomCategory}</td>
            <td>
                <div>${formatDateShort(req.date)}</div>
                <div style="font-size: 0.85rem; color: #666;">${req.startTime} - ${req.endTime}</div>
            </td>
            <td>
                <div style="font-size: 0.85rem; margin-bottom: 4px;">${req.requestType === 'meeting' ? '📞 Schedule Meeting' : '🔑 Using a Room'}</div>
                <div>${req.purpose || 'N/A'}</div>
            </td>
            <td><span class="request-status status-${req.status}">${req.status}</span></td>
            <td>
                <div class="request-actions">
                    ${req.status === 'pending' ? `
                        <button class="btn-approve" onclick="approveRequest(${req.id})">✓ Approve</button>
                        <button class="btn-reject" onclick="rejectRequest(${req.id})">✗ Reject</button>
                    ` : '<span style="color: #999; font-size: 0.85rem;">Processed</span>'}
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Filter requests by status
 * @param {string} status - Status to filter by
 */
function filterRequests(status) {
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderRequestsTable(status);
}

/**
 * Approve a request
 * @param {number} requestId - Request ID
 */
function approveRequest(requestId) {
    const session = getSession();
    if (!session) return;

    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    if (!confirm(`Approve request for Room ${request.roomId} by ${request.instructor}?`)) return;

    // Find the base room (type 'register')
    const baseRoom = allRooms.find(r => r.type === 'register' && r.id === request.roomId);
    if (!baseRoom) {
        alert('Room not found!');
        return;
    }

    // Initialize schedules array if it doesn't exist
    if (!baseRoom.schedules) {
        baseRoom.schedules = [];
    }

    // Check if this request has already been approved (prevents duplicates across devices)
    const alreadyApproved = baseRoom.schedules.some(s => s.requestId === request.id);
    if (alreadyApproved) {
        alert('This request has already been approved!');
        return;
    }

    request.status = 'approved';
    request.approvedAt = new Date().toISOString();
    request.approvedBy = session.username;

    console.log('✅ Approving Request:', {
        id: request.id,
        instructor: request.instructor,
        requestedStatus: request.requestedStatus,
        roomId: request.roomId
    });

    // Determine queue status based on time overlap with existing schedules
    let queueStatus = 'active'; // Default to active
    if (baseRoom.schedules.length > 0) {
        // Check if this time slot overlaps with existing schedules
        const hasOverlap = baseRoom.schedules.some(s =>
            timeToMinutes(request.startTime) < timeToMinutes(s.endTime) &&
            timeToMinutes(request.endTime) > timeToMinutes(s.startTime)
        );
        if (hasOverlap) {
            queueStatus = 'standby'; // This instructor will wait until the active one finishes
        }
    }

    // Update room status based on instructor's requested status
    const statusMap = {
        'locked': 'Locked',
        'meeting': 'Meeting',
        'maintenance': 'Maintenance'
    };
    const newStatus = statusMap[request.requestedStatus] || 'Available';

    console.log('🔧 Status Mapping:', {
        requestedStatus: request.requestedStatus,
        statusMapValue: statusMap[request.requestedStatus],
        finalStatus: newStatus
    });

    baseRoom.status = newStatus;
    console.log('🏠 Room Status Updated:', { roomId: baseRoom.id, newStatus: baseRoom.status });

    // Add this instructor to the schedule queue
    baseRoom.schedules.push({
        requestId: request.id,  // CRITICAL: Store request ID to prevent duplicates
        date: request.date,
        instructor: request.instructor,
        startTime: request.startTime,
        endTime: request.endTime,
        purpose: request.purpose || request.requestedStatus,
        requestedStatus: request.requestedStatus,
        requestedRoomStatus: newStatus,  // Store the requested room status
        queueStatus: queueStatus,  // active or standby
        approvedAt: request.approvedAt,
        approvedBy: session.username
    });

    // Sort schedules by date and start time
    baseRoom.schedules.sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });

    // Update room info to reflect current schedule
    baseRoom.date = request.date;
    baseRoom.startTime = baseRoom.schedules[0].startTime;
    baseRoom.endTime = baseRoom.schedules[0].endTime;
    baseRoom.instructor = baseRoom.schedules[0].instructor;

    // Update history
    baseRoom.history = baseRoom.history || [];
    baseRoom.history.push(
        `${new Date().toLocaleTimeString()} - ${request.instructor} scheduled (${request.date} ${request.startTime}-${request.endTime}, ${queueStatus}) - Status: ${newStatus}`
    );

    // CRITICAL: Remove all duplicate 'schedule' type rooms for this room ID to prevent duplicates
    const duplicateScheduleRooms = allRooms.filter(r =>
        r.type === 'schedule' &&
        r.id === request.roomId
    );
    duplicateScheduleRooms.forEach(dup => {
        const idx = allRooms.indexOf(dup);
        if (idx !== -1) allRooms.splice(idx, 1);
    });

    addLog('approve', request.roomId, request.instructor, request.roomCategory,
        `Approved: ${request.date} ${request.startTime}-${request.endTime} (${queueStatus})`, 'Meeting');

    saveToStorage();
    renderRequestsTable();
    updateRequestsSidebar();
    updateStatusCounts();

    alert('Request approved successfully! Room has been scheduled.');
}

/**
 * Reject a request
 * @param {number} requestId - Request ID
 */
function rejectRequest(requestId) {
    const session = getSession();
    if (!session) return;

    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    const reason = prompt(`Reject request for Room ${request.roomId} by ${request.instructor}?\n\nEnter reason (optional):`);
    if (reason === null) return;

    request.status = 'rejected';
    request.rejectedAt = new Date().toISOString();
    request.rejectedBy = session.username;
    request.rejectionReason = reason;

    addLog('reject', request.roomId, request.instructor, request.roomCategory,
        `Rejected${reason ? ': ' + reason : ''}`, 'Rejected');

    saveToStorage();
    renderRequestsTable();
    updateRequestsSidebar();

    alert('Request rejected.');
}

/**
 * Update requests sidebar statistics
 */
function updateRequestsSidebar() {
    const pending = pendingRequests.filter(r => r.status === 'pending').length;
    const today = new Date().toISOString().split('T')[0];
    const approvedToday = pendingRequests.filter(r =>
        r.status === 'approved' && r.approvedAt && r.approvedAt.startsWith(today)
    ).length;
    const rejectedToday = pendingRequests.filter(r =>
        r.status === 'rejected' && r.rejectedAt && r.rejectedAt.startsWith(today)
    ).length;

    const pendingEl = document.getElementById('pendingCountSidebar');
    const approvedEl = document.getElementById('approvedTodaySidebar');
    const rejectedEl = document.getElementById('rejectedTodaySidebar');

    if (pendingEl) pendingEl.textContent = pending;
    if (approvedEl) approvedEl.textContent = approvedToday;
    if (rejectedEl) rejectedEl.textContent = rejectedToday;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        renderRequestsTable,
        filterRequests,
        approveRequest,
        rejectRequest,
        updateRequestsSidebar
    };
}
