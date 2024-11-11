async function fetchRoomInfo(r) {
    try {
        // Make request to API to get room info
        let res = await r.subrequest(`/api/room/${r.variables.room_id}`);
        
        if (res.status !== 200) {
            r.error(`Failed to fetch room info: ${res.status}`);
            return null;
        }

        return JSON.parse(res.responseText);
    } catch (error) {
        r.error(`Error fetching room info: ${error}`);
        return null;
    }
}

// Main routing function for WebSocket connections
async function routeWebSocket(r) {
    try {
        const roomInfo = await fetchRoomInfo(r);
        
        if (!roomInfo || !roomInfo.host) {
            r.return(404, 'Room not found or invalid');
            return;
        }

        // Route the WebSocket connection to the room's host
        r.internalRedirect(`@quiz_room_${roomInfo.host}`);

    } catch (error) {
        r.error(`WebSocket routing error: ${error}`);
        r.return(500, 'Internal routing error');
    }
}

// Helper function to get room host for dynamic upstream
function getQuizRoomHost(r) {
    const roomInfo = JSON.parse(r.variables.room_info);
    return roomInfo.host || '';
}

export default { routeWebSocket, getQuizRoomHost };