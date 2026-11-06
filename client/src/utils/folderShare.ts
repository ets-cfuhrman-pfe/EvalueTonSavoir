import { zipSync, strToU8 } from 'fflate';

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
    const files: Record<string, Uint8Array> = {};
    const used = new Set<string>();

    for (const quiz of quizzes) {
        const base = sanitizeFileName(quiz.title);
        let name = `${base}.gift`;
        let n = 1;
        while (used.has(name.toLowerCase())) {
            name = `${base} (${n++}).gift`;
        }
        used.add(name.toLowerCase());
        files[name] = strToU8(quizToGift(quiz.content));
    }

    return zipSync(files);
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
