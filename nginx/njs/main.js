function get_cache_dict(r) {
    return '';
}

function getCachedData(r, key) {
    try {
        const cached = ngx.shared.cache.get(key);
        if (cached) {
            const data = JSON.parse(cached);
            const now = Date.now();
            // 2 minutes cache - let game rooms rotate
            if (now - data.timestamp < 120000) {
                r.error(`Debug: Cache hit for ${key}, age: ${(now - data.timestamp)/1000}s`);
                return data.value;
            }
            r.error(`Debug: Cache expired for ${key}, age: ${(now - data.timestamp)/1000}s`);
        }
        return null;
    } catch (error) {
        r.error(`Cache read error: ${error}`);
        return null;
    }
}

function setCachedData(r, key, value) {
    try {
        const data = {
            timestamp: Date.now(),
            value: value
        };
        ngx.shared.cache.set(key, JSON.stringify(data));
        r.error(`Debug: Cached ${key}`);
    } catch (error) {
        r.error(`Cache write error: ${error}`);
    }
}

async function fetchRoomInfo(r) {
    const cacheKey = `room:${r.variables.room_id}`;

    try {
        const cachedRoom = getCachedData(r, cacheKey);
        if (cachedRoom) {
            r.error(`Debug: Room info from cache: ${JSON.stringify(cachedRoom)}`);
            return cachedRoom;
        }

        let res = await r.subrequest('/api/room/' + r.variables.room_id, {
            method: 'GET'
        });

        if (res.status !== 200) {
            r.error(`Failed to fetch room info: ${res.status}`);
            return null;
        }

        let room = JSON.parse(res.responseText);
        setCachedData(r, cacheKey, room);
        r.error(`Debug: Room info fetched and cached: ${JSON.stringify(room)}`);
        return room;

    } catch (error) {
        r.error(`Error fetching/caching room info: ${error}`);
        return null;
    }
}

export default {
    get_cache_dict,
    routeWebSocket: async function(r) {
        try {
            const roomInfo = await fetchRoomInfo(r);

            if (!roomInfo || !roomInfo.host) {
                r.error(`Debug: Invalid room info: ${JSON.stringify(roomInfo)}`);
                r.return(404, 'Room not found or invalid');
                return;
            }

            let proxyUrl = roomInfo.host;
            if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://')) {
                proxyUrl = 'http://' + proxyUrl;
            }

            r.error(`Debug: Original URL: ${r.uri}`);
            r.error(`Debug: Setting proxy target to: ${proxyUrl}`);
            r.error(`Debug: Headers: ${JSON.stringify(r.headersIn)}`);

            r.variables.proxy_target = proxyUrl;
            r.internalRedirect('@websocket_proxy');

        } catch (error) {
            r.error(`WebSocket routing error: ${error}`);
            r.return(500, 'Internal routing error');
        }
    }
};