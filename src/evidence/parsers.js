const PLAIN_TEXT_EXTENSIONS = new Set(["txt", "md", "csv", "ris", "bib"]);
const STABLE_ERROR_CODES = new Set([
  "empty-text", "invalid-utf8", "malformed-csv", "malformed-ris", "malformed-bib",
  "image-only-pdf", "image-only-docx", "encrypted-pdf", "encrypted-docx",
]);
const COMPOUND_FILE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const CFB = Object.freeze({
  freeSector: 0xffffffff,
  endOfChain: 0xfffffffe,
  fatSector: 0xfffffffd,
  difatSector: 0xfffffffc,
  noStream: 0xffffffff,
  headerSize: 512,
  directoryEntrySize: 128,
  miniSectorSize: 64,
  maxSectors: 65536,
  maxMiniSectors: 1048576,
  maxDirectoryEntries: 65536,
});

function extensionFor(filename) {
  const match = /\.([^.]+)$/.exec(filename ?? "");
  return match?.[1].toLowerCase() ?? "";
}

function parserError(code) {
  return Object.freeze({ code });
}

function errorCodeFor(error) {
  if (STABLE_ERROR_CODES.has(error?.code)) return error.code;
  return error?.name === "PasswordException" ? "encrypted-pdf" : "malformed-file";
}

function hasCompoundFileSignature(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer, 0, Math.min(arrayBuffer.byteLength, COMPOUND_FILE_SIGNATURE.length));
  return bytes.length === COMPOUND_FILE_SIGNATURE.length
    && COMPOUND_FILE_SIGNATURE.every((value, index) => bytes[index] === value);
}

function regularSectorId(id, totalSectors) {
  return Number.isInteger(id) && id >= 0 && id < totalSectors;
}

function readCfbHeader(bytes, view) {
  if (bytes.byteLength < CFB.headerSize) return null;
  if (view.getUint16(24, true) !== 0x003e || view.getUint16(28, true) !== 0xfffe) return null;
  const majorVersion = view.getUint16(26, true);
  const sectorShift = view.getUint16(30, true);
  const sectorSize = 2 ** sectorShift;
  if (!((majorVersion === 3 && sectorShift === 9) || (majorVersion === 4 && sectorShift === 12))) return null;
  const miniStreamCutoff = view.getUint32(56, true);
  if (view.getUint16(32, true) !== 6 || miniStreamCutoff !== 4096) return null;
  if ([...bytes.subarray(8, 24), ...bytes.subarray(34, 40)].some(value => value !== 0)) return null;
  if (bytes.byteLength % sectorSize !== 0) return null;
  if (majorVersion === 4 && bytes.subarray(CFB.headerSize, sectorSize).some(value => value !== 0)) return null;

  const totalSectors = (bytes.byteLength / sectorSize) - 1;
  const numberOfDirectorySectors = view.getUint32(40, true);
  const numberOfFatSectors = view.getUint32(44, true);
  const firstDirectorySector = view.getUint32(48, true);
  const firstMiniFatSector = view.getUint32(60, true);
  const numberOfMiniFatSectors = view.getUint32(64, true);
  const firstDifatSector = view.getUint32(68, true);
  const numberOfDifatSectors = view.getUint32(72, true);

  if (totalSectors < 2 || totalSectors > CFB.maxSectors) return null;
  if (majorVersion === 3 && numberOfDirectorySectors !== 0) return null;
  if (majorVersion === 4 && (numberOfDirectorySectors === 0 || numberOfDirectorySectors > totalSectors)) return null;
  if (numberOfFatSectors === 0 || numberOfFatSectors > totalSectors) return null;
  if (!regularSectorId(firstDirectorySector, totalSectors)) return null;
  if (numberOfMiniFatSectors > totalSectors || numberOfDifatSectors > totalSectors) return null;
  if (numberOfMiniFatSectors === 0
    ? firstMiniFatSector !== CFB.endOfChain
    : !regularSectorId(firstMiniFatSector, totalSectors)) return null;
  if (numberOfDifatSectors === 0
    ? firstDifatSector !== CFB.endOfChain
    : !regularSectorId(firstDifatSector, totalSectors)) return null;

  return {
    majorVersion,
    sectorSize,
    miniStreamCutoff,
    totalSectors,
    numberOfDirectorySectors,
    numberOfFatSectors,
    firstDirectorySector,
    firstMiniFatSector,
    numberOfMiniFatSectors,
    firstDifatSector,
    numberOfDifatSectors,
  };
}

