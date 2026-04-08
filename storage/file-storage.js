const fs = require('fs');
const path = require('path');

function isProductionDeployment() {
  const nodeEnv = String(process.env.NODE_ENV || '').trim().toLowerCase();
  const renderFlag = String(process.env.RENDER || '').trim().toLowerCase();
  return nodeEnv === 'production' || renderFlag === 'true';
}

const localDataDir = path.join(__dirname, '..', 'data');
const localUploadDir = path.join(localDataDir, 'uploads');

function resolveUploadDir() {
  if (!isProductionDeployment()) {
    fs.mkdirSync(localDataDir, { recursive: true });
    fs.mkdirSync(localUploadDir, { recursive: true });
    return localUploadDir;
  }

  const configuredRoot = String(process.env.UPLOAD_STORAGE_DIR || '').trim();
  if (!configuredRoot) {
    throw new Error('UPLOAD_STORAGE_DIR must point to durable storage in production. Do not use Render ephemeral app disk for uploads.');
  }

  const resolved = path.resolve(configuredRoot);
  fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

const uploadDir = resolveUploadDir();

function resolveStoredFilePath(storedName) {
  return path.join(uploadDir, path.basename(String(storedName || '').trim()));
}

module.exports = {
  localDataDir,
  resolveStoredFilePath,
  uploadDir,
};