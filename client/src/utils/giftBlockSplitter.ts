export interface GiftSplitBlock {
    index: number;
    text: string;
    startOffset: number;
    endOffset: number;
    startLine: number;
}

export interface GiftQuestionRange {
    index: number;
    start: number;
    end: number;
}

export interface SplitGiftSourceResult {
    blocks: GiftSplitBlock[];
    questions: string[];
    ranges: GiftQuestionRange[];
}

function countLineBreaks(value: string): number {
    const matches = value.match(/\n/g);
    return matches ? matches.length : 0;
}

/**
 * Splits a GIFT source into non-empty blocks separated by one or more blank lines.
 * Supports both LF and CRLF line breaks while tracking absolute offsets and line starts.
 */
export function splitGiftSource(source: string): SplitGiftSourceResult {
    if (!source.trim()) {
        return { blocks: [], questions: [], ranges: [] };
    }

    const blocks: GiftSplitBlock[] = [];
    const questions: string[] = [];
    const ranges: GiftQuestionRange[] = [];
    const separatorRegex = /\r?\n(?:[ \t]*\r?\n)+/g;

    let blockStartOffset = 0;
    let blockStartLine = 1;
    let match: RegExpExecArray | null;

    while ((match = separatorRegex.exec(source)) !== null) {
        const separatorStartOffset = match.index;
        const separatorText = match[0];
        const blockText = source.slice(blockStartOffset, separatorStartOffset);

        if (blockText.trim()) {
            const index = questions.length;
            const block = {
                index,
                text: blockText,
                startOffset: blockStartOffset,
                endOffset: blockStartOffset + blockText.length,
                startLine: blockStartLine,
            };

            blocks.push(block);
            questions.push(blockText);
            ranges.push({
                index,
                start: block.startOffset,
                end: block.endOffset,
            });
        }

        const consumedChunk = source.slice(
            blockStartOffset,
            separatorStartOffset + separatorText.length
        );
        blockStartLine += countLineBreaks(consumedChunk);
        blockStartOffset = separatorStartOffset + separatorText.length;
    }

    const tailText = source.slice(blockStartOffset);
    if (tailText.trim()) {
        const index = questions.length;
        const block = {
            index,
            text: tailText,
            startOffset: blockStartOffset,
            endOffset: blockStartOffset + tailText.length,
            startLine: blockStartLine,
        };

        blocks.push(block);
        questions.push(tailText);
        ranges.push({
            index,
            start: block.startOffset,
            end: block.endOffset,
        });
    }

    return { blocks, questions, ranges };
}