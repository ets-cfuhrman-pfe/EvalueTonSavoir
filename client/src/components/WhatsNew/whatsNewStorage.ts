import whatsNewJson from '../../data/whatsNew.json';
import { UNRELEASED_VERSION, WhatsNewData, WhatsNewRelease } from '../../Types/WhatsNewType';

export const LAST_SEEN_STORAGE_KEY = 'ets.whatsNew.lastSeen';

/** Releases shown to users: newest first, "unreleased" drafts excluded. */
export function getPublishedReleases(data: WhatsNewData = whatsNewJson as WhatsNewData): WhatsNewRelease[] {
    return (data?.releases ?? [])
        .filter((r) => r.version && r.version !== UNRELEASED_VERSION)
        .sort((a, b) => compareVersions(b.version, a.version));
}

/** Compares "X.Y.Z" versions. Returns >0 if a is newer than b. */
export function compareVersions(a: string, b: string): number {
    const pa = a.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
    const pb = b.split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
        if (diff !== 0) return diff;
    }
    return 0;
}

export function getLastSeenVersion(): string | null {
    try {
        return window.localStorage.getItem(LAST_SEEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function markSeen(version: string): void {
    try {
        window.localStorage.setItem(LAST_SEEN_STORAGE_KEY, version);
    } catch {
        // Storage unavailable (private mode, blocked): the badge simply reappears next visit.
    }
}

export function formatReleaseDate(date?: string): string {
    if (!date) return '';
    const parsed = new Date(`${date}T12:00:00`);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function plural(count: number, singular: string, pluralForm: string): string {
    return `${count} ${count > 1 ? pluralForm : singular}`;
}

export function isUnseen(latestVersion: string | undefined, lastSeen: string | null): boolean {
    if (!latestVersion) return false;
    if (!lastSeen) return true;
    return compareVersions(latestVersion, lastSeen) > 0;
}
