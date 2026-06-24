const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const localDataDir = path.join(__dirname, '..', 'data');
const configuredUploadDir = String(process.env.UPLOAD_STORAGE_DIR || '').trim();
const uploadDir = configuredUploadDir
  ? path.resolve(configuredUploadDir)
  : path.resolve(process.cwd(), 'uploads');

fs.mkdirSync(uploadDir, { recursive: true });

function sanitizeNamespace(namespace) {
  return String(namespace || 'uploads')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9/_-]+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '') || 'uploads';
}

function sanitizeExtension(originalName) {
  const rawExt = path.extname(String(originalName || '')).toLowerCase();
  const normalized = rawExt.replace(/[^.a-z0-9]+/g, '');
  return normalized && normalized.length <= 12 ? normalized : '';
}

function createStorageKey(namespace, originalName) {
  const safeNamespace = sanitizeNamespace(namespace);
  const ext = sanitizeExtension(originalName);
  const unique = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  return `${safeNamespace}/${unique}${ext}`;
}

function resolveStoredFilePath(storageKey) {
  const normalizedKey = String(storageKey || '').replace(/\\/g, '/').trim();
  const fullPath = path.resolve(uploadDir, ...normalizedKey.split('/').filter(Boolean));
  const relative = path.relative(uploadDir, fullPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    const error = new Error('Invalid storage key path.');
    error.code = 'EINVAL';
    throw error;
  }
  return fullPath;
}

function toAsciiFilenameFallback(fileName) {
  const normalized = String(fileName || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/["\\]/g, '')
    .replace(/[^\x20-\x7E]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  const trimmed = normalized.slice(0, 180).trim();
  return trimmed || 'download';
}

function encodeRfc5987(value) {
  return encodeURIComponent(String(value || 'download'))
    .replace(/['()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function buildContentDisposition(disposition, fileName) {
  const originalName = String(fileName || 'download')
    .replace(/[\r\n]/g, ' ')
    .trim() || 'download';
  const asciiName = toAsciiFilenameFallback(originalName);
  const encodedName = encodeRfc5987(originalName);
  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
}

function isStorageNotFoundError(error) {
  const code = String(error && (error.code || error.name || error.Code) || '').trim();
  return code === 'ENOENT' || code === 'NotFound';
}

async function storeUploadedFile(file, options = {}) {
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Uploaded file buffer is required.');
  }

  const storageKey = createStorageKey(options.namespace, file.originalname);
  const fullPath = resolveStoredFilePath(storageKey);
  await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.promises.writeFile(fullPath, file.buffer);

  return { storageKey };
}

async function deleteStoredFile(storageKey) {
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) return;

  const fullPath = resolveStoredFilePath(normalizedKey);
  try {
    await fs.promises.unlink(fullPath);
  } catch (error) {
    if (!isStorageNotFoundError(error)) throw error;
  }
}

async function sendStoredFile(res, storageKey, options = {}) {
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) {
    const error = new Error('Stored file not found.');
    error.code = 'ENOENT';
    throw error;
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
  try {
    await fs.promises.access(fullPath, fs.constants.F_OK | fs.constants.R_OK);
  } catch (error) {
    error.code = 'ENOENT';
    throw error;
  }

  const contentType = String(options.contentType || '').trim();
  const disposition = String(options.disposition || 'attachment').trim().toLowerCase() === 'inline' ? 'inline' : 'attachment';
  res.setHeader('Content-Disposition', buildContentDisposition(disposition, options.downloadName));
  if (contentType) {
    res.type(contentType);
  }

  const stats = await fs.promises.stat(fullPath);
  if (Number.isFinite(stats.size)) {
    res.setHeader('Content-Length', String(stats.size));
  }

  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(fullPath);

    let settled = false;
    const complete = (fn, value) => {
      if (settled) return;
      settled = true;
      stream.removeListener('error', onStreamError);
      res.removeListener('error', onResError);
      res.removeListener('close', onResClose);
      res.removeListener('finish', onResFinish);
      fn(value);
    };

    const onStreamError = (error) => complete(reject, error);
    const onResError = (error) => complete(reject, error);
    const onResClose = () => complete(resolve);
    const onResFinish = () => complete(resolve);

    stream.on('error', onStreamError);
    res.on('error', onResError);
    res.on('close', onResClose);
    res.on('finish', onResFinish);
    stream.pipe(res);
  });
}

async function createStoredFileReadStream(storageKey) {
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) {
    const error = new Error('Stored file not found.');
    error.code = 'ENOENT';
    throw error;
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
  try {
    await fs.promises.access(fullPath, fs.constants.F_OK | fs.constants.R_OK);
  } catch (error) {
    error.code = 'ENOENT';
    throw error;
  }

  const stats = await fs.promises.stat(fullPath);
  return {
    stream: fs.createReadStream(fullPath),
    contentLength: Number(stats.size) || null,
    contentType: null,
  };
}

module.exports = {
  createStoredFileReadStream,
  deleteStoredFile,
  isStorageNotFoundError,
  localDataDir,
  resolveStoredFilePath,
  sendStoredFile,
  storeUploadedFile,
  uploadDir,
};
