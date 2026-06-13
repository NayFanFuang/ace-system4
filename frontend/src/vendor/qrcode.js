// Dependency-free QR Code generator (byte / UTF-8 mode).
// Port of Kazuhiko Arase's "qrcode-generator" (MIT) to a small ES module.
// Exposes `makeQR(text, { ecLevel })` which returns a boolean matrix
// (matrix[row][col] === true means a dark module). Used by the meeting-room
// QR poster. Vendored so it ships with the build — no npm install required.

// ---- Error-correction levels -------------------------------------------------
export const ECLevel = { L: 1, M: 0, Q: 3, H: 2 }

// ---- GF(256) math ------------------------------------------------------------
const EXP = new Array(256)
const LOG = new Array(256)
;(function initMath() {
  for (let i = 0; i < 8; i++) EXP[i] = 1 << i
  for (let i = 8; i < 256; i++) {
    EXP[i] = EXP[i - 4] ^ EXP[i - 5] ^ EXP[i - 6] ^ EXP[i - 8]
  }
  for (let i = 0; i < 255; i++) LOG[EXP[i]] = i
})()

function gexp(n) {
  while (n < 0) n += 255
  while (n >= 256) n -= 255
  return EXP[n]
}
function glog(n) {
  if (n < 1) throw new Error('glog(' + n + ')')
  return LOG[n]
}

// ---- Polynomial --------------------------------------------------------------
function Polynomial(num, shift) {
  let offset = 0
  while (offset < num.length && num[offset] === 0) offset++
  const arr = new Array(num.length - offset + shift).fill(0)
  for (let i = 0; i < num.length - offset; i++) arr[i] = num[i + offset]
  return arr
}
function polyMultiply(a, b) {
  const num = new Array(a.length + b.length - 1).fill(0)
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      num[i + j] ^= gexp(glog(a[i]) + glog(b[j]))
    }
  }
  return Polynomial(num, 0)
}
function polyMod(self, e) {
  if (self.length - e.length < 0) return self
  const ratio = glog(self[0]) - glog(e[0])
  const num = self.slice()
  for (let i = 0; i < e.length; i++) {
    num[i] ^= gexp(glog(e[i]) + ratio)
  }
  return polyMod(Polynomial(num, 0), e)
}
function errorCorrectPolynomial(ecLength) {
  let a = [1]
  for (let i = 0; i < ecLength; i++) a = polyMultiply(a, [1, gexp(i)])
  return a
}

