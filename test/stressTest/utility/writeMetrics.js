import fs from "fs";
import path from "path";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// Ensure a directory exists, creating it if necessary
function ensureDirectoryExists(directory) {
    try {
        fs.mkdirSync(directory, { recursive: true });
    } catch (err) {
        console.error(`Error creating directory ${directory}:`, err.message);
        throw err;
    }
}

// Write metrics to a JSON file
export function writeMetricsToFile(metrics) {
    if (!metrics.endTime) {
        console.error("Error: metrics.endTime is not defined. Ensure it is set before calling this function.");
        return;
    }

    const directory = `./metrics/${metrics.startTime.toISOString().replace(/[:.]/g, "-")}`;
    const filename = path.join(directory, "metrics_report.json");

    // Ensure the directory exists
    ensureDirectoryExists(directory);

    const metricsData = {
        summary: {
            roomsCreated: metrics.roomsCreated,
            roomsFailed: metrics.roomsFailed,
            teachersConnected: metrics.teachersConnected,
            teachersFailed: metrics.teachersFailed,
            studentsConnected: metrics.studentsConnected,
            studentsFailed: metrics.studentsFailed,
        },
        messages: {
            messagesSent: metrics.messagesSent,
            messagesReceived: metrics.messagesReceived,
            throughput: metrics.throughput.toFixed(2), // Messages per second
        },
        latencies: {
            totalLatency: metrics.totalLatency,
            averageLatency: metrics.teachersConnected + metrics.studentsConnected
                ? (metrics.totalLatency / (metrics.teachersConnected + metrics.studentsConnected)).toFixed(2)
                : null,
            maxLatency: metrics.maxLatency,
            minLatency: metrics.minLatency,
        },
        timing: {
            startTime: metrics.startTime?.toISOString(),
            endTime: metrics.endTime?.toISOString(),
            executionTimeInSeconds: metrics.endTime && metrics.startTime
                ? (metrics.endTime - metrics.startTime) / 1000
                : null,
        },
    };

    // Write metrics to a file
    fs.writeFile(filename, JSON.stringify(metricsData, null, 4), (err) => {
        if (err) {
            console.error(`Error writing metrics to file:`, err.message);
        } else {
            console.log(`Metrics saved to file: ${filename}`);
        }
    });
}

// Generate charts for resource data
export async function generateGraphs(resourceData, metrics) {
    if (!metrics.endTime) {
        console.error("Error: metrics.endTime is not defined. Ensure it is set before calling this function.");
        return;
    }

    const directory = `./metrics/${metrics.startTime.toISOString().replace(/[:.]/g, "-")}`;
    ensureDirectoryExists(directory);

    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 600 });

    // Aggregated data for all containers
    const aggregatedTimestamps = [];
    const aggregatedMemoryUsage = [];
    const aggregatedCpuUserPercentage = [];
    const aggregatedCpuSystemPercentage = [];

    // Generate charts for individual containers
    for (const [roomId, data] of Object.entries(resourceData)) {
        if (!data || !data.length) {
            console.warn(`No data available for room ${roomId}. Skipping individual charts.`);
            continue;
        }

        // Extract data
        const timestamps = data.map((point) => new Date(point.timestamp).toLocaleTimeString());
        const memoryUsage = data.map((point) => (point.memory.rss || 0) / (1024 * 1024)); // MB
        const cpuUserPercentage = data.map((point) => point.cpu.userPercentage || 0);
        const cpuSystemPercentage = data.map((point) => point.cpu.systemPercentage || 0);

        // Update aggregated data
        data.forEach((point, index) => {
            if (!aggregatedTimestamps[index]) {
                aggregatedTimestamps[index] = timestamps[index];
                aggregatedMemoryUsage[index] = 0;
                aggregatedCpuUserPercentage[index] = 0;
                aggregatedCpuSystemPercentage[index] = 0;
            }
            aggregatedMemoryUsage[index] += memoryUsage[index];
            aggregatedCpuUserPercentage[index] += cpuUserPercentage[index];
            aggregatedCpuSystemPercentage[index] += cpuSystemPercentage[index];
        });

        // Memory usage chart
        await saveChart(
            chartJSNodeCanvas,
            {
                labels: timestamps,
                datasets: [
                    {
                        label: "Memory Usage (MB)",
                        data: memoryUsage,
                        borderColor: "blue",
                        fill: false,
                    },
                ],
            },
            "Time",
            "Memory Usage (MB)",
            path.join(directory, `memory-usage-room-${roomId}.png`)
        );

        // CPU usage chart
        await saveChart(
            chartJSNodeCanvas,
            {
                labels: timestamps,
                datasets: [
                    {
                        label: "CPU User Usage (%)",
                        data: cpuUserPercentage,
                        borderColor: "red",
                        fill: false,
                    },
                    {
                        label: "CPU System Usage (%)",
                        data: cpuSystemPercentage,
                        borderColor: "orange",
                        fill: false,
                    },
                ],
            },
            "Time",
            "CPU Usage (%)",
            path.join(directory, `cpu-usage-room-${roomId}.png`)
        );

        console.log(`Charts generated for room ${roomId}`);
    }

    // Ensure aggregated data is not empty
    if (!aggregatedTimestamps.length) {
        console.error("Error: Aggregated data is empty. Verify container data.");
        return;
    }

    // Aggregated memory usage chart
    await saveChart(
        chartJSNodeCanvas,
        {
            labels: aggregatedTimestamps,
            datasets: [
                {
                    label: "Total Memory Usage (MB)",
                    data: aggregatedMemoryUsage,
                    borderColor: "blue",
                    fill: false,
                },
            ],
        },
        "Time",
        "Memory Usage (MB)",
        path.join(directory, "aggregated-memory-usage.png")
    );

    // Aggregated CPU usage chart
    await saveChart(
        chartJSNodeCanvas,
        {
            labels: aggregatedTimestamps,
            datasets: [
                {
                    label: "Total CPU User Usage (%)",
                    data: aggregatedCpuUserPercentage,
                    borderColor: "red",
                    fill: false,
                },
                {
                    label: "Total CPU System Usage (%)",
                    data: aggregatedCpuSystemPercentage,
                    borderColor: "orange",
                    fill: false,
                },
            ],
        },
        "Time",
        "CPU Usage (%)",
        path.join(directory, "aggregated-cpu-usage.png")
    );

    console.log("Aggregated charts generated.");
}

// Helper function to save a chart
async function saveChart(chartJSNodeCanvas, data, xLabel, yLabel, outputFile) {
    const chartConfig = {
        type: "line",
        data,
        options: {
            scales: {
                x: { title: { display: true, text: xLabel } },
                y: { title: { display: true, text: yLabel } },
            },
        },
    };
    const chartBuffer = await chartJSNodeCanvas.renderToBuffer(chartConfig);
    fs.writeFileSync(outputFile, chartBuffer);
}