function sectorOffset(header, sectorId) {
  return (sectorId + 1) * header.sectorSize;
}

function collectCfbDifat(view, header) {
  const fatSectorIds = [];
  const fatSeen = new Set();
  const difatSectorIds = [];
  const difatSeen = new Set();
  const addFatSector = sectorId => {
    if (!regularSectorId(sectorId, header.totalSectors) || fatSeen.has(sectorId)) return false;
    fatSeen.add(sectorId);
    fatSectorIds.push(sectorId);
    return true;
  };

  for (let index = 0; index < 109; index += 1) {
    const sectorId = view.getUint32(76 + (index * 4), true);
    if (fatSectorIds.length < header.numberOfFatSectors) {
      if (!addFatSector(sectorId)) return null;
    } else if (sectorId !== CFB.freeSector) return null;
  }

  if (header.numberOfFatSectors <= 109) {
    if (header.numberOfDifatSectors !== 0 || fatSectorIds.length !== header.numberOfFatSectors) return null;
    return { fatSectorIds, difatSectorIds };
  }
  if (header.numberOfDifatSectors === 0) return null;

  const difatEntriesPerSector = (header.sectorSize / 4) - 1;
  let currentSector = header.firstDifatSector;
  for (let chainIndex = 0; chainIndex < header.numberOfDifatSectors; chainIndex += 1) {
    if (!regularSectorId(currentSector, header.totalSectors)
      || difatSeen.has(currentSector)
      || fatSeen.has(currentSector)) return null;
    difatSeen.add(currentSector);
    difatSectorIds.push(currentSector);
    const offset = sectorOffset(header, currentSector);
    for (let entryIndex = 0; entryIndex < difatEntriesPerSector; entryIndex += 1) {
      const sectorId = view.getUint32(offset + (entryIndex * 4), true);
      if (fatSectorIds.length < header.numberOfFatSectors) {
        if (!addFatSector(sectorId)) return null;
      } else if (sectorId !== CFB.freeSector) return null;
    }
    const nextSector = view.getUint32(offset + (difatEntriesPerSector * 4), true);
    const finalSector = chainIndex === header.numberOfDifatSectors - 1;
    if (finalSector ? nextSector !== CFB.endOfChain : !regularSectorId(nextSector, header.totalSectors)) return null;
    currentSector = nextSector;
  }

  if (fatSectorIds.length !== header.numberOfFatSectors) return null;
  if (difatSectorIds.some(sectorId => fatSeen.has(sectorId))) return null;
  return { fatSectorIds, difatSectorIds };
}

function readCfbFat(view, header, fatSectorIds, difatSectorIds) {
  const entriesPerSector = header.sectorSize / 4;
  if (fatSectorIds.length * entriesPerSector < header.totalSectors) return null;
  const fat = new Uint32Array(header.totalSectors);
  let targetIndex = 0;
  for (const sectorId of fatSectorIds) {
    const offset = sectorOffset(header, sectorId);
    for (let entryIndex = 0; entryIndex < entriesPerSector && targetIndex < fat.length; entryIndex += 1) {
      fat[targetIndex] = view.getUint32(offset + (entryIndex * 4), true);
      targetIndex += 1;
    }
  }

  const specialIds = new Set([CFB.freeSector, CFB.endOfChain, CFB.fatSector, CFB.difatSector]);
  if (Array.from(fat, sectorId => regularSectorId(sectorId, header.totalSectors) || specialIds.has(sectorId)).some(valid => !valid)) {
    return null;
  }
  if (fatSectorIds.some(sectorId => fat[sectorId] !== CFB.fatSector)) return null;
  if (difatSectorIds.some(sectorId => fat[sectorId] !== CFB.difatSector)) return null;
  return fat;
}

