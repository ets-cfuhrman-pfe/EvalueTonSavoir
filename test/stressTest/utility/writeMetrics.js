import fs from 'fs';

/**
 * Écrit les métriques dans un fichier JSON.
 * @param {string} filename - Nom du fichier où écrire les métriques.
 * @param {Object} metrics - Objet contenant les métriques à enregistrer.
 */
export function writeMetricsToFile(metrics) {
    const metricsData = {
        ...metrics,
        startTime: metrics.startTime?.toISOString(),
        endTime: metrics.endTime?.toISOString(),
        executionTime: metrics.endTime && metrics.startTime
            ? (metrics.endTime - metrics.startTime) / 1000
            : null,
        memoryUsage: process.memoryUsage(),
    };

    fs.writeFile(`metrics_report_${Date.now()}`, JSON.stringify(metricsData, null, 4), (err) => {
        if (err) {
            console.error('Erreur lors de l\'écriture des métriques dans le fichier :', err.message);
        } else {
            console.log(`Métriques enregistrées dans le fichier metrics_report_${Date.now()}.`);
        }
    });
}
