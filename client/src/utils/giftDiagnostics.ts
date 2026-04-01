import { parse, PegjsParseError } from 'gift-pegjs';
import { splitGiftSource } from './giftBlockSplitter';

export interface GiftDiagnosticMarker {
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

export function isPegjsParseError(error: unknown): error is PegjsParseError {
    if (!error || typeof error !== 'object') return false;

    const candidate = error as Partial<PegjsParseError>;

    return Boolean(
        typeof candidate.message === 'string' &&
            candidate.location &&
            typeof candidate.location.start?.line === 'number' &&
            typeof candidate.location.start?.column === 'number' &&
            typeof candidate.location.end?.line === 'number' &&
            typeof candidate.location.end?.column === 'number'
    );
}

type PegjsLikeParseError = PegjsParseError & {
    expected?: unknown;
    found?: unknown;
};

export function buildGiftDiagnosticMarkers(source: string): GiftDiagnosticMarker[] {
    const markers: GiftDiagnosticMarker[] = [];
    const { blocks } = splitGiftSource(source);

    blocks.forEach((block) => {
        try {
            parse(block.text);
        } catch (error) {
            if (isPegjsParseError(error)) {
                const startLineNumber = block.startLine + error.location.start.line - 1;
                const endLineNumber = block.startLine + error.location.end.line - 1;
                const startColumn = Math.max(1, error.location.start.column);
                const endColumn = Math.max(startColumn + 1, error.location.end.column);

                markers.push({
                    message: formatGiftParseErrorMessage(error),
                    startLineNumber,
                    startColumn,
                    endLineNumber,
                    endColumn,
                });
                return;
            }

            const fallbackMessage = error instanceof Error ? error.message : 'Erreur GIFT inconnue';
            markers.push({
                message: fallbackMessage,
                startLineNumber: block.startLine,
                startColumn: 1,
                endLineNumber: block.startLine,
                endColumn: 2,
            });
        }
    });

    return markers;
}

function normalizeToken(value: unknown, fallback: string): string {
    if (value === null || value === undefined) return fallback;

    let raw = '';
    if (typeof value === 'string') {
        raw = value.trim();
    } else if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint' ||
        typeof value === 'symbol'
    ) {
        raw = value.toString().trim();
    } else {
        return fallback;
    }

    if (!raw) return fallback;
    if (raw.startsWith('"') && raw.endsWith('"')) return raw;
    return `"${raw}"`;
}

function extractExpectedAndFound(message: string): { expected: string; found: string } {
    const expectedFoundRegexp = /^Expected\s+(.+)\s+but\s+(.+)\s+found\.?$/i;
    const expectedFoundMatch = expectedFoundRegexp.exec(message);

    if (!expectedFoundMatch) {
        return {
            expected: '"valid GIFT syntax"',
            found: '"unexpected input"',
        };
    }

    return {
        expected: normalizeToken(expectedFoundMatch[1], '"valid GIFT syntax"'),
        found: normalizeToken(expectedFoundMatch[2], '"unexpected input"'),
    };
}

export function formatGiftParseErrorMessage(error: PegjsParseError): string {
    const parseError = error as PegjsLikeParseError;
    const line = Math.max(1, error.location.start.line);
    const column = Math.max(1, error.location.start.column);

    let expected = normalizeToken(parseError.expected, '');
    let found = normalizeToken(parseError.found, '');

    if (!expected || !found) {
        const parsedMessage = extractExpectedAndFound(error.message);
        expected = expected || parsedMessage.expected;
        found = found || parsedMessage.found;
    }

    return `Line ${line}, column ${column}: Expected ${expected}, but ${found} found.`;
}