import { parse, PegjsParseError } from 'gift-pegjs';
import { splitGiftSource } from './giftBlockSplitter';

export interface GiftDiagnosticMarker {
    message: string;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

function isPegjsParseError(error: unknown): error is PegjsParseError {
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
                    message: error.message,
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