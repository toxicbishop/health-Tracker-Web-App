/**
 * Generates minimal but valid PWA PNG icons (192×192 and 512×512)
 * for the health tracker app using only Node.js built-ins (no deps needed).
 * Draws a dark-background square with a red heart shape pixel-art style.
 */
import { createWriteStream } from "fs";
import { deflateSync } from "zlib";
import { mkdirSync } from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function createPNG(size) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBuf = Buffer.from(type, "ascii");
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    let crc = 0xffffffff;
    const crcData = Buffer.concat([typeBuf, data]);
    for (const b of crcData) {
      crc ^= b;
      for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
    crc ^= 0xffffffff;
    crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build pixel data: dark bg (#1a1a2e) with a red heart centred
  const bg = [26, 26, 46];     // #1a1a2e dark navy
  const accent = [229, 62, 62]; // #e53e3e red (health red)
  const light = [255, 255, 255]; // white text pixels

  const pixels = [];
  for (let y = 0; y < size; y++) {
    pixels.push(0); // filter type per row
    for (let x = 0; x < size; x++) {
      // Normalise to 0..1
      const nx = (x / size) * 2 - 1; // -1..1
      const ny = (y / size) * 2 - 1;

      // Heart function: (x²+y²-1)³ - x²y³ ≤ 0
      // Scaled and shifted upward slightly
      const hx = nx * 1.2;
      const hy = ny * 1.2 + 0.2;
      const heartVal = Math.pow(hx * hx + hy * hy - 1, 3) - hx * hx * Math.pow(hy, 3);

      // Border ring
      const dist = Math.sqrt(nx * nx + ny * ny);
      if (heartVal <= 0) {
        pixels.push(...accent);
      } else {
        pixels.push(...bg);
      }
    }
  }

  const raw = Buffer.from(pixels);
  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    PNG_SIG,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const publicDir = new URL("../public", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
mkdirSync(publicDir, { recursive: true });

for (const size of [192, 512]) {
  const png = createPNG(size);
  const path = `${publicDir}/pwa-${size}x${size}.png`;
  createWriteStream(path).end(png, () => console.log(`✓ Created ${path} (${png.length} bytes)`));
}

// Apple touch icon (180×180)
const applePng = createPNG(180);
const applePath = `${publicDir}/apple-touch-icon.png`;
createWriteStream(applePath).end(applePng, () => console.log(`✓ Created ${applePath} (${applePng.length} bytes)`));
