import { readZip } from '../../testUtils/readZip';
import {
    getQuizShareUrl,
    getFolderShareUrl,
    buildQuizLinkList,
    sanitizeFileName,
    quizToGift,
    buildFolderGiftZip,
    downloadBlob,
    crc32,
} from '../../utils/folderShare';

const origin = window.location.origin;

describe('folderShare utils', () => {
    describe('share URLs', () => {
        it('builds the quiz share URL on the current origin', () => {
            expect(getQuizShareUrl('abc')).toBe(`${origin}/teacher/share/abc`);
        });

        it('builds the folder share URL on the current origin', () => {
            expect(getFolderShareUrl('f1')).toBe(`${origin}/teacher/share-folder/f1`);
        });
    });

    describe('buildQuizLinkList', () => {
        it('returns an empty string for no quizzes', () => {
            expect(buildQuizLinkList([])).toBe('');
        });

        it('lists every quiz title with its link', () => {
            expect(buildQuizLinkList([{ _id: '1', title: 'A' }, { _id: '2', title: 'B' }])).toBe(
                `A :\n${origin}/teacher/share/1\n\nB :\n${origin}/teacher/share/2`
            );
        });
    });

    describe('sanitizeFileName', () => {
        it.each([
            ['Chapitre 1: Les forces?', 'Chapitre 1_ Les forces_'],
            ['a/b\\c', 'a_b_c'],
            ['  spaced   out  ', 'spaced out'],
            ['trailing dots...', 'trailing dots'],
            ['<>:"|?*', '_______'],
            ['', 'quiz'],
            ['   ', 'quiz'],
            ['Électricité é', 'Électricité é'],
        ])('%p -> %p', (input, expected) => {
            expect(sanitizeFileName(input)).toBe(expected);
        });
    });

    describe('quizToGift', () => {
        it('joins trimmed, non-empty questions with a blank line', () => {
            expect(quizToGift(['  Q1 {T}  ', '', '   ', 'Q2 {F}'])).toBe('Q1 {T}\n\nQ2 {F}\n\n');
        });

        it('accepts string content split on blank lines', () => {
            expect(quizToGift('Q1 {T}\n\n\nQ2 {F}')).toBe('Q1 {T}\n\nQ2 {F}\n\n');
        });

        it('returns an empty string for missing content', () => {
            expect(quizToGift(undefined)).toBe('');
            expect(quizToGift([])).toBe('');
        });
    });

    describe('crc32', () => {
        it('matches the standard CRC-32 check values', () => {
            expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
            expect(crc32(new Uint8Array())).toBe(0);
            expect(crc32(new TextEncoder().encode('The quick brown fox jumps over the lazy dog'))).toBe(0x414fa339);
        });
    });

    describe('buildFolderGiftZip', () => {
        it('produces a valid zip with one gift file per quiz', () => {
            const zip = buildFolderGiftZip([
                { _id: '1', title: 'Quiz 1', content: ['Q1 {T}'] },
                { _id: '2', title: 'Quiz 2', content: ['Q2 {F}', 'Q3 {T}'] },
            ]);
            const files = readZip(zip);
            expect(Object.keys(files).sort()).toEqual(['Quiz 1.gift', 'Quiz 2.gift']);
            expect(files['Quiz 2.gift']).toBe('Q2 {F}\n\nQ3 {T}\n\n');
        });

        it('keeps every quiz when titles collide (case-insensitive) or sanitize to the same name', () => {
            const zip = buildFolderGiftZip([
                { _id: '1', title: 'Test', content: ['A'] },
                { _id: '2', title: 'test', content: ['B'] },
                { _id: '3', title: 'Test', content: ['C'] },
                { _id: '4', title: 'a/b', content: ['D'] },
                { _id: '5', title: 'a:b', content: ['E'] },
            ]);
            const files = readZip(zip);
            expect(Object.keys(files)).toHaveLength(5);
            expect(files['Test.gift']).toBe('A\n\n');
            expect(files['test (1).gift']).toBe('B\n\n');
            expect(files['Test (2).gift']).toBe('C\n\n');
            expect(files['a_b.gift']).toBe('D\n\n');
            expect(files['a_b (1).gift']).toBe('E\n\n');
        });

        it('preserves UTF-8 accents in file names and content', () => {
            const files = readZip(buildFolderGiftZip([{ _id: '1', title: 'Énergie', content: ['Qu’est-ce que l’été? {T}'] }]));
            expect(files['Énergie.gift']).toBe('Qu’est-ce que l’été? {T}\n\n');
        });

        it('writes a byte-exact zip layout (signatures, sizes, offsets)', () => {
            const zip = buildFolderGiftZip([{ _id: '1', title: 'A', content: ['x'] }]);
            // local header (30 + "A.gift") + data (3 bytes) + central (46 + 6) + end (22)
            expect(zip).toHaveLength(30 + 6 + 3 + 46 + 6 + 22);
            const v = new DataView(zip.buffer, zip.byteOffset);
            expect(v.getUint32(0, true)).toBe(0x04034b50);
            expect(v.getUint32(39, true)).toBe(0x02014b50);
            expect(v.getUint32(zip.length - 22, true)).toBe(0x06054b50);
        });

        it('produces an empty but valid zip for an empty folder', () => {
            expect(Object.keys(readZip(buildFolderGiftZip([])))).toEqual([]);
        });
    });

    describe('downloadBlob', () => {
        it('creates an object URL, clicks a download link and cleans up', () => {
            const createObjectURL = jest.fn().mockReturnValue('blob:x');
            const revokeObjectURL = jest.fn();
            Object.assign(globalThis.URL, { createObjectURL, revokeObjectURL });
            const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
                expect(this.download).toBe('f.zip');
                expect(this.href).toBe('blob:x');
            });

            downloadBlob(new Uint8Array([1, 2]), 'f.zip', 'application/zip');

            expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
            expect(clickSpy).toHaveBeenCalledTimes(1);
            expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
            expect(document.querySelector('a[download]')).toBeNull();
            clickSpy.mockRestore();
        });
    });
});