// ---- RS block table (versions 1..40, order L,M,Q,H) --------------------------
// Each entry: [ {totalCount, dataCount} groups flattened ] expressed as
// [count, totalCount, dataCount, count, totalCount, dataCount, ...]
const RS_BLOCK_TABLE = [
  [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
  [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
  [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
  [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
  [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
  [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
  [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
  [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
  [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
  [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
  [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
  [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
  [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
  [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
  [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
  [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
  [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
  [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
  [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
  [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
  [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
  [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
  [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
  [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
  [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
  [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
  [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
  [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
  [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
  [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
  [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
  [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
  [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
  [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
  [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
  [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
  [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
  [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
  [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
  [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16],
]

function rsBlocks(typeNumber, ecLevel) {
  const ecIndex = { 1: 0, 0: 1, 3: 2, 2: 3 }[ecLevel] // L,M,Q,H -> row offset
  const row = RS_BLOCK_TABLE[(typeNumber - 1) * 4 + ecIndex]
  const list = []
  for (let i = 0; i < row.length; i += 3) {
    const count = row[i], total = row[i + 1], data = row[i + 2]
    for (let j = 0; j < count; j++) list.push({ totalCount: total, dataCount: data })
  }
  return list
}

// ---- Bit buffer --------------------------------------------------------------
function BitBuffer() {
  return { buffer: [], length: 0,
    getLengthInBits() { return this.length },
    put(num, len) { for (let i = 0; i < len; i++) this.putBit(((num >>> (len - i - 1)) & 1) === 1) },
    putBit(bit) {
      const bufIdx = Math.floor(this.length / 8)
      if (this.buffer.length <= bufIdx) this.buffer.push(0)
      if (bit) this.buffer[bufIdx] |= 0x80 >>> (this.length % 8)
      this.length++
    },
  }
}

// ---- Byte (UTF-8) data block -------------------------------------------------
function utf8Bytes(str) {
  // encodeURIComponent gives us UTF-8 bytes for any string.
  const out = []
  const enc = unescape(encodeURIComponent(str))
  for (let i = 0; i < enc.length; i++) out.push(enc.charCodeAt(i) & 0xff)
  return out
}

// ---- QR utility --------------------------------------------------------------
const PATTERN_POSITION_TABLE = [
  [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42],
  [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66],
  [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86],
  [6, 34, 62, 90], [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
  [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130],
  [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154],
  [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170],
]
const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0)
const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0)
const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

function bchDigit(data) { let digit = 0; while (data !== 0) { digit++; data >>>= 1 } return digit }
function bchTypeInfo(data) {
  let d = data << 10
  while (bchDigit(d) - bchDigit(G15) >= 0) d ^= G15 << (bchDigit(d) - bchDigit(G15))
  return ((data << 10) | d) ^ G15_MASK
}
function bchTypeNumber(data) {
  let d = data << 12
  while (bchDigit(d) - bchDigit(G18) >= 0) d ^= G18 << (bchDigit(d) - bchDigit(G18))
  return (data << 12) | d
}
function maskFn(maskPattern, i, j) {
  switch (maskPattern) {
    case 0: return (i + j) % 2 === 0
    case 1: return i % 2 === 0
    case 2: return j % 3 === 0
    case 3: return (i + j) % 3 === 0
    case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
    case 5: return ((i * j) % 2) + ((i * j) % 3) === 0
    case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
    case 7: return (((i * j) % 3) + ((i + j) % 2)) % 2 === 0
    default: throw new Error('bad maskPattern:' + maskPattern)
  }
}
// byte mode length-in-bits by version range
function lengthInBits(typeNumber) {
  if (typeNumber >= 1 && typeNumber < 10) return 8
  if (typeNumber < 27) return 16
  if (typeNumber < 41) return 16
  throw new Error('typeNumber:' + typeNumber)
}

function lostPoint(qr) {
  const n = qr.moduleCount
  let lost = 0
  // rule 1
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      let same = 0
      const dark = qr.isDark(row, col)
      for (let r = -1; r <= 1; r++) {
        if (row + r < 0 || n <= row + r) continue
        for (let c = -1; c <= 1; c++) {
          if (col + c < 0 || n <= col + c) continue
          if (r === 0 && c === 0) continue
          if (dark === qr.isDark(row + r, col + c)) same++
        }
      }
      if (same > 5) lost += 3 + same - 5
    }
  }
  // rule 2
  for (let row = 0; row < n - 1; row++) {
    for (let col = 0; col < n - 1; col++) {
      let count = 0
      if (qr.isDark(row, col)) count++
      if (qr.isDark(row + 1, col)) count++
      if (qr.isDark(row, col + 1)) count++
      if (qr.isDark(row + 1, col + 1)) count++
      if (count === 0 || count === 4) lost += 3
    }
  }
  // rule 3
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n - 6; col++) {
      if (qr.isDark(row, col) && !qr.isDark(row, col + 1) && qr.isDark(row, col + 2) &&
          qr.isDark(row, col + 3) && qr.isDark(row, col + 4) && !qr.isDark(row, col + 5) &&
          qr.isDark(row, col + 6)) lost += 40
    }
  }
  for (let col = 0; col < n; col++) {
    for (let row = 0; row < n - 6; row++) {
      if (qr.isDark(row, col) && !qr.isDark(row + 1, col) && qr.isDark(row + 2, col) &&
          qr.isDark(row + 3, col) && qr.isDark(row + 4, col) && !qr.isDark(row + 5, col) &&
          qr.isDark(row + 6, col)) lost += 40
    }
  }
  // rule 4
  let darkCount = 0
  for (let col = 0; col < n; col++) for (let row = 0; row < n; row++) if (qr.isDark(row, col)) darkCount++
  const ratio = Math.abs((100 * darkCount) / n / n - 50) / 5
  lost += ratio * 10
  return lost
}

// ---- Create the data codewords ----------------------------------------------
const PAD0 = 0xec, PAD1 = 0x11

function createData(typeNumber, ecLevel, dataBytes) {
  const blocks = rsBlocks(typeNumber, ecLevel)
  const buffer = BitBuffer()
  buffer.put(4, 4) // byte mode indicator
  buffer.put(dataBytes.length, lengthInBits(typeNumber))
  for (let i = 0; i < dataBytes.length; i++) buffer.put(dataBytes[i], 8)

  let totalDataCount = 0
  for (let i = 0; i < blocks.length; i++) totalDataCount += blocks[i].dataCount

  if (buffer.getLengthInBits() > totalDataCount * 8) {
    throw new Error('code length overflow. (' + buffer.getLengthInBits() + '>' + totalDataCount * 8 + ')')
  }
  if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) buffer.put(0, 4)
  while (buffer.getLengthInBits() % 8 !== 0) buffer.putBit(false)
  for (;;) {
    if (buffer.getLengthInBits() >= totalDataCount * 8) break
    buffer.put(PAD0, 8)
    if (buffer.getLengthInBits() >= totalDataCount * 8) break
    buffer.put(PAD1, 8)
  }
  return createBytes(buffer, blocks)
}

function createBytes(buffer, blocks) {
  let offset = 0
  let maxDc = 0, maxEc = 0
  const dcdata = new Array(blocks.length)
  const ecdata = new Array(blocks.length)
  for (let r = 0; r < blocks.length; r++) {
    const dcCount = blocks[r].dataCount
    const ecCount = blocks[r].totalCount - dcCount
    maxDc = Math.max(maxDc, dcCount)
    maxEc = Math.max(maxEc, ecCount)
    dcdata[r] = new Array(dcCount)
    for (let i = 0; i < dcCount; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset]
    offset += dcCount
    const rsPoly = errorCorrectPolynomial(ecCount)
    const rawPoly = Polynomial(dcdata[r], rsPoly.length - 1)
    const modPoly = polyMod(rawPoly, rsPoly)
    ecdata[r] = new Array(rsPoly.length - 1)
    for (let i = 0; i < ecdata[r].length; i++) {
      const modIndex = i + modPoly.length - ecdata[r].length
      ecdata[r][i] = modIndex >= 0 ? modPoly[modIndex] : 0
    }
  }
  let totalCodeCount = 0
  for (let i = 0; i < blocks.length; i++) totalCodeCount += blocks[i].totalCount
  const data = new Array(totalCodeCount)
  let index = 0
  for (let i = 0; i < maxDc; i++) {
    for (let r = 0; r < blocks.length; r++) if (i < dcdata[r].length) data[index++] = dcdata[r][i]
  }
  for (let i = 0; i < maxEc; i++) {
    for (let r = 0; r < blocks.length; r++) if (i < ecdata[r].length) data[index++] = ecdata[r][i]
  }
  return data
}

// ---- QR model ----------------------------------------------------------------
function makeImpl(qr, test, maskPattern, dataCache) {
  const n = qr.moduleCount
  qr.modules = []
  for (let row = 0; row < n; row++) {
    qr.modules.push(new Array(n).fill(null))
  }
  setupPositionProbePattern(qr, 0, 0)
  setupPositionProbePattern(qr, n - 7, 0)
  setupPositionProbePattern(qr, 0, n - 7)
  setupPositionAdjustPattern(qr)
  setupTimingPattern(qr)
  setupTypeInfo(qr, test, maskPattern)
  if (qr.typeNumber >= 7) setupTypeNumber(qr, test)
  mapData(qr, dataCache, maskPattern)
}
function setupPositionProbePattern(qr, row, col) {
  for (let r = -1; r <= 7; r++) {
    if (row + r <= -1 || qr.moduleCount <= row + r) continue
    for (let c = -1; c <= 7; c++) {
      if (col + c <= -1 || qr.moduleCount <= col + c) continue
      const dark = (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
        (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
        (2 <= r && r <= 4 && 2 <= c && c <= 4)
      qr.modules[row + r][col + c] = dark
    }
  }
}
function setupTimingPattern(qr) {
  for (let r = 8; r < qr.moduleCount - 8; r++) {
    if (qr.modules[r][6] !== null) continue
    qr.modules[r][6] = r % 2 === 0
  }
  for (let c = 8; c < qr.moduleCount - 8; c++) {
    if (qr.modules[6][c] !== null) continue
    qr.modules[6][c] = c % 2 === 0
  }
}
function setupPositionAdjustPattern(qr) {
  const pos = PATTERN_POSITION_TABLE[qr.typeNumber - 1]
  for (let i = 0; i < pos.length; i++) {
    for (let j = 0; j < pos.length; j++) {
      const row = pos[i], col = pos[j]
      if (qr.modules[row][col] !== null) continue
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          qr.modules[row + r][col + c] =
            r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)
        }
      }
    }
  }
}
function setupTypeNumber(qr, test) {
  const bits = bchTypeNumber(qr.typeNumber)
  for (let i = 0; i < 18; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    qr.modules[Math.floor(i / 3)][(i % 3) + qr.moduleCount - 8 - 3] = mod
  }
  for (let i = 0; i < 18; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    qr.modules[(i % 3) + qr.moduleCount - 8 - 3][Math.floor(i / 3)] = mod
  }
}
function setupTypeInfo(qr, test, maskPattern) {
  const data = (qr.ecLevel << 3) | maskPattern
  const bits = bchTypeInfo(data)
  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    if (i < 6) qr.modules[i][8] = mod
    else if (i < 8) qr.modules[i + 1][8] = mod
    else qr.modules[qr.moduleCount - 15 + i][8] = mod
  }
  for (let i = 0; i < 15; i++) {
    const mod = !test && ((bits >> i) & 1) === 1
    if (i < 8) qr.modules[8][qr.moduleCount - i - 1] = mod
    else if (i < 9) qr.modules[8][15 - i - 1 + 1] = mod
    else qr.modules[8][15 - i - 1] = mod
  }
  qr.modules[qr.moduleCount - 8][8] = !test
}
function mapData(qr, data, maskPattern) {
  let inc = -1
  let row = qr.moduleCount - 1
  let bitIndex = 7
  let byteIndex = 0
  const n = qr.moduleCount
  for (let col = n - 1; col > 0; col -= 2) {
    if (col === 6) col--
    for (;;) {
      for (let c = 0; c < 2; c++) {
        if (qr.modules[row][col - c] === null) {
          let dark = false
          if (byteIndex < data.length) dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
          const mask = maskFn(maskPattern, row, col - c)
          if (mask) dark = !dark
          qr.modules[row][col - c] = dark
          bitIndex--
          if (bitIndex === -1) { byteIndex++; bitIndex = 7 }
        }
      }
      row += inc
      if (row < 0 || n <= row) { row -= inc; inc = -inc; break }
    }
  }
}

function bestMaskPattern(typeNumber, ecLevel, dataCache) {
  let minLost = 0
  let pattern = 0
  for (let i = 0; i < 8; i++) {
    const qr = makeModel(typeNumber, ecLevel)
    makeImpl(qr, true, i, dataCache)
    const lost = lostPoint(qr)
    if (i === 0 || minLost > lost) { minLost = lost; pattern = i }
  }
  return pattern
}

function makeModel(typeNumber, ecLevel) {
  return {
    typeNumber, ecLevel,
    moduleCount: typeNumber * 4 + 17,
    modules: null,
    isDark(row, col) { return this.modules[row][col] === true },
  }
}

// ---- Public API --------------------------------------------------------------
// Returns { matrix: boolean[][], size: number, version: number }
export function makeQR(text, opts = {}) {
  const ecLevel = opts.ecLevel != null ? opts.ecLevel : ECLevel.M
  const dataBytes = utf8Bytes(text)

  // auto-pick the smallest version that fits
  let typeNumber = opts.version || 0
  if (!typeNumber) {
    for (let t = 1; t <= 40; t++) {
      try { createData(t, ecLevel, dataBytes); typeNumber = t; break } catch { /* too small */ }
    }
    if (!typeNumber) throw new Error('text too long for QR')
  }

  const dataCache = createData(typeNumber, ecLevel, dataBytes)
  const maskPattern = opts.mask != null ? opts.mask : bestMaskPattern(typeNumber, ecLevel, dataCache)
  const qr = makeModel(typeNumber, ecLevel)
  makeImpl(qr, false, maskPattern, dataCache)

  return { matrix: qr.modules, size: qr.moduleCount, version: typeNumber }
}

export default makeQR
