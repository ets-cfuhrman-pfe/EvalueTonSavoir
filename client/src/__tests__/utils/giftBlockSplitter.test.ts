import { splitGiftSource } from 'src/utils/giftBlockSplitter';

describe('splitGiftSource', () => {
    it('splits by blank lines and returns offsets and start lines', () => {
        const source = 'Q1\nline2\n\nQ2';

        const { questions, ranges, blocks } = splitGiftSource(source);

        expect(questions).toEqual(['Q1\nline2', 'Q2']);
        expect(ranges).toEqual([
            { index: 0, start: 0, end: 8 },
            { index: 1, start: 10, end: 12 },
        ]);
        expect(blocks.map((block) => block.startLine)).toEqual([1, 4]);
    });

    it('supports CRLF blank-line separators', () => {
        const source = '::Q1:: 2+2? { =4 }\r\n\r\n::Q2:: 3+3? { =6 }';

        const { questions, blocks } = splitGiftSource(source);

        expect(questions).toHaveLength(2);
        expect(questions[0]).toContain('::Q1::');
        expect(questions[1]).toContain('::Q2::');
        expect(blocks[1].startLine).toBe(3);
    });

    it('ignores whitespace-only blocks', () => {
        const source = '::Q1:: 2+2? { =4 }\n\n   \n\n::Q2:: 3+3? { =6 }';

        const { questions, ranges } = splitGiftSource(source);

        expect(questions).toHaveLength(2);
        expect(ranges.map((range) => range.index)).toEqual([0, 1]);
    });

    it('treats whitespace-only lines as blank line separators', () => {
        const source = 'Q1\n \nQ2\n\t\nQ3';

        const { questions, ranges, blocks } = splitGiftSource(source);

        expect(questions).toEqual(['Q1', 'Q2', 'Q3']);
        expect(ranges).toEqual([
            { index: 0, start: 0, end: 2 },
            { index: 1, start: 5, end: 7 },
            { index: 2, start: 10, end: 12 },
        ]);
        expect(blocks.map((block) => block.startLine)).toEqual([1, 3, 5]);
    });
});