function readCfbChain(startSector, expectedLength, header, fat, reservedSectors) {
  if (startSector === CFB.endOfChain) return expectedLength === 0 ? [] : null;
  const chain = [];
  const seen = new Set();
  let currentSector = startSector;
  while (chain.length <= header.totalSectors) {
    if (!regularSectorId(currentSector, header.totalSectors)
      || reservedSectors.has(currentSector)
      || seen.has(currentSector)) return null;
    seen.add(currentSector);
    chain.push(currentSector);
    const nextSector = fat[currentSector];
    if (nextSector === CFB.endOfChain) break;
    if (!regularSectorId(nextSector, header.totalSectors)) return null;
    currentSector = nextSector;
  }
  if (chain.length > header.totalSectors) return null;
  if (expectedLength != null && chain.length !== expectedLength) return null;
  return chain;
}

function readCfbMiniFat(view, header, miniFatSectors) {
  const entriesPerSector = header.sectorSize / 4;
  const entryCount = miniFatSectors.length * entriesPerSector;
  if (entryCount > CFB.maxMiniSectors) return null;
  const miniFat = new Uint32Array(entryCount);
  let targetIndex = 0;
  for (const sectorId of miniFatSectors) {
    const offset = sectorOffset(header, sectorId);
    for (let entryIndex = 0; entryIndex < entriesPerSector; entryIndex += 1) {
      miniFat[targetIndex] = view.getUint32(offset + (entryIndex * 4), true);
      targetIndex += 1;
    }
  }
  return miniFat;
}

function readCfbMiniChain(startSector, expectedLength, miniFat, miniStreamCapacity) {
  if (!Number.isInteger(expectedLength)
    || expectedLength <= 0
    || expectedLength > miniStreamCapacity
    || !Number.isInteger(startSector)
    || startSector < 0
    || startSector >= miniStreamCapacity) return null;
  const chain = [];
  const seen = new Set();
  let currentSector = startSector;
  while (chain.length <= miniStreamCapacity) {
    if (currentSector >= miniStreamCapacity || seen.has(currentSector)) return null;
    seen.add(currentSector);
    chain.push(currentSector);
    const nextSector = miniFat[currentSector];
    if (nextSector === CFB.endOfChain) break;
    if (!Number.isInteger(nextSector) || nextSector >= miniStreamCapacity) return null;
    currentSector = nextSector;
  }
  if (chain.length > miniStreamCapacity || chain.length !== expectedLength) return null;
  return chain;
}

function decodeCfbDirectoryName(bytes, view, entryOffset, nameLength) {
  if (nameLength < 4 || nameLength > 64 || nameLength % 2 !== 0) return null;
  if (view.getUint16(entryOffset + nameLength - 2, true) !== 0) return null;
  if (bytes.subarray(entryOffset + nameLength, entryOffset + 64).some(value => value !== 0)) return null;
  const codeUnits = [];
  for (let offset = 0; offset < nameLength - 2; offset += 2) {
    const codeUnit = view.getUint16(entryOffset + offset, true);
    if (codeUnit === 0) return null;
    codeUnits.push(codeUnit);
  }
  for (let index = 0; index < codeUnits.length; index += 1) {
    const codeUnit = codeUnits[index];
    if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const lowSurrogate = codeUnits[index + 1];
      if (!(lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff)) return null;
      index += 1;
    } else if (codeUnit >= 0xdc00 && codeUnit <= 0xdfff) return null;
  }
  return String.fromCharCode(...codeUnits);
}

