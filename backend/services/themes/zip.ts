import zlib from 'zlib';

/**
 * Minimal ZIP reader/writer (PKZIP, stored + deflate) on top of Node's zlib.
 *
 * Theme packages are a handful of small text files, so a full archive library
 * is not needed. The reader enforces size limits because import accepts files
 * from anyone: a ZIP can declare a tiny compressed size that inflates to
 * gigabytes.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d: Date) {
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  return { time, date };
}

export function createZip(files: { name: string; data: Buffer | string }[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;
  const { time, date } = dosDateTime(new Date());

  for (const f of files) {
    const raw = Buffer.isBuffer(f.data) ? f.data : Buffer.from(f.data, 'utf8');
    const deflated = zlib.deflateRawSync(raw, { level: 9 });
    const useDeflate = deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const name = Buffer.from(f.name, 'utf8');
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(useDeflate ? 8 : 0, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    locals.push(local, name, body);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(useDeflate ? 8 : 0, 10);
    central.writeUInt16LE(time, 12);
    central.writeUInt16LE(date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += local.length + name.length + body.length;
  }

  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

export class ZipError extends Error {}

const MAX_ENTRIES = 2000;
const MAX_TOTAL_UNCOMPRESSED = 40 * 1024 * 1024;

/** Lists entry names and lets the caller read only the ones it needs. */
export function readZip(buf: Buffer): { names: string[]; read: (name: string, maxBytes?: number) => Buffer | null } {
  // End-of-central-directory record: scan back past an optional comment.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError('This file is not a valid ZIP archive.');

  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16);
  if (count > MAX_ENTRIES) throw new ZipError('The ZIP has too many files to be a theme package.');

  const entries = new Map<string, { method: number; compSize: number; size: number; localOffset: number }>();
  for (let i = 0; i < count; i++) {
    if (ptr + 46 > buf.length || buf.readUInt32LE(ptr) !== 0x02014b50) throw new ZipError('The ZIP archive is damaged.');
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const size = buf.readUInt32LE(ptr + 24);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOffset = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen).replace(/\\/g, '/');
    entries.set(name, { method, compSize, size, localOffset });
    ptr += 46 + nameLen + extraLen + commentLen;
  }

  let inflatedTotal = 0;
  return {
    names: Array.from(entries.keys()),
    read(name, maxBytes = MAX_TOTAL_UNCOMPRESSED) {
      const e = entries.get(name);
      if (!e) return null;
      if (e.size > maxBytes) throw new ZipError(`"${name}" is too large.`);
      const lo = e.localOffset;
      if (lo + 30 > buf.length || buf.readUInt32LE(lo) !== 0x04034b50) throw new ZipError('The ZIP archive is damaged.');
      const start = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28);
      const data = buf.subarray(start, start + e.compSize);
      let out: Buffer;
      if (e.method === 0) out = Buffer.from(data);
      else if (e.method === 8) out = zlib.inflateRawSync(data, { maxOutputLength: maxBytes });
      else throw new ZipError(`"${name}" uses an unsupported compression method.`);
      inflatedTotal += out.length;
      if (inflatedTotal > MAX_TOTAL_UNCOMPRESSED) throw new ZipError('The ZIP expands to more data than a theme can contain.');
      return out;
    }
  };
}
