import fs from 'fs';
import path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

function ensureDirectoryExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

async function saveChart(chartJSNodeCanvas, data, xLabel, yLabel, outputFile, title) {
    const chartConfig = {
        type: 'line',
        data,
        options: {
            scales: {
                x: {
                    title: { display: true, text: xLabel }
                },
                y: {
                    title: { display: true, text: yLabel }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
    fs.writeFileSync(outputFile, buffer);
}

async function generateRoomGraphs(roomId, validRoomData, chartJSNodeCanvas, roomDir) {
    const timeLabels = validRoomData.map(d => new Date(parseInt(d.timestamp)).toLocaleTimeString());

    await Promise.all([
        // Room Memory Usage (MB)
        saveChart(chartJSNodeCanvas, {
            labels: timeLabels,
            datasets: [{
                label: `Room ${roomId} Memory (MB)`,
                data: validRoomData.map(d => parseFloat(d.memoryUsedMB || 0)),
                borderColor: 'blue',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'Memory Usage (MB)', path.join(roomDir, 'memory-usage-mb.png'),
            `Room ${roomId} Memory Usage in MB`),

        // Room Memory Usage (Percentage)
        saveChart(chartJSNodeCanvas, {
            labels: timeLabels,
            datasets: [{
                label: `Room ${roomId} Memory %`,
                data: validRoomData.map(d => parseFloat(d.memoryUsedPercentage || 0)),
                borderColor: 'green',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'Memory Usage %', path.join(roomDir, 'memory-usage-percent.png'),
            `Room ${roomId} Memory Usage Percentage`),

        // Room CPU Usage
        saveChart(chartJSNodeCanvas, {
            labels: timeLabels,
            datasets: [{
                label: `Room ${roomId} CPU Usage %`,
                data: validRoomData.map(d => parseFloat(d.cpuUsedPercentage || 0)),
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'CPU Usage %', path.join(roomDir, 'cpu-usage.png'),
            `Room ${roomId} CPU Impact`)
    ]);
}

async function generateGlobalGraphs(data, chartJSNodeCanvas, globalMetricsDir) {
    await Promise.all([
        saveChart(chartJSNodeCanvas, {
            labels: data.labels,
            datasets: [{
                label: 'Total System Memory Used (MB)',
                data: data.memoryMB,
                borderColor: 'blue',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'Total Memory Usage (MB)', path.join(globalMetricsDir, 'total-system-memory-mb.png')),

        saveChart(chartJSNodeCanvas, {
            labels: data.labels,
            datasets: [{
                label: 'Total System Memory Used %',
                data: data.memoryPercentage,
                borderColor: 'green',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'Total Memory Usage %', path.join(globalMetricsDir, 'total-system-memory-percent.png')),

        saveChart(chartJSNodeCanvas, {
            labels: data.labels,
            datasets: [{
                label: 'Total System CPU Usage %',
                data: data.cpuPercentage,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.4
            }]
        }, 'Time', 'Total CPU Usage %', path.join(globalMetricsDir, 'total-system-cpu.png'))
    ]);
}

async function saveMetricsSummary(metrics, baseOutputDir) {
    const metricsData = metrics.getSummary();

    // Save as JSON
    fs.writeFileSync(
        path.join(baseOutputDir, 'metrics-summary.json'),
        JSON.stringify(metricsData, null, 2)
    );

    // Save as formatted text
    const textSummary = `
Load Test Summary
================

Rooms
-----
Created: ${metricsData.rooms.created}
Failed: ${metricsData.rooms.failed}
Total: ${metricsData.rooms.total}

Users
-----
Connected: ${metricsData.users.connected}
Failed: ${metricsData.users.failed}
Total: ${metricsData.users.total}

Messages
--------
Attempted: ${metricsData.messages.attempted}
Sent: ${metricsData.messages.sent}
Received: ${metricsData.messages.received}

Errors by Category
----------------
${Object.entries(metricsData.errors)
            .map(([category, count]) => `${category}: ${count}`)
            .join('\n')}
`;

    fs.writeFileSync(
        path.join(baseOutputDir, 'metrics-summary.txt'),
        textSummary.trim()
    );
}

export default async function generateMetricsReport(allRoomsData, testMetrics) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseOutputDir = `./output/${timestamp}`;
    ensureDirectoryExists(baseOutputDir);

    if (testMetrics) {
        await saveMetricsSummary(testMetrics, baseOutputDir);
    }

    const globalMetricsDir = path.join(baseOutputDir, 'global');
    ensureDirectoryExists(globalMetricsDir);

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });

    // Process individual room graphs first
    for (const [roomId, roomData] of Object.entries(allRoomsData)) {
        if (!Array.isArray(roomData)) {
            console.warn(`Invalid data format for room ${roomId}`);
            continue;
        }

        const roomDir = path.join(baseOutputDir, `room_${roomId}`);
        ensureDirectoryExists(roomDir);

        const validRoomData = roomData.filter(d => {
            const isValid = d && d.timestamp &&
                typeof d.memoryUsedMB !== 'undefined' &&
                typeof d.memoryUsedPercentage !== 'undefined' &&
                typeof d.cpuUsedPercentage !== 'undefined';
            if (!isValid) {
                console.warn(`Invalid metric data in room ${roomId}:`, d);
            }
            return isValid;
        });

        if (validRoomData.length === 0) {
            console.warn(`No valid data for room ${roomId}`);
            continue;
        }

        await generateRoomGraphs(roomId, validRoomData, chartJSNodeCanvas, roomDir);
    }



    // Process global metrics with time-based averaging
    const timeWindows = {};
    const timeInterval = 1000; // 250ms windows
    const totalRooms = Object.keys(allRoomsData).length;

    // Group data into time windows
    Object.entries(allRoomsData).forEach(([roomId, roomData]) => {
        if (!Array.isArray(roomData)) return;

        roomData.forEach(metric => {
            if (!metric?.timestamp) return;

            const timeWindow = Math.floor(parseInt(metric.timestamp) / timeInterval) * timeInterval;

            if (!timeWindows[timeWindow]) {
                timeWindows[timeWindow] = {
                    rooms: new Map(),
                    roomCount: 0
                };
            }

            if (!timeWindows[timeWindow].rooms.has(roomId)) {
                timeWindows[timeWindow].rooms.set(roomId, {
                    memoryMB: [],
                    memoryPercentage: [],
                    cpuPercentage: []
                });
                timeWindows[timeWindow].roomCount++;
            }

            const roomMetrics = timeWindows[timeWindow].rooms.get(roomId);
            roomMetrics.memoryMB.push(parseFloat(metric.memoryUsedMB || 0));
            roomMetrics.memoryPercentage.push(parseFloat(metric.memoryUsedPercentage || 0));
            roomMetrics.cpuPercentage.push(parseFloat(metric.cpuUsedPercentage || 0));
        });
    });

    // Process only windows with data from all rooms
    const globalMetrics = Object.entries(timeWindows)
        .filter(([_, data]) => data.roomCount === totalRooms) // Only windows with all rooms
        .map(([timestamp, data]) => {
            const totals = Array.from(data.rooms.values()).reduce((acc, room) => {
                // Calculate room averages
                const memoryMBAvg = room.memoryMB.reduce((a, b) => a + b, 0) / room.memoryMB.length;
                const memoryPercentageAvg = room.memoryPercentage.reduce((a, b) => a + b, 0) / room.memoryPercentage.length;
                const cpuPercentageAvg = room.cpuPercentage.reduce((a, b) => a + b, 0) / room.cpuPercentage.length;

                // Sum room averages
                return {
                    memoryMB: acc.memoryMB + memoryMBAvg,
                    memoryPercentage: acc.memoryPercentage + memoryPercentageAvg,
                    cpuPercentage: acc.cpuPercentage + cpuPercentageAvg
                };
            }, { memoryMB: 0, memoryPercentage: 0, cpuPercentage: 0 });

            return {
                timestamp: parseInt(timestamp),
                ...totals
            };
        })
        .sort((a, b) => a.timestamp - b.timestamp);

    // Generate global graphs with complete window data
    const timeLabels = globalMetrics.map(d => new Date(d.timestamp).toLocaleTimeString());
    await generateGlobalGraphs({
        labels: timeLabels,
        memoryMB: globalMetrics.map(d => d.memoryMB),
        memoryPercentage: globalMetrics.map(d => d.memoryPercentage),
        cpuPercentage: globalMetrics.map(d => d.cpuPercentage)
    }, chartJSNodeCanvas, globalMetricsDir);

    return { outputDir: baseOutputDir };
}