function readCfbDirectoryEntries(bytes, view, header, directorySectors) {
  const entriesPerSector = header.sectorSize / CFB.directoryEntrySize;
  const entryCount = directorySectors.length * entriesPerSector;
  if (entryCount === 0 || entryCount > CFB.maxDirectoryEntries) return null;
  const entries = [];
  for (const sectorId of directorySectors) {
    const sectorStart = sectorOffset(header, sectorId);
    for (let entryIndex = 0; entryIndex < entriesPerSector; entryIndex += 1) {
      const offset = sectorStart + (entryIndex * CFB.directoryEntrySize);
      const nameLength = view.getUint16(offset + 64, true);
      const type = bytes[offset + 66];
      if (type === 0) {
        if (nameLength !== 0) return null;
        entries.push({
          type,
          name: "",
          left: CFB.noStream,
          right: CFB.noStream,
          child: CFB.noStream,
          startSector: CFB.endOfChain,
          streamSize: 0,
        });
        continue;
      }
      if (![1, 2, 5].includes(type) || ![0, 1].includes(bytes[offset + 67])) return null;
      const name = decodeCfbDirectoryName(bytes, view, offset, nameLength);
      if (name == null) return null;
      const streamSizeHigh = view.getUint32(offset + 124, true);
      if (header.majorVersion === 3 && streamSizeHigh !== 0) return null;
      const streamSize = (streamSizeHigh * 0x100000000) + view.getUint32(offset + 120, true);
      if (!Number.isSafeInteger(streamSize)) return null;
      entries.push({
        type,
        name,
        left: view.getUint32(offset + 68, true),
        right: view.getUint32(offset + 72, true),
        child: view.getUint32(offset + 76, true),
        startSector: view.getUint32(offset + 116, true),
        streamSize,
      });
    }
  }
  return entries;
}

function findEncryptedOoxmlDirectoryStreams(entries) {
  const validPointer = pointer => pointer === CFB.noStream || pointer < entries.length;
  if (entries[0]?.type !== 5 || entries[0].name !== "Root Entry") return null;
  if (entries.filter(entry => entry.type === 5).length !== 1) return null;
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (entry.type === 0) continue;
    if (![entry.left, entry.right, entry.child].every(validPointer)) return null;
    if (entry.type === 5 && (index !== 0 || entry.left !== CFB.noStream || entry.right !== CFB.noStream)) return null;
    if (entry.type === 2 && entry.child !== CFB.noStream) return null;
  }

  const reached = new Set([0]);
  const stack = entries[0].child === CFB.noStream ? [] : [entries[0].child];
  const encryptedStreams = new Map();
  while (stack.length) {
    const entryId = stack.pop();
    if (entryId === 0 || entryId >= entries.length || reached.has(entryId)) return null;
    const entry = entries[entryId];
    if (entry.type === 0 || entry.type === 5) return null;
    reached.add(entryId);
    if (entry.left !== CFB.noStream) stack.push(entry.left);
    if (entry.right !== CFB.noStream) stack.push(entry.right);
    if (entry.type === 1 && entry.child !== CFB.noStream) stack.push(entry.child);
    if (entry.type === 2 && ["EncryptionInfo", "EncryptedPackage"].includes(entry.name)) {
      if (encryptedStreams.has(entry.name)) return null;
      encryptedStreams.set(entry.name, entry);
    }
  }
  if (entries.some((entry, index) => entry.type !== 0 && !reached.has(index))) return null;
  if (!encryptedStreams.has("EncryptionInfo") || !encryptedStreams.has("EncryptedPackage")) return null;
  return {
    root: entries[0],
    streams: [encryptedStreams.get("EncryptionInfo"), encryptedStreams.get("EncryptedPackage")],
  };
}

