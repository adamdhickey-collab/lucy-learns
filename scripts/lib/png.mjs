// Reading a PNG's dimensions without shelling out.
//
// pilot.mjs asks `sips` for this, which is fine there — it runs on the Mac and
// the file is already on disk. The generate path needs the answer earlier and
// in more places: before writing anything, to check that what came back is the
// canvas that was asked for, and on Linux, where the tests run and sips does
// not exist.
//
// A PNG is an 8-byte signature followed by chunks; IHDR is required to be
// first, and carries width and height as big-endian uint32 at a fixed offset.
// That is the whole format needed here, so no decoder is warranted.

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
