const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

const storageBackend = resolveStorageBackend();
const uploadDir = storageBackend === 'local' ? resolveUploadDir() : null;

const s3Client = storageBackend === 's3'
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
const s3Bucket = String(process.env.STORAGE_S3_BUCKET || '').trim();

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
  return path.join(uploadDir, ...String(storageKey || '').split('/').filter(Boolean));
}

function buildContentDisposition(disposition, fileName) {
  const safeName = String(fileName || 'download').replace(/[\r\n"]/g, '').trim() || 'download';
  return `${disposition}; filename="${safeName}"`;
}

function isStorageNotFoundError(error) {
  const code = String(error && (error.code || error.name || error.Code) || '').trim();
  const statusCode = Number(error && error.$metadata && error.$metadata.httpStatusCode);
  return code === 'ENOENT' || code === 'NoSuchKey' || code === 'NotFound' || statusCode === 404;
}

async function storeUploadedFile(file, options = {}) {
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
  const normalizedKey = String(storageKey || '').trim();
  if (!normalizedKey) {
    const error = new Error('Stored file not found.');
    error.code = 'ENOENT';
    throw error;
  }

  const contentType = String(options.contentType || '').trim();
  const disposition = String(options.disposition || 'attachment').trim().toLowerCase() === 'inline' ? 'inline' : 'attachment';
  res.setHeader('Content-Disposition', buildContentDisposition(disposition, options.downloadName));
  if (contentType) {
    res.type(contentType);
  }

  if (storageBackend === 's3') {
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: s3Bucket,
      Key: normalizedKey,
    }));
    if (!contentType && response.ContentType) {
      res.type(response.ContentType);
    }
    if (response.ContentLength != null) {
      res.setHeader('Content-Length', String(response.ContentLength));
    }

    await new Promise((resolve, reject) => {
      const body = response.Body;
      if (!body || typeof body.pipe !== 'function') {
        reject(new Error('Stored file body stream is unavailable.'));
        return;
      }
      body.on('error', reject);
      res.on('error', reject);
      res.on('finish', resolve);
      body.pipe(res);
    });
    return;
  }

  const fullPath = resolveStoredFilePath(normalizedKey);
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(fullPath);
    stream.on('error', reject);
    res.on('error', reject);
    res.on('finish', resolve);
    stream.pipe(res);
  });
}

module.exports = {
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