function validateCfbMiniFat(miniFat, miniStreamCapacity) {
  if (!Number.isInteger(miniStreamCapacity)
    || miniStreamCapacity < 0
    || miniStreamCapacity > CFB.maxMiniSectors
    || miniStreamCapacity > miniFat.length) return false;
  if (miniStreamCapacity === 0) return miniFat.length === 0;
  if (miniFat.length === 0) return false;
  for (let index = 0; index < miniFat.length; index += 1) {
    const sectorId = miniFat[index];
    if (index >= miniStreamCapacity) {
      if (sectorId !== CFB.freeSector) return false;
    } else if (sectorId !== CFB.freeSector
      && sectorId !== CFB.endOfChain
      && sectorId >= miniStreamCapacity) return false;
  }
  return true;
}

function validateEncryptedOoxmlAllocations(directory, header, fat, miniFat, reservedSectors) {
  const root = directory.root;
  if (root.streamSize === 0) {
    if (root.startSector !== CFB.endOfChain) return false;
  } else {
    const expectedRootSectors = Math.ceil(root.streamSize / header.sectorSize);
    if (expectedRootSectors > header.totalSectors) return false;
    const rootSectors = readCfbChain(root.startSector, expectedRootSectors, header, fat, reservedSectors);
    if (!rootSectors) return false;
    rootSectors.forEach(sectorId => reservedSectors.add(sectorId));
  }

  const miniStreamCapacity = Math.ceil(root.streamSize / CFB.miniSectorSize);
  if (!validateCfbMiniFat(miniFat, miniStreamCapacity)) return false;
  const usedMiniSectors = new Set();

  for (const stream of directory.streams) {
    if (!Number.isSafeInteger(stream.streamSize) || stream.streamSize <= 0) return false;
    if (stream.streamSize < header.miniStreamCutoff) {
      const expectedMiniSectors = Math.ceil(stream.streamSize / CFB.miniSectorSize);
      const miniSectors = readCfbMiniChain(
        stream.startSector,
        expectedMiniSectors,
        miniFat,
        miniStreamCapacity
      );
      if (!miniSectors || miniSectors.some(sectorId => usedMiniSectors.has(sectorId))) return false;
      miniSectors.forEach(sectorId => usedMiniSectors.add(sectorId));
      continue;
    }

    const expectedSectors = Math.ceil(stream.streamSize / header.sectorSize);
    if (expectedSectors > header.totalSectors) return false;
    const streamSectors = readCfbChain(stream.startSector, expectedSectors, header, fat, reservedSectors);
    if (!streamSectors) return false;
    streamSectors.forEach(sectorId => reservedSectors.add(sectorId));
  }
  return true;
}

function isEncryptedOoxmlCompound(arrayBuffer) {
  if (!hasCompoundFileSignature(arrayBuffer)) return false;
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const header = readCfbHeader(bytes, view);
    if (!header) return false;
    const difat = collectCfbDifat(view, header);
    if (!difat) return false;
    const fat = readCfbFat(view, header, difat.fatSectorIds, difat.difatSectorIds);
    if (!fat) return false;
    const reservedSectors = new Set([...difat.fatSectorIds, ...difat.difatSectorIds]);
    const miniFatSectors = readCfbChain(
      header.firstMiniFatSector,
      header.numberOfMiniFatSectors,
      header,
      fat,
      reservedSectors
    );
    if (!miniFatSectors) return false;
    miniFatSectors.forEach(sectorId => reservedSectors.add(sectorId));
    const expectedDirectorySectors = header.majorVersion === 4 ? header.numberOfDirectorySectors : null;
    const directorySectors = readCfbChain(
      header.firstDirectorySector,
      expectedDirectorySectors,
      header,
      fat,
      reservedSectors
    );
    if (!directorySectors) return false;
    directorySectors.forEach(sectorId => reservedSectors.add(sectorId));
    const entries = readCfbDirectoryEntries(bytes, view, header, directorySectors);
    if (!entries) return false;
    const directory = findEncryptedOoxmlDirectoryStreams(entries);
    if (!directory) return false;
    const miniFat = readCfbMiniFat(view, header, miniFatSectors);
    return miniFat
      ? validateEncryptedOoxmlAllocations(directory, header, fat, miniFat, reservedSectors)
      : false;
  } catch {
    return false;
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
      continue;
    }
    if (character === '"' && field === "") quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw parserError("malformed-csv");
  row.push(field);
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length < 2 || rows[0].length < 2 || rows.some(candidate => candidate.length !== rows[0].length)) {
    throw parserError("malformed-csv");
  }
}

