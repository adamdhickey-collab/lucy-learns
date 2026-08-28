// Reading an image's dimensions without shelling out.
//
// pilot.mjs asks `sips` for this, which is fine there — it runs on the Mac and
// the file is already on disk. The generate path needs the answer earlier and
// in more places: before writing anything, to check that what came back is the
// canvas that was asked for, and on Linux, where the tests run and sips does
// not exist.
//
// A PNG is an 8-byte signature followed by chunks; IHDR is required to be
// first, and carries width and height as big-endian uint32 at a fixed offset.
// A JPEG needs a walk through its markers to find a start-of-frame, which is
// slightly more work and still nowhere near a decoder. Between them they cover
// everything this pipeline writes: PNG for the raw and the master, JPEG for
// what ships.

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** { width, height } from a PNG buffer. Throws if it is not a PNG. */
export function pngSize(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 24) {
    throw new Error('not a PNG: too short to hold an IHDR');
  }
  if (!buf.subarray(0, 8).equals(SIGNATURE)) {
    throw new Error('not a PNG: signature does not match');
  }
  if (buf.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a PNG: first chunk is not IHDR');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/**
 * Start-of-frame markers, which are the ones carrying a size.
 *
 * Everything in C0-CF is a frame header except C4 (Huffman tables), C8 (an
 * extension) and CC (arithmetic coding tables) — those three are ordinary
 * segments that happen to sit in the same range, and reading a size out of one
 * would produce a confident wrong answer rather than an error.
 */
const isSOF = (m) => m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc;

/** { width, height } from a JPEG buffer. Throws if it is not a JPEG. */
export function jpegSize(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error('not a JPEG: no start-of-image marker');
  }
  let i = 2;
  while (i < buf.length - 1) {
    if (buf[i] !== 0xff) {
      i++; // fill bytes and padding between segments
      continue;
    }
    const marker = buf[i + 1];
    i += 2;
    // Standalone markers carry no length: padding, restart markers, SOI, EOI.
    if (marker === 0xff || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (i + 1 >= buf.length) break;
    const length = buf.readUInt16BE(i);
    if (isSOF(marker)) {
      if (i + 7 > buf.length) break;
      return { width: buf.readUInt16BE(i + 5), height: buf.readUInt16BE(i + 3) };
    }
    i += length;
  }
  throw new Error('not a JPEG: no start-of-frame marker found');
}

/** Whichever of the two this is. */
export function imageSize(buf) {
  if (Buffer.isBuffer(buf) && buf.length > 1 && buf[0] === 0xff && buf[1] === 0xd8) {
    return jpegSize(buf);
  }
  return pngSize(buf);
}
