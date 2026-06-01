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
        expect(markers[0].message).toMatch(/^Line \d+, column \d+: Expected .+, but .+ found\.$/);
        expect(markers[0].startLineNumber).toBeGreaterThanOrEqual(1);
        expect(markers[0].startColumn).toBeGreaterThanOrEqual(1);
    });

    it('maps parser line numbers to global editor lines across multiple blocks', () => {
        const source = '::Q1:: 2+2? { =4 ~3 }\n\n::Q2:: Broken question { =A ~B';

        const markers = buildGiftDiagnosticMarkers(source);

        expect(markers).toHaveLength(1);
        expect(markers[0].startLineNumber).toBeGreaterThanOrEqual(3);
    });

    it('correctly reports error line number for multi-line questions with errors', () => {
        // Question 4 starts at line 7 and spans multiple lines until line 11 where the error is
        const source = `::Q1:: 2+2? { =4 ~3 }

::Q2:: 3+3? { =6 ~5 }

::Q3:: Question 3 { =C ~D }

::Q4:: Some question { =A ~B
~C ~D
~ 1=`;

        const markers = buildGiftDiagnosticMarkers(source);

        expect(markers).toHaveLength(1);
        // The error should be reported on the line where it actually occurs (line 9)
        expect(markers[0].startLineNumber).toBe(9);
        // The error message should also show the correct global line number, not just the line within the block
        expect(markers[0].message).toContain('Line 9');
    });
});