const roomCache = new Map();

async function fetchRoomInfo(r) {
    try {
        let res = await r.subrequest(`/api/room/${r.variables.room_id}`, { method: 'GET' });

        if (res.status !== 200) {
            r.error(`Failed to fetch room info: ${res.status}`);
            return null;
        }

        let room = JSON.parse(res.responseText);
        r.error(`Debug: Room info fetched: ${JSON.stringify(room)}`);
        return room;
    } catch (error) {
        r.error(`Error fetching room info: ${error}`);
        return null;
    }
}

function checkCache(r) {
    let room = roomCache.get(r.variables.room_id);
    if (room) {
        r.error(`Cache hit for room_id: ${r.variables.room_id}`);
        r.return(200, JSON.stringify(room));
    } else {
        r.error(`Cache miss for room_id: ${r.variables.room_id}`);
        r.return(404);
    }
}

function setCache(r) {
    let room = JSON.parse(r.responseBody);
    roomCache.set(r.variables.room_id, room);
    r.error(`Cached room info: ${JSON.stringify(room)}`);
}

async function routeWebSocket(r) {
    let room = roomCache.get(r.variables.room_id);

    if (!room) {
        r.error(`Cache miss. Fetching room info for: ${r.variables.room_id}`);
        room = await fetchRoomInfo(r);

        if (!room || !room.host) {
            r.error(`Invalid room info for room_id: ${r.variables.room_id}`);
            r.return(404, 'Room not found or invalid');
            return;
        }

        roomCache.set(r.variables.room_id, room); // Cache the result
    } else {
        r.error(`Cache hit for room_id: ${r.variables.room_id}`);
    }

    let proxyUrl = room.host.startsWith('http://') || room.host.startsWith('https://')
        ? room.host
        : `http://${room.host}`;

    r.error(`Routing WebSocket to: ${proxyUrl}`);
    r.variables.proxy_target = proxyUrl;
    r.internalRedirect('@websocket_proxy');
}

export default { routeWebSocket, checkCache, setCache };
