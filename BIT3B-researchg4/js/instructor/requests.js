/* ============================================
   CTU Room Management System - Instructor Requests
   ============================================ */

/**
 * Open request modal for a room
 * @param {number} roomId - Room ID
 */
function openRequestModal(roomId) {
    selectedRoomForRequest = roomId;
    const room = allRooms.find(r => r.id === roomId);

    document.getElementById('requestRoomNumber').textContent = `Room ${room.id}`;
    document.getElementById('requestRoomCategory').textContent = room.category;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('requestDate').min = today;
    document.getElementById('requestDate').value = today;

    document.getElementById('requestStartTime').value = '';
    document.getElementById('requestEndTime').value = '';
    document.getElementById('requestPurpose').value = '';
    document.getElementById('conflictWarning').style.display = 'none';

    document.getElementById('requestModal').style.display = 'flex';
}

/**
 * Close request modal
 */
function closeRequestModal() {
    document.getElementById('requestModal').style.display = 'none';
    selectedRoomForRequest = null;
}

/**
 * Submit room request
 */
function submitRequest() {
    const session = getSession();
    if (!session) {
        alert('Please log in again');
        return;
    }

    const requestStatus = document.querySelector('input[name="requestStatus"]:checked').value;
    console.log('📋 Request Status Selected:', requestStatus);  // DEBUG

    const date = document.getElementById('requestDate').value;
    const startTime = document.getElementById('requestStartTime').value;
    const endTime = document.getElementById('requestEndTime').value;
    const purpose = document.getElementById('requestPurpose').value.trim();

    console.log('📅 Request Date:', date);  // DEBUG
    console.log('⏰ Start Time:', startTime);  // DEBUG
    console.log('⏰ End Time:', endTime);  // DEBUG

    if (!date || !startTime || !endTime) {
        alert('Please fill in all date and time fields');
        return;
    }

    // Check if selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);  // Reset to midnight
    const todayString = today.toISOString().split('T')[0];

    console.log('📆 Today:', todayString);  // DEBUG
    console.log('🔍 Date comparison:', date, 'vs', todayString, '| Past?', date < todayString);  // DEBUG

    if (date < todayString) {
        alert('❌ Cannot schedule for past dates.\n\nToday: ' + todayString + '\nYour date: ' + date + '\n\nPlease select today or a future date.');
        return;
    }

    if (startTime >= endTime) {
        alert('End time must be after start time');
        return;
    }

    const room = allRooms.find(r => r.id === selectedRoomForRequest);

    if (checkTimeConflict(room, date, startTime, endTime)) {
        document.getElementById('conflictWarning').style.display = 'flex';
        return;
    }

    const request = {
        id: Date.now(),
        roomId: selectedRoomForRequest,
        roomCategory: room.category,
        instructor: session.username,
        date: date,
        startTime: startTime,
        endTime: endTime,
        purpose: purpose,
        requestedStatus: requestStatus,
        status: 'pending',
        requestedAt: new Date().toISOString()
    };

    console.log('📋 Full Request Object:', request);  // DEBUG
    pendingRequests.push(request);
    saveToStorage();

    if (typeof notifyRequestAction === 'function') {
        notifyRequestAction({
            type: 'new_request',
            action: 'submitted',
            user: session.username,
            roomId: selectedRoomForRequest,
            instructor: session.username,
            title: 'New Room Request',
            message: `${session.username} has submitted a request for Room ${selectedRoomForRequest}`,
            timestamp: new Date().toISOString()
        });
    }

    addLog(
        'request',
        selectedRoomForRequest,
        session.username,
        room.category,
        `Request: ${requestStatus} status for ${date} ${startTime}-${endTime} - ${purpose}`,
        'Pending'
    );

    alert('Request submitted successfully! Please wait for admin approval.');
    closeRequestModal();
    updateInstructorStats();
}

/**
 * Render my schedules
 */
function renderMySchedules() {
    const list = document.getElementById('mySchedulesList');
    const noData = document.getElementById('noMySchedules');

    const session = getSession();
    if (!session) return;

    // Get all scheduled entries from allRooms where this instructor is scheduled
    const myScheduledItems = [];
    allRooms.forEach(room => {
        if (room.type === 'register' && room.schedules) {
            room.schedules.forEach(schedule => {
                if (schedule.instructor === session.username) {
                    myScheduledItems.push({
                        roomId: room.id,
                        roomCategory: room.category,
                        roomStatus: room.status,  // Include the room status
                        ...schedule
                    });
                }
            });
        }
    });

    if (myScheduledItems.length === 0) {
        list.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';

    list.innerHTML = myScheduledItems.map(item => `
        <div class="schedule-item">
            <div class="item-header">
                <span class="item-room">Room ${item.roomId} ${item.roomCategory}</span>
                <span class="item-status status-${item.queueStatus || 'active'}">
                    ${item.queueStatus === 'standby' ? '⏳ Standby' : '✓ Active'}
                </span>
            </div>
            <div class="item-details">
                <strong>Date:</strong> ${formatDateShort(item.date)}<br>
                <strong>Time:</strong> ${item.startTime} - ${item.endTime}<br>
                <strong>Purpose:</strong> ${item.purpose || 'N/A'}<br>
                <strong style="color: ${item.roomStatus === 'Locked' ? '#e74c3c' : item.roomStatus === 'Meeting' ? '#9b59b6' : '#f39c12'};">
                    🔍 Room Status: ${item.roomStatus}
                </strong><br>
                ${item.queueStatus === 'standby' ? '<strong style="color: #ff9800;">⏳ Status:</strong> Waiting for previous schedule to end<br>' : ''}
            </div>
        </div>
    `).join('');
}

/**
 * Render my pending requests
 */
function renderMyRequests() {
    const list = document.getElementById('pendingRequestsList');
    const noData = document.getElementById('noPendingRequests');

    const session = getSession();
    if (!session) return;

    const myRequests = pendingRequests.filter(r => r.instructor === session.username);

    if (myRequests.length === 0) {
        list.innerHTML = '';
        noData.style.display = 'block';
        return;
    }

    noData.style.display = 'none';

    list.innerHTML = myRequests.map(request => {
        const statusClass = request.status === 'approved' ? 'approved' :
            request.status === 'rejected' ? 'rejected' : 'pending';
        const statusText = request.status.charAt(0).toUpperCase() + request.status.slice(1);

        return `
            <div class="request-item">
                <div class="item-header">
                    <span class="item-room">Room ${request.roomId} ${request.roomCategory}</span>
                    <span class="item-status status-${statusClass}">${statusText}</span>
                </div>
                <div class="item-details">
                    <strong>Requested Status:</strong> ${request.requestedStatus || 'N/A'}<br>
                    <strong>Date:</strong> ${formatDateShort(request.date)}<br>
                    <strong>Time:</strong> ${request.startTime} - ${request.endTime}<br>
                    <strong>Purpose:</strong> ${request.purpose || 'N/A'}<br>
                    <strong>Requested:</strong> ${new Date(request.requestedAt).toLocaleDateString()}
                </div>
            </div>
        `;
    }).join('');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openRequestModal,
        closeRequestModal,
        submitRequest,
        renderMySchedules,
        renderMyRequests
    };
}