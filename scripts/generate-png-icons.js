import fs from 'node:fs';
import zlib from 'node:zlib';

// Function to generate a raw RGBA buffer and pack into a valid PNG
function createPng(width, height, isMaskable = false) {
  // Let's create RGBA pixels
  const rowSize = width * 4 + 1; // 1 filter byte per row
  const rawData = Buffer.alloc(rowSize * height);

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = width / 2;
  const safeRadius = isMaskable ? maxRadius * 0.8 : maxRadius * 0.95;

  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Squircle or rounded rect distance
      const normX = Math.abs(x - cx) / (width * 0.45);
      const normY = Math.abs(y - cy) / (height * 0.45);
      const superellipse = Math.pow(normX, 4) + Math.pow(normY, 4);

      let r = 79, g = 70, b = 229, a = 255; // Indigo-600 default

      if (isMaskable) {
        // Full bleed gradient for Android maskable
        const gradT = (x + y) / (width + height);
        r = Math.round(79 * (1 - gradT) + 219 * gradT); // indigo to pink
        g = Math.round(70 * (1 - gradT) + 39 * gradT);
        b = Math.round(229 * (1 - gradT) + 119 * gradT);
      } else {
        if (superellipse <= 1.0) {
          const gradT = (x + y) / (width + height);
          r = Math.round(79 * (1 - gradT) + 219 * gradT);
          g = Math.round(70 * (1 - gradT) + 39 * gradT);
          b = Math.round(229 * (1 - gradT) + 119 * gradT);
        } else {
          a = 0; // transparent outside squircle
        }
      }

      // Draw an inner wallet card & euro badge shape
      if (a > 0) {
        // Center card
        const cardLeft = width * 0.22;
        const cardRight = width * 0.78;
        const cardTop = height * 0.35;
        const cardBottom = height * 0.7;

        if (x >= cardLeft && x <= cardRight && y >= cardTop && y <= cardBottom) {
          r = 15; g = 23; b = 42; // Slate 900
        }

        // Gold coin circle
        const coinCx = width * 0.65;
        const coinCy = height * 0.65;
        const coinR = width * 0.14;
        const cdx = x - coinCx;
        const cdy = y - coinCy;
        if (cdx * cdx + cdy * cdy <= coinR * coinR) {
          r = 245; g = 158; b = 11; // Amber gold
        }
      }

      rawData[offset++] = r;
      rawData[offset++] = g;
      rawData[offset++] = b;
      rawData[offset++] = a;
    }
  }

  // Deflate IDAT
  const compressedData = zlib.deflateSync(rawData);

  // PNG structure
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const crc = crc32(typeAndData);

    const crcBuf = Buffer.alloc(4);
    crcBuf.writeInt32BE(crc, 0);

    return Buffer.concat([len, typeAndData, crcBuf]);
  }

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdrData);
  const idatChunk = chunk('IDAT', compressedData);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// CRC32 implementation
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return ~crc;
}

// Generate files
fs.writeFileSync('public/pwa-192x192.png', createPng(192, 192, false));
fs.writeFileSync('public/pwa-512x512.png', createPng(512, 512, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPng(512, 512, true));
fs.writeFileSync('public/apple-touch-icon.png', createPng(180, 180, false));
console.log('Successfully generated PWA and iOS PNG icons!');
