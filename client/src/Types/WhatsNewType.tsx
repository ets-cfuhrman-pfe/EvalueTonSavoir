export interface WhatsNewFeature {
    area: string;
    title: string;
    description: string;
}

export interface WhatsNewFix {
    description: string;
}

export interface WhatsNewRelease {
    /** Semver version (e.g. "2.5.0"), or "unreleased" for notes written ahead of a release. */
    version: string;
    /** ISO date (YYYY-MM-DD). Optional on "unreleased" entries. */
    date?: string;
    features: WhatsNewFeature[];
    fixes: WhatsNewFix[];
}

export interface WhatsNewData {
    releases: WhatsNewRelease[];
}

export const UNRELEASED_VERSION = 'unreleased';
