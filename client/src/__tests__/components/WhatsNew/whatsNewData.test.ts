// Validates the real release-notes file, so a bad manual or AI-generated edit fails CI.
import whatsNewJson from 'src/data/whatsNew.json';
import { compareVersions } from 'src/components/WhatsNew/whatsNewStorage';
import { UNRELEASED_VERSION, WhatsNewData } from 'src/Types/WhatsNewType';

const data = whatsNewJson as WhatsNewData;
const nonEmpty = (s: unknown) => typeof s === 'string' && s.trim().length > 0;

describe('whatsNew.json', () => {
    test('has a releases array', () => {
        expect(Array.isArray(data.releases)).toBe(true);
    });

    test('versions are unique and valid', () => {
        const versions = data.releases.map((r) => r.version);
        expect(new Set(versions).size).toBe(versions.length);
        for (const v of versions) {
            expect(v === UNRELEASED_VERSION || /^\d+\.\d+\.\d+$/.test(v)).toBe(true);
        }
    });

    test('published releases are sorted newest first, with a date', () => {
        const published = data.releases.filter((r) => r.version !== UNRELEASED_VERSION);
        for (let i = 1; i < published.length; i++) {
            expect(compareVersions(published[i - 1].version, published[i].version)).toBeGreaterThan(0);
        }
        for (const r of published) {
            expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
    });

    test('every entry has content with non-empty text', () => {
        for (const r of data.releases) {
            expect(Array.isArray(r.features)).toBe(true);
            expect(Array.isArray(r.fixes)).toBe(true);
            expect(r.features.length + r.fixes.length).toBeGreaterThan(0);
            for (const f of r.features) {
                expect(nonEmpty(f.area) && nonEmpty(f.title) && nonEmpty(f.description)).toBe(true);
            }
            for (const f of r.fixes) {
                expect(nonEmpty(f.description)).toBe(true);
            }
        }
    });
});
