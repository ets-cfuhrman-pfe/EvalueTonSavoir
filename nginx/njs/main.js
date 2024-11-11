async function fetchRoomInfo(r) {
    try {
        // Make request to API to get room info
        let res = await r.subrequest('/api/room/' + r.variables.room_id, {
            method: 'GET'
        });
        
        if (res.status !== 200) {
            r.error(`Failed to fetch room info: ${res.status}`);
            return null;
        }
        
        let room = JSON.parse(res.responseText);
        r.error(`Debug: Room info: ${JSON.stringify(room)}`); // Debug log
        return room;
    } catch (error) {
        r.error(`Error fetching room info: ${error}`);
        return null;
    }
}

async function routeWebSocket(r) {
    try {
        const roomInfo = await fetchRoomInfo(r);
        
        if (!roomInfo || !roomInfo.host) {
            r.error(`Debug: Invalid room info: ${JSON.stringify(roomInfo)}`);
            r.return(404, 'Room not found or invalid');
            return;
        }

        // Make sure the host includes protocol if not already present
        let proxyUrl = roomInfo.host;
        if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://')) {
            proxyUrl = 'http://' + proxyUrl;
        }

        r.error(`Debug: Original URL: ${r.uri}`);
        r.error(`Debug: Setting proxy target to: ${proxyUrl}`);
        r.error(`Debug: Headers: ${JSON.stringify(r.headersIn)}`);
        
        // Set the proxy target variable
        r.variables.proxy_target = proxyUrl;
        
        // Redirect to the websocket proxy
        r.internalRedirect('@websocket_proxy');
        
    } catch (error) {
        r.error(`WebSocket routing error: ${error}`);
        r.return(500, 'Internal routing error');
    }
}

export default { routeWebSocket };