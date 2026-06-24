const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PassThrough } = require('stream');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

function isProductionDeployment() {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const renderFlag = String(process.env.RENDER || '').trim().toLowerCase();
  return nodeEnv === 'production' || renderFlag === 'true';
}

const localDataDir = path.join(__dirname, '..', 'data');
const localUploadDir = path.join(localDataDir, 'uploads');

function inferS3BackendConfigured() {
  return Boolean(
    String(process.env.STORAGE_S3_BUCKET || '').trim()
    && String(process.env.STORAGE_S3_REGION || '').trim()
    && String(process.env.STORAGE_S3_ACCESS_KEY_ID || '').trim()
    && String(process.env.STORAGE_S3_SECRET_ACCESS_KEY || '').trim()
  );
}

function resolveStorageBackend() {
  const explicit = String(process.env.STORAGE_BACKEND || '').trim().toLowerCase();
  if (explicit === 's3' || explicit === 'local') {
    return explicit;
  }

  if (isProductionDeployment()) {
    if (inferS3BackendConfigured()) {
      return 's3';
    }
    if (String(process.env.UPLOAD_STORAGE_DIR || '').trim()) {
      return 'local';
    }
    throw new Error('Production uploads require S3-compatible object storage or an explicit durable UPLOAD_STORAGE_DIR mount. Do not use Render ephemeral app disk for uploads.');
  }

  return inferS3BackendConfigured() ? 's3' : 'local';
}

function resolveUploadDir() {
  const configuredRoot = String(process.env.UPLOAD_STORAGE_DIR || '').trim();
  if (!configuredRoot) {
    if (isProductionDeployment()) {
      throw new Error('UPLOAD_STORAGE_DIR must point to durable storage when STORAGE_BACKEND=local in production.');
    }
    fs.mkdirSync(localDataDir, { recursive: true });
    fs.mkdirSync(localUploadDir, { recursive: true });
    return localUploadDir;
  }

  const resolved = path.resolve(configuredRoot);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

let storageBackend = null;
let uploadDir = null;
let s3Client = null;
let s3Bucket = '';
let storageInitError = null;
let storageInitialized = false;

function initializeStorage() {
  if (storageInitialized) return;
  storageInitialized = true;

  try {
    storageBackend = resolveStorageBackend();
    uploadDir = storageBackend === 'local' ? resolveUploadDir() : null;
    s3Bucket = String(process.env.STORAGE_S3_BUCKET || '').trim();
    s3Client = storageBackend === 's3'
      ? new S3Client({
          region: String(process.env.STORAGE_S3_REGION || '').trim(),
          endpoint: String(process.env.STORAGE_S3_ENDPOINT || '').trim() || undefined,
          forcePathStyle: String(process.env.STORAGE_S3_FORCE_PATH_STYLE || '').trim().toLowerCase() === 'true',
          credentials: {
            accessKeyId: String(process.env.STORAGE_S3_ACCESS_KEY_ID || '').trim(),
            secretAccessKey: String(process.env.STORAGE_S3_SECRET_ACCESS_KEY || '').trim(),
          },
        })
      : null;
  } catch (error) {
    storageInitError = error;
  }
}

function ensureStorageReady() {
  initializeStorage();
  if (storageInitError) {
    throw storageInitError;
  }
}

function sanitizeNamespace(namespace) {
  return String(namespace || 'uploads').trim().toLowerCase().replace(/[^a-z0-9/_-]+/g, '-').replace(/^[-/]+|[-/]+$/g, '') || 'uploads';
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
  ensureStorageReady();
  return path.join(uploadDir, ...String(storageKey || '').split('/').filter(Boolean));
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
  const statusCode = Number(error && error.$metadata && error.$metadata.httpStatusCode);
  return code === 'ENOENT' || code === 'NoSuchKey' || code === 'NotFound' || statusCode === 404;
}

async function storeUploadedFile(file, options = {}) {
  ensureStorageReady();
  if (!file || !file.buffer || !Buffer.isBuffer(file.buffer)) {
    throw new Error('Uploaded file buffer is required.');
  }

  const storageKey = createStorageKey(options.namespace, file.originalname);
  if (storageBackend === 's3') {
    await s3Client.send(new PutObjectCommand({
      Bucket: s3Bucket,
      Key: storageKey,
      Body: file.buffer,
      ContentType: String(file.mimetype || 'application/octet-stream'),
    }));
  } else {
    const fullPath = resolveStoredFilePath(storageKey);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, file.buffer);
  }

  return { storageKey };
}

