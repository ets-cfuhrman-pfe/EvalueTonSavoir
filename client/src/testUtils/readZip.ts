import { crc32 } from '../utils/folderShare';

/**
 * Test helper: reads a zip of "stored" (uncompressed) entries by walking the
 * central directory, like a real unzip tool, and checks each entry's local
 * header and CRC. Returns file name -> UTF-8 text.
 */
export const readZip = (zip: Uint8Array): Record<string, string> => {
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    const decoder = new TextDecoder();

    const eocd = zip.length - 22;
    if (view.getUint32(eocd, true) !== 0x06054b50) throw new Error('missing end of central directory');
    const count = view.getUint16(eocd + 10, true);
    const cdSize = view.getUint32(eocd + 12, true);
    let p = view.getUint32(eocd + 16, true);
    if (p + cdSize !== eocd) throw new Error('central directory size/offset mismatch');

    const files: Record<string, string> = {};
    for (let i = 0; i < count; i++) {
        if (view.getUint32(p, true) !== 0x02014b50) throw new Error(`bad central header #${i}`);
        if ((view.getUint16(p + 8, true) & 0x0800) === 0) throw new Error('UTF-8 flag not set');
        if (view.getUint16(p + 10, true) !== 0) throw new Error('entry is compressed');
        const crc = view.getUint32(p + 16, true);
        const size = view.getUint32(p + 20, true);
        const nameLen = view.getUint16(p + 28, true);
        const extraLen = view.getUint16(p + 30, true);
        const commentLen = view.getUint16(p + 32, true);
        const localOffset = view.getUint32(p + 42, true);
        const name = decoder.decode(zip.subarray(p + 46, p + 46 + nameLen));

        if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`bad local header for ${name}`);
        const localNameLen = view.getUint16(localOffset + 26, true);
        const localExtraLen = view.getUint16(localOffset + 28, true);
        const localName = decoder.decode(zip.subarray(localOffset + 30, localOffset + 30 + localNameLen));
        if (localName !== name) throw new Error(`name mismatch ${localName} vs ${name}`);
        if (view.getUint32(localOffset + 14, true) !== crc) throw new Error(`local CRC mismatch for ${name}`);

        const start = localOffset + 30 + localNameLen + localExtraLen;
        const data = zip.subarray(start, start + size);
        if (crc32(data) !== crc) throw new Error(`CRC mismatch for ${name}`);
        if (name in files) throw new Error(`duplicate entry ${name}`);
        files[name] = decoder.decode(data);

        p += 46 + nameLen + extraLen + commentLen;
    }
    return files;
};
