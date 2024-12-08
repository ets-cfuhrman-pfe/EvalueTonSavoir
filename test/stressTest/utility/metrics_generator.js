import fs from 'fs';
import path from 'path';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

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

// Common chart configurations
const CHART_CONFIG = {
    width: 800,
    height: 400,
    chartStyles: {
        memory: {
            borderColor: 'blue',
            backgroundColor: 'rgba(54, 162, 235, 0.2)'
        },
        memoryPercent: {
            borderColor: 'green', 
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
        },
        cpu: {
            borderColor: 'red',
            backgroundColor: 'rgba(255, 99, 132, 0.2)'
        }
    }
};

const createBaseChartConfig = (labels, dataset, xLabel, yLabel) => ({
    type: 'line',
    data: {
        labels,
        datasets: [dataset]
    },
    options: {
        scales: {
            x: { title: { display: true, text: xLabel }},
            y: { title: { display: true, text: yLabel }}
        },
        plugins: {
            legend: { display: true, position: 'top' }
        }
    }
});

function ensureDirectoryExists(directory) {
    !fs.existsSync(directory) && fs.mkdirSync(directory, { recursive: true });
}

async function generateMetricsChart(chartJSNodeCanvas, data, style, label, timeLabels, metric, outputPath) {
    const dataset = {
        label,
        data: data.map(m => m[metric] || 0),
        ...CHART_CONFIG.chartStyles[style],
        fill: true,
        tension: 0.4
    };

    const buffer = await chartJSNodeCanvas.renderToBuffer(
        createBaseChartConfig(timeLabels, dataset, 'Time', label)
    );
    
    return fs.promises.writeFile(outputPath, buffer);
}

async function generateContainerCharts(chartJSNodeCanvas, containerData, outputDir) {
    const timeLabels = containerData.metrics.map(m => 
        new Date(m.timestamp).toLocaleTimeString()
    );

    const chartPromises = [
        generateMetricsChart(
            chartJSNodeCanvas,
            containerData.metrics,
            'memory',
            `${containerData.containerName} Memory (MB)`,
            timeLabels,
            'memoryUsedMB',
            path.join(outputDir, 'memory-usage-mb.png')
        ),
        generateMetricsChart(
            chartJSNodeCanvas,
            containerData.metrics,
            'memoryPercent',
            `${containerData.containerName} Memory %`,
            timeLabels,
            'memoryUsedPercentage', 
            path.join(outputDir, 'memory-usage-percent.png')
        ),
        generateMetricsChart(
            chartJSNodeCanvas,
            containerData.metrics,
            'cpu',
            `${containerData.containerName} CPU %`,
            timeLabels,
            'cpuUsedPercentage',
            path.join(outputDir, 'cpu-usage.png')
        )
    ];

    await Promise.all(chartPromises);
}

async function processSummaryMetrics(containers, timeLabels) {
    return timeLabels.map((_, timeIndex) => ({
        memoryUsedMB: containers.reduce((sum, container) =>
            sum + (container.metrics[timeIndex]?.memoryUsedMB || 0), 0),
        memoryUsedPercentage: containers.reduce((sum, container) =>
            sum + (container.metrics[timeIndex]?.memoryUsedPercentage || 0), 0),
        cpuUsedPercentage: containers.reduce((sum, container) =>
            sum + (container.metrics[timeIndex]?.cpuUsedPercentage || 0), 0)
    }));
}

export default async function generateMetricsReport(allRoomsData, testMetrics) {
    try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const baseOutputDir = `./output/${timestamp}`;
        const dirs = [
            baseOutputDir,
            path.join(baseOutputDir, 'all-containers'),
            path.join(baseOutputDir, 'all-rooms')
        ];
        
        dirs.forEach(ensureDirectoryExists);

        if (testMetrics) {
            await saveMetricsSummary(testMetrics, baseOutputDir);
        }

        const chartJSNodeCanvas = new ChartJSNodeCanvas(CHART_CONFIG);
        const allContainers = Object.values(allRoomsData).flat();
        const roomContainers = allContainers.filter(c => 
            c.containerName.startsWith('room_')
        );

        if (allContainers.length > 0) {
            const timeLabels = allContainers[0].metrics.map(m =>
                new Date(m.timestamp).toLocaleTimeString()
            );
            const summedMetrics = await processSummaryMetrics(allContainers, timeLabels);
            await generateContainerSummaryCharts(
                chartJSNodeCanvas, 
                summedMetrics, 
                timeLabels,
                path.join(baseOutputDir, 'all-containers')
            );
        }

        if (roomContainers.length > 0) {
            const timeLabels = roomContainers[0].metrics.map(m =>
                new Date(m.timestamp).toLocaleTimeString()
            );
            const summedMetrics = await processSummaryMetrics(roomContainers, timeLabels);
            await generateContainerSummaryCharts(
                chartJSNodeCanvas,
                summedMetrics,
                timeLabels, 
                path.join(baseOutputDir, 'all-rooms')
            );
        }

        // Process individual containers
        const containerPromises = Object.values(allRoomsData)
            .flat()
            .filter(container => !container.containerName.startsWith('room_'))
            .map(async containerData => {
                const containerDir = path.join(baseOutputDir, containerData.containerName);
                ensureDirectoryExists(containerDir);
                await generateContainerCharts(chartJSNodeCanvas, containerData, containerDir);
            });

        await Promise.all(containerPromises);

        return { outputDir: baseOutputDir };
    } catch (error) {
        console.error('Error generating metrics report:', error);
        throw error;
    }
}

async function generateContainerSummaryCharts(chartJSNodeCanvas, metrics, timeLabels, outputDir) {
    await Promise.all([
        generateMetricsChart(
            chartJSNodeCanvas,
            metrics,
            'memory',
            'Total Memory (MB)',
            timeLabels,
            'memoryUsedMB',
            path.join(outputDir, 'total-memory-usage-mb.png')
        ),
        generateMetricsChart(
            chartJSNodeCanvas,
            metrics,
            'memoryPercent', 
            'Total Memory %',
            timeLabels,
            'memoryUsedPercentage',
            path.join(outputDir, 'total-memory-usage-percent.png')
        ),
        generateMetricsChart(
            chartJSNodeCanvas,
            metrics,
            'cpu',
            'Total CPU %', 
            timeLabels,
            'cpuUsedPercentage',
            path.join(outputDir, 'total-cpu-usage.png')
        )
    ]);
}