async function deleteStoredFile(storageKey) {
  ensureStorageReady();
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) return;

  if (storageBackend === 's3') {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey,
    }));
    return;
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
  await fs.promises.unlink(fullPath);
}

async function sendStoredFile(res, storageKey, options = {}) {
  ensureStorageReady();
  console.log('[sendStoredFile] start', { storageKey, backend: storageBackend, hasContentType: !!options.contentType });
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) {
    const error = new Error('Stored file not found.');
    error.code = 'ENOENT';
    console.error('[sendStoredFile] empty key error');
    throw error;
  }

  const contentType = String(options.contentType || '').trim();
  const disposition = String(options.disposition || 'attachment').trim().toLowerCase() === 'inline' ? 'inline' : 'attachment';
  
  try {
    const dispositionHeader = buildContentDisposition(disposition, options.downloadName);
    console.log('[sendStoredFile] setting disposition header', { disposition, downloadName: options.downloadName, header: dispositionHeader });
    res.setHeader('Content-Disposition', dispositionHeader);
  } catch (headerError) {
    console.error('[sendStoredFile] disposition header error', headerError);
    throw headerError;
  }
  
  if (contentType) {
    console.log('[sendStoredFile] setting content-type', { contentType });
    res.type(contentType);
  }

  if (storageBackend === 's3') {
    console.log('[sendStoredFile] s3 backend - fetching object');
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey,
    }));
    console.log('[sendStoredFile] s3 object received', { contentLength: response.ContentLength, responseContentType: response.ContentType });
    
    if (!contentType && response.ContentType) {
      res.type(response.ContentType);
    }
    if (response.ContentLength != null) {
      res.setHeader('Content-Length', String(response.ContentLength));
    }

    await new Promise((resolve, reject) => {
      const body = response.Body;
      console.log('[sendStoredFile] s3 stream - validating body');
      if (!body || typeof body.pipe !== 'function') {
        const err = new Error('Stored file body stream is unavailable.');
        console.error('[sendStoredFile] s3 body invalid', err);
        reject(err);
        return;
      }
      
      const handleBodyError = (error) => {
        console.error('[sendStoredFile] s3 body stream error', error);
        stream.destroy();
        reject(error);
      };
      const handleResError = (error) => {
        console.error('[sendStoredFile] s3 response stream error', error);
        body.destroy();
        reject(error);
      };
      const handleFinish = () => {
        console.log('[sendStoredFile] s3 stream finish');
        body.removeListener('error', handleBodyError);
        res.removeListener('error', handleResError);
        resolve();
      };
      
      body.on('error', handleBodyError);
      res.on('error', handleResError);
      res.on('finish', handleFinish);
      console.log('[sendStoredFile] s3 piping body to response');
      body.pipe(res);
    });
    console.log('[sendStoredFile] s3 streaming complete');
    return;
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
  console.log('[sendStoredFile] local backend - reading from', fullPath);
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(fullPath);
    console.log('[sendStoredFile] local stream created');
    
    const handleStreamError = (error) => {
      console.error('[sendStoredFile] local stream error', error);
      stream.destroy();
      res.destroy();
      reject(error);
    };
    const handleResError = (error) => {
      console.error('[sendStoredFile] local response error', error);
      stream.destroy();
      reject(error);
    };
    const handleFinish = () => {
      console.log('[sendStoredFile] local stream finish');
      stream.removeListener('error', handleStreamError);
      res.removeListener('error', handleResError);
      resolve();
    };
    
    stream.on('error', handleStreamError);
    res.on('error', handleResError);
    res.on('finish', handleFinish);
    console.log('[sendStoredFile] piping local stream to response');
    stream.pipe(res);
  });
  console.log('[sendStoredFile] local streaming complete');
}

async function createStoredFileReadStream(storageKey) {
  ensureStorageReady();
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) {
    const error = new Error('Stored file not found.');
    error.code = 'ENOENT';
    throw error;
  }

  if (storageBackend === 's3') {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey,
    }));

    const body = response.Body;
    if (!body || typeof body.pipe !== 'function') {
      throw new Error('Stored file body stream is unavailable.');
    }

    const stream = new PassThrough();
    body.on('error', (error) => stream.destroy(error));
    body.pipe(stream);
    return {
      stream,
      contentLength: response.ContentLength != null ? Number(response.ContentLength) : null,
      contentType: response.ContentType || null,
    };
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
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
  isProductionDeployment,
  isStorageNotFoundError,
  localDataDir,
  resolveStoredFilePath,
  sendStoredFile,
  storageBackend,
  storeUploadedFile,
  uploadDir,
};