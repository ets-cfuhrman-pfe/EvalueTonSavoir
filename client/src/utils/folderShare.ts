const encoder = new TextEncoder();

const CRC_TABLE = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
    }
    return table;
})();

export const crc32 = (data: Uint8Array): number => {
    let crc = 0xffffffff;
    for (let i = 0; i < data.length; i++) crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
};

/**
 * Minimal zip writer (no compression, "stored" entries) — enough for small text files
 * and readable by every unzip tool. File names are flagged as UTF-8.
 */
export const createZip = (files: { name: string; data: Uint8Array }[]): Uint8Array => {
    const chunks: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    for (const file of files) {
        const name = encoder.encode(file.name);
        const crc = crc32(file.data);
        const size = file.data.length;

        const local = new Uint8Array(30 + name.length);
        const lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true); // local file header signature
        lv.setUint16(4, 20, true); // version needed
        lv.setUint16(6, 0x0800, true); // flags: UTF-8 names
        lv.setUint16(8, 0, true); // method: stored
        lv.setUint16(10, 0, true); // mod time
        lv.setUint16(12, 0x21, true); // mod date (1980-01-01)
        lv.setUint32(14, crc, true);
        lv.setUint32(18, size, true); // compressed size
        lv.setUint32(22, size, true); // uncompressed size
        lv.setUint16(26, name.length, true);
        lv.setUint16(28, 0, true); // extra length
        local.set(name, 30);

        const entry = new Uint8Array(46 + name.length);
        const cv = new DataView(entry.buffer);
        cv.setUint32(0, 0x02014b50, true); // central directory signature
        cv.setUint16(4, 20, true); // version made by
        cv.setUint16(6, 20, true); // version needed
        cv.setUint16(8, 0x0800, true);
        cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true);
        cv.setUint16(14, 0x21, true);
        cv.setUint32(16, crc, true);
        cv.setUint32(20, size, true);
        cv.setUint32(24, size, true);
        cv.setUint16(28, name.length, true);
        // extra len, comment len, disk start, internal attrs, external attrs = 0
        cv.setUint32(42, offset, true); // local header offset
        entry.set(name, 46);

        chunks.push(local, file.data);
        central.push(entry);
        offset += local.length + size;
    }

    const centralSize = central.reduce((n, c) => n + c.length, 0);
    const end = new Uint8Array(22);
    const ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true); // end of central directory signature
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);

    const out = new Uint8Array(offset + centralSize + end.length);
    let pos = 0;
    for (const part of [...chunks, ...central, end]) {
        out.set(part, pos);
        pos += part.length;
    }
    return out;
};

export interface ShareableQuiz {
    _id: string;
    title: string;
    content?: string[] | string;
}

const getOrigin = (): string => globalThis.location?.origin ?? '';

/** Link that lets another teacher import a single quiz. */
export const getQuizShareUrl = (quizId: string): string =>
    `${getOrigin()}/teacher/share/${quizId}`;

/** Single link that lets another teacher import every quiz of a folder at once. */
export const getFolderShareUrl = (folderId: string): string =>
    `${getOrigin()}/teacher/share-folder/${folderId}`;

/** "Title :\nlink" blocks, one per quiz, separated by a blank line. */
export const buildQuizLinkList = (quizzes: ShareableQuiz[]): string =>
    quizzes.map((q) => `${q.title} :\n${getQuizShareUrl(q._id)}`).join('\n\n');

/** Replace characters that are invalid in file names on Windows/macOS/Linux. */
export const sanitizeFileName = (name: string): string => {
    const cleaned = name
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/, '');
    return cleaned || 'quiz';
};

/** Same serialization as the single-quiz GIFT download: non-empty questions separated by a blank line. */
export const quizToGift = (content: string[] | string | undefined): string => {
    const questions = Array.isArray(content) ? content : (content ?? '').split(/\n{2,}/);
    return questions
        .map((q) => q.trim())
        .filter((q) => q !== '')
        .map((q) => `${q}\n\n`)
        .join('');
};

/** Builds a zip with one `<title>.gift` file per quiz. Duplicate titles get a " (n)" suffix. */
export const buildFolderGiftZip = (quizzes: ShareableQuiz[]): Uint8Array => {
    const files: { name: string; data: Uint8Array }[] = [];
    const used = new Set<string>();

    for (const quiz of quizzes) {
        const base = sanitizeFileName(quiz.title);
        let name = `${base}.gift`;
        let n = 1;
        while (used.has(name.toLowerCase())) {
            name = `${base} (${n++}).gift`;
        }
        used.add(name.toLowerCase());
        files.push({ name, data: encoder.encode(quizToGift(quiz.content)) });
    }

    return createZip(files);
};

/** Triggers a browser download of the given bytes. */
export const downloadBlob = (data: BlobPart, fileName: string, type: string): void => {
    const blob = new Blob([data], { type });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    globalThis.URL.revokeObjectURL?.(url);
};
