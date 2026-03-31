import { buildGiftDiagnosticMarkers } from 'src/utils/giftDiagnostics';

describe('buildGiftDiagnosticMarkers', () => {
    it('returns no markers for valid GIFT blocks', () => {
        const source = '::Q1:: 2+2? { =4 ~3 }\n\n::Q2:: 3+3? { =6 ~5 }';

        const markers = buildGiftDiagnosticMarkers(source);

        expect(markers).toEqual([]);
    });

    it('returns a marker for malformed GIFT', () => {
        const source = '::Q1:: Broken question { =A ~B';

        const markers = buildGiftDiagnosticMarkers(source);

        expect(markers).toHaveLength(1);
        expect(markers[0].message).toMatch(/^Line \d+, column \d+: Expected .+ , but .+ found\.$/);
        expect(markers[0].startLineNumber).toBeGreaterThanOrEqual(1);
        expect(markers[0].startColumn).toBeGreaterThanOrEqual(1);
    });

    it('maps parser line numbers to global editor lines across multiple blocks', () => {
        const source = '::Q1:: 2+2? { =4 ~3 }\n\n::Q2:: Broken question { =A ~B';

        const markers = buildGiftDiagnosticMarkers(source);

        expect(markers).toHaveLength(1);
        expect(markers[0].startLineNumber).toBeGreaterThanOrEqual(3);
    });
});