function validateRis(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2 || !/^TY  -\s*\S+/.test(lines[0]) || !/^ER  -\s*$/.test(lines.at(-1))) {
    throw parserError("malformed-ris");
  }
  if (lines.some(line => !/^[A-Z0-9]{2}  -(?:\s.*)?$/.test(line))) {
    throw parserError("malformed-ris");
  }
}

function validateBibtex(text) {
  let cursor = 0;
  let entries = 0;
  while (cursor < text.length) {
    while (/\s/.test(text[cursor] ?? "")) cursor += 1;
    if (cursor >= text.length) break;
    const header = /^@[A-Za-z][A-Za-z0-9_-]*\s*([({])/.exec(text.slice(cursor));
    if (!header) throw parserError("malformed-bib");
    const openingIndex = cursor + header[0].length - 1;
    const stack = [header[1]];
    let quoted = false;
    let escaped = false;
    let end = -1;
    for (let index = openingIndex + 1; index < text.length; index += 1) {
      const character = text[index];
      if (escaped) { escaped = false; continue; }
      if (character === "\\") { escaped = true; continue; }
      if (character === '"') { quoted = !quoted; continue; }
      if (quoted) continue;
      if (character === "{" || character === "(") stack.push(character);
      if (character === "}" || character === ")") {
        const expected = character === "}" ? "{" : "(";
        if (stack.at(-1) !== expected) throw parserError("malformed-bib");
        stack.pop();
        if (!stack.length) { end = index; break; }
      }
    }
    if (end < 0 || !text.slice(openingIndex + 1, end).includes(",")) throw parserError("malformed-bib");
    entries += 1;
    cursor = end + 1;
  }
  if (!entries) throw parserError("malformed-bib");
}

export async function parsePdf(arrayBuffer, pdfjs, resourceUrls = {}) {
  const task = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    ...resourceUrls,
  });
  const document = await task.promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => item.str).join(" "));
  }

  const text = pages.join("\n\n").trim();
  if (!text) throw parserError("image-only-pdf");
  return { text, warnings: text.length < 40 ? ["image-only-or-empty-pdf"] : [] };
}

export async function parseDocx(arrayBuffer, mammoth) {
  let result;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (error) {
    if (error?.message !== "Could not find file in options" || typeof Buffer === "undefined") {
      throw error;
    }
    result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
  }
  return {
    text: (() => {
      const text = result.value.trim();
      if (!text) throw parserError("image-only-docx");
      return text;
    })(),
    warnings: result.messages.map(message => message.type),
  };
}

export async function parsePlainText(arrayBuffer, format = "txt") {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(arrayBuffer).trim();
  } catch {
    throw parserError("invalid-utf8");
  }
  if (!text) throw parserError("empty-text");
  if (format === "csv") parseCsv(text);
  if (format === "ris") validateRis(text);
  if (format === "bib") validateBibtex(text);
  return {
    text,
    warnings: [],
  };
}

export async function parseEvidenceFile(file, dependencies = {}) {
  const extension = extensionFor(file?.name);
  if (!["pdf", "docx", ...PLAIN_TEXT_EXTENSIONS].includes(extension)) {
    throw parserError("unsupported-file");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    if (extension === "pdf") {
      return await parsePdf(arrayBuffer, dependencies.pdfjs, dependencies.pdfResources);
    }
    if (extension === "docx") {
      if (isEncryptedOoxmlCompound(arrayBuffer)) throw parserError("encrypted-docx");
      return await parseDocx(arrayBuffer, dependencies.mammoth);
    }
    return await parsePlainText(arrayBuffer, extension);
  } catch (error) {
    throw parserError(errorCodeFor(error));
  }
}
