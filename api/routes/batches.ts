import express, { type Request, type Response } from 'express';
import { deflateSync } from 'zlib';
import { store } from '../data/store.js';
import type { FermentationReading, ParameterDeviation, BrewStep, Batch } from '../../shared/types.js';

const router = express.Router();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = (table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type: string, data: Buffer): Buffer {
  const typeData = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeData), 0);
  return Buffer.concat([length, typeData, crc]);
}

function createPNG(width: number, height: number, rgbaData: Uint8ClampedArray): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = createChunk('IHDR', ihdrData);

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = rgbaData[srcIdx];
      rawData[dstIdx + 1] = rgbaData[srcIdx + 1];
      rawData[dstIdx + 2] = rgbaData[srcIdx + 2];
      rawData[dstIdx + 3] = rgbaData[srcIdx + 3];
    }
  }

  const compressed = deflateSync(rawData);
  const idat = createChunk('IDAT', compressed);

  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function setPixel(data: Uint8ClampedArray, width: number, x: number, y: number, r: number, g: number, b: number, a = 255) {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (y * width + x) * 4;
  data[idx] = r;
  data[idx + 1] = g;
  data[idx + 2] = b;
  data[idx + 3] = a;
}

function drawLine(data: Uint8ClampedArray, width: number, height: number, x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number, thickness = 2) {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;

  while (true) {
    for (let t = -Math.floor(thickness / 2); t <= Math.floor(thickness / 2); t++) {
      setPixel(data, width, x, y + t, r, g, b);
      if (thickness > 2) setPixel(data, width, x + t, y, r, g, b);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
}

function drawText(data: Uint8ClampedArray, width: number, height: number, text: string, x: number, y: number, r: number, g: number, b: number, fontSize = 20) {
  const chars: Record<string, number[][]> = {
    '0': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,1,1],
      [1,0,1,0,1],
      [1,1,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '1': [
      [0,0,1,0,0],
      [0,1,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,1,1,0],
    ],
    '2': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    '3': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,1,1,0],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '4': [
      [0,0,0,1,0],
      [0,0,1,1,0],
      [0,1,0,1,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
      [1,1,1,1,1],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
    ],
    '5': [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '6': [
      [0,0,1,1,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '7': [
      [1,1,1,1,1],
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
    ],
    '8': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '9': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
    ],
    '.': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,1,1,0,0],
      [0,0,0,0,0],
    ],
    '-': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [0,1,1,1,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    ' ': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    '°': [
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    ',': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,1,1,0,0],
      [0,1,0,0,0],
    ],
    '/': [
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    'C': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'L': [
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    'O': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'G': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'p': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    'H': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'S': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'N': [
      [1,0,0,0,1],
      [1,1,0,0,1],
      [1,1,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,1,1],
      [1,0,0,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'n': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
    ],
    'g': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
      [0,0,0,0,1],
    ],
    'A': [
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'B': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ],
    'D': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ],
    'E': [
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    'I': [
      [0,1,1,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,1,1,0],
    ],
    'J': [
      [0,0,1,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [1,0,0,1,0],
      [1,0,0,1,0],
      [0,1,1,0,0],
    ],
    'K': [
      [1,0,0,0,1],
      [1,0,0,1,0],
      [1,0,1,0,0],
      [1,1,0,0,0],
      [1,1,0,0,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'M': [
      [1,0,0,0,1],
      [1,1,0,1,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'P': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    'R': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'T': [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'U': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'V': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
    ],
    'W': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,1,0,1,1],
      [1,1,0,1,1],
      [1,0,0,0,1],
    ],
    'X': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'Y': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'Z': [
      [1,1,1,1,1],
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    'a': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [0,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
    ],
    'b': [
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
    ],
    'c': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'd': [
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
    ],
    'e': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'f': [
      [0,0,1,1,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [1,1,1,1,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
    ],
    'h': [
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'i': [
      [0,0,1,0,0],
      [0,0,0,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'j': [
      [0,0,0,1,0],
      [0,0,0,0,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [1,0,0,1,0],
      [0,1,1,0,0],
    ],
    'k': [
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,1,0],
      [1,0,1,0,0],
      [1,1,0,0,0],
      [1,0,1,0,0],
      [1,0,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'l': [
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    'm': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,1,0,1,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
    ],
    'o': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    'q': [
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
    ],
    'r': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,1,1,1,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    's': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,1,0],
      [1,0,0,0,0],
      [0,1,1,1,0],
      [0,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    't': [
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [1,1,1,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
    ],
    'u': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
    ],
    'v': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
    ],
    'w': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,1,0,1,1],
      [1,0,0,0,1],
    ],
    'x': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    'y': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [0,0,1,0,0],
    ],
    'z': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [1,1,1,1,1],
      [0,0,0,1,0],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,1,1,1,1],
    ],
    ':': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,1,1,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,1,1,0,0],
      [0,1,1,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    '(': [
      [0,0,1,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [0,1,0,0,0],
      [0,1,0,0,0],
      [0,0,1,0,0],
    ],
    ')': [
      [0,0,1,0,0],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,0,1],
      [0,0,0,1,0],
      [0,0,0,1,0],
      [0,0,1,0,0],
    ],
    ' ': [
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
      [0,0,0,0,0],
    ],
    '比': [
      [1,0,1,0,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,1,0,0],
      [1,0,1,1,1],
      [1,1,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
    ],
    '重': [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,0,1,0,1],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
    ],
    '温': [
      [0,0,1,0,0],
      [0,1,1,1,1],
      [1,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,0],
      [0,0,1,0,0],
      [0,1,1,1,1],
      [0,1,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    '度': [
      [1,0,0,0,1],
      [1,1,0,0,1],
      [1,0,1,0,1],
      [1,0,0,1,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '日': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '期': [
      [1,0,1,0,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,1,1,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
    ],
    '发': [
      [0,0,1,0,0],
      [0,1,1,1,1],
      [1,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,1,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    '酵': [
      [0,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,1,1],
      [1,0,1,0,0],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '曲': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '线': [
      [1,0,0,1,0],
      [1,0,1,0,0],
      [1,1,0,0,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '名': [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [0,1,0,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '称': [
      [0,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,1,1],
      [1,0,1,0,0],
      [1,1,1,1,0],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [0,1,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '配': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    '方': [
      [0,1,1,1,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '批': [
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
    ],
    '次': [
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,1,1,0,0],
      [1,0,0,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
    '读': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,1,0,0],
      [1,1,1,1,0],
      [1,0,1,0,1],
      [1,1,1,1,1],
      [1,0,1,0,0],
      [1,0,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '数': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,1,1,1],
      [1,1,1,0,0],
      [1,0,1,1,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
    '酿': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,0],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '造': [
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,1,0,0],
      [1,1,1,1,1],
      [1,0,1,0,0],
      [1,1,1,1,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
    '生': [
      [0,0,1,0,0],
      [0,1,1,1,0],
      [1,0,1,0,1],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
    ],
    '成': [
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,0,0,0],
      [1,0,1,1,1],
      [0,0,0,0,1],
      [1,1,1,1,0],
    ],
    '时': [
      [0,1,0,1,0],
      [1,1,1,1,1],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,1,1,1,1],
      [1,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
    '间': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
    ],
    '配': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,0],
      [1,0,0,0,0],
      [1,0,0,0,0],
    ],
    '未': [
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,0,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
    '知': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,1],
      [0,0,1,0,0],
      [1,0,1,1,0],
      [1,0,1,0,1],
      [1,0,1,0,1],
      [1,0,1,0,1],
    ],
    '暂': [
      [0,1,1,1,0],
      [1,0,0,0,1],
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [0,1,1,1,0],
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,1,0,1,0],
      [1,0,0,0,1],
    ],
    '无': [
      [1,1,1,1,1],
      [0,0,1,0,0],
      [0,0,1,0,0],
      [1,1,1,1,1],
      [0,1,0,1,0],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
    ],
  };

  const scale = fontSize / 10;
  const charWidth = 5 * scale;
  const charHeight = 10 * scale;
  const charSpacing = Math.floor(charWidth * 0.3);

  let cx = x;
  for (const ch of text) {
    const pattern = chars[ch] || chars[' '];
    for (let row = 0; row < pattern.length; row++) {
      for (let col = 0; col < pattern[row].length; col++) {
        if (pattern[row][col]) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = Math.floor(cx + col * scale + sx);
              const py = Math.floor(y + row * scale + sy);
              if (py >= 0 && py < height && px >= 0 && px < width) {
                setPixel(data, width, px, py, r, g, b);
              }
            }
          }
        }
      }
    }
    cx += Math.floor(charWidth + charSpacing);
  }
}

function drawRect(data: Uint8ClampedArray, width: number, height: number, x0: number, y0: number, x1: number, y1: number, r: number, g: number, b: number, a = 255, fill = true) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (fill || y === y0 || y === y1 || x === x0 || x === x1) {
        setPixel(data, width, x, y, r, g, b, a);
      }
    }
  }
}

function generateChartPNG(batch: Batch): Buffer {
  const W = 1600;
  const H = 950;
  const padL = 140;
  const padR = 100;
  const padT = 180;
  const padB = 160;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const TICK_FONT = 20;
  const LABEL_FONT = 24;
  const HEADER_FONT = 28;
  const SUB_FONT = 22;
  const LEGEND_FONT = 22;

  const data = new Uint8ClampedArray(W * H * 4);
  for (let i = 0; i < W * H * 4; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
    data[i + 3] = 255;
  }

  const sortedReadings = [...batch.readings].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedReadings.length === 0) {
    drawText(data, W, H, `${batch.name} - 暂无发酵读数`, Math.floor(W / 2 - 300), Math.floor(H / 2), 100, 100, 100, 28);
    return createPNG(W, H, data);
  }

  drawText(data, W, H, `批次: ${batch.name}`, padL, 30, 50, 50, 50, HEADER_FONT);
  drawText(data, W, H, `配方: ${batch.recipeName || '未知'}`, padL, 70, 100, 100, 100, SUB_FONT);
  drawText(data, W, H, `酿造日期: ${batch.brewDate}`, padL, 105, 100, 100, 100, SUB_FONT);
  drawText(data, W, H, `读数数量: ${batch.readings.length}`, padL + 500, 70, 100, 100, 100, SUB_FONT);
  drawText(data, W, H, `生成时间: ${new Date().toLocaleString('zh-CN')}`, padL + 500, 105, 100, 100, 100, SUB_FONT);

  drawRect(data, W, H, padL - 2, padT - 2, padL + chartW + 2, padT + chartH + 2, 220, 220, 220, 255, false);
  drawRect(data, W, H, padL, padT, padL + chartW, padT + chartH, 250, 250, 250, 255, true);

  const sgs = sortedReadings.map(r => r.specificGravity);
  const temps = sortedReadings.map(r => r.temperature);
  const phs = sortedReadings.filter(r => r.ph).map(r => r.ph);

  const sgMin = Math.max(0.99, Math.min(...sgs) - 0.01);
  const sgMax = Math.min(1.08, Math.max(...sgs) + 0.01);
  const tempMin = Math.max(0, Math.min(...temps) - 2);
  const tempMax = Math.min(40, Math.max(...temps) + 2);

  const sgTicks = 6;
  for (let i = 0; i <= sgTicks; i++) {
    const y = padT + chartH - Math.floor((i / sgTicks) * chartH);
    drawLine(data, W, H, padL, y, padL + chartW, y, 235, 235, 235, 1);
    const val = (sgMin + (sgMax - sgMin) * (i / sgTicks)).toFixed(3);
    drawText(data, W, H, val, 15, y - 10, 217, 119, 6, TICK_FONT);
  }

  const tempTicks = 6;
  for (let i = 0; i <= tempTicks; i++) {
    const val = (tempMin + (tempMax - tempMin) * (i / sgTicks)).toFixed(1);
    drawText(data, W, H, `${val}°C`, W - padR + 10, padT + chartH - Math.floor((i / tempTicks) * chartH) - 10, 59, 130, 246, TICK_FONT);
  }

  const labelCount = Math.min(sortedReadings.length, 10);
  const labelStep = Math.max(1, Math.floor(sortedReadings.length / labelCount));
  for (let i = 0; i < sortedReadings.length; i += labelStep) {
    const x = padL + Math.floor((i / (sortedReadings.length - 1 || 1)) * chartW);
    drawLine(data, W, H, x, padT, x, padT + chartH, 235, 235, 235, 1);
    const label = sortedReadings[i].date.slice(5);
    drawText(data, W, H, label, x - 20, padT + chartH + 20, 100, 100, 100, TICK_FONT);
  }

  drawText(data, W, H, '日期', padL + Math.floor(chartW / 2) - 20, H - 60, 100, 100, 100, LABEL_FONT);
  drawText(data, W, H, '比重', 30, padT + Math.floor(chartH / 2) - 10, 217, 119, 6, LABEL_FONT);
  drawText(data, W, H, '温度', W - padR + 30, padT + Math.floor(chartH / 2) - 10, 59, 130, 246, LABEL_FONT);

  const toX = (i: number) => padL + Math.floor((i / (sortedReadings.length - 1 || 1)) * chartW);
  const toYSG = (sg: number) => padT + chartH - Math.floor(((sg - sgMin) / (sgMax - sgMin || 1)) * chartH);
  const toYTemp = (t: number) => padT + chartH - Math.floor(((t - tempMin) / (tempMax - tempMin || 1)) * chartH);

  for (let i = 1; i < sortedReadings.length; i++) {
    drawLine(
      data, W, H,
      toX(i - 1), toYSG(sortedReadings[i - 1].specificGravity),
      toX(i), toYSG(sortedReadings[i].specificGravity),
      217, 119, 6, 4
    );
  }

  for (let i = 1; i < sortedReadings.length; i++) {
    drawLine(
      data, W, H,
      toX(i - 1), toYTemp(sortedReadings[i - 1].temperature),
      toX(i), toYTemp(sortedReadings[i].temperature),
      59, 130, 246, 4
    );
  }

  for (let i = 0; i < sortedReadings.length; i++) {
    const cx = toX(i);
    const cySG = toYSG(sortedReadings[i].specificGravity);
    const cyTemp = toYTemp(sortedReadings[i].temperature);
    drawRect(data, W, H, cx - 5, cySG - 5, cx + 5, cySG + 5, 217, 119, 6, 255, true);
    drawRect(data, W, H, cx - 5, cyTemp - 5, cx + 5, cyTemp + 5, 59, 130, 246, 255, true);
  }

  if (phs.length >= 2) {
    const phMin = Math.min(...phs) - 0.3;
    const phMax = Math.max(...phs) + 0.3;
    const toYPH = (ph: number) => padT + chartH - Math.floor(((ph - phMin) / (phMax - phMin || 1)) * chartH);
    let prevIdx = -1;
    for (let i = 0; i < sortedReadings.length; i++) {
      if (sortedReadings[i].ph) {
        if (prevIdx >= 0) {
          drawLine(
            data, W, H,
            toX(prevIdx), toYPH(sortedReadings[prevIdx].ph!),
            toX(i), toYPH(sortedReadings[i].ph!),
            34, 197, 94, 3
          );
        }
        prevIdx = i;
      }
    }
  }

  const legendY = 150;
  drawRect(data, W, H, padL, legendY - 15, padL + 30, legendY + 8, 217, 119, 6, 255, true);
  drawText(data, W, H, '比重 (SG)', padL + 42, legendY - 10, 217, 119, 6, LEGEND_FONT);

  drawRect(data, W, H, padL + 220, legendY - 15, padL + 250, legendY + 8, 59, 130, 246, 255, true);
  drawText(data, W, H, '温度 (°C)', padL + 262, legendY - 10, 59, 130, 246, LEGEND_FONT);

  if (phs.length >= 2) {
    drawRect(data, W, H, padL + 440, legendY - 15, padL + 470, legendY + 8, 34, 197, 94, 255, true);
    drawText(data, W, H, 'pH', padL + 482, legendY - 10, 34, 197, 94, LEGEND_FONT);
  }

  return createPNG(W, H, data);
}

router.get('/', (req: Request, res: Response) => {
  const { recipeId, startDate, endDate } = req.query;
  let batches;

  if (startDate && endDate) {
    batches = store.getBatchesByDateRange(startDate as string, endDate as string);
  } else if (recipeId) {
    batches = store.getBatchesByRecipe(recipeId as string);
  } else {
    batches = store.getAllBatches();
  }

  res.json({
    success: true,
    data: batches,
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const batch = store.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/from-recipe/:recipeId', (req: Request, res: Response) => {
  const result = store.createBatchFromRecipeWithInventory(req.params.recipeId, req.body);
  if (!result.success) {
    if (result.check) {
      return res.status(400).json({
        success: false,
        error: result.error || '原料库存不足',
        shortages: result.check.shortages,
        warnings: result.check.warnings,
      });
    }
    return res.status(404).json({
      success: false,
      error: result.error || '配方不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: result.batch,
    warnings: result.check?.warnings || [],
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const batch = store.updateBatch(req.params.id, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = store.deleteBatch(req.params.id);
  if (!deleted) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    message: '批次已删除',
  });
});

router.post('/:id/readings', (req: Request, res: Response) => {
  const reading = req.body as Omit<FermentationReading, 'id'>;
  const batch = store.addReading(req.params.id, reading);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

router.put('/:id/readings/:readingId', (req: Request, res: Response) => {
  const batch = store.updateReading(req.params.id, req.params.readingId, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或读数不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id/readings/:readingId', (req: Request, res: Response) => {
  const batch = store.deleteReading(req.params.id, req.params.readingId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或读数不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/deviations', (req: Request, res: Response) => {
  const deviation = req.body as ParameterDeviation;
  const batch = store.addDeviation(req.params.id, deviation);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

router.put('/:id/notes', (req: Request, res: Response) => {
  const { notes } = req.body;
  const batch = store.updateBatchNotes(req.params.id, notes || '');
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/photos', (req: Request, res: Response) => {
  const { url, stage, caption } = req.body;
  if (!url || !stage) {
    return res.status(400).json({
      success: false,
      error: '图片URL和阶段是必填项',
    });
  }
  const batch = store.addPhoto(req.params.id, {
    url,
    stage,
    caption: caption || '',
  });
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.status(201).json({
    success: true,
    data: batch,
  });
});

router.put('/:id/photos/:photoId', (req: Request, res: Response) => {
  const batch = store.updatePhoto(req.params.id, req.params.photoId, req.body);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或照片不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.delete('/:id/photos/:photoId', (req: Request, res: Response) => {
  const batch = store.deletePhoto(req.params.id, req.params.photoId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或照片不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/generate', (req: Request, res: Response) => {
  const batch = store.generateBrewStepsForBatch(req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.put('/:id/brew-steps/:stepId', (req: Request, res: Response) => {
  const updates = req.body as Partial<BrewStep>;
  const batch = store.updateBrewStep(req.params.id, req.params.stepId, updates);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/start', (req: Request, res: Response) => {
  const batch = store.startBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/complete', (req: Request, res: Response) => {
  const batch = store.completeBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/:stepId/skip', (req: Request, res: Response) => {
  const batch = store.skipBrewStep(req.params.id, req.params.stepId);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次或步骤不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/brew-steps/reset', (req: Request, res: Response) => {
  const batch = store.resetBrewSteps(req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }
  res.json({
    success: true,
    data: batch,
  });
});

router.post('/:id/bottling', (req: Request, res: Response) => {
  const { totalBottles, bottleSpec, capColor, storageLocation, notes } = req.body;

  const result = store.createBottlingRecord(req.params.id, {
    totalBottles: Number(totalBottles),
    bottleSpec,
    capColor,
    storageLocation,
    notes,
  });

  if (!result.success) {
    const statusCode = result.error === '批次不存在' ? 404 : 400;
    return res.status(statusCode).json({
      success: false,
      error: result.error,
    });
  }

  res.status(201).json({
    success: true,
    data: result.batch,
  });
});

router.get('/trace/:traceCode', (req: Request, res: Response) => {
  const result = store.lookupTraceCode(req.params.traceCode);
  if (!result) {
    return res.status(404).json({
      success: false,
      error: '追溯码无效或不存在',
    });
  }
  res.json({
    success: true,
    data: result,
  });
});

router.get('/:id/export/chart', (req: Request, res: Response) => {
  const batch = store.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({
      success: false,
      error: '批次不存在',
    });
  }

  try {
    const pngBuffer = generateChartPNG(batch);
    const safeName = batch.name.replace(/[<>:"/\\|?*]/g, '_');
    const timestamp = new Date().toISOString().slice(0, 10);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="发酵曲线_${safeName}_${timestamp}.png"`);
    res.setHeader('Content-Length', pngBuffer.length);
    res.send(pngBuffer);
  } catch (_error) {
    res.status(500).json({
      success: false,
      error: '生成图表失败',
    });
  }
});

export default router;
