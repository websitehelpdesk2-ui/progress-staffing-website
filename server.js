const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const { Server } = require('socket.io');
const { bootstrapPostgresSchema, runSafePostgresMigrations, createDatabase, isProductionDeployment, isUsingPostgres } = require('./db');
const {
  isEmailServiceConfigured,
  sendPasswordResetEmail,
  sendOnboardingReminderEmail,
  sendNotificationEmail,
  sendPostmarkTestEmail,
} = require('./services/email-service');
const twilio = require('twilio');
const webpush = require('web-push');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const {
  createStoredFileReadStream,
  deleteStoredFile,
  isStorageNotFoundError,
  localDataDir,
  sendStoredFile,
  storeUploadedFile,
} = require('./storage/file-storage');
const yazl = require('yazl');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
const port = process.env.PORT || 3000;

const db = createDatabase();
db.pragma('foreign_keys = ON');

app.disable('x-powered-by');
app.set('trust proxy', 1);

const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24 hours
const CLOCK_GEOFENCE_FEET = 1000;
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || '').trim();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || '');
const ONBOARDING_PORTAL_EMAIL = String(process.env.ONBOARDING_PORTAL_EMAIL || '').trim();
const CONTRACTS_PORTAL_EMAIL = String(process.env.CONTRACTS_PORTAL_EMAIL || '').trim();
const SCHEDULING_PORTAL_EMAIL = String(process.env.SCHEDULING_PORTAL_EMAIL || '').trim();
const SCOPED_PORTAL_PASSCODE = String(process.env.SCOPED_PORTAL_PASSCODE || '').trim();
const ADMIN_SCOPES = new Set(['full', 'onboarding', 'contracts', 'scheduling']);
const LOCAL_APP_BASE_URL = `http://localhost:${port}`;
const APP_URL_PLACEHOLDER_BASE = 'http://app.local';
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@progressstaffingagency.com';
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || 'onboarding@progressstaffingagency.com';
const POSTMARK_SERVER_TOKEN = String(process.env.POSTMARK_SERVER_TOKEN || '').trim();
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || `mailto:${EMAIL_FROM}`;
const TIMESHEET_APPROVAL_ALERT_EMAIL = process.env.TIMESHEET_APPROVAL_ALERT_EMAIL || 'info@progresshealthcarestaffing.net';
const vapidKeysPath = path.join(localDataDir, 'vapid-keys.json');
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;
const PASSKEY_PROOF_TTL_MS = 5 * 60 * 1000;
const SENSITIVE_PASSKEY_ACTIONS = new Set([
  'admin-user-delete',
  'admin-password-reset',
]);

const passkeyChallenges = new Map();
const passkeyActionProofs = new Map();
const manualDocumentReminderInFlight = new Map();
const notificationDispatchInFlight = new Map();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const SUPPORTED_PORTAL_LANGUAGES = new Set(['en', 'es', 'ar']);
const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;
const AUTO_DB_BOOTSTRAP = !isProductionDeployment() && String(process.env.AUTO_DB_BOOTSTRAP || '').trim().toLowerCase() === 'true';

function normalizeBaseUrl(rawValue, source) {
  const value = String(rawValue || '').trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) {
      throw new Error('Base URL must use http or https.');
    }
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    console.error('[startup] Invalid application base URL configuration.', {
      source,
      rawValue: value,
      error: error.message,
    });
    return null;
  }
}

function resolveAppBaseUrlConfig() {
  const candidates = [
    ['APP_BASE_URL', process.env.APP_BASE_URL],
    ['PUBLIC_APP_URL', process.env.PUBLIC_APP_URL],
  ];

  for (const [source, rawValue] of candidates) {
    const baseUrl = normalizeBaseUrl(rawValue, source);
    if (!baseUrl) continue;

    return {
      baseUrl,
      source,
      usedFallback: false,
      environment: isProductionDeployment() ? 'production' : 'development',
    };
  }

  if (!isProductionDeployment()) {
    const fallbackBaseUrl = normalizeBaseUrl(LOCAL_APP_BASE_URL, 'development-fallback');
    return {
      baseUrl: fallbackBaseUrl,
      source: 'development-fallback',
      usedFallback: true,
      environment: 'development',
    };
  }

  return {
    baseUrl: null,
    source: null,
    usedFallback: false,
    environment: 'production',
  };
}

const APP_URL_CONFIG = resolveAppBaseUrlConfig();
const APP_BASE_URL = APP_URL_CONFIG.baseUrl;

function validateAppBaseUrlConfiguration() {
  if (APP_BASE_URL) {
    console.info('[startup] Application base URL selected.', {
      environment: APP_URL_CONFIG.environment,
      source: APP_URL_CONFIG.source,
      baseUrl: APP_BASE_URL,
      usedFallback: APP_URL_CONFIG.usedFallback,
    });
    if (APP_URL_CONFIG.usedFallback) {
      console.warn('[startup] Application base URL is using the local development fallback.', {
        baseUrl: APP_BASE_URL,
        checkedEnvVars: ['APP_BASE_URL', 'PUBLIC_APP_URL'],
      });
    }
    return;
  }

  console.error('[startup] Missing application base URL configuration.', {
    environment: APP_URL_CONFIG.environment,
    checkedEnvVars: ['APP_BASE_URL', 'PUBLIC_APP_URL'],
    message: 'Set APP_BASE_URL or PUBLIC_APP_URL to generate absolute links for emails and portal notifications.',
  });
}

function getMissingEmailEnvVars() {
  return [
    ['POSTMARK_SERVER_TOKEN', POSTMARK_SERVER_TOKEN],
    ['EMAIL_FROM', EMAIL_FROM],
    ['EMAIL_REPLY_TO', EMAIL_REPLY_TO],
  ]
    .filter(([, value]) => !String(value || '').trim())
    .map(([name]) => name);
}

function validateEmailEnvironment() {
  const missingVars = getMissingEmailEnvVars();
  if (!missingVars.length) return;

  console.warn('[startup] Email delivery is disabled until Postmark settings are configured.', {
    missingVars,
  });
}

function serializeError(error) {
  if (!error) return null;
  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    code: error.code || null,
    stack: error.stack || null,
  };
}

function logFlowEvent(event, details = {}) {
  console.info(`[email-flow] ${event}`, details);
}

function logCaughtException(context, error, details = {}) {
  console.error(`[exception] ${context}`, {
    ...details,
    error: serializeError(error),
  });
}

validateEmailEnvironment();
validateAppBaseUrlConfiguration();

function requireAppBaseUrl(context) {
  if (APP_BASE_URL) return APP_BASE_URL;

  const error = new Error('APP_BASE_URL or PUBLIC_APP_URL must be configured before generating absolute application URLs.');
  logCaughtException(`app base url unavailable: ${context}`, error, {
    environment: APP_URL_CONFIG.environment,
    checkedEnvVars: ['APP_BASE_URL', 'PUBLIC_APP_URL'],
    usedFallback: APP_URL_CONFIG.usedFallback,
  });
  throw error;
}

function buildAppUrl(relativePath, params = {}, context = 'app-url') {
  const baseUrl = requireAppBaseUrl(context);
  const url = new URL(relativePath.startsWith('/') ? relativePath : `/${relativePath}`, `${baseUrl}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  const absoluteUrl = url.toString();
  logFlowEvent('app URL generated', {
    context,
    baseUrl,
    source: APP_URL_CONFIG.source,
    usedFallback: APP_URL_CONFIG.usedFallback,
    absoluteUrl,
  });
  return absoluteUrl;
}

function resolvePasskeyRpId() {
  if (process.env.WEBAUTHN_RP_ID) {
    return String(process.env.WEBAUTHN_RP_ID).trim();
  }

  try {
    return new URL(process.env.WEBAUTHN_ORIGIN || APP_BASE_URL || LOCAL_APP_BASE_URL).hostname;
  } catch (_error) {
    return 'localhost';
  }
}

const PASSKEY_RP_ID = resolvePasskeyRpId();
const PASSKEY_ORIGIN = normalizeBaseUrl(process.env.WEBAUTHN_ORIGIN || APP_BASE_URL || LOCAL_APP_BASE_URL, 'passkey-origin');
const PASSKEY_ALLOWED_ORIGINS = new Set(
  [
    PASSKEY_ORIGIN,
    ...String(process.env.WEBAUTHN_ALLOWED_ORIGINS || '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  ].filter(Boolean)
);

function toBase64Url(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = String(value || '').trim().replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function storePasskeyChallenge(key, payload) {
  passkeyChallenges.set(key, {
    ...payload,
    expiresAt: Date.now() + PASSKEY_CHALLENGE_TTL_MS,
  });
}

function takePasskeyChallenge(key) {
  const record = passkeyChallenges.get(key);
  passkeyChallenges.delete(key);
  if (!record) return null;
  if (!record.expiresAt || record.expiresAt < Date.now()) return null;
  return record;
}

function parseTransports(rawValue) {
  if (!rawValue) return [];
  if (Array.isArray(rawValue)) return rawValue.map((value) => String(value).trim()).filter(Boolean);
  try {
    const parsed = JSON.parse(String(rawValue));
    return Array.isArray(parsed) ? parsed.map((value) => String(value).trim()).filter(Boolean) : [];
  } catch (_error) {
    return [];
  }
}

function userRequiresSensitiveBiometric(userId) {
  const user = db.prepare('SELECT requireBiometricSensitive FROM users WHERE id = ?').get(userId);
  return Boolean(user && Number(user.requireBiometricSensitive) === 1);
}

function createPasskeyActionProof(userId, action) {
  const proofToken = crypto.randomBytes(32).toString('hex');
  passkeyActionProofs.set(proofToken, {
    userId: Number(userId),
    action: String(action || '').trim(),
    expiresAt: Date.now() + PASSKEY_PROOF_TTL_MS,
  });
  return proofToken;
}

function isValidPasskeyActionProof(userId, action, proofToken) {
  const token = String(proofToken || '').trim();
  if (!token) return false;

  const record = passkeyActionProofs.get(token);
  if (!record) return false;

  if (!record.expiresAt || record.expiresAt < Date.now()) {
    passkeyActionProofs.delete(token);
    return false;
  }

  return Number(record.userId) === Number(userId) && String(record.action || '') === String(action || '');
}

function requireSensitiveActionBiometric(req, res, action) {
  if (!SENSITIVE_PASSKEY_ACTIONS.has(action)) return true;
  if (!userRequiresSensitiveBiometric(req.auth.id)) return true;

  const proofToken = String(req.headers['x-passkey-proof'] || '').trim();
  if (!proofToken || !isValidPasskeyActionProof(req.auth.id, action, proofToken)) {
    res.status(403).json({
      error: 'Biometric confirmation is required for this sensitive action.',
      code: 'PASSKEY_REQUIRED',
      action,
    });
    return false;
  }

  return true;
}

function verifyAdminCredentialForSensitiveAction(adminUserId, credential) {
  const normalized = String(credential || '').trim();
  if (!normalized) return false;

  const admin = db
    .prepare('SELECT id, passwordHash, passwordSalt, passcodeHash, passcodeSalt FROM users WHERE id = ? AND role = ?')
    .get(adminUserId, 'admin');

  if (!admin) return false;
  return verifyUserCredential(admin, credential);
}

function requireSensitiveActionAuthorization(req, res, action, credential) {
  if (!SENSITIVE_PASSKEY_ACTIONS.has(action)) return true;
  if (!userRequiresSensitiveBiometric(req.auth.id)) return true;

  const proofToken = String(req.headers['x-passkey-proof'] || '').trim();
  const hasProof = proofToken && isValidPasskeyActionProof(req.auth.id, action, proofToken);
  const hasCredential = verifyAdminCredentialForSensitiveAction(req.auth.id, credential);

  if (hasProof || hasCredential) {
    return true;
  }

  res.status(403).json({
    error: 'Biometric confirmation or password/passcode is required for this sensitive action.',
    code: 'PASSKEY_OR_CREDENTIAL_REQUIRED',
    action,
  });
  return false;
}

function getUserPasskeys(userId) {
  return db
    .prepare(
      `SELECT
         id,
         userId,
         credentialId,
         publicKey,
         counter,
         transports,
         deviceType,
         backedUp,
         createdAt,
         lastUsedAt
       FROM user_passkeys
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(userId);
}

function loadOrCreateVapidKeys() {
  try {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      return {
        publicKey: String(process.env.VAPID_PUBLIC_KEY),
        privateKey: String(process.env.VAPID_PRIVATE_KEY),
      };
    }

    if (isProductionDeployment()) {
      console.error('Missing VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY in production. Push notifications are disabled until they are configured.');
      return null;
    }

    if (fs.existsSync(vapidKeysPath)) {
      const file = JSON.parse(fs.readFileSync(vapidKeysPath, 'utf8'));
      if (file && file.publicKey && file.privateKey) {
        return file;
      }
    }

    const generated = webpush.generateVAPIDKeys();
    fs.writeFileSync(vapidKeysPath, JSON.stringify(generated, null, 2));
    return generated;
  } catch (error) {
    console.error('Failed to load VAPID keys:', error);
    return null;
  }
}

const vapidKeys = loadOrCreateVapidKeys();
if (vapidKeys) {
  webpush.setVapidDetails(VAPID_SUBJECT, vapidKeys.publicKey, vapidKeys.privateKey);
}

const smsClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

const realtimeClients = new Map();

const ALLOWED_EMPLOYEE_DOCUMENT_TYPES = new Set([
  'resume',
  'id_or_drivers_license',
  'social_security_or_work_authorization',
  'background_check',
  'background_clearance_form',
  'doctor_note',
  'tuberculosis_screening_tb',
  'hepatitis_b',
  'mmr_varicella',
  'license_or_certification',
  'cpr_bls_certificate',
  'dependent_adult_abuse_training',
  'covid19_vaccine_card',
  'covid19_religious_exemption_form',
  'physical_form',
  'other',
]);

const ADMIN_ONLY_DOCUMENT_TYPES = new Set([
  'background_check',
]);

const EXPIRATION_REQUIRED_DOCUMENT_TYPES = new Set([
  'tuberculosis_screening_tb',
  'license_or_certification',
  'cpr_bls_certificate',
  'dependent_adult_abuse_training',
]);

const DOCUMENT_TYPE_LABELS = {
  resume: 'Resume',
  id_or_drivers_license: "ID / Driver\'s License",
  background_check: 'Background Check',
  background_acknowledgment_consent: 'Background Acknowledgment & Consent',
  hipaa_compliance_acknowledgment: 'HIPAA Compliance & Confidentiality Acknowledgment',
  background_clearance_form: 'Completed Background Form',
  doctor_note: 'Doctor Note',
  social_security_or_work_authorization: 'Social Security Card / Work Authorization Permit',
  tuberculosis_screening_tb: 'Tuberculosis Screening (TB)',
  hepatitis_b: 'Hepatitis B',
  mmr_varicella: 'MMR / Varicella',
  license_or_certification: 'License / Certification',
  cpr_bls_certificate: 'CPR / BLS Certificate',
  dependent_adult_abuse_training: 'Dependent Adult Abuse Mandatory Reporter Training',
  covid19_vaccine_card: 'Covid-19 Vaccine Card',
  covid19_religious_exemption_form: 'Covid-19 Religious Exemption Form',
  physical_form: 'Physical Form',
  other: 'Other',
};

const JOB_STATUS_VALUES = new Set(['open', 'closed', 'draft']);
const ASSIGNMENT_STATUS_VALUES = new Set(['assigned', 'approved', 'completed', 'cancelled', 'no_call_no_show']);

const EMPLOYEE_DOCUMENT_PROFILES = {
  warehouse: [
    { type: 'resume', required: false },
    { type: 'id_or_drivers_license', required: true },
    { type: 'social_security_or_work_authorization', required: true },
    { type: 'physical_form', required: true },
  ],
  healthcare: [
    { type: 'resume', required: true },
    { type: 'id_or_drivers_license', required: true },
    { type: 'social_security_or_work_authorization', required: true },
    { type: 'hepatitis_b', required: true },
    { type: 'mmr_varicella', required: true },
    { type: 'tuberculosis_screening_tb', required: true, requiresExpiration: true },
    { type: 'license_or_certification', required: true, requiresExpiration: true },
    { type: 'cpr_bls_certificate', required: true, requiresExpiration: true },
    { type: 'dependent_adult_abuse_training', required: true, requiresExpiration: true },
    { type: 'covid19_vaccine_card', required: true },
    { type: 'covid19_religious_exemption_form', required: true },
    { type: 'physical_form', required: true },
  ],
};

const HEALTHCARE_INDUSTRIES = new Set(['healthcare', 'cna', 'cma', 'rn', 'lpn', 'lvn', 'dietary']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = new Set([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ]);

    if (!allowed.has(file.mimetype)) {
      return cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, PNG, or JPG.'));
    }

    cb(null, true);
  },
});

async function persistUploadedFile(file, namespace) {
  if (!file) return null;
  const stored = await storeUploadedFile(file, { namespace });
  file.filename = stored.storageKey;
  file.storedName = stored.storageKey;
  return file;
}

async function persistUploadedFiles(files, namespace) {
  const uploadedFiles = Array.isArray(files) ? files : [];
  const persisted = [];
  try {
    for (const file of uploadedFiles) {
      persisted.push(await persistUploadedFile(file, namespace));
    }
    return persisted;
  } catch (error) {
    await Promise.allSettled(persisted.map((file) => deleteStoredFile(file.storedName)));
    throw error;
  }
}

function discardUploadedFile(file) {
  if (!file) return;
  const storedName = String(file.storedName || file.filename || '').trim();
  if (!storedName) return;
  deleteStoredFile(storedName).catch(() => {});
}

function discardUploadedFiles(files) {
  (Array.isArray(files) ? files : []).forEach((file) => discardUploadedFile(file));
}

function removeStoredFileLater(storedName) {
  const normalized = String(storedName || '').trim();
  if (!normalized) return;
  deleteStoredFile(normalized).catch(() => {});
}

async function sendStoredAsset(res, storedName, options = {}) {
  try {
    await sendStoredFile(res, storedName, options);
  } catch (error) {
    if (isStorageNotFoundError(error)) {
      if (!res.headersSent) {
        res.status(404).json({ error: options.missingMessage || 'File not found.' });
      }
      return;
    }
    throw error;
  }
}

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      fullName TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      industry TEXT NOT NULL,
      position TEXT,
      message TEXT,
      certificationAccepted INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      pendingEmail TEXT,
      role TEXT NOT NULL CHECK(role IN ('employee', 'jobsite', 'admin')),
      passwordHash TEXT NOT NULL,
      passwordSalt TEXT NOT NULL,
      passcodeHash TEXT,
      passcodeSalt TEXT,
      notifyEmailEnabled INTEGER NOT NULL DEFAULT 1,
      notifySmsEnabled INTEGER NOT NULL DEFAULT 1,
      notifyPushEnabled INTEGER NOT NULL DEFAULT 1,
      isActive INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt DATETIME,
      preferredLanguage TEXT NOT NULL DEFAULT 'en'
    );

    CREATE TABLE IF NOT EXISTS employee_profiles (
      userId INTEGER PRIMARY KEY,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      skills TEXT,
      certifications TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobsite_profiles (
      userId INTEGER PRIMARY KEY,
      companyName TEXT,
      contactName TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      geofenceLatitude REAL,
      geofenceLongitude REAL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobsiteUserId INTEGER NOT NULL,
      title TEXT NOT NULL,
      industry TEXT NOT NULL,
      payRate TEXT,
      schedule TEXT,
      statPayEnabled INTEGER NOT NULL DEFAULT 0,
      statPaySignatureName TEXT,
      statPaySignedAt DATETIME,
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'draft')),
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobsiteUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS job_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      employeeUserId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'completed', 'cancelled')),
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt INTEGER NOT NULL,
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS admin_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      adminUserId INTEGER NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (adminUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      applicationId INTEGER,
      documentType TEXT NOT NULL DEFAULT 'resume',
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      expirationDate TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS employee_w4_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      legalName TEXT NOT NULL,
      addressLine TEXT,
      cityStateZip TEXT,
      filingStatus TEXT,
      multipleJobs INTEGER NOT NULL DEFAULT 0,
      dependentsAmount REAL,
      otherIncome REAL,
      deductions REAL,
      extraWithholding REAL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_w9_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      businessName TEXT,
      taxClassification TEXT NOT NULL,
      llcType TEXT,
      otherClassification TEXT,
      exemptPayeeCode TEXT,
      fatcaExemptionCode TEXT,
      addressLine TEXT,
      cityStateZip TEXT,
      tin TEXT NOT NULL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_background_consent_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      legalName TEXT NOT NULL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      consentVersion TEXT NOT NULL DEFAULT 'v1',
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_hipaa_compliance_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      legalName TEXT NOT NULL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      policyVersion TEXT NOT NULL DEFAULT 'v1',
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_handbook_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      legalName TEXT NOT NULL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      handbookVersion TEXT NOT NULL DEFAULT 'v1',
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_compensation_agreement_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL UNIQUE,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      legalName TEXT NOT NULL,
      signatureName TEXT NOT NULL,
      signedDate TEXT NOT NULL,
      agreementVersion TEXT NOT NULL DEFAULT 'v1',
      ipAddress TEXT,
      userAgent TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shift_declines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      employeeUserId INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(jobId, employeeUserId),
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS shift_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignmentId INTEGER NOT NULL,
      fromEmployeeUserId INTEGER NOT NULL,
      toEmployeeUserId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled')),
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      respondedAt DATETIME,
      FOREIGN KEY (assignmentId) REFERENCES job_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (fromEmployeeUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (toEmployeeUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS direct_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      senderUserId INTEGER NOT NULL,
      recipientUserId INTEGER NOT NULL,
      body TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (senderUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS employee_time_clock_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeUserId INTEGER NOT NULL,
      assignmentId INTEGER NOT NULL,
      jobId INTEGER NOT NULL,
      jobsiteUserId INTEGER,
      clockInAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      clockInLatitude REAL,
      clockInLongitude REAL,
      clockOutAt DATETIME,
      clockOutLatitude REAL,
      clockOutLongitude REAL,
      geofenceDistanceFeet REAL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assignmentId) REFERENCES job_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (jobsiteUserId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS notification_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      keysJson TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS portal_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      actorUserId INTEGER,
      category TEXT NOT NULL DEFAULT 'activity',
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      url TEXT,
      taskType TEXT,
      taskRefId INTEGER,
      metadataJson TEXT,
      isRead INTEGER NOT NULL DEFAULT 0,
      isCompleted INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actorUserId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS document_reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      documentType TEXT NOT NULL,
      reason TEXT NOT NULL,
      weekKey TEXT,
      actorUserId INTEGER,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actorUserId) REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(userId, documentType, reason, weekKey)
    );

    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeUserId INTEGER NOT NULL,
      jobsiteUserId INTEGER,
      assignmentId INTEGER,
      jobId INTEGER,
      periodStart TEXT NOT NULL,
      periodEnd TEXT NOT NULL,
      entriesJson TEXT NOT NULL DEFAULT '[]',
      totalHours REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'clock',
      paperOriginalName TEXT,
      paperStoredName TEXT,
      paperMimeType TEXT,
      paperFileSize INTEGER,
      status TEXT NOT NULL DEFAULT 'pending_approval',
      submittedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      submittedBy TEXT NOT NULL DEFAULT 'employee',
      approvedAt DATETIME,
      approvalSignature TEXT,
      approvedByUserId INTEGER,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (jobsiteUserId) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (assignmentId) REFERENCES job_assignments(id) ON DELETE SET NULL,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE SET NULL,
      FOREIGN KEY (approvedByUserId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS timesheet_reminder_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      reminderType TEXT NOT NULL,
      weekKey TEXT NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(userId, reminderType, weekKey)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industryTrack TEXT NOT NULL CHECK(industryTrack IN ('warehouse', 'healthcare')),
      jobsiteUserId INTEGER NOT NULL,
      uploadedByAdminUserId INTEGER NOT NULL,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'declined', 'withdrawn', 'withdrawal_pending', 'cancelled', 'expired')),
      clientOpenedAt DATETIME,
      clientSignedAt DATETIME,
      clientSignatureName TEXT,
      clientAuthorized INTEGER NOT NULL DEFAULT 0,
      adminSignedAt DATETIME,
      adminSignatureName TEXT,
      adminAuthorized INTEGER NOT NULL DEFAULT 0,
      declinedAt DATETIME,
      declinedReason TEXT,
      withdrawnAt DATETIME,
      withdrawnReason TEXT,
      withdrawnByUserId INTEGER,
      executedAt DATETIME,
      renewalDueAt DATETIME,
      renewalNotifiedAt DATETIME,
      renewalClientDecision TEXT,
      renewalAdminDecision TEXT,
      clientRenewalSignatureName TEXT,
      adminRenewalSignatureName TEXT,
      clientWithdrawalSignatureName TEXT,
      clientWithdrawalSignedAt DATETIME,
      adminWithdrawalSignatureName TEXT,
      adminWithdrawalSignedAt DATETIME,
      withdrawalInitiatedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobsiteUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (uploadedByAdminUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (withdrawnByUserId) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS contract_bank (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industryTrack TEXT NOT NULL CHECK(industryTrack IN ('warehouse', 'healthcare')),
      uploadedByAdminUserId INTEGER NOT NULL,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedByAdminUserId) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS misc_docs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uploadedByAdminUserId INTEGER NOT NULL,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      description TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedByAdminUserId) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS misc_doc_sends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      miscDocId INTEGER NOT NULL,
      recipientUserId INTEGER NOT NULL,
      sentByAdminUserId INTEGER NOT NULL,
      sentAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (miscDocId) REFERENCES misc_docs(id) ON DELETE CASCADE,
      FOREIGN KEY (recipientUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sentByAdminUserId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

function columnExists(tableName, columnName) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((col) => col.name === columnName);
}

function ensureColumn(tableName, columnName, definition) {
  if (columnExists(tableName, columnName)) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function normalizeJobStatus(value, fallback = 'open') {
  const normalized = String(value || '').trim().toLowerCase();
  return JOB_STATUS_VALUES.has(normalized) ? normalized : fallback;
}

function normalizeAssignmentStatus(value, fallback = 'assigned') {
  const normalized = String(value || '').trim().toLowerCase();
  return ASSIGNMENT_STATUS_VALUES.has(normalized) ? normalized : fallback;
}

function parseShiftStartFromSchedule(schedule) {
  const raw = String(schedule || '').trim();
  if (!raw) return null;
  const startPart = raw.split(/\suntil\s/i)[0] || raw;
  const startDate = new Date(startPart.trim());
  if (!Number.isFinite(startDate.getTime())) return null;
  return startDate;
}

function parseShiftEndFromSchedule(schedule) {
  const raw = String(schedule || '').trim();
  if (!raw) return null;
  const parts = raw.split(/\suntil\s/i);
  if (parts.length < 2) return null;
  const endDate = new Date(parts[1].trim());
  if (!Number.isFinite(endDate.getTime())) return null;
  return endDate;
}

function ensureContractsExpandedStatusConstraint() {
  const meta = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'contracts'").get();
  if (!meta || !meta.sql) return;
  if (String(meta.sql).includes("'withdrawal_pending'")) return; // already on new schema
  // Ensure previously-optional columns exist in old table before migrating
  const optionalCols = [
    ['clientOpenedAt', 'DATETIME'], ['clientSignedAt', 'DATETIME'],
    ['clientSignatureName', 'TEXT'], ['clientAuthorized', 'INTEGER NOT NULL DEFAULT 0'],
    ['adminSignedAt', 'DATETIME'], ['adminSignatureName', 'TEXT'],
    ['adminAuthorized', 'INTEGER NOT NULL DEFAULT 0'], ['declinedAt', 'DATETIME'],
    ['declinedReason', 'TEXT'], ['withdrawnAt', 'DATETIME'],
    ['withdrawnReason', 'TEXT'], ['withdrawnByUserId', 'INTEGER'],
  ];
  for (const [col, def] of optionalCols) ensureColumn('contracts', col, def);
  db.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS contracts_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      industryTrack TEXT NOT NULL CHECK(industryTrack IN ('warehouse', 'healthcare')),
      jobsiteUserId INTEGER NOT NULL,
      uploadedByAdminUserId INTEGER NOT NULL,
      originalName TEXT NOT NULL,
      storedName TEXT NOT NULL,
      mimeType TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'declined', 'withdrawn', 'withdrawal_pending', 'cancelled', 'expired')),
      clientOpenedAt DATETIME,
      clientSignedAt DATETIME,
      clientSignatureName TEXT,
      clientAuthorized INTEGER NOT NULL DEFAULT 0,
      adminSignedAt DATETIME,
      adminSignatureName TEXT,
      adminAuthorized INTEGER NOT NULL DEFAULT 0,
      declinedAt DATETIME,
      declinedReason TEXT,
      withdrawnAt DATETIME,
      withdrawnReason TEXT,
      withdrawnByUserId INTEGER,
      executedAt DATETIME,
      renewalDueAt DATETIME,
      renewalNotifiedAt DATETIME,
      renewalClientDecision TEXT,
      renewalAdminDecision TEXT,
      clientRenewalSignatureName TEXT,
      adminRenewalSignatureName TEXT,
      clientWithdrawalSignatureName TEXT,
      clientWithdrawalSignedAt DATETIME,
      adminWithdrawalSignatureName TEXT,
      adminWithdrawalSignedAt DATETIME,
      withdrawalInitiatedAt DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobsiteUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (uploadedByAdminUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (withdrawnByUserId) REFERENCES users(id) ON DELETE SET NULL
    );
    INSERT INTO contracts_v2 (
      id, industryTrack, jobsiteUserId, uploadedByAdminUserId, originalName, storedName,
      mimeType, fileSize, status, clientOpenedAt, clientSignedAt, clientSignatureName,
      clientAuthorized, adminSignedAt, adminSignatureName, adminAuthorized, declinedAt,
      declinedReason, withdrawnAt, withdrawnReason, withdrawnByUserId, createdAt, updatedAt
    )
    SELECT
      id, industryTrack, jobsiteUserId, uploadedByAdminUserId, originalName, storedName,
      mimeType, fileSize, status, clientOpenedAt, clientSignedAt, clientSignatureName,
      clientAuthorized, adminSignedAt, adminSignatureName, adminAuthorized, declinedAt,
      declinedReason, withdrawnAt, withdrawnReason, withdrawnByUserId, createdAt, updatedAt
    FROM contracts;
    DROP TABLE contracts;
    ALTER TABLE contracts_v2 RENAME TO contracts;
    COMMIT;
  `);
}

function ensureJobAssignmentsExpandedStatusConstraint() {
  const createSqlRow = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'job_assignments'")
    .get();
  const createSql = String(createSqlRow && createSqlRow.sql ? createSqlRow.sql : '').toLowerCase();
  if (createSql.includes("'no_call_no_show'") && createSql.includes("'approved'")) {
    return;
  }

  db.exec(`
    BEGIN;
    CREATE TABLE IF NOT EXISTS job_assignments_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId INTEGER NOT NULL,
      employeeUserId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'approved', 'completed', 'cancelled', 'no_call_no_show')),
      statusReason TEXT,
      cancellationType TEXT,
      statusUpdatedByUserId INTEGER,
      statusUpdatedAt DATETIME,
      excuseFormId INTEGER,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (statusUpdatedByUserId) REFERENCES users(id) ON DELETE SET NULL
    );

    INSERT INTO job_assignments_v2 (
      id,
      jobId,
      employeeUserId,
      status,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      cancellationType,
      statusUpdatedByUserId,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      excuseFormId,
      createdAt
    )
    SELECT
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      jobId,
      employeeUserId,
      CASE
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
        ELSE 'assigned'
      END,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      createdAt
    FROM job_assignments;

    DROP TABLE job_assignments;
    ALTER TABLE job_assignments_v2 RENAME TO job_assignments;
    COMMIT;
  `);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, expectedHash) {
  const actualHash = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(actualHash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function previewToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return null;
  return `${normalized.slice(0, 8)}...`;
}

function cleanupExpiredPasswordResetTokens() {
  return db.prepare('DELETE FROM password_reset_tokens WHERE expiresAt <= ?').run(Date.now());
}

function createPasswordResetTokenRecord(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = Date.now() + RESET_TOKEN_TTL_MS;

  db.prepare('DELETE FROM password_reset_tokens WHERE userId = ?').run(userId);
  db.prepare(
    'INSERT INTO password_reset_tokens (userId, tokenHash, expiresAt) VALUES (?, ?, ?)'
  ).run(userId, tokenHash, expiresAt);

  logFlowEvent('password reset token created', { userId, tokenHash, expiresAt });

  return {
    rawToken,
    tokenHash,
    expiresAt,
  };
}

function consumePasswordResetTokenRecord(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = db
    .prepare('SELECT id, userId, expiresAt FROM password_reset_tokens WHERE tokenHash = ? LIMIT 1')
    .get(tokenHash);

  if (!record || Number(record.expiresAt || 0) < Date.now()) {
    db.prepare('DELETE FROM password_reset_tokens WHERE tokenHash = ?').run(tokenHash);
    return null;
  }

  db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(record.id);
  return record;
}

function getPasswordResetTokenRecord(rawToken) {
  const tokenHash = hashToken(rawToken);
  return db
    .prepare('SELECT id, userId, expiresAt FROM password_reset_tokens WHERE tokenHash = ? LIMIT 1')
    .get(tokenHash);
}

function invalidatePasswordResetTokenById(tokenId) {
  return db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(tokenId);
}

function invalidatePasswordResetTokenByHash(tokenHash) {
  return db.prepare('DELETE FROM password_reset_tokens WHERE tokenHash = ?').run(tokenHash);
}

function createEmailVerificationTokenRecord(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + EMAIL_VERIFICATION_TTL_MS;

  logFlowEvent('verification token created', { userId, tokenPreview: `${rawToken.slice(0, 8)}...`, expiresAt });
  db.prepare(
    'UPDATE users SET isVerified = 0, emailVerificationToken = ?, emailVerificationExpiresAt = ? WHERE id = ?'
  ).run(rawToken, expiresAt, userId);
  logFlowEvent('verification token saved', { userId, expiresAt });

  return {
    rawToken,
    expiresAt,
  };
}

function buildVerificationEmailPayload(user, verificationUrl) {
  const safeName = escapeHtmlText(user.name || 'there');
  return {
    subject: 'Verify your Progress Staffing Agency account',
    text: `Hi ${user.name || 'there'},\n\nWelcome to Progress Staffing Agency. Verify your email address by opening the link below:\n\n${verificationUrl}\n\nIf you did not create this account, you can ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>Welcome to Progress Staffing Agency.</p><p>Please verify your email address by clicking the link below:</p><p><a href="${verificationUrl}">Verify My Email</a></p><p>If you did not create this account, you can ignore this email.</p>`,
  };
}

async function sendAccountVerificationEmail(user, reason = 'registration') {
  const verification = createEmailVerificationTokenRecord(user.id);
  const verificationUrl = buildAppUrl('/api/verify-email', {
    token: verification.rawToken,
  }, 'verification-email');
  const emailPayload = buildVerificationEmailPayload(user, verificationUrl);

  logFlowEvent('verification URL generated', {
    userId: user.id,
    email: user.email,
    reason,
    selectedBaseUrl: APP_BASE_URL,
    baseUrlSource: APP_URL_CONFIG.source,
    usedFallback: APP_URL_CONFIG.usedFallback,
    verificationUrl,
    expiresAt: verification.expiresAt,
  });

  const providerResult = await sendNotificationEmail({
    to: user.email,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html,
    replyTo: EMAIL_REPLY_TO,
    logContext: `account_verification:${reason}`,
  });

  return {
    verificationUrl,
    expiresAt: verification.expiresAt,
    providerResult,
  };
}

function buildPasswordResetEmailPayload(user, resetUrl) {
  const safeName = escapeHtmlText(user.name || 'there');
  return {
    subject: 'Progress Staffing Agency - Password Reset',
    text: `Hi ${user.name || 'there'},\n\nYou requested a password reset. Click the link below to set a new password. This link expires in 1 hour.\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.`,
    html: `<p>Hi ${safeName},</p><p>You requested a password reset. Click the link below to set a new password. This link expires in 1 hour.</p><p><a href="${resetUrl}">Reset My Password</a></p><p>If you did not request this, please ignore this email.</p>`,
  };
}

async function sendPasswordResetEmailForUser(user, reason = 'forgot_password') {
  const resetRecord = createPasswordResetTokenRecord(user.id);
  const resetUrl = buildAppUrl('/portal-login', {
    resetToken: resetRecord.rawToken,
  }, 'password-reset-email');
  const emailPayload = buildPasswordResetEmailPayload(user, resetUrl);

  logFlowEvent('password reset email attempted', {
    userId: user.id,
    email: user.email,
    reason,
    selectedBaseUrl: APP_BASE_URL,
    baseUrlSource: APP_URL_CONFIG.source,
    usedFallback: APP_URL_CONFIG.usedFallback,
    resetUrl,
    expiresAt: resetRecord.expiresAt,
  });

  const providerResult = await sendPasswordResetEmail({
    to: user.email,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html,
    replyTo: EMAIL_REPLY_TO,
    logContext: `password_reset:${reason}`,
  });

  return {
    resetUrl,
    expiresAt: resetRecord.expiresAt,
    providerResult,
  };
}

// SSN encryption (AES-256-GCM) — key derived from server secret, never stored.
const SSN_ENCRYPTION_KEY = crypto.scryptSync(
  process.env.SSN_SECRET || 'progress-staffing-ssn-key-v1',
  'progress-staffing-ssn-salt-v1',
  32
);

function encryptSSN(ssn) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', SSN_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(ssn), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptSSN(stored) {
  try {
    const parts = String(stored || '').split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encData = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SSN_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(encData).toString('utf8') + decipher.final('utf8');
  } catch (_e) {
    return null;
  }
}

function formatSSNForStorage(raw) {
  // Accept ###-##-#### or 9 raw digits; normalize to ###-##-####
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length !== 9) return null;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function normalizePasscode(value) {
  const normalized = String(value || '').trim();
  return /^\d{4}$/.test(normalized) ? normalized : '';
}

function getSubmittedCredential(body = {}) {
  const candidates = [body.currentCredential, body.credential, body.currentPassword, body.password, body.passcode];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const normalized = String(candidate).trim();
    if (normalized) return String(candidate);
  }
  return '';
}

function verifyUserCredential(user, credential) {
  const raw = String(credential || '');
  const trimmed = raw.trim();
  const passcode = normalizePasscode(trimmed);

  if (passcode && user.passcodeHash && user.passcodeSalt) {
    return verifyPassword(passcode, user.passcodeSalt, user.passcodeHash);
  }

  return verifyPassword(raw, user.passwordSalt, user.passwordHash);
}

function requireCredentialForUser(res, userId, credential, missingMessage = 'Password or 4-digit passcode is required.') {
  if (!String(credential || '').trim()) {
    res.status(400).json({ error: missingMessage });
    return null;
  }

  const user = db
    .prepare('SELECT id, email, role, passwordHash, passwordSalt, passcodeHash, passcodeSalt FROM users WHERE id = ?')
    .get(userId);

  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return null;
  }

  if (!verifyUserCredential(user, credential)) {
    res.status(401).json({ error: 'Password or passcode is incorrect.' });
    return null;
  }

  return user;
}

function normalizePhoneNumber(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (String(phone || '').trim().startsWith('+')) return String(phone).trim();
  return '';
}

function isValidEmailAddress(email) {
  return EMAIL_ADDRESS_PATTERN.test(String(email || '').trim());
}

function normalizePreferredLanguage(value, fallback = 'en') {
  const normalized = String(value || '').trim().toLowerCase();
  if (SUPPORTED_PORTAL_LANGUAGES.has(normalized)) return normalized;
  return fallback;
}

function normalizeSingleLineText(value, maxLength = 255) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function normalizeMultiLineText(value, maxLength = 500) {
  return String(value || '').replace(/\r\n/g, '\n').trim().slice(0, maxLength);
}

function validateStructuredAddress(address, city, state, zip, message) {
  const hasAddressData = Boolean(address || city || state || zip);
  if (hasAddressData && (!address || !city || !state || !zip)) {
    return message;
  }
  if (state && !/^[A-Z]{2}$/.test(state)) {
    return 'State must be a 2-letter code.';
  }
  if (zip && !/^\d{5}(?:-\d{4})?$/.test(zip)) {
    return 'ZIP code must be 5 digits or ZIP+4 format.';
  }
  return '';
}

function createPendingEmailVerificationRecord() {
  return {
    rawToken: crypto.randomBytes(32).toString('hex'),
    expiresAt: Date.now() + EMAIL_VERIFICATION_TTL_MS,
  };
}

function buildPendingEmailVerificationPayload(user, nextEmail, verificationUrl) {
  const safeName = escapeHtmlText(user.name || 'there');
  const safeEmail = escapeHtmlText(nextEmail);
  return {
    subject: 'Confirm your Progress Staffing Agency email change',
    text: `Hi ${user.name || 'there'},\n\nWe received a request to change your Progress Staffing Agency login email to ${nextEmail}. Confirm the new email address by opening the link below:\n\n${verificationUrl}\n\nIf you did not request this change, you can ignore this email and your current login will remain unchanged.`,
    html: `<p>Hi ${safeName},</p><p>We received a request to change your Progress Staffing Agency login email to <strong>${safeEmail}</strong>.</p><p>Confirm the new email address by clicking the link below:</p><p><a href="${verificationUrl}">Confirm New Email</a></p><p>If you did not request this change, you can ignore this email and your current login will remain unchanged.</p>`,
  };
}

async function sendPendingEmailVerificationEmail(user, nextEmail, verificationRecord, reason = 'account_update') {
  const verificationUrl = buildAppUrl('/api/verify-email', {
    token: verificationRecord.rawToken,
  }, 'pending-email-verification');
  const emailPayload = buildPendingEmailVerificationPayload(user, nextEmail, verificationUrl);

  const providerResult = await sendNotificationEmail({
    to: nextEmail,
    subject: emailPayload.subject,
    text: emailPayload.text,
    html: emailPayload.html,
    replyTo: EMAIL_REPLY_TO,
    logContext: `pending_email_verification:${reason}`,
  });

  return {
    verificationUrl,
    expiresAt: verificationRecord.expiresAt,
    providerResult,
  };
}

function toFiniteNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function parseClientCoordinates(body = {}) {
  const latitude = toFiniteNumber(body.latitude);
  const longitude = toFiniteNumber(body.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function distanceFeetBetween(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = earthRadiusMeters * c;
  return meters * 3.28084;
}

async function geocodeAddressToCoordinates(address) {
  const query = String(address || '').trim();
  if (!query || typeof fetch !== 'function') return null;

  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ProgressStaffingPortal/1.0',
      },
    });

    if (!response.ok) return null;
    const results = await response.json().catch(() => []);
    const first = Array.isArray(results) ? results[0] : null;
    if (!first) return null;

    const latitude = toFiniteNumber(first.lat);
    const longitude = toFiniteNumber(first.lon);
    if (latitude === null || longitude === null) return null;

    return { latitude, longitude };
  } catch (_error) {
    return null;
  }
}

async function resolveJobsiteGeofenceCoordinates(jobsiteUserId) {
  if (!Number.isInteger(Number(jobsiteUserId)) || Number(jobsiteUserId) < 1) return null;

  const profile = db
    .prepare('SELECT userId, address, geofenceLatitude, geofenceLongitude FROM jobsite_profiles WHERE userId = ?')
    .get(jobsiteUserId);

  if (!profile) return null;

  const storedLatitude = toFiniteNumber(profile.geofenceLatitude);
  const storedLongitude = toFiniteNumber(profile.geofenceLongitude);
  if (storedLatitude !== null && storedLongitude !== null) {
    return { latitude: storedLatitude, longitude: storedLongitude };
  }

  const geocoded = await geocodeAddressToCoordinates(profile.address);
  if (!geocoded) return null;

  db.prepare(
    'UPDATE jobsite_profiles SET geofenceLatitude = ?, geofenceLongitude = ? WHERE userId = ?'
  ).run(geocoded.latitude, geocoded.longitude, jobsiteUserId);

  return geocoded;
}

function absolutePortalUrl(relativePath) {
  return buildAppUrl(relativePath || '/', {}, 'absolute-portal-url');
}

function runAsyncTask(label, taskFactory) {
  Promise.resolve()
    .then(taskFactory)
    .catch((error) => {
      logCaughtException(label, error);
    });
}

function buildPortalPath(relativePath, params = {}) {
  const url = new URL(relativePath.startsWith('/') ? relativePath : `/${relativePath}`, APP_URL_PLACEHOLDER_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });
  return `${url.pathname}${url.search}`;
}

function getPortalPathForRole(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'admin') return '/portal-admin';
  if (normalized === 'jobsite') return '/portal-jobsite';
  return '/portal-employee';
}

function normalizeAdminScope(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (ADMIN_SCOPES.has(normalized)) return normalized;
  return 'full';
}

function getPortalPathForUser(user) {
  if (!user) return '/portal-login';
  const role = String(user.role || '').trim().toLowerCase();
  if (role !== 'admin') return getPortalPathForRole(role);

  const scope = normalizeAdminScope(user.portalScope);
  if (scope === 'onboarding') return '/portal-onboarding';
  if (scope === 'contracts') return '/portal-contracts';
  if (scope === 'scheduling') return '/portal-scheduling';
  return '/portal-admin';
}

function canScopedAdminAccessPath(scope, requestPath) {
  const normalizedScope = normalizeAdminScope(scope);
  if (normalizedScope === 'full') return true;
  const pathValue = String(requestPath || '').trim();
  if (!pathValue) return false;

  const allowedPrefixes = [
    '/portal-admin',
    '/api/auth/logout',
    '/api/auth/me',
    '/api/account',
    '/api/messages',
    '/api/notifications',
    '/api/portal/notifications',
    '/api/portal/messages',
    '/api/realtime/stream',
  ];

  if (allowedPrefixes.some((prefix) => pathValue === prefix || pathValue.startsWith(`${prefix}/`))) {
    return true;
  }

  if (normalizedScope === 'onboarding') {
    return pathValue === '/portal-onboarding'
      || pathValue.startsWith('/api/portal/onboarding')
      || pathValue.startsWith('/api/admin/employees')
      || pathValue.startsWith('/api/admin/misc-docs')
      || pathValue.startsWith('/api/misc-docs/');
  }

  if (normalizedScope === 'contracts') {
    return pathValue === '/portal-contracts'
      || pathValue.startsWith('/api/portal/contracts')
      || pathValue.startsWith('/api/contracts/')
      || pathValue.startsWith('/api/admin/contracts')
      || pathValue.startsWith('/api/admin/contract-bank')
      || pathValue.startsWith('/api/contract-bank/')
      || pathValue.startsWith('/api/admin/misc-docs')
      || pathValue.startsWith('/api/misc-docs/');
  }

  if (normalizedScope === 'scheduling') {
    return pathValue === '/portal-scheduling'
      || pathValue.startsWith('/api/portal/scheduling')
      || pathValue.startsWith('/api/admin/diagnostics')
      || pathValue.startsWith('/api/admin/jobs')
      || pathValue.startsWith('/api/admin/assignments')
      || pathValue.startsWith('/api/admin/employees')
      || pathValue.startsWith('/api/contracts/');
  }

  return false;
}

function hasAdminScopeAccess(user, allowedScopes = []) {
  if (!user || String(user.role || '').toLowerCase() !== 'admin') return false;
  const scope = normalizeAdminScope(user.portalScope);
  if (scope === 'full') return true;
  const normalizedAllowed = Array.isArray(allowedScopes)
    ? allowedScopes.map((item) => normalizeAdminScope(item)).filter(Boolean)
    : [];
  return normalizedAllowed.includes(scope);
}

function canAdminViewEmployee(admin, employeeId, employeeIndustryTrack) {
  if (!admin || String(admin.role || '').toLowerCase() !== 'admin') return false;
  
  // Full-scope admins can view all employees
  if (normalizeAdminScope(admin.portalScope) === 'full') return true;
  if (!admin.adminEmployeeIndustryTrack || String(admin.adminEmployeeIndustryTrack || '').trim() === '') {
    return true;
  }
  
  // Scoped admins can only view employees in their industry track
  const adminTrack = normalizeIndustryTrack(String(admin.adminEmployeeIndustryTrack || '').trim());
  const empTrack = normalizeIndustryTrack(String(employeeIndustryTrack || '').trim());
  return adminTrack === empTrack;
}

function getActiveAdminUsers() {
  return db.prepare("SELECT id, name, email FROM users WHERE role = 'admin' AND isActive = 1 ORDER BY id ASC").all();
}

function getActiveAdminUsersForScopes(allowedScopes = ['full']) {
  const normalizedAllowedScopes = Array.isArray(allowedScopes)
    ? Array.from(new Set(allowedScopes.map((scope) => normalizeAdminScope(scope)).filter(Boolean)))
    : ['full'];

  return db
    .prepare("SELECT id, name, email, role, portalScope FROM users WHERE role = 'admin' AND isActive = 1 ORDER BY id ASC")
    .all()
    .filter((admin) => {
      const scope = normalizeAdminScope(admin.portalScope);
      return scope === 'full' || normalizedAllowedScopes.includes(scope);
    });
}

function emitContractsDomainSyncToAdmins() {
  const admins = getActiveAdminUsersForScopes(['contracts']);
  admins.forEach((admin) => {
    emitRealtimeEventToUser(Number(admin.id), 'portal-sync', { domains: ['contracts'] });
  });
}

function emitDomainSyncToAdmins(scopes, domains) {
  const admins = getActiveAdminUsersForScopes(scopes);
  admins.forEach((admin) => {
    emitRealtimeEventToUser(Number(admin.id), 'portal-sync', { domains });
  });
}

function notifyContractsPortalActivityToAdmins(actorUserId, title, body, metadata = {}) {
  const contractId = Number(metadata && metadata.contractId);
  const track = metadata && metadata.track ? metadata.track : metadata && metadata.industryTrack ? metadata.industryTrack : '';
  dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `contracts-portal:${contractId || 'general'}:${String(title || '').trim().toLowerCase()}`,
    targets: getActiveAdminUsersForScopes(['contracts']).filter((admin) => Number(admin.id) !== Number(actorUserId)).map((admin) => {
      const links = buildNotificationLinkBundle(contractId > 0
        ? buildPortalPath(getPortalPathForUser(admin), { task: 'admin-contract', contractId, track })
        : buildPortalPath(getPortalPathForUser(admin)));
      return {
        userId: Number(admin.id),
        actorUserId: Number(actorUserId),
        category: 'contract',
        title: String(title || 'Contracts activity'),
        body: String(body || 'A contracts portal update was made.'),
        relativeUrl: links.relativeUrl,
        portalNotification: {
          taskType: contractId > 0 ? 'contract_admin_sign' : null,
          taskRefId: contractId > 0 ? contractId : null,
          metadata,
          syncDomains: ['admin-dashboard', 'contracts'],
        },
        email: {
          to: admin.email,
          subject: String(title || 'Contracts activity'),
          text: `${String(body || 'A contracts portal update was made.')}\n\nOpen it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(String(body || 'A contracts portal update was made.'))}</p><p><a href="${links.directUrl}">Open contract activity</a></p>`,
          logContext: `contract_activity:${contractId || 'general'}:admin:${admin.id}`,
        },
        push: {
          payload: {
            title: String(title || 'Contracts activity'),
            body: String(body || 'A contracts portal update was made.'),
            url: links.relativeUrl,
            tag: `contract-activity-${contractId || 'general'}-${admin.id}`,
          },
        },
      };
    }),
  });
}

function parseStoredDateTime(value) {
  if (value === null || value === undefined || value === '') return null;
  let text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(text)) {
    text = `${text.replace(' ', 'T')}Z`;
  }
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDateYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function safeParseJson(value, fallback = {}) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (_error) {
    return fallback;
  }
}

function emitRealtimeEventToUser(userId, eventName, payload) {
  const clients = realtimeClients.get(Number(userId));
  if (!clients || !clients.size) return;

  const serialized = JSON.stringify(payload || {});
  clients.forEach((res) => {
    try {
      res.write(`event: ${eventName}\n`);
      res.write(`data: ${serialized}\n\n`);
    } catch (_error) {
      // Ignore stream write failures. The close handler removes dead clients.
    }
  });
}

function emitSocketEventToAdmins(eventName, payload) {
  io.emit(String(eventName || 'event'), payload || {});
}

function createPortalNotification(options = {}) {
  const userId = Number(options.userId);
  if (!Number.isInteger(userId) || userId < 1) return null;

  const category = String(options.category || 'activity').trim().toLowerCase() || 'activity';
  const title = String(options.title || 'Activity update').trim() || 'Activity update';
  const body = String(options.body || '').trim() || 'There is a new activity in your portal.';
  const actorUserId = options.actorUserId === null || options.actorUserId === undefined || options.actorUserId === ''
    ? null
    : Number(options.actorUserId);
  const taskRefId = options.taskRefId === null || options.taskRefId === undefined || options.taskRefId === ''
    ? null
    : Number(options.taskRefId);
  const syncDomains = Array.from(new Set(['notifications'].concat(Array.isArray(options.syncDomains) ? options.syncDomains : [])));
  const info = db.prepare(
    `INSERT INTO portal_notifications
      (userId, actorUserId, category, title, body, url, taskType, taskRefId, metadataJson, isRead, isCompleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
  ).run(
    userId,
    Number.isInteger(actorUserId) && actorUserId > 0 ? actorUserId : null,
    category,
    title,
    body,
    options.url ? String(options.url) : null,
    options.taskType ? String(options.taskType) : null,
    Number.isInteger(taskRefId) && taskRefId > 0 ? taskRefId : null,
    JSON.stringify(options.metadata || {}),
    options.isCompleted ? 1 : 0
  );

  emitRealtimeEventToUser(userId, 'portal-sync', {
    domains: syncDomains,
    notification: {
      id: Number(info.lastInsertRowid),
      category,
      title,
      body,
      taskType: options.taskType ? String(options.taskType) : '',
    },
  });

  return Number(info.lastInsertRowid);
}

function markNotificationsCompletedByTask(taskType, taskRefId, userId = null) {
  const normalizedTaskType = String(taskType || '').trim();
  const normalizedTaskRefId = Number(taskRefId);
  if (!normalizedTaskType || !Number.isInteger(normalizedTaskRefId) || normalizedTaskRefId < 1) return;

  const recipients = userId === null
    ? db.prepare('SELECT DISTINCT userId FROM portal_notifications WHERE taskType = ? AND taskRefId = ? AND isCompleted = 0').all(normalizedTaskType, normalizedTaskRefId)
    : db.prepare('SELECT DISTINCT userId FROM portal_notifications WHERE taskType = ? AND taskRefId = ? AND userId = ? AND isCompleted = 0').all(normalizedTaskType, normalizedTaskRefId, Number(userId));

  if (!recipients.length) return;

  if (userId === null) {
    db.prepare(
      `UPDATE portal_notifications
       SET isCompleted = 1,
           updatedAt = CURRENT_TIMESTAMP
       WHERE taskType = ? AND taskRefId = ?`
    ).run(normalizedTaskType, normalizedTaskRefId);
  } else {
    db.prepare(
      `UPDATE portal_notifications
       SET isCompleted = 1,
           updatedAt = CURRENT_TIMESTAMP
       WHERE taskType = ? AND taskRefId = ? AND userId = ?`
    ).run(normalizedTaskType, normalizedTaskRefId, Number(userId));
  }

  recipients.forEach((row) => {
    emitRealtimeEventToUser(Number(row.userId), 'portal-sync', { domains: ['notifications'] });
  });
}

function listPortalNotificationsForUser(userId, limit = 25) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 25, 100));
  const pendingTasks = db.prepare(
    `SELECT
       pn.id,
       pn.category,
       pn.title,
       pn.body,
       pn.url,
       pn.taskType,
       pn.taskRefId,
       pn.metadataJson,
       pn.isRead,
       pn.isCompleted,
       pn.createdAt,
       actor.name AS actorName,
       actor.role AS actorRole
     FROM portal_notifications pn
     LEFT JOIN users actor ON actor.id = pn.actorUserId
     WHERE pn.userId = ?
       AND pn.taskType IS NOT NULL
       AND TRIM(pn.taskType) <> ''
       AND pn.isCompleted = 0
       AND pn.category <> 'message'
     ORDER BY pn.createdAt DESC, pn.id DESC`
  ).all(userId);

  const pendingIds = pendingTasks.map((row) => Number(row.id)).filter((id) => Number.isInteger(id) && id > 0);
  const placeholders = pendingIds.map(() => '?').join(',');
  const recentQuery = pendingIds.length
    ? `SELECT
         pn.id,
         pn.category,
         pn.title,
         pn.body,
         pn.url,
         pn.taskType,
         pn.taskRefId,
         pn.metadataJson,
         pn.isRead,
         pn.isCompleted,
         pn.createdAt,
         actor.name AS actorName,
         actor.role AS actorRole
       FROM portal_notifications pn
       LEFT JOIN users actor ON actor.id = pn.actorUserId
       WHERE pn.userId = ?
         AND pn.id NOT IN (${placeholders})
         AND pn.category <> 'message'
       ORDER BY pn.createdAt DESC, pn.id DESC
       LIMIT ?`
    : `SELECT
         pn.id,
         pn.category,
         pn.title,
         pn.body,
         pn.url,
         pn.taskType,
         pn.taskRefId,
         pn.metadataJson,
         pn.isRead,
         pn.isCompleted,
         pn.createdAt,
         actor.name AS actorName,
         actor.role AS actorRole
       FROM portal_notifications pn
       LEFT JOIN users actor ON actor.id = pn.actorUserId
       WHERE pn.userId = ?
         AND pn.category <> 'message'
       ORDER BY pn.createdAt DESC, pn.id DESC
       LIMIT ?`;

  const recentRows = db.prepare(recentQuery).all(...(pendingIds.length ? [userId, ...pendingIds, safeLimit] : [userId, safeLimit]));

  return pendingTasks.concat(recentRows).map((row) => ({
    ...row,
    isRead: Boolean(row.isRead),
    isCompleted: Boolean(row.isCompleted),
    metadata: safeParseJson(row.metadataJson, {}),
  }));
}

function getUserPhoneNumber(userId, role) {
  if (role === 'employee') {
    const row = db.prepare('SELECT phone FROM employee_profiles WHERE userId = ?').get(userId);
    return row ? normalizePhoneNumber(row.phone) : '';
  }

  if (role === 'jobsite') {
    const row = db.prepare('SELECT phone FROM jobsite_profiles WHERE userId = ?').get(userId);
    return row ? normalizePhoneNumber(row.phone) : '';
  }

  return '';
}

async function sendEmailNotification(to, subject, text, html, userId = null, emailOptions = {}) {
  if (Number.isInteger(userId) && userId > 0) {
    const pref = db.prepare('SELECT notifyEmailEnabled FROM users WHERE id = ?').get(userId);
    if (pref && Number(pref.notifyEmailEnabled) !== 1) return { skipped: true, disabled: 'email' };
  }
  if (!to) return { skipped: true, reason: 'missing-recipient' };
  if (!isEmailServiceConfigured()) {
    console.error('Postmark not configured. Email skipped.', { to, subject });
    return { skipped: true, reason: 'postmark-not-configured' };
  }
  try {
    return await sendNotificationEmail({
      to,
      subject,
      text,
      html,
      replyTo: EMAIL_REPLY_TO,
      logContext: emailOptions.logContext,
    });
  } catch (error) {
    logCaughtException('sendEmailNotification', error, {
      to,
      subject,
      logContext: emailOptions.logContext || null,
    });
    throw error;
  }
}

async function sendSmsNotification(to, body, userId = null) {
  if (Number.isInteger(userId) && userId > 0) {
    const pref = db.prepare('SELECT notifySmsEnabled FROM users WHERE id = ?').get(userId);
    if (pref && Number(pref.notifySmsEnabled) !== 1) return { skipped: true, disabled: 'sms' };
  }
  if (!to) return { skipped: true, reason: 'missing-recipient' };
  if (!smsClient || !TWILIO_FROM_NUMBER) return { skipped: true, reason: 'sms-not-configured' };
  await smsClient.messages.create({ from: TWILIO_FROM_NUMBER, to, body });
  return { sent: true };
}

async function sendPushNotificationToUser(userId, payload, options = {}) {
  const ignorePreference = options.ignorePreference === true;
  const pref = db.prepare('SELECT notifyPushEnabled FROM users WHERE id = ?').get(userId);
  if (!ignorePreference && pref && Number(pref.notifyPushEnabled) !== 1) {
    return { skipped: true, disabled: 'push' };
  }

  const subscriptions = db
    .prepare('SELECT id, endpoint, keysJson FROM notification_subscriptions WHERE userId = ?')
    .all(userId);

  if (!subscriptions.length) {
    return { skipped: true, reason: 'no-subscriptions' };
  }

  if (!vapidKeys) {
    return { skipped: true, reason: 'push-not-configured' };
  }

  const settled = await Promise.allSettled(
    subscriptions.map(async (subscriptionRow) => {
      const subscription = {
        endpoint: subscriptionRow.endpoint,
        keys: JSON.parse(subscriptionRow.keysJson),
      };

      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (error) {
        if (error && (error.statusCode === 404 || error.statusCode === 410)) {
          db.prepare('DELETE FROM notification_subscriptions WHERE id = ?').run(subscriptionRow.id);
          return;
        }
        throw error;
      }
    })
  );

  const fulfilledCount = settled.filter((entry) => entry.status === 'fulfilled').length;
  const rejected = settled.filter((entry) => entry.status === 'rejected');
  if (!fulfilledCount && rejected.length) {
    const firstError = rejected[0] && rejected[0].reason;
    throw firstError instanceof Error
      ? firstError
      : new Error(firstError && firstError.message ? firstError.message : 'Push delivery failed.');
  }

  return {
    sent: fulfilledCount > 0,
    subscriptionCount: subscriptions.length,
    deliveredCount: fulfilledCount,
    failedCount: rejected.length,
  };
}

function buildEmployeeDocumentReminderPath(documentType, extraParams = {}) {
  return buildPortalPath('/portal-employee', {
    task: 'employee-documents',
    documentType: String(documentType || '').trim().toLowerCase(),
    ...extraParams,
  });
}

function buildDocumentReminderEmailPayload({ employeeName, title, body, directUrl, fallbackUrl, documentLabel }) {
  const safeName = escapeHtmlText(employeeName || 'there');
  const safeBody = escapeHtmlText(body || 'Please review your employee portal.');
  const safeLabel = escapeHtmlText(documentLabel || 'document');
  return {
    subject: title,
    text: `Hi ${employeeName || 'there'},\n\n${body}\n\nDirect link: ${directUrl}\nFallback login: ${fallbackUrl}\n\nIf the direct link asks you to sign in, complete login and you will return to the exact ${documentLabel || 'task'}.`,
    html: `<p>Hi ${safeName},</p><p>${safeBody}</p><p><a href="${directUrl}">Open ${safeLabel} task</a></p><p>If you need to sign in first, use this fallback link: <a href="${fallbackUrl}">${fallbackUrl}</a></p>`,
  };
}

function sanitizeNotificationPortalPath(relativePath) {
  const raw = String(relativePath || '').trim();
  if (!raw) return '';

  try {
    const url = new URL(raw.startsWith('/') ? raw : `/${raw}`, APP_URL_PLACEHOLDER_BASE);
    if (!url.pathname.startsWith('/portal-')) return '';
    if (url.pathname === '/portal-login') return '';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch (_error) {
    return '';
  }
}

function buildNotificationLinkBundle(relativePath) {
  const safeRelativePath = sanitizeNotificationPortalPath(relativePath);
  if (!safeRelativePath) {
    return {
      relativeUrl: '',
      directUrl: '',
      fallbackUrl: '',
    };
  }

  return {
    relativeUrl: safeRelativePath,
    directUrl: absolutePortalUrl(safeRelativePath),
    fallbackUrl: absolutePortalUrl(buildPortalPath('/portal-login', { redirect: safeRelativePath })),
  };
}

function normalizeNotificationChannelResult(channel, result) {
  if (result && result.sent) {
    return { channel, status: 'sent', details: result };
  }
  if (result && result.skipped) {
    return {
      channel,
      status: 'skipped',
      reason: result.reason || result.disabled || 'skipped',
      details: result,
    };
  }
  return {
    channel,
    status: 'unknown',
    details: result || null,
  };
}

async function executeNotificationChannel(eventType, channel, handler) {
  try {
    const result = await handler();
    const normalized = normalizeNotificationChannelResult(channel, result);
    console.info('[notification-route] channel completed', {
      eventType,
      channel,
      status: normalized.status,
      reason: normalized.reason || null,
      details: normalized.details || null,
    });
    return normalized;
  } catch (error) {
    const failure = {
      channel,
      status: 'failed',
      reason: error && error.message ? error.message : 'delivery-failed',
    };
    console.error('[notification-route] channel failed', {
      eventType,
      channel,
      message: failure.reason,
      stack: error && error.stack ? error.stack : null,
    });
    return failure;
  }
}

function normalizeDeliveryChannelResult(channel, result) {
  return normalizeNotificationChannelResult(channel, result);
}

async function executeReminderChannel(channel, handler) {
  return executeNotificationChannel('document-reminder', channel, handler);
}

function makeNotificationDispatchLockKey(eventType, dedupeKey) {
  return `${String(eventType || 'event').trim().toLowerCase()}:${String(dedupeKey || '').trim()}`;
}

function tryAcquireNotificationDispatchLock(eventType, dedupeKey) {
  const normalizedKey = makeNotificationDispatchLockKey(eventType, dedupeKey);
  if (!normalizedKey || normalizedKey.endsWith(':')) return null;
  if (notificationDispatchInFlight.has(normalizedKey)) return null;
  notificationDispatchInFlight.set(normalizedKey, Date.now());
  return normalizedKey;
}

function releaseNotificationDispatchLock(lockKey) {
  if (!lockKey) return;
  notificationDispatchInFlight.delete(lockKey);
}

function makeManualDocumentReminderLockKey(employeeUserId, documentType) {
  return `${employeeUserId}:${String(documentType || '').trim().toLowerCase()}`;
}

function tryAcquireManualDocumentReminderLock(employeeUserId, documentType) {
  const key = makeManualDocumentReminderLockKey(employeeUserId, documentType);
  if (manualDocumentReminderInFlight.has(key)) return null;
  manualDocumentReminderInFlight.set(key, Date.now());
  return key;
}

function releaseManualDocumentReminderLock(lockKey) {
  if (!lockKey) return;
  manualDocumentReminderInFlight.delete(lockKey);
}

async function dispatchNotificationTargets(options = {}) {
  const eventType = String(options.eventType || 'activity').trim().toLowerCase() || 'activity';
  const dedupeKey = String(options.dedupeKey || '').trim();
  const targets = Array.isArray(options.targets) ? options.targets.filter(Boolean) : [];
  let lockKey = null;

  if (dedupeKey) {
    lockKey = tryAcquireNotificationDispatchLock(eventType, dedupeKey);
    if (!lockKey) {
      console.info('[notification-route] duplicate event suppressed', { eventType, dedupeKey });
      return { sent: false, skipped: true, reason: 'duplicate-event', recipients: [] };
    }
  }

  try {
    const recipients = await Promise.all(targets.map(async (target) => {
      const delivery = {};
      const tasks = [];
      const targetUserId = Number(target.userId);
      const actorUserId = target.actorUserId === undefined || target.actorUserId === null || target.actorUserId === ''
        ? null
        : Number(target.actorUserId);

      if (target.portalNotification && Number.isInteger(targetUserId) && targetUserId > 0) {
        tasks.push(
          executeNotificationChannel(eventType, 'portal', async () => {
            const notificationId = createPortalNotification({
              userId: targetUserId,
              actorUserId: Number.isInteger(actorUserId) && actorUserId > 0 ? actorUserId : null,
              category: target.category || 'activity',
              title: target.title,
              body: target.body,
              url: target.relativeUrl || null,
              taskType: target.portalNotification.taskType || null,
              taskRefId: target.portalNotification.taskRefId || null,
              metadata: target.portalNotification.metadata || {},
              syncDomains: target.portalNotification.syncDomains || [],
              isCompleted: target.portalNotification.isCompleted === true,
            });
            return notificationId
              ? { sent: true, notificationId }
              : { skipped: true, reason: 'portal-notification-not-created' };
          }).then((result) => {
            delivery.portal = result;
          })
        );
      }

      if (target.email) {
        tasks.push(
          executeNotificationChannel(eventType, 'email', async () => sendEmailNotification(
            target.email.to,
            target.email.subject,
            target.email.text,
            target.email.html,
            target.email.userId === undefined ? (Number.isInteger(targetUserId) && targetUserId > 0 ? targetUserId : null) : target.email.userId,
            { logContext: target.email.logContext || `${eventType}:email` }
          )).then((result) => {
            delivery.email = result;
          })
        );
      }

      if (target.push) {
        const pushUserId = Number(target.push.userId === undefined ? targetUserId : target.push.userId);
        if (Number.isInteger(pushUserId) && pushUserId > 0) {
          tasks.push(
            executeNotificationChannel(eventType, 'push', async () => sendPushNotificationToUser(
              pushUserId,
              target.push.payload || {},
              target.push.options || {}
            )).then((result) => {
              delivery.push = result;
            })
          );
        }
      }

      if (target.sms) {
        tasks.push(
          executeNotificationChannel(eventType, 'sms', async () => sendSmsNotification(
            target.sms.to,
            target.sms.body,
            target.sms.userId === undefined ? (Number.isInteger(targetUserId) && targetUserId > 0 ? targetUserId : null) : target.sms.userId
          )).then((result) => {
            delivery.sms = result;
          })
        );
      }

      await Promise.all(tasks);

      return {
        userId: Number.isInteger(targetUserId) && targetUserId > 0 ? targetUserId : null,
        delivery,
      };
    }));

    return {
      sent: recipients.some((recipient) => Object.values(recipient.delivery || {}).some((entry) => entry && entry.status === 'sent')),
      recipients,
    };
  } finally {
    releaseNotificationDispatchLock(lockKey);
  }
}

function buildShiftNotificationCopy(shift, actionLabel) {
  const companyName = shift.companyName || shift.jobsiteName || 'Progress Staffing';
  const shiftLabel = shift.title || shift.shiftTitle || 'Open shift';
  const schedule = shift.schedule ? ` Schedule: ${shift.schedule}.` : '';
  const payRate = shift.payRate ? ` Pay: ${shift.payRate}.` : '';
  return `${actionLabel}: ${shiftLabel} at ${companyName}.${schedule}${payRate}`.trim();
}

async function notifyUserAboutShift(user, shift, options = {}) {
  const relativeUrl = options.url || '/portal-employee';
  const title = options.title || 'Shift update';
  const body = options.body || buildShiftNotificationCopy(shift, 'Shift update');
  const links = buildNotificationLinkBundle(relativeUrl);

  await dispatchNotificationTargets({
    eventType: 'scheduling-activity',
    dedupeKey: `${options.tag || `shift-${shift.id || shift.assignmentId || 'update'}`}:${user.id}`,
    targets: [{
      userId: user.id,
      category: 'activity',
      title,
      body,
      relativeUrl: links.relativeUrl,
      email: {
        to: user.email,
        subject: title,
        text: `${body}\n\nOpen the scheduling item: ${links.directUrl}`,
        html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open the scheduling item</a></p>`,
        logContext: `scheduling_activity:${options.tag || shift.id || shift.assignmentId || 'update'}`,
      },
      push: {
        payload: {
          title,
          body,
          url: links.relativeUrl,
          tag: options.tag || `shift-${shift.id || shift.assignmentId || 'update'}`,
          actions: options.actions || [],
          data: options.data || {},
        },
      },
    }],
  });
}

function getEmployeesMatchingShiftTitle(shiftTitle, excludedUserIds = new Set()) {
  const employees = db
    .prepare("SELECT id, name, email, role FROM users WHERE role = 'employee' AND isActive = 1 ORDER BY name ASC")
    .all();
  const normalizedTitle = normalizeText(shiftTitle);

  return employees.filter((employee) => {
    if (excludedUserIds.has(Number(employee.id))) return false;
    if (normalizeText(getEmployeePrimaryPosition(employee.id, employee.email)) !== normalizedTitle) return false;

    const applications = db
      .prepare(
        `SELECT id, industry, position, createdAt
         FROM applications
         WHERE userId = ? OR email = ?
         ORDER BY createdAt DESC`
      )
      .all(employee.id, employee.email);

    const documents = db
      .prepare(
        `SELECT
           documentType,
           expirationDate,
           documentStatus,
           createdAt
         FROM employee_documents
         WHERE userId = ?
         ORDER BY createdAt DESC`
      )
      .all(employee.id);

    const industry = inferIndustryFromApplications(applications);
    const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
    return compliance.isComplete;
  });
}

async function notifyMatchingEmployeesAboutOpenShift(shift) {
  const shiftTrack = industryToTrack(shift.industry);
  const recipients = getEmployeesMatchingShiftTitle(shift.title).filter(
    (user) => getEmployeeIndustryTrack(user.id, user.email) === shiftTrack
  );
  await Promise.allSettled(
    recipients.map((user) =>
      notifyUserAboutShift(user, shift, {
        title: `New ${shift.title} shift available`,
        body: buildShiftNotificationCopy(shift, 'A new shift matches your registered title'),
        url: `/portal-employee?shiftAction=view&shiftId=${encodeURIComponent(shift.id)}`,
        tag: `shift-open-${shift.id}`,
        actions: [
          { action: 'accept_shift', title: 'Accept' },
          { action: 'decline_shift', title: 'Decline' },
        ],
        data: { shiftId: shift.id },
      })
    )
  );
}

async function notifyAdminsAboutDocumentUpload(employeeUserId, docId, documentType) {
  const employee = db.prepare('SELECT name, email FROM users WHERE id = ?').get(employeeUserId) || {};
  const admins = getActiveAdminUsersForScopes(['onboarding']);
  const typeName = documentType.replace(/_/g, ' ');
  const body = `${employee.name || 'An employee'} uploaded a ${typeName} document that requires your review.`;
  await dispatchNotificationTargets({
    eventType: 'onboarding-document-upload',
    dedupeKey: `${employeeUserId}:${docId}:${documentType}`,
    targets: admins.map((admin) => {
      const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'document-review', employeeId: employeeUserId, docId }));
      return {
        userId: admin.id,
        actorUserId: employeeUserId,
        category: 'document',
        title: 'Document Upload – Review Required',
        body,
        relativeUrl: links.relativeUrl,
        portalNotification: {
          taskType: 'document_review',
          taskRefId: docId,
          metadata: { employeeId: employeeUserId, docId, documentType },
          syncDomains: ['admin-dashboard'],
        },
        email: {
          to: admin.email,
          subject: 'Document Upload – Review Required',
          text: `${body}\n\nReview it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open review task</a></p>`,
          logContext: `onboarding_document_upload:${docId}`,
        },
        push: {
          payload: {
            title: 'Document Upload – Review Required',
            body,
            url: links.relativeUrl,
            tag: `doc-upload-${docId}`,
          },
        },
      };
    }),
  });
}

async function notifyEmployeeAboutDocumentReview(employeeUserId, docId, documentType, action) {
  const employee = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(employeeUserId);
  if (!employee) return;
  const typeName = documentType.replace(/_/g, ' ');
  const approved = action === 'approved';
  const body = approved
    ? `Your ${typeName} has been approved.`
    : `Your ${typeName} was not accepted. Please re-upload the correct document in your portal.`;
  const url = buildPortalPath('/portal-employee', { task: 'employee-documents', docId });
  const absoluteUrl = absolutePortalUrl(url);
  await Promise.allSettled([
    sendEmailNotification(
      employee.email,
      `Document ${approved ? 'Approved' : 'Denied'}`,
      `${body}\n\nOpen your portal: ${absoluteUrl}`,
      `<p>${body}</p><p><a href="${absoluteUrl}">Open Portal</a></p>`,
      employee.id
    ),
    sendPushNotificationToUser(employee.id, {
      title: `Document ${approved ? 'Approved' : 'Denied'}`,
      body,
      url,
      tag: `doc-review-${docId}`,
    }),
    Promise.resolve(createPortalNotification({
      userId: employee.id,
      category: 'document',
      title: `Document ${approved ? 'Approved' : 'Denied'}`,
      body,
      url,
      metadata: { docId, documentType, action },
      syncDomains: ['employee-dashboard'],
    })),
  ]);
}

function escapeHtmlText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function notifyAdminsAboutTimesheetApproved(payload) {
  const employeeName = payload.employeeName || 'Employee';
  const employeePosition = payload.employeePosition || 'N/A';
  const facility = payload.facilityName || 'N/A';
  const streetAddress = payload.streetAddress || 'N/A';
  const workedWindow = payload.workedWindow || 'N/A';
  const approvalSignature = payload.approvalSignature || 'N/A';
  const approvedAt = payload.approvedAt || new Date().toISOString();
  const sourceLabel = payload.source === 'paper' ? 'Paper Timesheet Upload' : payload.source === 'manual' ? 'Manual Admin Entry' : 'Clock In / Clock Out';

  const subject = 'Timesheet Approved and Signed by Jobsite';
  const text = [
    'A timesheet has been approved and signed in the client/jobsite portal.',
    '',
    `Employee: ${employeeName}`,
    `Position: ${employeePosition}`,
    `Facility: ${facility}`,
    `Street Address: ${streetAddress}`,
    `Date/Time Worked: ${workedWindow}`,
    `Submission Type: ${sourceLabel}`,
    `Jobsite Signature: ${approvalSignature}`,
    `Approved At: ${approvedAt}`,
    '',
    `Review in portal: ${absolutePortalUrl('/portal-admin')}`,
  ].join('\n');

  const html = `
    <p>A timesheet has been approved and signed in the client/jobsite portal.</p>
    <ul>
      <li><strong>Employee:</strong> ${escapeHtmlText(employeeName)}</li>
      <li><strong>Position:</strong> ${escapeHtmlText(employeePosition)}</li>
      <li><strong>Facility:</strong> ${escapeHtmlText(facility)}</li>
      <li><strong>Street Address:</strong> ${escapeHtmlText(streetAddress)}</li>
      <li><strong>Date/Time Worked:</strong> ${escapeHtmlText(workedWindow)}</li>
      <li><strong>Submission Type:</strong> ${escapeHtmlText(sourceLabel)}</li>
      <li><strong>Jobsite Signature:</strong> ${escapeHtmlText(approvalSignature)}</li>
      <li><strong>Approved At:</strong> ${escapeHtmlText(approvedAt)}</li>
    </ul>
    <p><a href="${absolutePortalUrl('/portal-admin')}">Open Admin Portal</a></p>
  `;

  const admins = getActiveAdminUsersForScopes(['scheduling']);
  await Promise.allSettled([
    sendEmailNotification(TIMESHEET_APPROVAL_ALERT_EMAIL, subject, text, html, null, { logContext: `timesheet_activity:approved:${payload.timesheetId || 'event'}:alert` }),
    dispatchNotificationTargets({
      eventType: 'timesheet-activity',
      dedupeKey: `approved:${payload.timesheetId || 'event'}:admins`,
      targets: admins.map((admin) => {
        const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'timesheet-review', timesheetId: payload.timesheetId || '' }));
        const adminText = [
          'A timesheet has been approved and signed in the client/jobsite portal.',
          '',
          `Employee: ${employeeName}`,
          `Position: ${employeePosition}`,
          `Facility: ${facility}`,
          `Street Address: ${streetAddress}`,
          `Date/Time Worked: ${workedWindow}`,
          `Submission Type: ${sourceLabel}`,
          `Jobsite Signature: ${approvalSignature}`,
          `Approved At: ${approvedAt}`,
          '',
          `Review in portal: ${links.directUrl}`,
        ].join('\n');
        const adminHtml = `
    <p>A timesheet has been approved and signed in the client/jobsite portal.</p>
    <ul>
      <li><strong>Employee:</strong> ${escapeHtmlText(employeeName)}</li>
      <li><strong>Position:</strong> ${escapeHtmlText(employeePosition)}</li>
      <li><strong>Facility:</strong> ${escapeHtmlText(facility)}</li>
      <li><strong>Street Address:</strong> ${escapeHtmlText(streetAddress)}</li>
      <li><strong>Date/Time Worked:</strong> ${escapeHtmlText(workedWindow)}</li>
      <li><strong>Submission Type:</strong> ${escapeHtmlText(sourceLabel)}</li>
      <li><strong>Jobsite Signature:</strong> ${escapeHtmlText(approvalSignature)}</li>
      <li><strong>Approved At:</strong> ${escapeHtmlText(approvedAt)}</li>
    </ul>
    <p><a href="${links.directUrl}">Open review task</a></p>
  `;
        return {
          userId: admin.id,
          category: 'timesheet',
          title: 'Timesheet Approved',
          body: `${employeeName} approved a timesheet for ${facility}.`,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            metadata: { timesheetId: payload.timesheetId || null },
            syncDomains: ['admin-dashboard', 'timesheets'],
          },
          email: {
            to: admin.email,
            subject,
            text: adminText,
            html: adminHtml,
            logContext: `timesheet_activity:approved:${payload.timesheetId || 'event'}:admin:${admin.id}`,
          },
          push: {
            payload: {
              title: 'Timesheet Approved',
              body: `${employeeName} - ${facility} (${workedWindow})`,
              url: links.relativeUrl,
              tag: `timesheet-approved-${payload.timesheetId || 'event'}`,
            },
          },
        };
      }),
    }),
  ]);
}

async function notifyAdminsAboutFormSubmission(employeeUserId, employeeName, formType, formLabel) {
  console.info('[notification-route] onboarding form notification suppressed', {
    employeeUserId,
    employeeName,
    formType,
    formLabel,
  });
}

async function notifyEmployeeAboutBackgroundStatusChange(employeeUserId, statusValue) {
  const employee = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(Number(employeeUserId));
  if (!employee) return;
  const friendlyStatus = statusValue === 'passed' ? 'Passed' : 'Requires Further Attention';
  const title = 'Background Check Update';
  const body = `Your background check status has been updated to: ${friendlyStatus}.`;
  const url = '/portal-employee';
  const absoluteUrl = absolutePortalUrl(url);
  await Promise.allSettled([
    Promise.resolve(createPortalNotification({
      userId: Number(employeeUserId),
      category: 'activity',
      title,
      body,
      url,
      metadata: { status: statusValue },
      syncDomains: ['employee-dashboard'],
    })),
    sendEmailNotification(
      employee.email,
      title,
      `${body}\n\nOpen your portal: ${absoluteUrl}`,
      `<p>${escapeHtmlText(body)}</p><p><a href="${absoluteUrl}">Open Portal</a></p>`,
      Number(employeeUserId)
    ),
  ]);
}

async function notifyAdminsAboutNewRegistration(userId, userName, userRole, companyName) {
  const isJobsite = userRole === 'jobsite';
  const admins = getActiveAdminUsersForScopes(isJobsite ? ['contracts'] : ['onboarding']);
  if (!admins.length) return;
  const displayName = isJobsite ? (companyName || userName) : userName;
  const title = isJobsite ? 'New Client Registered' : 'New Employee Registered';
  const body = `${displayName} registered as a new ${isJobsite ? 'client' : 'employee'}.`;
  await Promise.allSettled(admins.map((admin) => {
    const portalPath = getPortalPathForUser(admin);
    const url = isJobsite ? portalPath : buildPortalPath(portalPath, { task: 'employee-profile', employeeId: userId });
    const metadata = isJobsite
      ? { newUserId: userId, role: userRole }
      : { employeeId: userId, role: userRole };
    return Promise.resolve(createPortalNotification({
      userId: admin.id,
      actorUserId: userId,
      category: 'activity',
      title,
      body,
      url,
      metadata,
      syncDomains: ['admin-dashboard'],
    }));
  }));
}

async function notifyAdminsAboutSsnSubmission(employeeUserId, employeeName) {
  console.info('[notification-route] onboarding ssn notification suppressed', {
    employeeUserId,
    employeeName,
  });
}

async function notifyAdminsAboutTimesheetSubmittedByEmployee(payload) {
  const admins = getActiveAdminUsersForScopes(['scheduling']);
  if (!admins.length) return;
  const employeeName = String(payload.employeeName || 'An employee').trim();
  const periodStart = String(payload.periodStart || '').trim();
  const periodEnd = String(payload.periodEnd || '').trim();
  const title = 'Timesheet Submitted';
  const body = `${employeeName} submitted a timesheet (${periodStart} to ${periodEnd}).`;
  await dispatchNotificationTargets({
    eventType: 'timesheet-activity',
    dedupeKey: `submitted:${payload.timesheetId}:admins`,
    targets: admins.map((admin) => {
      const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'timesheet-review', timesheetId: payload.timesheetId }));
      return {
        userId: admin.id,
        actorUserId: payload.employeeUserId || null,
        category: 'timesheet',
        title,
        body,
        relativeUrl: links.relativeUrl,
        portalNotification: {
          metadata: { timesheetId: payload.timesheetId, employeeUserId: payload.employeeUserId },
          syncDomains: ['admin-dashboard', 'timesheets'],
        },
        email: {
          to: admin.email,
          subject: title,
          text: `${body}\n\nReview it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open timesheet review</a></p>`,
          logContext: `timesheet_activity:submitted:${payload.timesheetId}:admin:${admin.id}`,
        },
        push: {
          payload: {
            title,
            body,
            url: links.relativeUrl,
            tag: `timesheet-submitted-${payload.timesheetId}`,
          },
        },
      };
    }),
  });
}

async function notifyJobsiteAboutTimesheetSubmitted(payload) {
  const jobsiteUserId = Number(payload.jobsiteUserId);
  const timesheetId = Number(payload.timesheetId);
  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1 || !Number.isInteger(timesheetId) || timesheetId < 1) return;

  const jobsite = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(jobsiteUserId, 'jobsite');
  if (!jobsite) return;

  const employeeName = String(payload.employeeName || 'An employee').trim() || 'An employee';
  const periodStart = String(payload.periodStart || '').trim() || 'N/A';
  const periodEnd = String(payload.periodEnd || '').trim() || 'N/A';
  const source = String(payload.source || 'clock').trim().toLowerCase();
  const sourceLabel = source === 'paper' ? 'Paper Upload' : source === 'manual' ? 'Manual Entry' : 'Clock In / Clock Out';
  const title = 'Timesheet Submitted for Review';
  const body = `${employeeName} submitted a ${sourceLabel} timesheet (${periodStart} to ${periodEnd}).`;
  const links = buildNotificationLinkBundle(buildPortalPath('/portal-jobsite', { task: 'timesheet-review', timesheetId }));

  await dispatchNotificationTargets({
    eventType: 'timesheet-activity',
    dedupeKey: `submitted:${timesheetId}:jobsite:${jobsite.id}`,
    targets: [{
      userId: jobsite.id,
      actorUserId: Number.isInteger(Number(payload.actorUserId)) ? Number(payload.actorUserId) : null,
      category: 'timesheet',
      title,
      body,
      relativeUrl: links.relativeUrl,
      portalNotification: {
        metadata: { timesheetId, source, employeeUserId: Number(payload.employeeUserId) || null },
        syncDomains: ['timesheets', 'jobsite-dashboard'],
      },
      email: {
        to: jobsite.email,
        subject: title,
        text: `${body}\n\nReview it here: ${links.directUrl}`,
        html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open timesheet review</a></p>`,
        logContext: `timesheet_activity:submitted:${timesheetId}:jobsite:${jobsite.id}`,
      },
      push: {
        payload: {
          title,
          body,
          url: links.relativeUrl,
          tag: `timesheet-submitted-${timesheetId}`,
        },
      },
    }],
  });
}

async function notifyEmployeeAboutTimesheetApproved(payload) {
  const employeeUserId = Number(payload.employeeUserId);
  const timesheetId = Number(payload.timesheetId);
  if (!Number.isInteger(employeeUserId) || employeeUserId < 1 || !Number.isInteger(timesheetId) || timesheetId < 1) return;

  const employee = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(employeeUserId, 'employee');
  if (!employee) return;

  const periodStart = String(payload.periodStart || '').trim() || 'N/A';
  const periodEnd = String(payload.periodEnd || '').trim() || 'N/A';
  const title = 'Timesheet Approved';
  const body = `Your timesheet for ${periodStart} to ${periodEnd} has been approved by the client.`;
  const links = buildNotificationLinkBundle(buildPortalPath('/portal-employee', { task: 'timesheet-review', timesheetId }));

  await dispatchNotificationTargets({
    eventType: 'timesheet-activity',
    dedupeKey: `approved:${timesheetId}:employee:${employee.id}`,
    targets: [{
      userId: employee.id,
      category: 'timesheet',
      title,
      body,
      relativeUrl: links.relativeUrl,
      portalNotification: {
        metadata: { timesheetId },
        syncDomains: ['timesheets', 'employee-dashboard'],
      },
      email: {
        to: employee.email,
        subject: title,
        text: `${body}\n\nOpen it here: ${links.directUrl}`,
        html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open timesheet</a></p>`,
        logContext: `timesheet_activity:approved:${timesheetId}:employee:${employee.id}`,
      },
      push: {
        payload: {
          title,
          body,
          url: links.relativeUrl,
          tag: `timesheet-approved-${timesheetId}`,
        },
      },
    }],
  });
}

async function notifyJobsiteAboutContractAvailable(jobsiteUserId, contractId, contractName, industryTrack, adminUserId = null) {
  const client = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(jobsiteUserId, 'jobsite');
  if (!client) return;

  const title = 'Contract Ready for Review';
  const body = `${contractName || 'A contract'} has been sent to your portal and is ready for review.`;
  const links = buildNotificationLinkBundle(buildPortalPath('/portal-jobsite', { task: 'jobsite-contract', contractId }));

  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `available:${contractId}:jobsite:${client.id}`,
    targets: [{
      userId: client.id,
      actorUserId: adminUserId,
      category: 'contract',
      title,
      body,
      relativeUrl: links.relativeUrl,
      portalNotification: {
        taskType: 'contract_review',
        taskRefId: contractId,
        metadata: { contractId, industryTrack },
        syncDomains: ['contracts'],
      },
      email: {
        to: client.email,
        subject: title,
        text: `${body}\n\nOpen it here: ${links.directUrl}`,
        html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract review</a></p>`,
        logContext: `contract_activity:available:${contractId}:jobsite:${client.id}`,
      },
      push: {
        payload: {
          title,
          body,
          url: links.relativeUrl,
          tag: `contract-review-${contractId}`,
        },
      },
    }],
  });
}

async function notifyAdminsAboutClientSignedContract(contract) {
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const clientName = contract.jobsiteName || 'A client';
  const title = 'Contract Signed by Client';
  const body = `${clientName} signed ${contract.originalName || 'a contract'}. Admin signature is now required.`;

  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `client-signed:${contract.id}:admins`,
    targets: admins.map((admin) => {
      const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), {
        task: 'admin-contract',
        contractId: contract.id,
        track: contract.industryTrack || '',
      }));
      return {
        userId: admin.id,
        actorUserId: contract.jobsiteUserId,
        category: 'contract',
        title,
        body,
        relativeUrl: links.relativeUrl,
        portalNotification: {
          taskType: 'contract_admin_sign',
          taskRefId: contract.id,
          metadata: { contractId: contract.id, track: contract.industryTrack || '' },
          syncDomains: ['contracts'],
        },
        email: {
          to: admin.email,
          subject: title,
          text: `${body}\n\nOpen it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract review</a></p>`,
          logContext: `contract_activity:client_signed:${contract.id}:admin:${admin.id}`,
        },
        push: {
          payload: {
            title,
            body,
            url: links.relativeUrl,
            tag: `contract-admin-sign-${contract.id}`,
          },
        },
      };
    }),
  });
}

async function notifyAdminsAboutContractOutcome(contract, outcome) {
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const clientName = contract.jobsiteName || 'A client';
  const normalizedOutcome = String(outcome || '').trim().toLowerCase();
  const title = normalizedOutcome === 'executed'
    ? 'Contract Executed'
    : normalizedOutcome === 'declined'
      ? 'Contract Declined'
      : 'Contract Withdrawn';
  const body = normalizedOutcome === 'executed'
    ? `${contract.originalName || 'A contract'} has been fully executed.`
    : normalizedOutcome === 'declined'
      ? `${clientName} declined ${contract.originalName || 'a contract'}.`
      : `${clientName} withdrew ${contract.originalName || 'a contract'}.`;
  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `outcome:${contract.id}:${normalizedOutcome}:admins`,
    targets: admins.map((admin) => {
      const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), {
        task: 'admin-contract',
        contractId: contract.id,
        track: contract.industryTrack || '',
      }));
      return {
        userId: admin.id,
        actorUserId: contract.jobsiteUserId,
        category: 'contract',
        title,
        body,
        relativeUrl: links.relativeUrl,
        portalNotification: {
          metadata: { contractId: contract.id, outcome: normalizedOutcome, track: contract.industryTrack || '' },
          syncDomains: ['contracts'],
        },
        email: {
          to: admin.email,
          subject: title,
          text: `${body}\n\nOpen it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract activity</a></p>`,
          logContext: `contract_activity:${normalizedOutcome}:${contract.id}:admin:${admin.id}`,
        },
        push: {
          payload: {
            title,
            body,
            url: links.relativeUrl,
            tag: `contract-outcome-${contract.id}-${normalizedOutcome}`,
          },
        },
      };
    }),
  });
}

async function notifyJobsiteAboutContractExecuted(contract) {
  const client = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(contract.jobsiteUserId, 'jobsite');
  if (!client) return;

  const title = 'Contract Executed';
  const body = `${contract.originalName || 'Your contract'} has been fully executed.`;
  const links = buildNotificationLinkBundle(buildPortalPath('/portal-jobsite', { task: 'jobsite-contract', contractId: contract.id }));

  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `executed:${contract.id}:jobsite:${client.id}`,
    targets: [{
      userId: client.id,
      actorUserId: contract.uploadedByAdminUserId,
      category: 'contract',
      title,
      body,
      relativeUrl: links.relativeUrl,
      portalNotification: {
        metadata: { contractId: contract.id, outcome: 'executed' },
        syncDomains: ['contracts'],
      },
      email: {
        to: client.email,
        subject: title,
        text: `${body}\n\nOpen it here: ${links.directUrl}`,
        html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract</a></p>`,
        logContext: `contract_activity:executed:${contract.id}:jobsite:${client.id}`,
      },
      push: {
        payload: {
          title,
          body,
          url: links.relativeUrl,
          tag: `contract-executed-${contract.id}`,
        },
      },
    }],
  });
}

async function notifyContractRenewalDue(contract) {
  const client = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(contract.jobsiteUserId, 'jobsite');
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const contractName = contract.originalName || 'Your contract';
  const clientUrl = buildPortalPath('/portal-jobsite', { task: 'jobsite-contract', contractId: contract.id });
  const title = 'Contract Renewal Required';
  const clientBody = `${contractName} is due for its annual renewal. Please log in to review and decide whether to renew or allow the contract to expire.`;
  const adminBody = `${contractName} for client ${contract.clientCompanyName || contract.clientUserName || 'a client'} is due for renewal. Please review and submit your renewal decision.`;
  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `renewal-due:${contract.id}`,
    targets: [
      ...(client ? [(() => {
        const links = buildNotificationLinkBundle(clientUrl);
        return {
          userId: client.id,
          category: 'contract',
          title,
          body: clientBody,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            taskType: 'contract_renewal',
            taskRefId: contract.id,
            metadata: { contractId: contract.id },
            syncDomains: ['contracts'],
          },
          email: {
            to: client.email,
            subject: title,
            text: `${clientBody}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(clientBody)}</p><p><a href="${links.directUrl}">Open renewal task</a></p>`,
            logContext: `contract_activity:renewal_due:${contract.id}:jobsite:${client.id}`,
          },
          push: {
            payload: {
              title,
              body: clientBody,
              url: links.relativeUrl,
              tag: `contract-renewal-${contract.id}`,
            },
          },
        };
      })()] : []),
      ...admins.map((admin) => {
        const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'admin-contract', contractId: contract.id, track: contract.industryTrack || '' }));
        return {
          userId: admin.id,
          category: 'contract',
          title,
          body: adminBody,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            taskType: 'contract_renewal',
            taskRefId: contract.id,
            metadata: { contractId: contract.id, track: contract.industryTrack || '' },
            syncDomains: ['contracts'],
          },
          email: {
            to: admin.email,
            subject: title,
            text: `${adminBody}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(adminBody)}</p><p><a href="${links.directUrl}">Open renewal task</a></p>`,
            logContext: `contract_activity:renewal_due:${contract.id}:admin:${admin.id}`,
          },
          push: {
            payload: {
              title,
              body: adminBody,
              url: links.relativeUrl,
              tag: `contract-renewal-${contract.id}`,
            },
          },
        };
      }),
    ],
  });
}

async function notifyAboutWithdrawalInitiated(contract) {
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const contractName = contract.originalName || 'A contract';
  const clientName = contract.clientCompanyName || contract.clientUserName || 'A client';
  const title = 'Contract Cancellation Initiated';
  const body = `${clientName} has initiated a cancellation request for ${contractName}. Your signature is required to complete the cancellation.`;
  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `cancel-initiated:${contract.id}:admins`,
    targets: admins.map((admin) => {
      const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'admin-contract', contractId: contract.id, track: contract.industryTrack || '' }));
      return {
        userId: admin.id,
        actorUserId: contract.jobsiteUserId,
        category: 'contract',
        title,
        body,
        relativeUrl: links.relativeUrl,
        portalNotification: {
          taskType: 'contract_cancel_confirm',
          taskRefId: contract.id,
          metadata: { contractId: contract.id, track: contract.industryTrack || '' },
          syncDomains: ['contracts'],
        },
        email: {
          to: admin.email,
          subject: title,
          text: `${body}\n\nOpen it here: ${links.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open cancellation task</a></p>`,
          logContext: `contract_activity:cancel_initiated:${contract.id}:admin:${admin.id}`,
        },
        push: {
          payload: {
            title,
            body,
            url: links.relativeUrl,
            tag: `contract-cancel-${contract.id}`,
          },
        },
      };
    }),
  });
}

async function notifyAboutContractCancelled(contract) {
  const client = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(contract.jobsiteUserId, 'jobsite');
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const contractName = contract.originalName || 'A contract';
  const title = 'Contract Cancelled';
  const body = `${contractName} has been permanently cancelled by mutual agreement of both parties.`;
  const clientUrl = buildPortalPath('/portal-jobsite', { task: 'jobsite-contract', contractId: contract.id });
  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `cancelled:${contract.id}`,
    targets: [
      ...(client ? [(() => {
        const links = buildNotificationLinkBundle(clientUrl);
        return {
          userId: client.id,
          category: 'contract',
          title,
          body,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            metadata: { contractId: contract.id },
            syncDomains: ['contracts'],
          },
          email: {
            to: client.email,
            subject: title,
            text: `${body}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract</a></p>`,
            logContext: `contract_activity:cancelled:${contract.id}:jobsite:${client.id}`,
          },
          push: {
            payload: {
              title,
              body,
              url: links.relativeUrl,
              tag: `contract-cancelled-${contract.id}`,
            },
          },
        };
      })()] : []),
      ...admins.map((admin) => {
        const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'admin-contract', contractId: contract.id, track: contract.industryTrack || '' }));
        return {
          userId: admin.id,
          category: 'contract',
          title,
          body,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            metadata: { contractId: contract.id },
            syncDomains: ['contracts'],
          },
          email: {
            to: admin.email,
            subject: title,
            text: `${body}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract activity</a></p>`,
            logContext: `contract_activity:cancelled:${contract.id}:admin:${admin.id}`,
          },
          push: {
            payload: {
              title,
              body,
              url: links.relativeUrl,
              tag: `contract-cancelled-${contract.id}-admin-${admin.id}`,
            },
          },
        };
      }),
    ],
  });
}

async function notifyAboutContractRenewed(contract) {
  const client = db.prepare('SELECT id, email FROM users WHERE id = ? AND role = ?').get(contract.jobsiteUserId, 'jobsite');
  const admins = getActiveAdminUsersForScopes(['contracts']);
  const contractName = contract.originalName || 'A contract';
  const title = 'Contract Renewed';
  const body = `${contractName} has been renewed by both parties for another year.`;
  const clientUrl = buildPortalPath('/portal-jobsite', { task: 'jobsite-contract', contractId: contract.id });
  await dispatchNotificationTargets({
    eventType: 'contract-activity',
    dedupeKey: `renewed:${contract.id}`,
    targets: [
      ...(client ? [(() => {
        const links = buildNotificationLinkBundle(clientUrl);
        return {
          userId: client.id,
          category: 'contract',
          title,
          body,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            metadata: { contractId: contract.id },
            syncDomains: ['contracts'],
          },
          email: {
            to: client.email,
            subject: title,
            text: `${body}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract</a></p>`,
            logContext: `contract_activity:renewed:${contract.id}:jobsite:${client.id}`,
          },
          push: {
            payload: {
              title,
              body,
              url: links.relativeUrl,
              tag: `contract-renewed-${contract.id}`,
            },
          },
        };
      })()] : []),
      ...admins.map((admin) => {
        const links = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'admin-contract', contractId: contract.id, track: contract.industryTrack || '' }));
        return {
          userId: admin.id,
          category: 'contract',
          title,
          body,
          relativeUrl: links.relativeUrl,
          portalNotification: {
            metadata: { contractId: contract.id },
            syncDomains: ['contracts'],
          },
          email: {
            to: admin.email,
            subject: title,
            text: `${body}\n\nOpen it here: ${links.directUrl}`,
            html: `<p>${escapeHtmlText(body)}</p><p><a href="${links.directUrl}">Open contract activity</a></p>`,
            logContext: `contract_activity:renewed:${contract.id}:admin:${admin.id}`,
          },
          push: {
            payload: {
              title,
              body,
              url: links.relativeUrl,
              tag: `contract-renewed-${contract.id}-admin-${admin.id}`,
            },
          },
        };
      }),
    ],
  });
}

async function notifyEmployeeAboutShiftOffer(recipient, offer) {
  await notifyUserAboutShift(recipient, offer, {
    title: `Private shift offer: ${offer.shiftTitle}`,
    body: `${offer.fromEmployeeName} offered you ${offer.shiftTitle}${offer.companyName ? ` at ${offer.companyName}` : ''}.`,
    url: `/portal-employee?offerAction=view&offerId=${encodeURIComponent(offer.id)}`,
    tag: `shift-offer-${offer.id}`,
    actions: [
      { action: 'accept_offer', title: 'Accept' },
      { action: 'decline_offer', title: 'Decline' },
    ],
    data: { offerId: offer.id },
  });
}

function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const idx = item.indexOf('=');
      if (idx === -1) return acc;
      const key = item.slice(0, idx);
      const value = decodeURIComponent(item.slice(idx + 1));
      acc[key] = value;
      return acc;
    }, {});
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  if (req.query && typeof req.query.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  const cookies = parseCookies(req.headers.cookie || '');
  return cookies.portal_token || null;
}

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;

  db.prepare('INSERT INTO sessions (userId, tokenHash, expiresAt) VALUES (?, ?, ?)').run(
    userId,
    tokenHash,
    expiresAt
  );

  return { token, tokenHash, expiresAt };
}

function getSessionUser(token) {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = db
    .prepare(
      `SELECT
         s.id AS sessionId,
         s.tokenHash,
         s.expiresAt,
         u.id,
         u.name,
         u.email,
        u.pendingEmail,
         u.role,
         u.portalScope,
         u.notifyEmailEnabled,
         u.notifySmsEnabled,
         u.notifyPushEnabled,
         u.requireBiometricSensitive,
        u.preferredLanguage,
         u.isActive,
         u.adminEmployeeIndustryTrack
       FROM sessions s
       JOIN users u ON u.id = s.userId
       WHERE s.tokenHash = ?
         AND s.expiresAt > strftime('%s', 'now')
         AND u.isActive = 1`
    )
    .get(tokenHash);

  if (!session) return null;

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    pendingEmail: session.pendingEmail || null,
    role: session.role,
    portalScope: normalizeAdminScope(session.portalScope),
    notificationPreferences: {
      email: Number(session.notifyEmailEnabled) === 1,
      sms: Number(session.notifySmsEnabled) === 1,
      push: Number(session.notifyPushEnabled) === 1,
    },
    requireBiometricSensitive: Number(session.requireBiometricSensitive) === 1,
    preferredLanguage: normalizePreferredLanguage(session.preferredLanguage, 'en'),
    adminEmployeeIndustryTrack: session.adminEmployeeIndustryTrack || null,
    tokenHash: session.tokenHash,
    sessionId: session.sessionId,
  };
}

function authGuard(allowedRoles = []) {
  return (req, res, next) => {
    const token = getTokenFromRequest(req);
    const user = getSessionUser(token);

    if (!user) {
      const isApiRequest = (req.path || '').startsWith('/api/') || !(req.headers.accept || '').includes('text/html');
      if (!isApiRequest) {
        return res.redirect(302, `/portal-login?redirect=${encodeURIComponent(req.originalUrl || req.path)}`);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (allowedRoles.length && !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (String(user.role || '').toLowerCase() === 'admin' && !canScopedAdminAccessPath(user.portalScope, req.path || req.originalUrl || '')) {
      return res.status(403).json({ error: 'Forbidden for this portal scope.' });
    }

    req.auth = user;
    req.authToken = token;
    next();
  };
}

function setSessionCookie(res, token) {
  res.setHeader(
    'Set-Cookie',
    `portal_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  );
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', 'portal_token=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0');
}

function sanitizeUser(user) {
  const pushLockState = user && String(user.role || '').toLowerCase() === 'employee'
    ? getMandatoryEmployeePushLockState(user.id, user.email)
    : { locked: false, reason: '', source: '' };
  const prefs = user && user.notificationPreferences
    ? user.notificationPreferences
    : {
        email: Number(user && user.notifyEmailEnabled) === 1,
        sms: Number(user && user.notifySmsEnabled) === 1,
        push: pushLockState.locked ? true : Number(user && user.notifyPushEnabled) === 1,
      };
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    pendingEmail: user.pendingEmail || null,
    role: user.role,
    portalScope: normalizeAdminScope(user.portalScope),
    homePath: getPortalPathForUser(user),
    notificationPreferences: {
      email: prefs.email !== false,
      sms: prefs.sms !== false,
      push: pushLockState.locked ? true : prefs.push !== false,
    },
    securityPreferences: {
      requireBiometricSensitive: Number(user && user.requireBiometricSensitive) === 1,
    },
    preferredLanguage: normalizePreferredLanguage(user && user.preferredLanguage, 'en'),
    mandatoryPushLock: Boolean(pushLockState.locked),
    mandatoryPushLockReason: String(pushLockState.reason || ''),
    mandatoryPushLockSource: String(pushLockState.source || ''),
  };
}

function isTruthy(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function inferIndustryFromApplications(applications = []) {
  if (!Array.isArray(applications) || applications.length === 0) return 'warehouse';
  return String(applications[0].industry || 'warehouse').toLowerCase();
}

function normalizeEmployeeIndustryType(value) {
  return String(value || '').trim().toLowerCase();
}

function buildEmployeeProfileHeaderData(userId, email, options = {}) {
  const applications = Array.isArray(options.applications)
    ? options.applications
    : db
      .prepare(
        `SELECT id, industry, position, createdAt
         FROM applications
         WHERE userId = ? OR email = ?
         ORDER BY createdAt DESC`
      )
      .all(userId, email);
  const latestApplication = applications[0] || {};
  const profile = options.profile || db.prepare('SELECT industryType, positionTitle FROM employee_profiles WHERE userId = ?').get(userId) || {};

  const industryType = normalizeEmployeeIndustryType(latestApplication.industry || profile.industryType);
  const positionTitle = String(latestApplication.position || profile.positionTitle || '').trim();
  const profileIndustryType = normalizeEmployeeIndustryType(profile.industryType);
  const profilePositionTitle = String(profile.positionTitle || '').trim();

  if (industryType || positionTitle) {
    const shouldPersist = industryType !== profileIndustryType || positionTitle !== profilePositionTitle;
    if (shouldPersist) {
      db.prepare(
        `INSERT INTO employee_profiles (userId, industryType, positionTitle)
         VALUES (?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
           industryType = excluded.industryType,
           positionTitle = excluded.positionTitle`
      ).run(userId, industryType || null, positionTitle || null);
    }
  }

  if (options.profile) {
    options.profile.industryType = industryType || profileIndustryType || null;
    options.profile.positionTitle = positionTitle || profilePositionTitle || null;
  }

  return {
    industryType: industryType || profileIndustryType || null,
    positionTitle: positionTitle || profilePositionTitle || null,
    industryTrack: industryToTrack(industryType || profileIndustryType || inferIndustryFromApplications(applications)),
  };
}

function normalizeIndustryTrack(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'healthcare') return 'healthcare';
  if (normalized === 'warehouse') return 'warehouse';
  return '';
}

function industryToTrack(industry) {
  return HEALTHCARE_INDUSTRIES.has(String(industry || '').trim().toLowerCase()) ? 'healthcare' : 'warehouse';
}

function industryMatchesTrack(industry, track) {
  const normalizedTrack = normalizeIndustryTrack(track);
  if (!normalizedTrack) return true;
  return industryToTrack(industry) === normalizedTrack;
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getLatestEmployeeApplicationRecord(userId, email) {
  return db
    .prepare(
      `SELECT id, industry, position, createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC
       LIMIT 1`
    )
    .get(userId, email);
}

function getEmployeePrimaryPosition(userId, email) {
  const application = getLatestEmployeeApplicationRecord(userId, email);
  return application ? String(application.position || '').trim() : '';
}

function getEmployeeIndustryTrack(userId, email) {
  const application = getLatestEmployeeApplicationRecord(userId, email);
  if (!application) return 'warehouse';
  return industryToTrack(application.industry);
}

function getJobsiteIndustryTrack(userId) {
  const profile = db.prepare('SELECT industryTrack FROM jobsite_profiles WHERE userId = ?').get(userId);
  const profileTrack = normalizeIndustryTrack(profile && profile.industryTrack);

  const latestContract = db
    .prepare(
      `SELECT industryTrack
       FROM contracts
       WHERE jobsiteUserId = ?
         AND industryTrack IN ('warehouse', 'healthcare')
       ORDER BY COALESCE(updatedAt, createdAt) DESC
       LIMIT 1`
    )
    .get(userId);
  const contractTrack = normalizeIndustryTrack(latestContract && latestContract.industryTrack);
  if (contractTrack) {
    if (contractTrack !== profileTrack) {
      db.prepare('UPDATE jobsite_profiles SET industryTrack = ? WHERE userId = ?').run(contractTrack, userId);
    }
    return contractTrack;
  }

  if (profileTrack) return profileTrack;

  const latestJob = db
    .prepare('SELECT industry FROM jobs WHERE jobsiteUserId = ? ORDER BY createdAt DESC LIMIT 1')
    .get(userId);
  if (latestJob && String(latestJob.industry || '').trim()) {
    const jobTrack = industryToTrack(latestJob.industry);
    if (jobTrack) {
      db.prepare('UPDATE jobsite_profiles SET industryTrack = ? WHERE userId = ?').run(jobTrack, userId);
      return jobTrack;
    }
  }

  return 'warehouse';
}

function getEmployeeShiftAccessState(userId, email) {
  const applications = db
    .prepare(
      `SELECT id, industry, position, createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(userId, email);

  const position = String(applications[0]?.position || '').trim();
  if (!position) {
    return {
      allowed: false,
      reason: 'missing_position',
      message: 'Add an application with your job title before you can receive matching shifts.',
    };
  }

  const documents = db
    .prepare(
      `SELECT
         documentType,
         expirationDate,
         documentStatus,
         createdAt
       FROM employee_documents
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(userId);

  const industry = inferIndustryFromApplications(applications);
  const { compliance } = evaluateEmployeeCompliance(userId, industry, documents);
  if (!compliance.isComplete) {
    return {
      allowed: false,
      reason: 'incomplete_documents',
      compliance,
      message: getEmployeeComplianceBlockMessage(compliance, 'accept shifts'),
    };
  }

  return {
    allowed: true,
    reason: null,
    compliance,
  };
}

function getOpenShiftRows() {
  return db
    .prepare(
      `SELECT
         j.id,
         j.title,
         j.industry,
         j.payRate,
         j.statPayEnabled,
         j.statPaySignatureName,
         j.statPaySignedAt,
         j.schedule,
         j.status,
         j.createdAt,
         j.jobsiteUserId,
         u.name AS jobsiteName,
         jp.companyName,
         jp.address AS clientAddress
       FROM jobs j
       JOIN users u ON u.id = j.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE j.status = 'open'
       ORDER BY j.createdAt DESC`
    )
    .all();
}

function getVisibleOpenShiftsForUser(user) {
  const shifts = getOpenShiftRows();
  if (!user || user.role !== 'employee') {
    return shifts;
  }

  const shiftAccess = getEmployeeShiftAccessState(user.id, user.email);
  if (!shiftAccess.allowed) return [];

  const employeeTitle = normalizeText(getEmployeePrimaryPosition(user.id, user.email));
  if (!employeeTitle) return [];

  const declinedIds = new Set(
    db.prepare('SELECT jobId FROM shift_declines WHERE employeeUserId = ?').all(user.id).map((row) => Number(row.jobId))
  );

  return shifts.filter((shift) => {
    if (declinedIds.has(Number(shift.id))) return false;
    if (!industryMatchesTrack(shift.industry, getEmployeeIndustryTrack(user.id, user.email))) return false;
    return normalizeText(shift.title) === employeeTitle;
  });
}

function getMessagingActorType(user) {
  const role = String(user && user.role ? user.role : '').trim().toLowerCase();
  if (role !== 'admin') return role;

  const scope = normalizeAdminScope(user && user.portalScope);
  if (scope === 'onboarding') return 'portal-onboarding';
  if (scope === 'contracts') return 'portal-contracts';
  if (scope === 'scheduling') return 'portal-scheduling';
  return 'admin';
}

function getMessagingPortalLabel(user) {
  const type = getMessagingActorType(user);
  if (type === 'portal-onboarding') return 'Onboarding Portal';
  if (type === 'portal-contracts') return 'Contracts Portal';
  if (type === 'portal-scheduling') return 'Scheduling Portal';
  if (type === 'admin') return 'Admin';
  if (type === 'jobsite') return 'Client';
  if (type === 'employee') return 'Employee';
  return 'User';
}

function baseMessagingTypeAllowsTarget(senderType, recipientType) {
  if (senderType === 'admin') return true;
  if (senderType === 'portal-onboarding') {
    return ['admin', 'employee', 'portal-onboarding', 'portal-scheduling'].includes(recipientType);
  }
  if (senderType === 'portal-contracts') {
    return ['admin', 'jobsite'].includes(recipientType);
  }
  if (senderType === 'portal-scheduling') {
    return ['admin', 'employee', 'jobsite', 'portal-onboarding', 'portal-scheduling'].includes(recipientType);
  }
  if (senderType === 'jobsite') {
    return ['admin', 'employee', 'portal-contracts', 'portal-scheduling'].includes(recipientType);
  }
  if (senderType === 'employee') {
    return ['admin', 'employee', 'jobsite', 'portal-onboarding', 'portal-scheduling'].includes(recipientType);
  }
  return false;
}

function canUsersDirectMessage(sender, recipient) {
  if (!sender || !recipient) return false;
  if (Number(sender.id) === Number(recipient.id)) return false;

  const senderType = getMessagingActorType(sender);
  const recipientType = getMessagingActorType(recipient);

  if (!baseMessagingTypeAllowsTarget(senderType, recipientType)) return false;
  if (!baseMessagingTypeAllowsTarget(recipientType, senderType)) return false;

  if (senderType === 'employee' && recipientType === 'employee') {
    return getEmployeeIndustryTrack(sender.id, sender.email) === getEmployeeIndustryTrack(recipient.id, recipient.email);
  }

  if (senderType === 'employee' && recipientType === 'jobsite') {
    return getEmployeeIndustryTrack(sender.id, sender.email) === getJobsiteIndustryTrack(recipient.id);
  }

  if (senderType === 'jobsite' && recipientType === 'employee') {
    return getJobsiteIndustryTrack(sender.id) === getEmployeeIndustryTrack(recipient.id, recipient.email);
  }

  return true;
}

function getMessageContactsForUser(user) {
  if (!user || !Number.isInteger(Number(user.id))) return [];

  const rows = db
    .prepare(
      `SELECT id, name, email, role, portalScope
       FROM users
       WHERE id <> ?
         AND isActive = 1
       ORDER BY role ASC, name ASC`
    )
    .all(Number(user.id));

  return rows.filter((row) => canUsersDirectMessage(user, row));
}

const MESSAGE_BLOCKLIST = [
  /\bf+u+c+k+\b/ig,
  /\bs+h+i+t+\b/ig,
  /\bb+i+t+c+h+\b/ig,
  /\ba+s+s+h+o+l+e+\b/ig,
  /\bd+i+c+k+\b/ig,
  /\bp+u+s+s+y+\b/ig,
  /\bc+u+n+t+\b/ig,
  /\bw+h+o+r+e+\b/ig,
  /\bn+i+g+g+a+\b/ig,
  /\bn+i+g+g+e+r+\b/ig,
  /\bf+a+g+\b/ig,
  /\bf+a+g+g+o+t+\b/ig,
  /\br+e+t+a+r+d+\b/ig,
  /\br+a+p+e+\b/ig,
  /\bk+i+l+l\s+y+o+u+\b/ig,
  /\bs+e+x+\b/ig,
  /\bp+o+r+n+\b/ig,
  /\bn+u+d+e+s+\b/ig,
];

function maskInappropriateLanguage(text) {
  let normalized = String(text || '');
  let redactionCount = 0;
  MESSAGE_BLOCKLIST.forEach((pattern) => {
    normalized = normalized.replace(pattern, (match) => {
      redactionCount += 1;
      return '*'.repeat(Math.max(3, String(match || '').length));
    });
  });
  return {
    text: normalized,
    redacted: redactionCount > 0,
  };
}

function getMessagesForUser(userId) {
  return db
    .prepare(
      `SELECT
         dm.id,
         dm.body,
         dm.createdAt,
         dm.senderUserId,
         dm.recipientUserId,
         sender.name AS senderName,
         sender.role AS senderRole,
         recipient.name AS recipientName,
         recipient.role AS recipientRole
       FROM direct_messages dm
       JOIN users sender ON sender.id = dm.senderUserId
       JOIN users recipient ON recipient.id = dm.recipientUserId
       WHERE (dm.senderUserId = ? AND dm.senderDeletedAt IS NULL)
         OR (dm.recipientUserId = ? AND dm.recipientDeletedAt IS NULL)
       ORDER BY dm.createdAt ASC
       LIMIT 300`
    )
    .all(userId, userId);
}

function getShiftOffersForEmployee(userId) {
  return db
    .prepare(
      `SELECT
         so.id,
         so.status,
         so.createdAt,
         so.assignmentId,
         so.fromEmployeeUserId,
         so.toEmployeeUserId,
         j.title AS shiftTitle,
         j.industry,
         j.schedule,
         j.payRate,
         sender.name AS fromEmployeeName,
         jp.companyName,
         jp.address AS clientAddress
       FROM shift_offers so
       JOIN job_assignments ja ON ja.id = so.assignmentId
       JOIN jobs j ON j.id = ja.jobId
       JOIN users sender ON sender.id = so.fromEmployeeUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE so.toEmployeeUserId = ?
       ORDER BY so.createdAt DESC`
    )
    .all(userId);
}

function profileForIndustry(industry) {
  return HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase())
    ? EMPLOYEE_DOCUMENT_PROFILES.healthcare
    : EMPLOYEE_DOCUMENT_PROFILES.warehouse;
}

function getDocumentTypeLabel(documentType) {
  return DOCUMENT_TYPE_LABELS[String(documentType || '').trim().toLowerCase()] || String(documentType || 'Document').trim() || 'Document';
}

function getEmployeeComplianceBlockMessage(compliance, actionPhrase = 'continue') {
  const items = Array.isArray(compliance && compliance.items) ? compliance.items : [];
  const missingItem = items.find((item) => item.required && item.missingRequired) || null;
  if (missingItem && (missingItem.documentType === 'background_acknowledgment_consent' || missingItem.documentType === 'hipaa_compliance_acknowledgment')) {
    return `Complete the ${getDocumentTypeLabel(missingItem.documentType)} form before you can ${actionPhrase}.`;
  }
  if (missingItem) {
    return `Complete ${getDocumentTypeLabel(missingItem.documentType)} before you can ${actionPhrase}.`;
  }
  const missingExpirationItem = items.find((item) => item.required && item.missingExpiration) || null;
  if (missingExpirationItem) {
    return `Complete the expiration details for ${getDocumentTypeLabel(missingExpirationItem.documentType)} before you can ${actionPhrase}.`;
  }
  return `Complete required onboarding items before you can ${actionPhrase}.`;
}

function getEmployeeExpiringRequiredDocuments(userId, email, daysUntilDue = 30) {
  const applications = db
    .prepare(
      `SELECT industry, createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(userId, email || '');

  const documents = db
    .prepare(
      `SELECT
         documentType,
         expirationDate,
         documentStatus,
         createdAt
       FROM employee_documents
       WHERE userId = ?`
    )
    .all(userId);

  const industry = inferIndustryFromApplications(applications);
  const requiredWithExpiration = profileForIndustry(industry)
    .filter((rule) => Boolean(rule.required) && Boolean(rule.requiresExpiration))
    .map((rule) => rule.type);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const maxDays = Number(daysUntilDue);

  return requiredWithExpiration
    .map((type) => {
      const approvedDocs = documents
        .filter((doc) => String(doc.documentType || '').toLowerCase() === type)
        .filter((doc) => String(doc.documentStatus || 'pending').toLowerCase() === 'approved')
        .filter((doc) => /^\d{4}-\d{2}-\d{2}$/.test(String(doc.expirationDate || '').trim()));

      if (!approvedDocs.length) return null;

      const withDate = approvedDocs
        .map((doc) => {
          const normalized = `${String(doc.expirationDate).trim()}T00:00:00`;
          const date = new Date(normalized);
          if (!Number.isFinite(date.getTime())) return null;
          const days = Math.ceil((date.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));
          return { doc, date, daysUntilExpiration: days };
        })
        .filter(Boolean)
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      if (!withDate.length) return null;
      const nearest = withDate[0];
      if (nearest.daysUntilExpiration < 0 || nearest.daysUntilExpiration > maxDays) return null;

      return {
        documentType: type,
        expirationDate: String(nearest.doc.expirationDate).trim(),
        daysUntilExpiration: nearest.daysUntilExpiration,
      };
    })
    .filter(Boolean);
}

function hasMandatoryExpirationReminderLock(userId, email) {
  return getEmployeeExpiringRequiredDocuments(userId, email, 30).length > 0;
}

function getWorkWeekWindow(date = new Date(), weekOffset = 0) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + delta + (weekOffset * 7));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    weekKey: formatLocalDateYmd(monday),
    periodStart: formatLocalDateYmd(monday),
    periodEnd: formatLocalDateYmd(sunday),
  };
}

function formatWeeklyReminderWeekKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  monday.setDate(monday.getDate() + delta);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEmployeesWithPendingPaperTimesheetReminderForWeek(periodStart, periodEnd) {
  const rows = db
    .prepare(
      `SELECT u.id, u.name, u.email, t.clockInAt
       FROM users u
       JOIN employee_time_clock_entries t ON t.employeeUserId = u.id
       WHERE u.role = 'employee'
         AND u.isActive = 1
         AND t.clockOutAt IS NOT NULL
         AND (t.timesheetId IS NULL OR t.timesheetId = 0)
       ORDER BY u.id ASC, t.clockInAt ASC`
    )
    .all();

  const employees = new Map();
  rows.forEach((row) => {
    const workedAt = parseStoredDateTime(row.clockInAt);
    const workedDay = formatLocalDateYmd(workedAt);
    if (!workedDay || workedDay < periodStart || workedDay > periodEnd) return;
    if (!employees.has(Number(row.id))) {
      employees.set(Number(row.id), { id: Number(row.id), name: row.name, email: row.email });
    }
  });

  return Array.from(employees.values());
}

function hasPendingPaperTimesheetReminderLock(userId, now = new Date()) {
  const windows = [getWorkWeekWindow(now, 0), getWorkWeekWindow(now, -1)];
  return windows.some((window) => {
    const rows = db
      .prepare(
        `SELECT clockInAt
         FROM employee_time_clock_entries
         WHERE employeeUserId = ?
           AND clockOutAt IS NOT NULL
           AND (timesheetId IS NULL OR timesheetId = 0)
         ORDER BY clockInAt DESC`
      )
      .all(userId);

    return rows.some((row) => {
      const workedAt = parseStoredDateTime(row.clockInAt);
      const workedDay = formatLocalDateYmd(workedAt);
      return Boolean(workedDay && workedDay >= window.periodStart && workedDay <= window.periodEnd);
    });
  });
}

function getMandatoryEmployeePushLockState(userId, email, now = new Date()) {
  if (hasMandatoryExpirationReminderLock(userId, email)) {
    return {
      locked: true,
      reason: 'Push notifications are required while any required document is within 30 days of expiration. Upload an updated document to stop expiration reminders.',
      source: 'expiration',
    };
  }

  if (hasPendingPaperTimesheetReminderLock(userId, now)) {
    return {
      locked: true,
      reason: 'Push notifications are required while you have worked, unsubmitted time in the current or prior payroll week because weekly paper timesheet reminders are mandatory.',
      source: 'timesheet',
    };
  }

  return {
    locked: false,
    reason: '',
    source: '',
  };
}

async function sendEmployeePaperTimesheetReminder(options = {}) {
  const employeeUserId = Number(options.employeeUserId);
  const reminderType = String(options.reminderType || '').trim().toLowerCase();
  const weekKey = String(options.weekKey || '').trim();
  const periodStart = String(options.periodStart || '').trim();
  const periodEnd = String(options.periodEnd || '').trim();

  if (!Number.isInteger(employeeUserId) || employeeUserId < 1 || !reminderType || !weekKey || !periodStart || !periodEnd) {
    return { sent: false, reason: 'invalid-input' };
  }

  const employee = db.prepare("SELECT id, name, email FROM users WHERE id = ? AND role = 'employee'").get(employeeUserId);
  if (!employee) {
    return { sent: false, reason: 'employee-not-found' };
  }

  const logResult = db.prepare(
    `INSERT OR IGNORE INTO timesheet_reminder_logs (userId, reminderType, weekKey)
     VALUES (?, ?, ?)`
  ).run(employeeUserId, reminderType, weekKey);
  if (logResult.changes === 0) {
    return { sent: false, reason: 'already-sent-for-week' };
  }

  const isFinalReminder = reminderType === 'paper_timesheet_monday_8am';
  const title = isFinalReminder ? 'Final Paper Timesheet Reminder' : 'Paper Timesheet Reminder';
  const body = isFinalReminder
    ? `Paper timesheets for ${periodStart} through ${periodEnd} are due now and must be turned in no later than Monday at 8:00 AM.`
    : `If you are submitting a paper timesheet for ${periodStart} through ${periodEnd}, it must be turned in every Monday no later than 8:00 AM.`;
  const employeeLinks = buildNotificationLinkBundle(buildPortalPath('/portal-employee', { task: 'timesheet_reminder', periodStart, periodEnd }));
  const employeePhone = getUserPhoneNumber(employeeUserId, 'employee');
  const adminRecipients = getActiveAdminUsersForScopes(['scheduling']);

  await dispatchNotificationTargets({
    eventType: 'timesheet-reminder',
    dedupeKey: `${employeeUserId}:${reminderType}:${weekKey}`,
    targets: [
      {
        userId: employeeUserId,
        category: 'timesheet',
        title,
        body,
        relativeUrl: employeeLinks.relativeUrl,
        portalNotification: {
          taskType: 'timesheet_reminder',
          metadata: { reminderType, weekKey, periodStart, periodEnd },
          syncDomains: ['notifications', 'timesheets', 'employee-dashboard'],
        },
        email: {
          to: employee.email,
          subject: title,
          text: `${body}\n\nOpen it here: ${employeeLinks.directUrl}`,
          html: `<p>${escapeHtmlText(body)}</p><p><a href="${employeeLinks.directUrl}">Open reminder task</a></p>`,
          logContext: `timesheet_reminder:${reminderType}:${weekKey}:employee:${employeeUserId}`,
        },
        push: {
          payload: {
            title,
            body,
            url: employeeLinks.relativeUrl,
            tag: `${reminderType}-${weekKey}`,
            data: { reminderType, weekKey, periodStart, periodEnd },
          },
          options: { ignorePreference: true },
        },
        sms: {
          to: employeePhone,
          body: `${title}: ${body} Open: ${employeeLinks.directUrl}`.slice(0, 320),
        },
      },
      ...adminRecipients.map((admin) => {
        const adminLinks = buildNotificationLinkBundle(buildPortalPath(getPortalPathForUser(admin), { task: 'timesheet-review', periodStart, periodEnd }));
        return {
          userId: admin.id,
          actorUserId: null,
          category: 'timesheet',
          title: `Timesheet Reminder Sent: ${employee.name || 'Employee'}`,
          body: `${employee.name || 'An employee'} was reminded to submit a paper timesheet for ${periodStart} through ${periodEnd}.`,
          relativeUrl: adminLinks.relativeUrl,
          portalNotification: {
            taskType: 'timesheet_reminder',
            metadata: { employeeUserId, reminderType, weekKey, periodStart, periodEnd },
            syncDomains: ['admin-dashboard', 'timesheets'],
          },
        };
      }),
    ],
  });

  return { sent: true };
}

async function sendEmployeeDocumentReminder(options = {}) {
  const employeeUserId = Number(options.employeeUserId);
  const actorUserId = Number(options.actorUserId) || null;
  const documentType = String(options.documentType || '').trim().toLowerCase();
  const reason = String(options.reason || 'admin_manual').trim().toLowerCase();
  const weekKey = options.weekKey ? String(options.weekKey) : null;
  const expirationDate = options.expirationDate ? String(options.expirationDate) : null;
  const daysUntilExpiration = Number.isInteger(options.daysUntilExpiration) ? options.daysUntilExpiration : null;

  if (!Number.isInteger(employeeUserId) || employeeUserId < 1 || !documentType) {
    return { sent: false, reason: 'invalid-input' };
  }

  const employee = db.prepare("SELECT id, name, email FROM users WHERE id = ? AND role = 'employee'").get(employeeUserId);
  if (!employee) {
    return { sent: false, reason: 'employee-not-found' };
  }

  if (weekKey) {
    const logResult = db.prepare(
      `INSERT OR IGNORE INTO document_reminder_logs
        (userId, documentType, reason, weekKey, actorUserId)
       VALUES (?, ?, ?, ?, ?)`
    ).run(employeeUserId, documentType, reason, weekKey, actorUserId);
    if (logResult.changes === 0) {
      return { sent: false, reason: 'already-sent-this-week' };
    }
  }

  const documentLabel = getDocumentTypeLabel(documentType);
  const url = buildEmployeeDocumentReminderPath(documentType);
  const directUrl = absolutePortalUrl(url);
  const fallbackUrl = absolutePortalUrl('/portal-login');
  const employeePhone = getUserPhoneNumber(employeeUserId, 'employee');

  let title = 'Document reminder';
  let body = `Please upload or update your ${documentLabel} in the employee portal.`;
  if (reason === 'expiration_auto') {
    title = `${documentLabel} expires soon`;
    if (expirationDate && Number.isInteger(daysUntilExpiration)) {
      body = `${documentLabel} expires in ${daysUntilExpiration} day(s) on ${expirationDate}. Please upload an updated document.`;
    } else {
      body = `${documentLabel} expires soon. Please upload an updated document to stay compliant.`;
    }
  }

  const emailPayload = buildDocumentReminderEmailPayload({
    employeeName: employee.name,
    title,
    body,
    directUrl,
    fallbackUrl,
    documentLabel,
  });
  const smsBody = `${title}: ${body} Open: ${directUrl}`.slice(0, 320);

  const channelResults = await Promise.all([
    executeReminderChannel('portal', async () => {
      const notificationId = createPortalNotification({
        userId: employeeUserId,
        actorUserId,
        category: 'document',
        title,
        body,
        url,
        taskType: reason === 'expiration_auto' ? 'document_expiration' : 'document_reminder',
        taskRefId: null,
        metadata: {
          employeeId: employeeUserId,
          documentType,
          reason,
          expirationDate,
          daysUntilExpiration,
        },
        syncDomains: ['notifications', 'documents'],
      });
      return notificationId
        ? { sent: true, notificationId }
        : { skipped: true, reason: 'portal-notification-not-created' };
    }),
    executeReminderChannel('email', async () => sendEmailNotification(
      employee.email,
      emailPayload.subject,
      emailPayload.text,
      emailPayload.html,
      employeeUserId,
      { logContext: `document_reminder:${reason}:${documentType}` }
    )),
    executeReminderChannel('push', async () => sendPushNotificationToUser(employeeUserId, {
      title,
      body,
      url,
      tag: reason === 'expiration_auto' ? `doc-expiration-${documentType}` : `doc-reminder-${documentType}`,
      data: { documentType, reason, directUrl },
    })),
    executeReminderChannel('sms', async () => sendSmsNotification(employeePhone, smsBody, employeeUserId)),
  ]);

  const delivery = channelResults.reduce((acc, entry) => {
    acc[entry.channel] = entry;
    return acc;
  }, {});

  return {
    sent: channelResults.some((entry) => entry.status === 'sent'),
    title,
    body,
    url,
    directUrl,
    fallbackUrl,
    delivery,
  };
}

function getEmployeeBackgroundConsentForm(userId, options = {}) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) return null;

  const includeMeta = Boolean(options.includeMeta);
  const columns = includeMeta
    ? `id, userId, acknowledged, legalName, signatureName, signedDate, consentVersion, ipAddress, userAgent, createdAt, updatedAt`
    : `id, userId, acknowledged, legalName, signatureName, signedDate, consentVersion, createdAt, updatedAt`;

  return db.prepare(
    `SELECT ${columns}
     FROM employee_background_consent_forms
     WHERE userId = ?
     LIMIT 1`
  ).get(normalizedUserId) || null;
}

function getEmployeeHipaaComplianceForm(userId, options = {}) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) return null;

  const includeMeta = Boolean(options.includeMeta);
  const columns = includeMeta
    ? `id, userId, acknowledged, legalName, signatureName, signedDate, policyVersion, ipAddress, userAgent, createdAt, updatedAt`
    : `id, userId, acknowledged, legalName, signatureName, signedDate, policyVersion, createdAt, updatedAt`;

  return db.prepare(
    `SELECT ${columns}
     FROM employee_hipaa_compliance_forms
     WHERE userId = ?
     LIMIT 1`
  ).get(normalizedUserId) || null;
}

function getEmployeeHandbookForm(userId, options = {}) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) return null;

  const includeMeta = Boolean(options.includeMeta);
  const columns = includeMeta
    ? `id, userId, acknowledged, legalName, signatureName, signedDate, handbookVersion, ipAddress, userAgent, createdAt, updatedAt`
    : `id, userId, acknowledged, legalName, signatureName, signedDate, handbookVersion, createdAt, updatedAt`;

  return db.prepare(
    `SELECT ${columns}
     FROM employee_handbook_forms
     WHERE userId = ?
     LIMIT 1`
  ).get(normalizedUserId) || null;
}

function getEmployeeCompensationAgreementForm(userId, options = {}) {
  const normalizedUserId = Number(userId);
  if (!Number.isInteger(normalizedUserId) || normalizedUserId < 1) return null;

  const includeMeta = Boolean(options.includeMeta);
  const columns = includeMeta
    ? `id, userId, acknowledged, legalName, signatureName, signedDate, agreementVersion, ipAddress, userAgent, createdAt, updatedAt`
    : `id, userId, acknowledged, legalName, signatureName, signedDate, agreementVersion, createdAt, updatedAt`;

  return db.prepare(
    `SELECT ${columns}
     FROM employee_compensation_agreement_forms
     WHERE userId = ?
     LIMIT 1`
  ).get(normalizedUserId) || null;
}

function getSignedOnboardingFormRecord(formType, userId, options = {}) {
  const normalizedType = String(formType || '').trim().toLowerCase();
  if (normalizedType === 'background-consent') {
    return getEmployeeBackgroundConsentForm(userId, options);
  }
  if (normalizedType === 'hipaa-compliance') {
    return getEmployeeHipaaComplianceForm(userId, options);
  }
  if (normalizedType === 'employee-handbook') {
    return getEmployeeHandbookForm(userId, options);
  }
  if (normalizedType === 'compensation-agreement') {
    return getEmployeeCompensationAgreementForm(userId, options);
  }
  return null;
}

function escapeHtmlDocument(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatFormTimestamp(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function renderSignedOnboardingFormHtml(formType, formRecord, renderOptions = {}) {
  const normalizedType = String(formType || '').trim().toLowerCase();
  const employeeName = escapeHtmlDocument(formRecord?.legalName || formRecord?.name || 'Employee');
  const signatureName = escapeHtmlDocument(formRecord?.signatureName || formRecord?.legalName || 'Employee');
  const signedDate = escapeHtmlDocument(formRecord?.signedDate || 'N/A');
  const updatedAt = escapeHtmlDocument(formatFormTimestamp(formRecord?.updatedAt || formRecord?.createdAt || null));
  const version = normalizedType === 'background-consent'
    ? escapeHtmlDocument(formRecord?.consentVersion || 'v1')
    : normalizedType === 'employee-handbook'
      ? escapeHtmlDocument(formRecord?.handbookVersion || 'v1')
      : normalizedType === 'compensation-agreement'
        ? escapeHtmlDocument(formRecord?.agreementVersion || 'v1')
        : escapeHtmlDocument(formRecord?.policyVersion || 'v1');
  const title = normalizedType === 'background-consent'
    ? 'Background Acknowledgment & Consent Record'
    : normalizedType === 'employee-handbook'
      ? 'Employee Handbook Acknowledgment Record'
      : normalizedType === 'compensation-agreement'
        ? 'Employee Compensation Agreement Record'
        : 'HIPAA Compliance & Confidentiality Record';
  const subtitle = normalizedType === 'background-consent'
    ? 'Signed employee background authorization copy'
    : normalizedType === 'employee-handbook'
      ? 'Signed employee handbook acknowledgment copy'
      : normalizedType === 'compensation-agreement'
        ? 'Signed employee compensation agreement copy'
        : 'Signed employee confidentiality acknowledgment copy';
  const statementHtml = normalizedType === 'background-consent'
    ? `
      <h2>Signed Authorization</h2>
      <p>
        I authorize Progress Staffing Agency, its clients, consumer reporting agencies, and representatives to obtain and review lawful background screening information for hiring, placement, reassignment, retention, and related employment purposes.
      </p>
      <h2>Screening Scope</h2>
      <ul>
        <li>Identity verification and Social Security trace information</li>
        <li>Criminal history information where legally permitted</li>
        <li>Employment, education, license, certification, and driving record verification when job-related</li>
        <li>Other screening records lawfully relevant to assignment eligibility</li>
      </ul>
      <h2>Disclosure Reference</h2>
      <p>
        This signed record corresponds to the disclosure presented in the employee portal and printable notice. The employee acknowledged that the typed name and checked acknowledgment constitute an electronic signature.
      </p>
    `
    : normalizedType === 'employee-handbook'
    ? `
      <h2>Welcome &amp; Purpose</h2>
      <p>This Employee Handbook outlines the policies, expectations, and guidelines that apply to every Progress Staffing Agency employee. These standards apply equally to warehouse, logistics, healthcare, and all other assignment tracks.</p>

      <h2>Employment Relationship</h2>
      <ul>
        <li>All employment with Progress Staffing Agency is at-will. Either the employee or the agency may end the employment relationship at any time, with or without cause or notice, to the extent permitted by law.</li>
        <li>Nothing in this handbook constitutes a contract of employment or guarantee of assignment duration.</li>
        <li>Progress Staffing Agency reserves the right to update, modify, or revoke any policy in this handbook at any time.</li>
      </ul>

      <h2>Equal Employment Opportunity</h2>
      <p>Progress Staffing Agency is an equal opportunity employer. We do not discriminate based on race, color, religion, sex, sexual orientation, gender identity, national origin, age, disability, veteran status, genetic information, or any other characteristic protected by applicable law.</p>

      <h2>Workplace Conduct &amp; Professionalism</h2>
      <ul>
        <li>Employees must report to assignments on time, dressed appropriately, and ready to work.</li>
        <li>Harassment, bullying, discrimination, threats, or violence of any kind will not be tolerated.</li>
        <li>Employees must follow all safety rules, client-site policies, and supervisor instructions.</li>
        <li>Use of alcohol, illegal drugs, or unauthorized substances during work hours or on client premises is strictly prohibited.</li>
        <li>Personal phone use during active work is prohibited unless explicitly authorized by the on-site supervisor.</li>
      </ul>

      <h2>Attendance &amp; Punctuality</h2>
      <ul>
        <li>You must arrive at your assigned location at or before the scheduled start time.</li>
        <li>If you cannot report to work, you must notify Progress Staffing Agency as far in advance as possible—no later than two hours before your scheduled shift.</li>
        <li>Repeated tardiness, unexcused absences, or no-call/no-show incidents may result in removal from assignment or termination.</li>
      </ul>

      <h2>Safety &amp; Injury Reporting</h2>
      <ul>
        <li>All employees must follow OSHA guidelines and any additional safety requirements at their assigned worksite.</li>
        <li>Report any unsafe condition, near-miss, or workplace injury immediately to your on-site supervisor and to Progress Staffing Agency.</li>
        <li>Personal protective equipment (PPE) must be worn as required by the assignment.</li>
      </ul>

      <h2>Confidentiality &amp; Data Protection</h2>
      <ul>
        <li>Employees must keep all client, patient, resident, and company information strictly confidential.</li>
        <li>Do not copy, photograph, share, or remove proprietary or sensitive data from any client site.</li>
        <li>Violations of confidentiality obligations may result in immediate termination and legal action.</li>
      </ul>

      <h2>Anti-Retaliation</h2>
      <p>Progress Staffing Agency prohibits retaliation against any employee who reports a workplace concern, files a complaint, participates in an investigation, or exercises rights under applicable law.</p>

      <h2>Separation &amp; Reassignment</h2>
      <ul>
        <li>When an assignment ends, contact Progress Staffing Agency immediately for reassignment opportunities.</li>
        <li>Return all client property, badges, keys, uniforms, and equipment before or on the last day of an assignment.</li>
        <li>Failure to return property may result in deductions to the extent permitted by law.</li>
      </ul>

      <h2>Electronic Signature</h2>
      <p>By signing electronically, I confirm that I have read this Employee Handbook in full, understand the policies and expectations described, and agree to follow them on every assignment.</p>
    `
    : normalizedType === 'compensation-agreement'
    ? (() => {
      const allRates = [
        { key: 'cna', label: 'CNA (Certified Nursing Assistant)', local: '$25.00 / hr', travel: '$30.00 / hr' },
        { key: 'cma', label: 'CMA (Certified Medication Aide)', local: '$25.00 / hr', travel: '$30.00 / hr' },
        { key: 'lpn', label: 'LPN (Licensed Practical Nurse)', local: '$40.00 / hr', travel: '$50.00 / hr' },
        { key: 'rn',  label: 'RN (Registered Nurse)',           local: '$50.00 / hr', travel: '$60.00 / hr' },
      ];
      const pos = String(renderOptions.employeePosition || '').trim().toLowerCase();
      const matched = allRates.filter(r => new RegExp(`\\b${r.key}\\b`).test(pos));
      const rates = matched.length ? matched : allRates;
      const rowStyle = (i) => i % 2 === 1 ? ' style="background:#f7fbf8"' : '';
      const rows = rates.map((r, i) =>
        `<tr${rowStyle(i)}><td style="padding:7px 10px;border:1px solid #c8d8cf">${r.label}</td><td style="padding:7px 10px;border:1px solid #c8d8cf">${r.local}</td><td style="padding:7px 10px;border:1px solid #c8d8cf">${r.travel}</td></tr>`
      ).join('\n          ');
      return `
      <h2>Pay Rate Schedule</h2>
      <p>I acknowledge and agree to the following hourly pay rates applicable to my licensed role:</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px;margin-bottom:1rem">
        <thead><tr style="background:#e4f1ea"><th style="text-align:left;padding:8px 10px;border:1px solid #c8d8cf">Role</th><th style="text-align:left;padding:8px 10px;border:1px solid #c8d8cf">Local Pay Rate</th><th style="text-align:left;padding:8px 10px;border:1px solid #c8d8cf">Travel Pay Rate</th></tr></thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <h2>Travel Pay Policy</h2>
      <p><strong>Travel pay applies to most facilities, but not all facilities.</strong> Travel pay is applicable when the drive time from the employee&rsquo;s home address to the assigned facility is one (1) hour or more. Facility eligibility for travel pay is determined by Progress Staffing Agency prior to each assignment.</p>
      <h2>General Terms</h2>
      <ul>
        <li>Overtime is paid at 1.5&times; the applicable hourly rate for all hours worked over 40 in a workweek as required by law.</li>
        <li>Pay rates are subject to periodic review and may be updated with written notice.</li>
        <li>This agreement does not guarantee any specific number of hours, shifts, or assignments.</li>
        <li>Changes in role must be confirmed in writing by Progress Staffing Agency before taking effect.</li>
      </ul>
      <h2>Electronic Signature</h2>
      <p>By signing electronically, I confirm that I have read this full Healthcare Compensation Agreement, understand my pay rates and the travel pay policy, and agree to the terms stated above.</p>`;
    })()
    : `
      <h2>Signed HIPAA Compliance Statement</h2>
      <p>
        I acknowledge that protected health information may only be accessed, used, discussed, stored, or disclosed for authorized work purposes and only to the minimum extent necessary.
      </p>
      <h2>Confidentiality Duties</h2>
      <ul>
        <li>I will not share patient or resident information with unauthorized persons.</li>
        <li>I will protect paper records, verbal conversations, screens, messages, and attachments containing protected health information.</li>
        <li>I will follow Progress Staffing Agency and client-site privacy, security, and incident reporting procedures.</li>
        <li>I understand that privacy violations may lead to removal from assignment, discipline, termination, or other action permitted by law.</li>
      </ul>
      <h2>Electronic Signature</h2>
      <p>
        This signed record confirms that the employee reviewed the full HIPAA compliance and confidentiality statement in the employee portal and agreed to follow it on every assignment.
      </p>
    `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | Progress Staffing Agency</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #173229;
      --muted: #51675d;
      --line: #c8d8cf;
      --paper: #f7fbf8;
      --panel: #ffffff;
      --accent: #2e6b52;
      --accent-soft: #e4f1ea;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, rgba(46, 107, 82, 0.12), transparent 28%),
        linear-gradient(180deg, #eef5f0 0%, var(--paper) 32%, #f9fcfa 100%);
      line-height: 1.58;
    }
    .shell { max-width: 920px; margin: 0 auto; padding: 32px 20px 56px; }
    .toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .button { appearance: none; border: 1px solid var(--accent); background: var(--accent); color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 999px; font: 600 14px/1.2 Arial, sans-serif; cursor: pointer; }
    .button--ghost { background: var(--panel); color: var(--accent); }
    .document { background: var(--panel); border: 1px solid var(--line); border-radius: 22px; padding: 36px 34px; box-shadow: 0 24px 80px rgba(24, 57, 43, 0.08); }
    .eyebrow { display: inline-block; padding: 6px 10px; border-radius: 999px; background: var(--accent-soft); color: var(--accent); font: 700 12px/1 Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 14px; }
    h1, h2 { margin: 0 0 14px; }
    h1 { font-size: clamp(30px, 5vw, 44px); line-height: 1.05; }
    h2 { font-size: 20px; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--line); }
    p, li { font-size: 16px; }
    .meta { color: var(--muted); font: 600 13px/1.4 Arial, sans-serif; margin-bottom: 24px; }
    .record-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin: 22px 0 8px; }
    .record-card { border: 1px solid var(--line); border-radius: 16px; padding: 14px 16px; background: #f7fbf8; }
    .record-label { display: block; font: 700 11px/1 Arial, sans-serif; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-bottom: 8px; }
    .record-value { font-size: 18px; font-weight: 700; word-break: break-word; }
    ul { margin: 12px 0 0 22px; padding: 0; }
    .footer-note { margin-top: 24px; color: var(--muted); font-size: 14px; }
    @media print {
      body { background: #fff; }
      .shell { max-width: none; padding: 0; }
      .toolbar { display: none; }
      .document { border: 0; border-radius: 0; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="shell">
    <div class="toolbar">
      <button class="button" type="button" onclick="window.print()">Print Form</button>
      <button class="button button--ghost" type="button" onclick="window.close()">Close</button>
    </div>
    <article class="document">
      <div class="eyebrow">Completed Employee Form</div>
      <h1>${title}</h1>
      <div class="meta">${subtitle} | Progress Staffing Agency | ${version}</div>
      <div class="record-grid">
        <div class="record-card"><span class="record-label">Employee Name</span><span class="record-value">${employeeName}</span></div>
        <div class="record-card"><span class="record-label">E-Signature</span><span class="record-value">${signatureName}</span></div>
        <div class="record-card"><span class="record-label">Signed Date</span><span class="record-value">${signedDate}</span></div>
        <div class="record-card"><span class="record-label">Last Saved</span><span class="record-value">${updatedAt}</span></div>
      </div>
      ${statementHtml}
      <p class="footer-note">This record reflects the completed electronic form stored in the employee profile, including the typed legal name, electronic signature, and signed date.</p>
    </article>
  </div>
</body>
</html>`;
}

function serveSignedOnboardingForm(res, formType, formRecord, options = {}) {
  if (!formRecord || !formRecord.acknowledged) {
    return res.status(404).json({ error: 'Signed form not found.' });
  }

  const html = renderSignedOnboardingFormHtml(formType, formRecord, { employeePosition: options.employeePosition });
  const normalizedType = String(formType || '').trim().toLowerCase();
  const safeName = String((formRecord.legalName || 'employee')).trim().replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'employee';
  const fileNameMap = {
    'background-consent': `${safeName}-background-consent.html`,
    'employee-handbook': `${safeName}-employee-handbook.html`,
    'compensation-agreement': `${safeName}-compensation-agreement.html`,
  };
  const fileName = fileNameMap[normalizedType] || `${safeName}-hipaa-compliance.html`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (options.download) {
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  }
  return res.send(html);
}

function canJobsiteAccessEmployeeForm(jobsiteUserId, employeeUserId) {
  const row = db.prepare(
    `SELECT 1
     FROM job_assignments ja
     JOIN jobs j ON j.id = ja.jobId
     WHERE j.jobsiteUserId = ? AND ja.employeeUserId = ?
     LIMIT 1`
  ).get(jobsiteUserId, employeeUserId);
  return Boolean(row) && getEmployeeOnboardingStatus(employeeUserId) === 'active';
}

function evaluateEmployeeDocumentCompliance(industry, documents = [], options = {}) {
  const checklist = profileForIndustry(industry);
  const docByType = new Map();
  const backgroundConsentComplete = Boolean(options.backgroundConsentComplete);
  const backgroundConsentSignedDate = options.backgroundConsentSignedDate || null;
  const backgroundConsentUpdatedAt = options.backgroundConsentUpdatedAt || null;
  const hipaaComplianceComplete = Boolean(options.hipaaComplianceComplete);
  const hipaaComplianceSignedDate = options.hipaaComplianceSignedDate || null;
  const hipaaComplianceUpdatedAt = options.hipaaComplianceUpdatedAt || null;
  const handbookComplete = Boolean(options.handbookComplete);
  const handbookSignedDate = options.handbookSignedDate || null;
  const handbookUpdatedAt = options.handbookUpdatedAt || null;
  const compensationAgreementComplete = Boolean(options.compensationAgreementComplete);
  const compensationAgreementSignedDate = options.compensationAgreementSignedDate || null;
  const compensationAgreementUpdatedAt = options.compensationAgreementUpdatedAt || null;
  const isHealthcareIndustry = HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase());

  documents.forEach((doc) => {
    const type = String(doc.documentType || '').toLowerCase();
    if (!docByType.has(type)) docByType.set(type, []);
    docByType.get(type).push(doc);
  });

  const covidCardUploaded = (docByType.get('covid19_vaccine_card') || []).length > 0;
  const covidExemptionUploaded = (docByType.get('covid19_religious_exemption_form') || []).length > 0;
  const covidUploadSatisfied = covidCardUploaded || covidExemptionUploaded;

  const covidCardApproved = (docByType.get('covid19_vaccine_card') || [])
    .some((doc) => String(doc.documentStatus || 'pending').toLowerCase() === 'approved');
  const covidExemptionApproved = (docByType.get('covid19_religious_exemption_form') || [])
    .some((doc) => String(doc.documentStatus || 'pending').toLowerCase() === 'approved');
  const covidRequirementSatisfied = covidCardApproved || covidExemptionApproved;

  const items = checklist.map((rule) => {
    const uploaded = docByType.get(rule.type) || [];
    const approved = uploaded.filter((doc) => String(doc.documentStatus || 'pending').toLowerCase() === 'approved');
    const hasApproved = approved.length > 0;
    const hasApprovedExpiration = approved.some((doc) => Boolean(doc.expirationDate));

    let missingRequired = rule.required && !hasApproved;
    if (rule.type === 'covid19_vaccine_card' || rule.type === 'covid19_religious_exemption_form') {
      missingRequired = rule.required && !covidRequirementSatisfied;
    }
    const missingExpiration = Boolean(rule.requiresExpiration) && hasApproved && !hasApprovedExpiration;
    const pendingApproval = rule.required && uploaded.length > 0 && !hasApproved;

    return {
      documentType: rule.type,
      kind: 'document',
      required: Boolean(rule.required),
      requiresExpiration: Boolean(rule.requiresExpiration),
      uploadedCount: uploaded.length,
      approvedCount: approved.length,
      missingRequired,
      missingExpiration,
      pendingApproval,
      complete: !missingRequired && !missingExpiration,
    };
  });

  items.push({
    documentType: 'background_acknowledgment_consent',
    kind: 'form',
    required: true,
    requiresExpiration: false,
    uploadedCount: backgroundConsentComplete ? 1 : 0,
    approvedCount: backgroundConsentComplete ? 1 : 0,
    missingRequired: !backgroundConsentComplete,
    missingExpiration: false,
    pendingApproval: false,
    complete: backgroundConsentComplete,
    signedDate: backgroundConsentSignedDate,
    updatedAt: backgroundConsentUpdatedAt,
  });

  items.push({
    documentType: 'hipaa_compliance_acknowledgment',
    kind: 'form',
    required: true,
    requiresExpiration: false,
    uploadedCount: hipaaComplianceComplete ? 1 : 0,
    approvedCount: hipaaComplianceComplete ? 1 : 0,
    missingRequired: !hipaaComplianceComplete,
    missingExpiration: false,
    pendingApproval: false,
    complete: hipaaComplianceComplete,
    signedDate: hipaaComplianceSignedDate,
    updatedAt: hipaaComplianceUpdatedAt,
  });

  items.push({
    documentType: 'employee_handbook_acknowledgment',
    kind: 'form',
    required: true,
    requiresExpiration: false,
    uploadedCount: handbookComplete ? 1 : 0,
    approvedCount: handbookComplete ? 1 : 0,
    missingRequired: !handbookComplete,
    missingExpiration: false,
    pendingApproval: false,
    complete: handbookComplete,
    signedDate: handbookSignedDate,
    updatedAt: handbookUpdatedAt,
  });

  if (isHealthcareIndustry) {
    items.push({
      documentType: 'employee_compensation_agreement',
      kind: 'form',
      required: true,
      requiresExpiration: false,
      uploadedCount: compensationAgreementComplete ? 1 : 0,
      approvedCount: compensationAgreementComplete ? 1 : 0,
      missingRequired: !compensationAgreementComplete,
      missingExpiration: false,
      pendingApproval: false,
      complete: compensationAgreementComplete,
      signedDate: compensationAgreementSignedDate,
      updatedAt: compensationAgreementUpdatedAt,
    });
  }

  const missingRequired = items.filter((item) => item.missingRequired).map((item) => item.documentType);
  const missingExpiration = items.filter((item) => item.missingExpiration).map((item) => item.documentType);

  const allUploaded = items
    .filter((item) => item.required)
    .every((item) => {
      if (item.kind === 'form') return item.complete;
      if (item.documentType === 'covid19_vaccine_card' || item.documentType === 'covid19_religious_exemption_form') {
        return covidUploadSatisfied;
      }
      return item.uploadedCount > 0;
    });

  return {
    industry,
    track: HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase()) ? 'healthcare' : 'warehouse',
    isComplete: missingRequired.length === 0 && missingExpiration.length === 0,
    allUploaded,
    missingRequired,
    missingExpiration,
    items,
  };
}

function evaluateEmployeeCompliance(userId, industry, documents = []) {
  const backgroundConsentForm = getEmployeeBackgroundConsentForm(userId);
  const hipaaComplianceForm = getEmployeeHipaaComplianceForm(userId);
  const handbookForm = getEmployeeHandbookForm(userId);
  const compensationAgreementForm = HEALTHCARE_INDUSTRIES.has(String(industry || '').toLowerCase())
    ? getEmployeeCompensationAgreementForm(userId)
    : null;
  const compliance = evaluateEmployeeDocumentCompliance(industry, documents, {
    backgroundConsentComplete: Boolean(backgroundConsentForm && backgroundConsentForm.acknowledged),
    backgroundConsentSignedDate: backgroundConsentForm ? backgroundConsentForm.signedDate : null,
    backgroundConsentUpdatedAt: backgroundConsentForm ? backgroundConsentForm.updatedAt : null,
    hipaaComplianceComplete: Boolean(hipaaComplianceForm && hipaaComplianceForm.acknowledged),
    hipaaComplianceSignedDate: hipaaComplianceForm ? hipaaComplianceForm.signedDate : null,
    hipaaComplianceUpdatedAt: hipaaComplianceForm ? hipaaComplianceForm.updatedAt : null,
    handbookComplete: Boolean(handbookForm && handbookForm.acknowledged),
    handbookSignedDate: handbookForm ? handbookForm.signedDate : null,
    handbookUpdatedAt: handbookForm ? handbookForm.updatedAt : null,
    compensationAgreementComplete: Boolean(compensationAgreementForm && compensationAgreementForm.acknowledged),
    compensationAgreementSignedDate: compensationAgreementForm ? compensationAgreementForm.signedDate : null,
    compensationAgreementUpdatedAt: compensationAgreementForm ? compensationAgreementForm.updatedAt : null,
  });
  return { compliance, backgroundConsentForm, hipaaComplianceForm, handbookForm, compensationAgreementForm };
}

function evaluateRequiredUploadedDocumentSet(industry, documents = []) {
  const requiredRules = profileForIndustry(industry).filter((rule) => Boolean(rule.required));
  const docsByType = new Map();

  documents.forEach((doc) => {
    const type = String(doc.documentType || '').trim().toLowerCase();
    if (!type) return;
    if (!docsByType.has(type)) docsByType.set(type, []);
    docsByType.get(type).push(doc);
  });

  const covidSatisfied = (docsByType.get('covid19_vaccine_card') || []).length > 0
    || (docsByType.get('covid19_religious_exemption_form') || []).length > 0;

  const missingTypes = requiredRules
    .filter((rule) => {
      if (rule.type === 'covid19_vaccine_card' || rule.type === 'covid19_religious_exemption_form') {
        return !covidSatisfied;
      }
      return (docsByType.get(rule.type) || []).length === 0;
    })
    .map((rule) => rule.type);

  return {
    complete: missingTypes.length === 0,
    requiredTypes: requiredRules.map((rule) => rule.type),
    missingTypes,
  };
}

function buildEmployeeDocumentBundleName(employee, prefix = 'employee-documents') {
  const safeName = String(employee && employee.name ? employee.name : 'employee')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'employee';
  return `${prefix}-${safeName}-${Number(employee && employee.id) || 'bundle'}.zip`;
}

function buildEmployeeDocumentArchiveEntries(documents = []) {
  const usedNames = new Set();
  return documents.map((doc, index) => {
    const rawName = String(doc.originalName || '').trim() || `${String(doc.documentType || 'document').trim() || 'document'}-${Number(doc.id) || index + 1}`;
    const ext = path.extname(rawName);
    const base = path.basename(rawName, ext).replace(/[\\/:*?"<>|]+/g, '-').trim() || `document-${Number(doc.id) || index + 1}`;
    const label = getDocumentTypeLabel(doc.documentType).replace(/[\\/:*?"<>|]+/g, '-').trim();
    let archiveName = `${label || 'Document'} - ${base}${ext}`;
    let counter = 2;
    while (usedNames.has(archiveName.toLowerCase())) {
      archiveName = `${label || 'Document'} - ${base} (${counter})${ext}`;
      counter += 1;
    }
    usedNames.add(archiveName.toLowerCase());
    return {
      ...doc,
      archiveName,
    };
  });
}

async function streamEmployeeDocumentArchive(res, options = {}) {
  const employee = options.employee || {};
  const documents = buildEmployeeDocumentArchiveEntries(Array.isArray(options.documents) ? options.documents : []);
  const archiveName = String(options.archiveName || buildEmployeeDocumentBundleName(employee)).trim() || 'employee-documents.zip';
  const zipFile = new yazl.ZipFile();
  const missingEntries = [];
  const addedEntries = [];

  for (const doc of documents) {
    try {
      const file = await createStoredFileReadStream(doc.storedName);
      zipFile.addReadStream(file.stream, doc.archiveName);
      addedEntries.push(doc.archiveName);
    } catch (error) {
      if (isStorageNotFoundError(error)) {
        missingEntries.push(`${doc.archiveName} (${doc.originalName || 'missing file'})`);
        continue;
      }
      throw error;
    }
  }

  if (missingEntries.length) {
    zipFile.addBuffer(
      Buffer.from(`The following files were unavailable when this bundle was created:\n\n${missingEntries.join('\n')}\n`, 'utf8'),
      'missing-files.txt'
    );
  }

  if (!addedEntries.length) {
    zipFile.end();
    return {
      streamed: false,
      missingEntries,
      addedEntries,
    };
  }

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${archiveName.replace(/[\r\n"]/g, '')}"`);
  res.setHeader('X-Archive-File-Count', String(addedEntries.length));
  if (missingEntries.length) {
    res.setHeader('X-Archive-Missing-Count', String(missingEntries.length));
    res.setHeader('X-Archive-Missing-Files', encodeURIComponent(JSON.stringify(missingEntries)));
  }

  const outputStream = zipFile.outputStream;
  await new Promise((resolve, reject) => {
    outputStream.on('error', reject);
    res.on('error', reject);
    res.on('finish', resolve);
    outputStream.pipe(res);
    zipFile.end();
  });

  return {
    streamed: true,
    missingEntries,
    addedEntries,
  };
}

function computeEmployeeOnboardingStatus(isActive, compliance, backgroundStatus) {
  if (!isActive) return 'inactive';
  const bgPassed = String(backgroundStatus || '').toLowerCase() === 'passed';
  if (compliance.isComplete && bgPassed) return 'active';
  if (compliance.allUploaded) return 'pending_approval';
  return 'registered';
}

function getEmployeeOnboardingStatus(employeeId) {
  const employee = db
    .prepare(
      `SELECT u.id, u.email, u.isActive, ep.backgroundStatus
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.id = ? AND u.role = 'employee'`
    )
    .get(employeeId);
  if (!employee) return 'inactive';

  const applications = db
    .prepare(
      `SELECT industry FROM applications WHERE userId = ? OR email = ? ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);

  const documents = db
    .prepare(
      `SELECT documentType, expirationDate, documentStatus FROM employee_documents WHERE userId = ?`
    )
    .all(employee.id);

  const industry = inferIndustryFromApplications(applications);
  const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
  const requiredUploadedDocumentSet = evaluateRequiredUploadedDocumentSet(industry, documents);
  return computeEmployeeOnboardingStatus(employee.isActive, compliance, employee.backgroundStatus);
}

function syncEmployeeActivationState(employeeId, adminUserId = null) {
  const employee = db
    .prepare(
      `SELECT u.id, u.email, u.isActive, ep.backgroundStatus
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.id = ? AND u.role = 'employee'`
    )
    .get(employeeId);
  if (!employee) return null;

  const status = getEmployeeOnboardingStatus(employeeId);

  if (status === 'active' && !employee.isActive) {
    db.prepare('UPDATE users SET isActive = 1 WHERE id = ?').run(employeeId);
    if (Number.isInteger(Number(adminUserId)) && Number(adminUserId) > 0) {
      logAdminAction(adminUserId, 'employee_auto_activated', JSON.stringify({ employeeId }));
    }
  }

  return status;
}

function checkAndAutoActivateEmployee(employeeId, adminUserId) {
  return syncEmployeeActivationState(employeeId, adminUserId);
}

function logAdminAction(adminUserId, action, details = null) {
  db.prepare('INSERT INTO admin_logs (adminUserId, action, details) VALUES (?, ?, ?)').run(
    adminUserId,
    action,
    details
  );
}

function seedAdminIfMissing() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) return;
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get();
  if (existingAdmin) return;

  const { salt, hash } = hashPassword(ADMIN_PASSWORD);
  const info = db
    .prepare(
      'INSERT INTO users (name, email, role, portalScope, passwordHash, passwordSalt) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run('Portal Admin', ADMIN_EMAIL.toLowerCase(), 'admin', 'full', hash, salt);

  console.log('Seeded default admin account.');
  console.log(`Admin email: ${ADMIN_EMAIL.toLowerCase()}`);
  console.log(`Admin password: ${ADMIN_PASSWORD}`);
  console.log(`Admin user id: ${info.lastInsertRowid}`);
}

function seedScopedPortalUserIfMissing(email, scope, name) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedScope = normalizeAdminScope(scope);
  if (!normalizedEmail || normalizedScope === 'full' || !SCOPED_PORTAL_PASSCODE) return;

  const defaultPasscode = SCOPED_PORTAL_PASSCODE;
  const defaultPasscodeRecord = hashPassword(defaultPasscode);

  const existing = db
    .prepare('SELECT id, passcodeHash, passcodeSalt FROM users WHERE email = ?')
    .get(normalizedEmail);
  if (existing) {
    db
      .prepare(
        `UPDATE users
         SET role = ?,
             portalScope = ?,
             passcodeHash = COALESCE(passcodeHash, ?),
             passcodeSalt = COALESCE(passcodeSalt, ?)
         WHERE id = ?`
      )
      .run('admin', normalizedScope, defaultPasscodeRecord.hash, defaultPasscodeRecord.salt, existing.id);
    return;
  }

  const { salt, hash } = hashPassword(ADMIN_PASSWORD);
      message: null,
  db
    .prepare(
      'INSERT INTO users (name, email, role, portalScope, passwordHash, passwordSalt, passcodeHash, passcodeSalt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .run(
      String(name || `${normalizedScope} portal`).trim(),
      normalizedEmail,
      'admin',
      normalizedScope,
      hash,
      salt,
      defaultPasscodeRecord.hash,
      defaultPasscodeRecord.salt
    );

  console.log(`Seeded default ${normalizedScope} portal account: ${normalizedEmail}`);
  console.log(`Default ${normalizedScope} portal passcode: ${defaultPasscode}`);
}

function seedScopedPortalUsersIfMissing() {
  seedScopedPortalUserIfMissing(ONBOARDING_PORTAL_EMAIL, 'onboarding', 'Onboarding Portal');
  seedScopedPortalUserIfMissing(CONTRACTS_PORTAL_EMAIL, 'contracts', 'Contracts Portal');
  seedScopedPortalUserIfMissing(SCHEDULING_PORTAL_EMAIL, 'scheduling', 'Scheduling Portal');
}

function initializeSqliteStartupState() {
  initDatabase();
  ensureJobAssignmentsExpandedStatusConstraint();
  ensureContractsExpandedStatusConstraint();
  ensureColumn('applications', 'userId', 'INTEGER');
  ensureColumn('applications', 'position', 'TEXT');
  ensureColumn('applications', 'certificationAccepted', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('applications', 'address', 'TEXT');
  ensureColumn('applications', 'city', 'TEXT');
  ensureColumn('applications', 'state', 'TEXT');
  ensureColumn('applications', 'zip', 'TEXT');
  ensureColumn('employee_documents', 'expirationDate', 'TEXT');
  ensureColumn('employee_documents', 'documentStatus', 'TEXT');
  ensureColumn('employee_documents', 'uploadedByUserId', 'INTEGER');
  ensureColumn('employee_documents', 'uploadedByRole', 'TEXT');
  ensureColumn('users', 'passcodeHash', 'TEXT');
  ensureColumn('users', 'passcodeSalt', 'TEXT');
  ensureColumn('users', 'notifyEmailEnabled', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('users', 'notifySmsEnabled', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('users', 'notifyPushEnabled', 'INTEGER NOT NULL DEFAULT 1');
  ensureColumn('users', 'isVerified', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'emailVerificationToken', 'TEXT');
  ensureColumn('users', 'emailVerificationExpiresAt', 'INTEGER');
  ensureColumn('users', 'pendingEmail', 'TEXT');
  ensureColumn('users', 'pendingEmailVerificationToken', 'TEXT');
  ensureColumn('users', 'pendingEmailVerificationExpiresAt', 'INTEGER');
  ensureColumn('users', 'portalScope', "TEXT NOT NULL DEFAULT 'full'");
  ensureColumn('users', 'requireBiometricSensitive', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('users', 'adminEmployeeIndustryTrack', 'TEXT DEFAULT NULL');
  ensureColumn('users', 'preferredLanguage', "TEXT NOT NULL DEFAULT 'en'");
  db.prepare("UPDATE users SET portalScope = 'full' WHERE portalScope IS NULL OR TRIM(portalScope) = ''").run();
  db.prepare("UPDATE users SET isVerified = 1 WHERE role = 'admin' AND (isVerified IS NULL OR isVerified = 0)").run();
  db.prepare("UPDATE users SET preferredLanguage = 'en' WHERE preferredLanguage IS NULL OR TRIM(preferredLanguage) = ''").run();
  ensureColumn('employee_profiles', 'address', 'TEXT');
  ensureColumn('employee_profiles', 'city', 'TEXT');
  ensureColumn('employee_profiles', 'state', 'TEXT');
  ensureColumn('employee_profiles', 'zip', 'TEXT');
  ensureColumn('employee_profiles', 'backgroundStatus', 'TEXT');
  ensureColumn('employee_profiles', 'ssnEncrypted', 'TEXT');
  ensureColumn('employee_profiles', 'industryType', 'TEXT');
  ensureColumn('employee_profiles', 'positionTitle', 'TEXT');
  ensureColumn('jobsite_profiles', 'industryTrack', 'TEXT');
  ensureColumn('jobsite_profiles', 'city', 'TEXT');
  ensureColumn('jobsite_profiles', 'state', 'TEXT');
  ensureColumn('jobsite_profiles', 'zip', 'TEXT');
  ensureColumn('jobsite_profiles', 'geofenceLatitude', 'REAL');
  ensureColumn('jobsite_profiles', 'geofenceLongitude', 'REAL');
  ensureColumn('jobs', 'statPayEnabled', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('jobs', 'statPaySignatureName', 'TEXT');
  ensureColumn('jobs', 'statPaySignedAt', 'DATETIME');
  ensureColumn('job_assignments', 'statusReason', 'TEXT');
  ensureColumn('job_assignments', 'cancellationType', 'TEXT');
  ensureColumn('job_assignments', 'statusUpdatedByUserId', 'INTEGER');
  ensureColumn('job_assignments', 'statusUpdatedAt', 'DATETIME');
  ensureColumn('job_assignments', 'excuseFormId', 'INTEGER');
  ensureColumn('employee_time_clock_entries', 'clockInLatitude', 'REAL');
  ensureColumn('employee_time_clock_entries', 'clockInLongitude', 'REAL');
  ensureColumn('employee_time_clock_entries', 'clockOutLatitude', 'REAL');
  ensureColumn('employee_time_clock_entries', 'clockOutLongitude', 'REAL');
  ensureColumn('employee_time_clock_entries', 'geofenceDistanceFeet', 'REAL');
  ensureColumn('employee_time_clock_entries', 'timesheetId', 'INTEGER');
  ensureColumn('timesheets', 'source', 'TEXT');
  ensureColumn('timesheets', 'paperOriginalName', 'TEXT');

  (function backfillEmployeeProfileHeaderFields() {
    const employees = db.prepare("SELECT id, email FROM users WHERE role = 'employee'").all();
    employees.forEach((employee) => {
      buildEmployeeProfileHeaderData(employee.id, employee.email);
    });
  })();

  db.exec(`
    CREATE TABLE IF NOT EXISTS employee_excuse_forms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employeeUserId INTEGER NOT NULL,
      assignmentId INTEGER NOT NULL,
      jobId INTEGER NOT NULL,
      cancellationType TEXT NOT NULL CHECK(cancellationType IN ('medical', 'non_medical')),
      reason TEXT NOT NULL,
      doctorNoteDocumentId INTEGER,
      shiftStartAt TEXT,
      cancelledAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
      adminSignature TEXT,
      reviewedByUserId INTEGER,
      reviewedAt TEXT,
      FOREIGN KEY (employeeUserId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (assignmentId) REFERENCES job_assignments(id) ON DELETE CASCADE,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (doctorNoteDocumentId) REFERENCES employee_documents(id) ON DELETE SET NULL,
      FOREIGN KEY (reviewedByUserId) REFERENCES users(id) ON DELETE SET NULL
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_passkeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      credentialId TEXT NOT NULL UNIQUE,
      publicKey TEXT NOT NULL,
      counter INTEGER NOT NULL DEFAULT 0,
      transports TEXT,
      deviceType TEXT,
      backedUp INTEGER NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      lastUsedAt DATETIME,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  ensureColumn('timesheets', 'paperStoredName', 'TEXT');
  ensureColumn('timesheets', 'paperMimeType', 'TEXT');
  ensureColumn('timesheets', 'paperFileSize', 'INTEGER');
  ensureColumn('contracts', 'clientOpenedAt', 'DATETIME');
  ensureColumn('contracts', 'clientSignedAt', 'DATETIME');
  ensureColumn('contracts', 'clientSignatureName', 'TEXT');
  ensureColumn('contracts', 'clientAuthorized', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('contracts', 'adminSignedAt', 'DATETIME');
  ensureColumn('contracts', 'adminSignatureName', 'TEXT');
  ensureColumn('contracts', 'adminAuthorized', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('contracts', 'declinedAt', 'DATETIME');
  ensureColumn('contracts', 'declinedReason', 'TEXT');
  ensureColumn('contracts', 'withdrawnAt', 'DATETIME');
  ensureColumn('contracts', 'withdrawnReason', 'TEXT');
  ensureColumn('contracts', 'withdrawnByUserId', 'INTEGER');
  ensureColumn('contracts', 'executedAt', 'DATETIME');
  ensureColumn('contracts', 'renewalDueAt', 'DATETIME');
  ensureColumn('contracts', 'renewalNotifiedAt', 'DATETIME');
  ensureColumn('contracts', 'renewalClientDecision', 'TEXT');
  ensureColumn('contracts', 'renewalAdminDecision', 'TEXT');
  ensureColumn('contracts', 'clientRenewalSignatureName', 'TEXT');
  ensureColumn('contracts', 'adminRenewalSignatureName', 'TEXT');
  ensureColumn('contracts', 'clientWithdrawalSignatureName', 'TEXT');
  ensureColumn('contracts', 'clientWithdrawalSignedAt', 'DATETIME');
  ensureColumn('contracts', 'adminWithdrawalSignatureName', 'TEXT');
  ensureColumn('contracts', 'adminWithdrawalSignedAt', 'DATETIME');
  ensureColumn('contracts', 'withdrawalInitiatedAt', 'DATETIME');
  ensureColumn('employee_excuse_forms', 'doctorNoteAcknowledged', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('employee_excuse_forms', 'shiftEndAt', 'TEXT');
  ensureColumn('employee_excuse_forms', 'submittedAsNcns', 'INTEGER NOT NULL DEFAULT 0');
  ensureColumn('direct_messages', 'senderDeletedAt', 'DATETIME');
  ensureColumn('direct_messages', 'recipientDeletedAt', 'DATETIME');
  seedAdminIfMissing();
  seedScopedPortalUsersIfMissing();

  (function migrateContractIndustryTracks() {
    const allContracts = db.prepare('SELECT id, jobsiteUserId, industryTrack FROM contracts').all();
    for (const contract of allContracts) {
      const correctTrack = getJobsiteIndustryTrack(contract.jobsiteUserId);
      if (correctTrack && correctTrack !== contract.industryTrack) {
        db.prepare('UPDATE contracts SET industryTrack = ? WHERE id = ?').run(correctTrack, contract.id);
      }
    }
  })();
}

function createLimiter(windowMs, max, message, options = {}) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    ...options,
    handler: (req, res) => {
      if (String(req.originalUrl || '').startsWith('/api/')) {
        return res.status(429).json({ error: message });
      }

      return res.status(429).send(message);
    },
  });
}

if (isUsingPostgres) {
  if (AUTO_DB_BOOTSTRAP) {
    bootstrapPostgresSchema(db);
  } else {
    console.log('[startup] PostgreSQL detected. Automatic schema bootstrap and startup data mutations are disabled.');
  }
} else {
  initializeSqliteStartupState();
}

const loginLimiter = createLimiter(15 * 60 * 1000, 60, 'Too many login attempts. Please try again later.', {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const normalizedEmail = String((req.body && req.body.email) || '').trim().toLowerCase();
    const ipKey = rateLimit.ipKeyGenerator(req.ip || '');
    return `login:${normalizedEmail || 'anonymous'}:${ipKey}`;
  },
});
const registerLimiter = createLimiter(15 * 60 * 1000, 30, 'Too many registration attempts. Please try again later.', {
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const normalizedEmail = String((req.body && req.body.email) || '').trim().toLowerCase();
    const ipKey = rateLimit.ipKeyGenerator(req.ip || '');
    return `register:${normalizedEmail || 'anonymous'}:${ipKey}`;
  },
});
const applyLimiter = createLimiter(60 * 60 * 1000, 20, 'Too many application submissions. Please try again later.');
const uploadLimiter = createLimiter(15 * 60 * 1000, 30, 'Too many upload attempts. Please try again later.');
const messageSendLimiter = createLimiter(5 * 60 * 1000, 200, 'Too many messages sent. Please slow down.', {
  keyGenerator: (req) => {
    if (req.auth && Number.isInteger(Number(req.auth.id))) {
      return `user:${Number(req.auth.id)}`;
    }
    return rateLimit.ipKeyGenerator(req.ip || '');
  },
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Passkey-Proof');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/passkey/login', loginLimiter);
app.use('/api/auth/passkey/action', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/register', registerLimiter);
app.use('/api/auth/forgot-password', createLimiter(15 * 60 * 1000, 5, 'Too many password reset requests. Please try again later.'));
app.use('/api/auth/reset-password', createLimiter(15 * 60 * 1000, 10, 'Too many password reset attempts. Please try again later.'));
app.use('/api/apply', applyLimiter);
app.use('/api/portal/employee/documents', uploadLimiter);
app.use(express.static(path.join(__dirname)));
app.use('/PSA FILES', express.static(path.join(__dirname, 'PSA FILES')));

app.get('/portal-login', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal-login.html'));
});

app.get('/portal-register', (req, res) => {
  if (req.query.role === 'employee') {
    const params = new URLSearchParams(req.query);
    params.delete('role');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    res.redirect(302, `/portal-register-employee${suffix}`);
    return;
  }

  if (req.query.role === 'jobsite') {
    const params = new URLSearchParams(req.query);
    params.delete('role');
    const suffix = params.toString() ? `?${params.toString()}` : '';
    res.redirect(302, `/portal-register-jobsite${suffix}`);
    return;
  }

  res.sendFile(path.join(__dirname, 'portal-register.html'));
});

app.get('/portal-register-employee', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal-register-employee.html'));
});

app.get('/portal-register-jobsite', (req, res) => {
  res.sendFile(path.join(__dirname, 'portal-register-jobsite.html'));
});

// Backward-compatible redirects for old nested portal routes.
app.get('/portal/login', (req, res) => {
  const suffix = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(302, `/portal-login${suffix}`);
});

app.get('/portal/register', (req, res) => {
  const suffix = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  res.redirect(302, `/portal-register${suffix}`);
});

app.get('/portal/employee', (req, res) => {
  res.redirect(302, '/portal-employee');
});

app.get('/portal/jobsite', (req, res) => {
  res.redirect(302, '/portal-jobsite');
});

app.get('/portal/admin', (req, res) => {
  res.redirect(302, '/portal-admin');
});

app.get('/portal-employee', authGuard(['employee']), (req, res) => {
  res.sendFile(path.join(__dirname, 'portal-employee.html'));
});

app.get('/portal-jobsite', authGuard(['jobsite']), (req, res) => {
  res.sendFile(path.join(__dirname, 'portal-jobsite.html'));
});

app.get('/portal-admin', authGuard(['admin']), (req, res) => {
  if (normalizeAdminScope(req.auth.portalScope) !== 'full') {
    return res.redirect(302, getPortalPathForUser(req.auth));
  }
  res.sendFile(path.join(__dirname, 'portal-admin.html'));
});

app.get('/portal-scheduling', authGuard(['admin']), (req, res) => {
  const scope = normalizeAdminScope(req.auth.portalScope);
  if (!['full', 'scheduling'].includes(scope)) {
    return res.redirect(302, getPortalPathForUser(req.auth));
  }
  res.sendFile(path.join(__dirname, 'portal-scheduling.html'));
});

app.get('/portal-onboarding', authGuard(['admin']), (req, res) => {
  const scope = normalizeAdminScope(req.auth.portalScope);
  if (!['full', 'onboarding'].includes(scope)) {
    return res.redirect(302, getPortalPathForUser(req.auth));
  }
  res.sendFile(path.join(__dirname, 'portal-onboarding.html'));
});

app.get('/portal-contracts', authGuard(['admin']), (req, res) => {
  const scope = normalizeAdminScope(req.auth.portalScope);
  if (!['full', 'contracts'].includes(scope)) {
    return res.redirect(302, getPortalPathForUser(req.auth));
  }
  res.sendFile(path.join(__dirname, 'portal-contracts.html'));
});

app.get('/api/portal/scheduling/dashboard', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['scheduling'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const clients = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         jp.companyName,
         jp.contactName,
         jp.address,
         jp.industryTrack
       FROM users u
       LEFT JOIN jobsite_profiles jp ON jp.userId = u.id
       WHERE u.role = 'jobsite' AND u.isActive = 1
       ORDER BY COALESCE(jp.companyName, u.name) ASC`
    )
    .all();

  const signedContracts = db
    .prepare(
      `SELECT
         c.id,
         c.industryTrack,
         c.jobsiteUserId,
         c.originalName,
         c.status,
         c.clientSignedAt,
         c.adminSignedAt,
         c.executedAt,
         c.createdAt,
         u.name AS clientUserName,
         jp.companyName AS clientCompanyName,
         jp.contactName AS clientContactName
       FROM contracts c
       JOIN users u ON u.id = c.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
       WHERE c.status = 'executed'
       ORDER BY c.executedAt DESC, c.createdAt DESC`
    )
    .all()
    .map((item) => ({
      ...item,
      fileUrl: `/api/contracts/${item.id}/file`,
    }));

  const jobs = db
    .prepare(
      `SELECT
         j.id,
         j.jobsiteUserId,
         j.title,
         j.industry,
         j.schedule,
         j.status,
         j.createdAt,
         u.name AS clientUserName,
         jp.companyName AS clientCompanyName
       FROM jobs j
       JOIN users u ON u.id = j.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       ORDER BY j.createdAt DESC
       LIMIT 200`
    )
    .all();

  const timesheets = db.prepare(
    `SELECT
       ts.id,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.paperOriginalName,
       ts.paperStoredName,
       ts.status,
       ts.submittedAt,
       ts.submittedBy,
       ts.approvedAt,
       ts.approvalSignature,
       ts.entriesJson,
       ts.notes,
       u.name AS employeeName,
       u.id AS employeeUserId,
       j.title AS jobTitle,
       COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
       j.statPaySignatureName,
       jp.companyName,
       jp.address AS facilityAddress
     FROM timesheets ts
     JOIN users u ON u.id = ts.employeeUserId
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     ORDER BY ts.createdAt DESC`
  ).all().map((ts) => ({
    ...ts,
    paperFileUrl: ts.paperStoredName ? `/api/portal/timesheets/${ts.id}/file` : null,
  }));

  return res.json({
    user: sanitizeUser(req.auth),
    clients,
    signedContracts,
    jobs,
    timesheets,
  });
});

app.post('/api/portal/scheduling/jobs', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['scheduling'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const jobsiteUserId = Number(req.body && req.body.jobsiteUserId);
  const title = String(req.body && req.body.title || '').trim();
  const industry = String(req.body && req.body.industry || '').trim();
  const schedule = String(req.body && req.body.schedule || '').trim();
  const payRate = String(req.body && req.body.payRate || '').trim();

  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) {
    return res.status(400).json({ error: 'Valid client is required.' });
  }
  if (!title || !industry || !schedule) {
    return res.status(400).json({ error: 'title, industry, and schedule are required.' });
  }

  const client = db.prepare("SELECT id, role, isActive FROM users WHERE id = ? AND role = 'jobsite'").get(jobsiteUserId);
  if (!client || Number(client.isActive) !== 1) {
    return res.status(404).json({ error: 'Client account not found.' });
  }

  const clientTrack = getJobsiteIndustryTrack(jobsiteUserId);
  if (!industryMatchesTrack(industry, clientTrack)) {
    return res.status(403).json({ error: `This client account is restricted to ${clientTrack} roles.` });
  }

  const info = db
    .prepare(
      `INSERT INTO jobs (
         jobsiteUserId,
         title,
         industry,
         payRate,
         schedule,
         status,
         statPayEnabled,
         statPaySignatureName,
         statPaySignedAt
       ) VALUES (?, ?, ?, ?, ?, 'open', 0, NULL, NULL)`
    )
    .run(jobsiteUserId, title, industry, payRate || null, schedule);

  const createdJobId = Number(info.lastInsertRowid);

  const shift = db
    .prepare(
      `SELECT
         j.id,
         j.title,
         j.industry,
         j.payRate,
         j.schedule,
         j.jobsiteUserId,
         u.name AS jobsiteName,
         jp.companyName,
         jp.address AS clientAddress
       FROM jobs j
       JOIN users u ON u.id = j.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE j.id = ?`
    )
    .get(createdJobId);

  if (shift) {
    runAsyncTask('notify_open_shift_from_scheduling', () => notifyMatchingEmployeesAboutOpenShift(shift));
  }

  getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
    if (Number(admin.id) === Number(req.auth.id)) return;
    createPortalNotification({
      userId: admin.id,
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Scheduling portal created shift',
      body: `Shift #${createdJobId} was created for client #${jobsiteUserId}.`,
      url: buildPortalPath(getPortalPathForUser(admin)),
      syncDomains: ['admin-dashboard'],
    });
  });

  emitDomainSyncToAdmins(['full'], ['admin-dashboard', 'timesheets']);

  return res.status(201).json({ id: createdJobId, created: true });
});

app.get('/api/portal/onboarding/employees', authGuard(['admin', 'onboarding']), (req, res) => {
  if (req.auth.role === 'admin' && !hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employees = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.isActive,
         ep.phone,
         ep.address,
         ep.city,
         ep.state,
         ep.zip,
         ep.backgroundStatus,
         ep.skills,
         ep.certifications
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.role = 'employee'
       ORDER BY u.createdAt DESC`
    )
    .all()
    .map((employee) => {
      const applications = db
        .prepare(
          `SELECT id, industry, position, createdAt
           FROM applications
           WHERE userId = ? OR email = ?
           ORDER BY createdAt DESC`
        )
        .all(employee.id, employee.email);

      const documents = db
        .prepare(
          `SELECT
             id,
             documentType,
             originalName,
             expirationDate,
             documentStatus,
             uploadedByRole,
             createdAt,
             storedName
           FROM employee_documents
           WHERE userId = ?
           ORDER BY createdAt DESC`
        )
        .all(employee.id)
        .map((doc) => ({
          ...doc,
          fileUrl: `/api/portal/documents/${doc.id}/file`,
        }));

      const industry = inferIndustryFromApplications(applications);
      const track = industryToTrack(industry);
      const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
      const onboardingStatus = computeEmployeeOnboardingStatus(employee.isActive, compliance, employee.backgroundStatus);
      const latestApp = applications[0] || {};
      const headerData = buildEmployeeProfileHeaderData(employee.id, employee.email, { applications, profile: employee });

      return {
        ...employee,
        industry: track,
        position: latestApp.position || null,
        industryType: headerData.industryType,
        positionTitle: headerData.positionTitle,
        industryTrack: headerData.industryTrack,
        onboardingStatus,
        complianceComplete: Boolean(compliance.isComplete),
      };
    })
    .filter((employee) => req.auth.role !== 'admin' || canAdminViewEmployee(req.auth, employee.id, employee.industry));

  return res.json({ data: employees, user: sanitizeUser(req.auth) });
});

app.get('/api/portal/onboarding/employees/:id/profile', authGuard(['admin', 'onboarding']), (req, res) => {
  if (req.auth.role === 'admin' && !hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.isActive,
         u.createdAt,
         ep.phone,
         ep.address,
         ep.city,
         ep.state,
         ep.zip,
         ep.backgroundStatus,
         ep.skills,
         ep.certifications
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.id = ? AND u.role = 'employee'
       LIMIT 1`
    )
    .get(employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const applications = db
    .prepare(
      `SELECT
         id,
         fullName,
         email,
         phone,
         industry,
         position,
         certificationAccepted,
         createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);

  const industry = inferIndustryFromApplications(applications);
  const track = industryToTrack(industry);
  const headerData = buildEmployeeProfileHeaderData(employee.id, employee.email, { applications, profile: employee });

  // Check if admin has permission to view this employee (for scoped admins)
  if (req.auth.role === 'admin' && !canAdminViewEmployee(req.auth, employeeId, track)) {
    return res.status(403).json({ error: 'Forbidden - employee is outside your assigned scope.' });
  }

  const documents = db
    .prepare(
      `SELECT
         id,
         documentType,
         originalName,
         mimeType,
         fileSize,
         expirationDate,
         documentStatus,
         uploadedByRole,
         createdAt,
         storedName
       FROM employee_documents
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id)
    .map((doc) => ({
      ...doc,
      fileUrl: `/api/portal/documents/${doc.id}/file`,
    }));

  const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
  const backgroundConsentForm = getEmployeeBackgroundConsentForm(employee.id, { includeMeta: true });
  const hipaaComplianceForm = getEmployeeHipaaComplianceForm(employee.id, { includeMeta: true });
  const handbookForm = getEmployeeHandbookForm(employee.id, { includeMeta: true });
  const compensationAgreementForm = getEmployeeCompensationAgreementForm(employee.id, { includeMeta: true });
  const onboardingStatus = computeEmployeeOnboardingStatus(employee.isActive, compliance, employee.backgroundStatus);

  const ssnRow = db.prepare('SELECT ssnEncrypted FROM employee_profiles WHERE userId = ?').get(employeeId);

  const w4Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           legalName,
           signedDate,
           updatedAt
         FROM employee_w4_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(employeeId) || null;

  const w9Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           name,
           tin,
           signedDate,
           updatedAt
         FROM employee_w9_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(employeeId) || null;

  return res.json({
    employee: {
      ...employee,
      industryType: headerData.industryType,
      positionTitle: headerData.positionTitle,
      industryTrack: headerData.industryTrack,
    },
    applications,
    documents,
    compliance,
    requiredUploadedDocumentSetComplete: requiredUploadedDocumentSet.complete,
    requiredUploadedDocumentSetMissing: requiredUploadedDocumentSet.missingTypes,
    industryType: headerData.industryType,
    positionTitle: headerData.positionTitle,
    industryTrack: headerData.industryTrack,
    onboardingStatus,
    ssnOnFile: Boolean(ssnRow && ssnRow.ssnEncrypted),
    w4Form,
    w9Form,
    backgroundConsentForm,
    hipaaComplianceForm,
    handbookForm,
    compensationAgreementForm,
  });
});

app.get('/api/portal/onboarding/employees/:id/ssn', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const row = db.prepare('SELECT ssnEncrypted FROM employee_profiles WHERE userId = ?').get(employeeId);
  if (!row || !row.ssnEncrypted) {
    return res.json({ ssn: null });
  }

  const ssn = decryptSSN(row.ssnEncrypted);
  logAdminAction(req.auth.id, 'employee_ssn_viewed', JSON.stringify({ employeeId, scope: 'onboarding' }));
  return res.json({ ssn });
});

app.post('/api/portal/onboarding/employees/:employeeId/document-reminders', authGuard(['admin', 'onboarding']), (req, res) => {
  if (req.auth.role === 'admin' && !hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.employeeId);
  const documentType = String(req.body && req.body.documentType ? req.body.documentType : '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  if (!documentType) {
    return res.status(400).json({ error: 'documentType is required.' });
  }

  const employee = db.prepare("SELECT id, email FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const applications = db
    .prepare(
      `SELECT industry
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const checklistTypes = new Set(
    profileForIndustry(industry)
      .filter((rule) => Boolean(rule.required))
      .map((rule) => String(rule.type || '').toLowerCase())
  );
  if (!checklistTypes.has(documentType)) {
    return res.status(400).json({ error: 'Document type is not applicable for this employee profile.' });
  }

  runAsyncTask('notify_employee_document_manual_reminder_onboarding', () =>
    sendEmployeeDocumentReminder({
      employeeUserId: employee.id,
      actorUserId: req.auth.id,
      documentType,
      reason: 'admin_manual',
      weekKey: null,
    })
  );

  logAdminAction(
    req.auth.id,
    'employee_document_reminder_sent',
    JSON.stringify({ employeeId: employee.id, documentType, scope: 'onboarding' })
  );

  emitDomainSyncToAdmins(['full'], ['admin-dashboard', 'documents']);

  return res.status(202).json({ queued: true, employeeId: employee.id, documentType });
});

app.put('/api/portal/onboarding/employees/:employeeId/documents/:docId/review', authGuard(['admin', 'onboarding']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.employeeId);
  const docId = Number(req.params.docId);
  const action = String(req.body && req.body.action || '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1 || !Number.isInteger(docId) || docId < 1) {
    return res.status(400).json({ error: 'Invalid employee or document id.' });
  }
  if (!['approved', 'denied'].includes(action)) {
    return res.status(400).json({ error: 'action must be approved or denied.' });
  }

  const doc = db
    .prepare('SELECT id, documentType, userId FROM employee_documents WHERE id = ? AND userId = ?')
    .get(docId, employeeId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found for this employee.' });
  }

  db.prepare('UPDATE employee_documents SET documentStatus = ? WHERE id = ?').run(action, docId);
  markNotificationsCompletedByTask('document_review', docId);

  runAsyncTask('notify_employee_doc_review_onboarding', () =>
    notifyEmployeeAboutDocumentReview(employeeId, docId, doc.documentType, action)
  );

  const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);

  getActiveAdminUsersForScopes(['onboarding']).forEach((admin) => {
    if (Number(admin.id) === Number(req.auth.id)) return;
    createPortalNotification({
      userId: admin.id,
      actorUserId: req.auth.id,
      category: 'document',
      title: 'Onboarding document reviewed',
      body: `Employee #${employeeId} document #${docId} marked ${action}.`,
      url: buildPortalPath(getPortalPathForUser(admin), { task: 'document-review', employeeId, docId }),
      syncDomains: ['admin-dashboard', 'documents'],
    });
  });

  emitDomainSyncToAdmins(['full'], ['admin-dashboard', 'documents']);

  return res.json({ id: docId, documentStatus: action, employeeOnboardingStatus: newStatus });
});

app.patch('/api/portal/onboarding/employees/:employeeId/background-status', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.employeeId);
  const status = String(req.body && req.body.status || '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }
  if (!['passed', 'needs_further_attention'].includes(status)) {
    return res.status(400).json({ error: 'status must be passed or needs_further_attention.' });
  }

  const employee = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  db.prepare('UPDATE employee_profiles SET backgroundStatus = ? WHERE userId = ?').run(status, employeeId);
  const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);

  emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);
  runAsyncTask('notify_employee_bg_status', () =>
    notifyEmployeeAboutBackgroundStatusChange(employeeId, status)
  );

  return res.json({ employeeId, status, employeeOnboardingStatus: newStatus });
});

app.post('/api/portal/onboarding/employees/:employeeId/background-document', authGuard(['admin', 'onboarding']), (req, res) => {
  if (req.auth.role === 'admin' && !hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const employeeId = Number(req.params.employeeId);
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db.prepare("SELECT id, email FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // Check if all required documents (except background check) are uploaded and approved
  const applications = db
    .prepare(`SELECT industry FROM applications WHERE userId = ? OR email = ? ORDER BY createdAt DESC`)
    .all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const documents = db
    .prepare(
      `SELECT documentType, documentStatus FROM employee_documents
       WHERE userId = ? AND documentType != 'background_check'
       ORDER BY createdAt DESC`
    )
    .all(employeeId);

  const { compliance } = evaluateEmployeeCompliance(employeeId, industry, documents);
  
  // Block background document upload until all other required documents are approved
  if (!compliance.isComplete) {
    const missing = compliance.missingRequired.length > 0 
      ? ` Missing: ${compliance.missingRequired.join(', ')}.`
      : (compliance.missingExpiration.length > 0 
        ? ` Missing expiration dates: ${compliance.missingExpiration.join(', ')}.`
        : '');
    return res.status(400).json({ 
      error: `Cannot upload background document until all required employee documents are approved and complete.${missing}`,
      missingRequired: compliance.missingRequired,
      missingExpiration: compliance.missingExpiration,
    });
  }

  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload background document.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No background file uploaded.' });
    }

    try {
      await persistUploadedFile(req.file, 'employee-documents');
      const info = db
        .prepare(
          `INSERT INTO employee_documents
            (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
           VALUES (?, NULL, 'background_check', ?, ?, ?, ?, NULL, 'approved', ?, 'admin')`
        )
        .run(employeeId, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.auth.id);

      const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);

      runAsyncTask('notify_employee_background_document_onboarding', () =>
        Promise.allSettled([
          Promise.resolve(createPortalNotification({
            userId: employeeId,
            actorUserId: req.auth.id,
            category: 'document',
            title: 'Background Document Uploaded',
            body: req.auth.role === 'admin' 
              ? 'An administrator uploaded your background check document.'
              : 'An onboarding staff member uploaded your background check document.',
            url: buildPortalPath('/portal-employee', { task: 'employee-documents' }),
            metadata: { documentId: Number(info.lastInsertRowid), documentType: 'background_check' },
            syncDomains: ['employee-dashboard', 'documents'],
          })),
        ])
      );

      emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);

      return res.status(201).json({
        id: info.lastInsertRowid,
        fileUrl: `/api/portal/documents/${info.lastInsertRowid}/file`,
        employeeOnboardingStatus: newStatus,
      });
    } catch (error) {
      discardUploadedFile(req.file);
      logCaughtException('onboarding background document upload', error, { employeeId, actorUserId: req.auth.id });
      return res.status(500).json({ error: 'Failed to store background document.' });
    }
  });
});

app.get('/api/portal/contracts/dashboard', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['contracts'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const clients = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.isActive,
         u.createdAt,
         u.lastLoginAt,
         jp.companyName,
         jp.contactName,
         jp.industryTrack,
         jp.phone,
         jp.address
       FROM users u
       LEFT JOIN jobsite_profiles jp ON jp.userId = u.id
       WHERE u.role = 'jobsite'
       ORDER BY COALESCE(jp.companyName, u.name) ASC`
    )
    .all();

  const contracts = db
    .prepare(
      `SELECT
         c.id,
         c.industryTrack,
         c.jobsiteUserId,
         c.originalName,
         c.status,
         c.clientOpenedAt,
         c.clientSignedAt,
         c.clientSignatureName,
         c.adminSignedAt,
         c.adminSignatureName,
         c.executedAt,
         c.createdAt,
         u.name AS clientUserName,
         jp.companyName AS clientCompanyName,
         jp.contactName AS clientContactName
       FROM contracts c
       JOIN users u ON u.id = c.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
       ORDER BY c.createdAt DESC`
    )
    .all()
    .map((item) => ({
      ...item,
      fileUrl: `/api/contracts/${item.id}/file`,
    }));

  const bank = db
    .prepare('SELECT id, industryTrack, originalName, createdAt FROM contract_bank ORDER BY createdAt DESC')
    .all()
    .map((item) => ({
      ...item,
      fileUrl: `/api/portal/contracts/bank/${item.id}/file`,
    }));

  return res.json({ user: sanitizeUser(req.auth), clients, contracts, bank });
});

app.get('/api/portal/contracts/bank/:id/file', authGuard(['admin']), async (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['contracts'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const bankId = Number(req.params.id);
  if (!Number.isInteger(bankId) || bankId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM contract_bank WHERE id = ?').get(bankId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  return sendStoredAsset(res, entry.storedName, {
    contentType: entry.mimeType,
    disposition: 'attachment',
    downloadName: entry.originalName || 'Contract.pdf',
    missingMessage: 'File missing from storage.',
  });
});

app.post('/api/portal/contracts/send', authGuard(['admin']), upload.array('contract', 20), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['contracts'])) {
    const files = Array.isArray(req.files) ? req.files : [];
    discardUploadedFiles(files);
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const industryTrack = String(req.body && req.body.industryTrack || '').trim().toLowerCase();
  const jobsiteUserId = Number(req.body && req.body.jobsiteUserId);
  const files = Array.isArray(req.files) ? req.files : [];
  const removeUploadedFiles = () => discardUploadedFiles(files);

  if (!files.length) {
    return res.status(400).json({ error: 'Contract PDF is required.' });
  }
  if (!['warehouse', 'healthcare'].includes(industryTrack)) {
    removeUploadedFiles();
    return res.status(400).json({ error: 'Valid contract industry is required.' });
  }
  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) {
    removeUploadedFiles();
    return res.status(400).json({ error: 'Valid client is required.' });
  }

  const client = db.prepare('SELECT id, role FROM users WHERE id = ?').get(jobsiteUserId);
  if (!client || client.role !== 'jobsite') {
    removeUploadedFiles();
    return res.status(404).json({ error: 'Client account not found.' });
  }

  const nowIso = new Date().toISOString();
  const insertContract = db.prepare(
    `INSERT INTO contracts (
       industryTrack,
       jobsiteUserId,
       uploadedByAdminUserId,
       originalName,
       storedName,
       mimeType,
       fileSize,
       status,
       createdAt,
       updatedAt
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  );
  const findBankByStoredName = db.prepare('SELECT id FROM contract_bank WHERE storedName = ? LIMIT 1');
  const insertBank = db.prepare(
    `INSERT INTO contract_bank (industryTrack, uploadedByAdminUserId, originalName, storedName, mimeType, fileSize)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const createdIds = [];
  const insertMany = db.transaction((uploadedFiles) => {
    uploadedFiles.forEach((file) => {
      const result = insertContract.run(
        industryTrack,
        jobsiteUserId,
        req.auth.id,
        file.originalname,
        file.filename,
        file.mimetype,
        file.size,
        nowIso,
        nowIso
      );
      createdIds.push(Number(result.lastInsertRowid));

      const existingBank = findBankByStoredName.get(file.filename);
      if (!existingBank) {
        insertBank.run(
          industryTrack,
          req.auth.id,
          file.originalname,
          file.filename,
          file.mimetype,
          file.size
        );
      }
    });
  });

  persistUploadedFiles(files, 'contracts').then(() => {
    try {
      insertMany(files);
    } catch (_error) {
      removeUploadedFiles();
      throw _error;
    }

    createdIds.forEach((contractId, index) => {
      const file = files[index];
      runAsyncTask('notify_jobsite_contract_available_from_contracts_portal', () =>
        notifyJobsiteAboutContractAvailable(jobsiteUserId, contractId, file ? file.originalname : 'Contract', industryTrack, req.auth.id)
      );
      notifyContractsPortalActivityToAdmins(
        req.auth.id,
        'Contract sent to client',
        `${file ? file.originalname : 'Contract'} was sent to client #${jobsiteUserId}.`,
        { contractId, jobsiteUserId, industryTrack, track: industryTrack }
      );
    });

    emitContractsDomainSyncToAdmins();

    return res.status(201).json({ id: createdIds[0] || null, ids: createdIds, created: true, count: createdIds.length });
  }).catch((error) => {
    removeUploadedFiles();
    logCaughtException('contracts portal upload', error, { actorUserId: req.auth.id, jobsiteUserId, industryTrack });
    return res.status(500).json({ error: 'Failed to store contract upload.' });
  });
});

app.post('/api/portal/contracts/send-bank/:id', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['contracts'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const bankId = Number(req.params.id);
  const jobsiteUserId = Number(req.body && req.body.jobsiteUserId);

  if (!Number.isInteger(bankId) || bankId < 1) return res.status(400).json({ error: 'Invalid bank contract id.' });
  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) return res.status(400).json({ error: 'Valid client is required.' });

  const entry = db.prepare('SELECT * FROM contract_bank WHERE id = ?').get(bankId);
  if (!entry) return res.status(404).json({ error: 'Bank contract not found.' });

  const client = db.prepare('SELECT id, role FROM users WHERE id = ?').get(jobsiteUserId);
  if (!client || client.role !== 'jobsite') return res.status(404).json({ error: 'Client account not found.' });

  const nowIso = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO contracts (industryTrack, jobsiteUserId, uploadedByAdminUserId, originalName, storedName, mimeType, fileSize, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(entry.industryTrack, jobsiteUserId, req.auth.id, entry.originalName, entry.storedName, entry.mimeType, entry.fileSize, nowIso, nowIso);

  runAsyncTask('notify_jobsite_contract_available_from_bank_contracts_portal', () =>
    notifyJobsiteAboutContractAvailable(jobsiteUserId, Number(result.lastInsertRowid), entry.originalName, entry.industryTrack, req.auth.id)
  );

  notifyContractsPortalActivityToAdmins(
    req.auth.id,
    'Bank contract sent to client',
    `${entry.originalName || `Bank contract #${bankId}`} was sent to client #${jobsiteUserId}.`,
    { bankId, jobsiteUserId, contractId: Number(result.lastInsertRowid), industryTrack: entry.industryTrack, track: entry.industryTrack }
  );

  emitContractsDomainSyncToAdmins();

  return res.status(201).json({ id: Number(result.lastInsertRowid), created: true });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, passcode, role, phone, companyName, contactName, address, city, state, zip, industry, position, certifyAgreement, industryTrack } = req.body;
  const normalizedName = String(name || '').trim();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || '').trim().toLowerCase();
  const normalizedPasscode = normalizePasscode(passcode);
  const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(0, 10);
  const normalizedState = String(state || '').trim().toUpperCase();
  const normalizedZip = String(zip || '').trim();
  const normalizedAddress = [address, city, normalizedState, normalizedZip]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(', ');

  logFlowEvent('registration request received', {
    email: normalizedEmail,
    role: normalizedRole,
    hasPhone: Boolean(normalizedPhone),
    hasCompanyName: Boolean(String(companyName || '').trim()),
  });

  if (!normalizedName || !normalizedEmail || !password || !normalizedRole) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!['employee', 'jobsite'].includes(normalizedRole)) {
    return res.status(400).json({ error: 'Invalid role for self-registration.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (String(passcode || '').trim() && !normalizedPasscode) {
    return res.status(400).json({ error: 'Passcode must be exactly 4 digits.' });
  }

  if (String(phone || '').trim() && normalizedPhone.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  if (normalizedRole === 'employee' && !isTruthy(certifyAgreement)) {
    return res.status(400).json({ error: 'You must certify the employment statement before creating an employee account.' });
  }

  const normalizedIndustryTrack = normalizeIndustryTrack(industryTrack);
  if (normalizedRole === 'jobsite' && !normalizedIndustryTrack) {
    return res.status(400).json({ error: 'Client industry track is required.' });
  }

  if (normalizedRole === 'jobsite' && !String(companyName || '').trim()) {
    return res.status(400).json({ error: 'Company name is required for client accounts.' });
  }

  if (normalizedRole === 'jobsite' && !String(contactName || '').trim()) {
    return res.status(400).json({ error: 'Primary contact name is required for client accounts.' });
  }

  const existingUser = db
    .prepare('SELECT id, name, email, role, isVerified, isActive FROM users WHERE email = ? LIMIT 1')
    .get(normalizedEmail);

  if (existingUser) {
    if (String(existingUser.role || '').trim().toLowerCase() !== normalizedRole || Number(existingUser.isVerified) === 1) {
      return res.status(409).json({ error: 'Account already exists for this email. Duplicate registration is not allowed unless the existing account is deleted.' });
    }

    try {
      const verificationResult = await sendAccountVerificationEmail(existingUser, 'registration_retry');
      return res.status(202).json({
        id: existingUser.id,
        role: normalizedRole,
        verificationRequired: true,
        verificationEmailSent: true,
        verificationEmailResent: true,
        verificationExpiresAt: verificationResult.expiresAt,
      });
    } catch (error) {
      logCaughtException('registration resend verification email', error, {
        userId: existingUser.id,
        email: normalizedEmail,
      });
      return res.status(502).json({ error: 'Your account exists but the verification email could not be sent right now. Please try again shortly.' });
    }
  }

  const geocodedJobsiteCoordinates = normalizedRole === 'jobsite' && normalizedAddress
    ? await geocodeAddressToCoordinates(normalizedAddress)
    : null;

  const { salt, hash } = hashPassword(password);
  const passcodeRecord = normalizedPasscode ? hashPassword(normalizedPasscode) : null;

  const tx = db.transaction(() => {
    const userInfo = db
      .prepare(
        'INSERT INTO users (name, email, role, passwordHash, passwordSalt, passcodeHash, passcodeSalt, isVerified, emailVerificationToken, emailVerificationExpiresAt) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, NULL)'
      )
      .run(
        normalizedName,
        normalizedEmail,
        normalizedRole,
        hash,
        salt,
        passcodeRecord ? passcodeRecord.hash : null,
        passcodeRecord ? passcodeRecord.salt : null
      );

    const userId = Number(userInfo.lastInsertRowid);

    if (normalizedRole === 'employee') {
      db.prepare('INSERT INTO employee_profiles (userId, phone, address, city, state, zip, skills, certifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        userId,
        normalizedPhone || null,
        address ? String(address).trim() : null,
        city ? String(city).trim() : null,
        normalizedState || null,
        normalizedZip || null,
        null,
        null
      );

      db.prepare('UPDATE applications SET userId = ? WHERE email = ? AND userId IS NULL').run(
        userId,
        normalizedEmail
      );

      const hasApplication = db
        .prepare('SELECT id FROM applications WHERE userId = ? OR email = ? LIMIT 1')
        .get(userId, normalizedEmail);

      if (!hasApplication && String(industry || '').trim() && String(position || '').trim()) {
        db.prepare(
          `INSERT INTO applications
            (userId, fullName, email, phone, address, city, state, zip, industry, position, certificationAccepted)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          userId,
          normalizedName,
          normalizedEmail,
          normalizedPhone || '',
          address ? String(address).trim() : '',
          city ? String(city).trim() : '',
          normalizedState || '',
          normalizedZip || '',
          String(industry).trim(),
          String(position).trim(),
          isTruthy(certifyAgreement) ? 1 : 0
        );
      }

      buildEmployeeProfileHeaderData(userId, normalizedEmail);
    }

    if (normalizedRole === 'jobsite') {
      db.prepare(
        `INSERT INTO jobsite_profiles (
           userId,
           companyName,
           contactName,
           phone,
           address,
           city,
           state,
           zip,
           industryTrack,
           geofenceLatitude,
           geofenceLongitude
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        userId,
        companyName || null,
        contactName || null,
        normalizedPhone || null,
        normalizedAddress || null,
        city ? String(city).trim() : null,
        normalizedState || null,
        normalizedZip || null,
        normalizedIndustryTrack,
        geocodedJobsiteCoordinates ? geocodedJobsiteCoordinates.latitude : null,
        geocodedJobsiteCoordinates ? geocodedJobsiteCoordinates.longitude : null
      );
    }

    return userId;
  });

  try {
    const userId = tx();
    logFlowEvent('user created', {
      userId,
      email: normalizedEmail,
      role: normalizedRole,
    });

    const verificationResult = await sendAccountVerificationEmail({
      id: userId,
      name: normalizedName,
      email: normalizedEmail,
    }, 'registration');

    emitSocketEventToAdmins('new-user-signup', { id: userId, email: normalizedEmail, name: normalizedName });
    runAsyncTask('notify_admins_new_registration', () =>
      notifyAdminsAboutNewRegistration(userId, normalizedName, normalizedRole, companyName)
    );
    return res.status(201).json({
      id: userId,
      role: normalizedRole,
      verificationRequired: true,
      verificationEmailSent: true,
      verificationExpiresAt: verificationResult.expiresAt,
    });
  } catch (error) {
    logCaughtException('registration flow', error, {
      email: normalizedEmail,
      role: normalizedRole,
    });
    if (error && String(error.code || '').includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({ error: 'Account already exists for this email. Duplicate registration is not allowed unless the existing account is deleted.' });
    }
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

app.post('/api/register', (req, res) => {
  res.redirect(307, '/api/auth/register');
});

app.post('/api/auth/resend-verification', async (req, res) => {
  const email = String(req.body && req.body.email || '').trim().toLowerCase();
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const user = db
    .prepare('SELECT id, name, email, role, isVerified, isActive FROM users WHERE email = ? LIMIT 1')
    .get(email);

  if (!user || !user.isActive) {
    return res.json({ sent: true, message: 'If an eligible account exists, a verification email has been sent.' });
  }

  if (!['employee', 'jobsite'].includes(String(user.role || '').trim().toLowerCase())) {
    return res.json({ sent: true, message: 'If an eligible account exists, a verification email has been sent.' });
  }

  if (Number(user.isVerified) === 1) {
    return res.status(400).json({ error: 'This account is already verified.' });
  }

  try {
    const verificationResult = await sendAccountVerificationEmail(user, 'manual_resend');
    return res.json({
      sent: true,
      verificationRequired: true,
      verificationExpiresAt: verificationResult.expiresAt,
      message: 'Verification email sent.',
    });
  } catch (error) {
    logCaughtException('resend verification email', error, { email });
    return res.status(502).json({ error: 'Verification email could not be sent right now. Please try again shortly.' });
  }
});

app.get('/api/verify-email', (req, res) => {
  const token = String(req.query.token || '').trim();
  if (!token) {
    return res.status(400).send('<h2>Verification link is missing.</h2><p>Please request a new verification email and try again.</p>');
  }

  try {
    const user = db
      .prepare(
        `SELECT
           id,
           email,
           pendingEmail,
           emailVerificationToken,
           emailVerificationExpiresAt,
           pendingEmailVerificationToken,
           pendingEmailVerificationExpiresAt
         FROM users
         WHERE emailVerificationToken = ? OR pendingEmailVerificationToken = ?
         LIMIT 1`
      )
      .get(token, token);

    if (!user) {
      return res.status(400).send('<h2>Verification link is invalid or expired.</h2><p>Please request a new verification email and try again.</p>');
    }

    const isPendingEmailVerification = String(user.pendingEmailVerificationToken || '') === token;
    const expiresAt = isPendingEmailVerification
      ? Number(user.pendingEmailVerificationExpiresAt || 0)
      : Number(user.emailVerificationExpiresAt || 0);

    if (expiresAt < Date.now()) {
      return res.status(400).send('<h2>Verification link is invalid or expired.</h2><p>Please request a new verification email and try again.</p>');
    }

    if (isPendingEmailVerification) {
      const nextEmail = String(user.pendingEmail || '').trim().toLowerCase();
      if (!nextEmail) {
        return res.status(400).send('<h2>Email change is no longer available.</h2><p>Please submit the email change request again from Account Settings.</p>');
      }

      const emailTaken = db
        .prepare('SELECT id FROM users WHERE id <> ? AND (email = ? OR pendingEmail = ?) LIMIT 1')
        .get(user.id, nextEmail, nextEmail);
      if (emailTaken) {
        return res.status(409).send('<h2>Email address unavailable.</h2><p>Please choose a different email address from Account Settings.</p>');
      }

      db.prepare(
        `UPDATE users
         SET email = ?,
             pendingEmail = NULL,
             pendingEmailVerificationToken = NULL,
             pendingEmailVerificationExpiresAt = NULL,
             isVerified = 1
         WHERE id = ?`
      ).run(nextEmail, user.id);
      logFlowEvent('pending email verified', { userId: user.id, previousEmail: user.email, nextEmail });
      return res.send('<h2>Email updated successfully.</h2><p>Your new email address is now active. You can keep using the portal normally.</p><p><a href="/portal-login">Go to portal login</a></p>');
    }

    db.prepare('UPDATE users SET isVerified = 1, emailVerificationToken = NULL, emailVerificationExpiresAt = NULL WHERE id = ?').run(user.id);
    logFlowEvent('email verified', { userId: user.id, email: user.email });
    return res.send('<h2>Email verified successfully.</h2><p>You can now log in to your portal.</p><p><a href="/portal-login">Go to portal login</a></p>');
  } catch (error) {
    logCaughtException('verify email route', error, { tokenPreview: `${token.slice(0, 8)}...` });
    return res.status(500).send('<h2>Verification failed.</h2><p>Please try again or request a new verification email.</p>');
  }
});

app.get('/api/account/passkeys', authGuard(), (req, res) => {
  const passkeys = getUserPasskeys(req.auth.id).map((item) => ({
    id: item.id,
    credentialId: item.credentialId,
    createdAt: item.createdAt,
    lastUsedAt: item.lastUsedAt,
    deviceType: item.deviceType || 'unknown',
    backedUp: Number(item.backedUp) === 1,
    transports: parseTransports(item.transports),
  }));

  return res.json({
    count: passkeys.length,
    passkeys,
  });
});

app.delete('/api/account/passkeys/:credentialId', authGuard(), (req, res) => {
  const credentialId = String(req.params.credentialId || '').trim();
  if (!credentialId) {
    return res.status(400).json({ error: 'Credential id is required.' });
  }

  const result = db
    .prepare('DELETE FROM user_passkeys WHERE userId = ? AND credentialId = ?')
    .run(req.auth.id, credentialId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Passkey not found.' });
  }

  return res.json({ deleted: true });
});

app.post('/api/auth/passkey/register/options', authGuard(), async (req, res) => {
  const user = db
    .prepare('SELECT id, name, email, isActive FROM users WHERE id = ?')
    .get(req.auth.id);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const existing = getUserPasskeys(user.id);
  const options = await generateRegistrationOptions({
    rpName: 'Progress Staffing Agency',
    rpID: PASSKEY_RP_ID,
    userID: Buffer.from(`psa-user-${user.id}`, 'utf8'),
    userName: String(user.email || '').trim().toLowerCase(),
    userDisplayName: String(user.name || user.email || `User ${user.id}`).trim(),
    timeout: 60000,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257],
    excludeCredentials: existing.map((item) => ({
      id: item.credentialId,
      type: 'public-key',
      transports: parseTransports(item.transports),
    })),
  });

  storePasskeyChallenge(`register:${user.id}`, {
    challenge: options.challenge,
    userId: user.id,
  });

  return res.json({ options });
});

app.post('/api/auth/passkey/register/verify', authGuard(), async (req, res) => {
  const response = req.body && req.body.response;
  if (!response || typeof response !== 'object') {
    return res.status(400).json({ error: 'Passkey response payload is required.' });
  }

  const challengeRecord = takePasskeyChallenge(`register:${req.auth.id}`);
  if (!challengeRecord) {
    return res.status(400).json({ error: 'Passkey registration challenge expired. Please try again.' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: Array.from(PASSKEY_ALLOWED_ORIGINS),
      expectedRPID: PASSKEY_RP_ID,
      requireUserVerification: true,
    });
  } catch (_error) {
    return res.status(400).json({ error: 'Unable to verify passkey registration response.' });
  }

  if (!verification || !verification.verified || !verification.registrationInfo) {
    return res.status(400).json({ error: 'Passkey registration verification failed.' });
  }

  const credentialInfo = verification.registrationInfo.credential || null;
  const credentialIdBuffer = credentialInfo && credentialInfo.id
    ? Buffer.from(credentialInfo.id)
    : verification.registrationInfo.credentialID
      ? Buffer.from(verification.registrationInfo.credentialID)
      : null;
  const publicKeyBuffer = credentialInfo && credentialInfo.publicKey
    ? Buffer.from(credentialInfo.publicKey)
    : verification.registrationInfo.credentialPublicKey
      ? Buffer.from(verification.registrationInfo.credentialPublicKey)
      : null;

  if (!credentialIdBuffer || !publicKeyBuffer) {
    return res.status(400).json({ error: 'Passkey registration is missing credential details.' });
  }

  const credentialId = toBase64Url(credentialIdBuffer);
  const publicKey = toBase64Url(publicKeyBuffer);
  const counter = Number.isInteger(Number(credentialInfo && credentialInfo.counter))
    ? Number(credentialInfo.counter)
    : Number.isInteger(Number(verification.registrationInfo.counter))
      ? Number(verification.registrationInfo.counter)
      : 0;
  const transports = parseTransports(
    (credentialInfo && credentialInfo.transports)
      || (response && response.response ? response.response.transports : [])
  );
  const deviceType = String(verification.registrationInfo.credentialDeviceType || 'unknown').trim();
  const backedUp = verification.registrationInfo.credentialBackedUp ? 1 : 0;

  const existing = db.prepare('SELECT userId FROM user_passkeys WHERE credentialId = ?').get(credentialId);
  if (existing && Number(existing.userId) !== Number(req.auth.id)) {
    return res.status(409).json({ error: 'This passkey is already assigned to another account.' });
  }

  db.prepare(
    `INSERT INTO user_passkeys (userId, credentialId, publicKey, counter, transports, deviceType, backedUp, lastUsedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(credentialId)
     DO UPDATE SET
       userId = excluded.userId,
       publicKey = excluded.publicKey,
       counter = excluded.counter,
       transports = excluded.transports,
       deviceType = excluded.deviceType,
       backedUp = excluded.backedUp,
       lastUsedAt = CURRENT_TIMESTAMP`
  ).run(
    req.auth.id,
    credentialId,
    publicKey,
    counter,
    JSON.stringify(transports),
    deviceType,
    backedUp
  );

  return res.json({ registered: true, credentialId });
});

app.post('/api/auth/passkey/login/options', async (req, res) => {
  const normalizedEmail = String(req.body && req.body.email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required for biometric sign in.' });
  }

  const user = db
    .prepare('SELECT id, email, isActive FROM users WHERE email = ?')
    .get(normalizedEmail);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'No active account found for this email.' });
  }

  const passkeys = getUserPasskeys(user.id);
  if (!passkeys.length) {
    return res.status(404).json({ error: 'No passkeys are registered for this account yet.' });
  }

  const options = await generateAuthenticationOptions({
    rpID: PASSKEY_RP_ID,
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: passkeys.map((item) => ({
      id: item.credentialId,
      type: 'public-key',
      transports: parseTransports(item.transports),
    })),
  });

  storePasskeyChallenge(`auth:${normalizedEmail}`, {
    challenge: options.challenge,
    userId: user.id,
  });

  return res.json({ options });
});

app.post('/api/auth/passkey/login/verify', async (req, res) => {
  const normalizedEmail = String(req.body && req.body.email || '').trim().toLowerCase();
  const response = req.body && req.body.response;

  if (!normalizedEmail || !response || typeof response !== 'object') {
    return res.status(400).json({ error: 'Email and passkey response are required.' });
  }

  const challengeRecord = takePasskeyChallenge(`auth:${normalizedEmail}`);
  if (!challengeRecord) {
    return res.status(400).json({ error: 'Biometric challenge expired. Please try again.' });
  }

  const user = db
    .prepare('SELECT id, name, email, role, portalScope, isActive FROM users WHERE id = ? AND email = ?')
    .get(challengeRecord.userId, normalizedEmail);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  const credentialId = String(response.id || '').trim();
  if (!credentialId) {
    return res.status(400).json({ error: 'Passkey credential id is missing.' });
  }

  const passkey = db
    .prepare(
      `SELECT
         id,
         userId,
         credentialId,
         publicKey,
         counter,
         transports
       FROM user_passkeys
       WHERE userId = ? AND credentialId = ?`
    )
    .get(user.id, credentialId);

  if (!passkey) {
    return res.status(401).json({ error: 'This passkey is not registered for the provided account.' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: Array.from(PASSKEY_ALLOWED_ORIGINS),
      expectedRPID: PASSKEY_RP_ID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: fromBase64Url(passkey.publicKey),
        counter: Number(passkey.counter || 0),
        transports: parseTransports(passkey.transports),
      },
    });
  } catch (_error) {
    return res.status(401).json({ error: 'Biometric sign in could not be verified.' });
  }

  if (!verification || !verification.verified) {
    return res.status(401).json({ error: 'Biometric sign in failed.' });
  }

  const nextCounter = Number(
    verification.authenticationInfo && Number.isInteger(Number(verification.authenticationInfo.newCounter))
      ? verification.authenticationInfo.newCounter
      : passkey.counter
  );

  db.prepare('UPDATE user_passkeys SET counter = ?, lastUsedAt = CURRENT_TIMESTAMP WHERE id = ?').run(nextCounter, passkey.id);
  db.prepare('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const session = createSession(user.id);
  setSessionCookie(res, session.token);

  return res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/passkey/action/options', authGuard(), async (req, res) => {
  const action = String(req.body && req.body.action || '').trim();
  if (!SENSITIVE_PASSKEY_ACTIONS.has(action)) {
    return res.status(400).json({ error: 'Invalid sensitive action.' });
  }

  const passkeys = getUserPasskeys(req.auth.id);
  if (!passkeys.length) {
    return res.status(404).json({ error: 'No passkeys are registered for this account yet.' });
  }

  const options = await generateAuthenticationOptions({
    rpID: PASSKEY_RP_ID,
    timeout: 60000,
    userVerification: 'preferred',
    allowCredentials: passkeys.map((item) => ({
      id: item.credentialId,
      type: 'public-key',
      transports: parseTransports(item.transports),
    })),
  });

  const challengeId = crypto.randomBytes(20).toString('hex');
  storePasskeyChallenge(`action:${challengeId}`, {
    challenge: options.challenge,
    userId: req.auth.id,
    action,
  });

  return res.json({ options, challengeId });
});

app.post('/api/auth/passkey/action/verify', authGuard(), async (req, res) => {
  const action = String(req.body && req.body.action || '').trim();
  const challengeId = String(req.body && req.body.challengeId || '').trim();
  const response = req.body && req.body.response;

  if (!SENSITIVE_PASSKEY_ACTIONS.has(action)) {
    return res.status(400).json({ error: 'Invalid sensitive action.' });
  }

  if (!challengeId || !response || typeof response !== 'object') {
    return res.status(400).json({ error: 'Action challenge response is required.' });
  }

  const challengeRecord = takePasskeyChallenge(`action:${challengeId}`);
  if (!challengeRecord) {
    return res.status(400).json({ error: 'Biometric challenge expired. Please try again.' });
  }

  if (Number(challengeRecord.userId) !== Number(req.auth.id) || String(challengeRecord.action || '') !== action) {
    return res.status(400).json({ error: 'Biometric challenge does not match this request.' });
  }

  const credentialId = String(response.id || '').trim();
  if (!credentialId) {
    return res.status(400).json({ error: 'Passkey credential id is missing.' });
  }

  const passkey = db
    .prepare(
      `SELECT
         id,
         userId,
         credentialId,
         publicKey,
         counter,
         transports
       FROM user_passkeys
       WHERE userId = ? AND credentialId = ?`
    )
    .get(req.auth.id, credentialId);

  if (!passkey) {
    return res.status(401).json({ error: 'This passkey is not registered for your account.' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: Array.from(PASSKEY_ALLOWED_ORIGINS),
      expectedRPID: PASSKEY_RP_ID,
      requireUserVerification: true,
      credential: {
        id: passkey.credentialId,
        publicKey: fromBase64Url(passkey.publicKey),
        counter: Number(passkey.counter || 0),
        transports: parseTransports(passkey.transports),
      },
    });
  } catch (_error) {
    return res.status(401).json({ error: 'Biometric confirmation failed.' });
  }

  if (!verification || !verification.verified) {
    return res.status(401).json({ error: 'Biometric confirmation failed.' });
  }

  const nextCounter = Number(
    verification.authenticationInfo && Number.isInteger(Number(verification.authenticationInfo.newCounter))
      ? verification.authenticationInfo.newCounter
      : passkey.counter
  );

  db.prepare('UPDATE user_passkeys SET counter = ?, lastUsedAt = CURRENT_TIMESTAMP WHERE id = ?').run(nextCounter, passkey.id);

  const proofToken = createPasskeyActionProof(req.auth.id, action);
  return res.json({
    verified: true,
    action,
    proofToken,
    expiresAt: Date.now() + PASSKEY_PROOF_TTL_MS,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, passcode } = req.body;
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedPasscode = normalizePasscode(passcode);

  if (!normalizedEmail || (!normalizedPassword && !normalizedPasscode)) {
    return res.status(400).json({ error: 'Email and password or 4-digit passcode are required.' });
  }

  const user = db
    .prepare('SELECT id, name, email, pendingEmail, role, portalScope, passwordHash, passwordSalt, passcodeHash, passcodeSalt, isActive, isVerified, notifyEmailEnabled, notifySmsEnabled, notifyPushEnabled, requireBiometricSensitive, preferredLanguage FROM users WHERE email = ?')
    .get(normalizedEmail);

  let isValid = false;
  if (user && user.isActive) {
    if (normalizedPassword) {
      // Password field authenticates only against password hash.
      isValid = verifyPassword(normalizedPassword, user.passwordSalt, user.passwordHash);
    } else if (normalizedPasscode && user.passcodeHash && user.passcodeSalt) {
      // Passcode field authenticates only against passcode hash.
      isValid = verifyPassword(normalizedPasscode, user.passcodeSalt, user.passcodeHash);
    }
  }

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  if ((user.role === 'employee' || user.role === 'jobsite') && Number(user.isVerified) !== 1) {
    return res.status(403).json({ error: 'Please verify your email before logging in.' });
  }

  db.prepare('UPDATE users SET lastLoginAt = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

  const session = createSession(user.id);
  setSessionCookie(res, session.token);

  return res.json({
    token: session.token,
    expiresAt: session.expiresAt,
    user: sanitizeUser(user),
  });
});

app.post('/api/auth/logout', authGuard(), (req, res) => {
  db.prepare('DELETE FROM sessions WHERE tokenHash = ?').run(req.auth.tokenHash);
  clearSessionCookie(res);
  res.status(204).send();
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const identifier = String(req.body && req.body.identifier || '').trim().toLowerCase();
  if (!identifier) {
    return res.status(400).json({ error: 'Email or phone number is required.' });
  }

  logFlowEvent('forgot password request received', { identifier });

  // Always return the same response to prevent user enumeration
  const genericOk = () => res.json({ sent: true, message: 'If an account was found, a reset link has been sent.' });

  let user = null;
  let deliveryMode = null;
  let deliveryTarget = null;

  // Try email match first
  const emailUser = db.prepare('SELECT id, name, email, role, isActive FROM users WHERE email = ?').get(identifier);
  if (emailUser && emailUser.isActive) {
    user = emailUser;
    deliveryMode = 'email';
    deliveryTarget = user.email;
  }

  // Try phone match if no email match
  if (!user) {
    const normalizedPhone = normalizePhoneNumber(identifier);
    if (normalizedPhone) {
      const epRow = db.prepare(
        `SELECT u.id, u.name, u.email, u.role, u.isActive, ep.phone
         FROM users u JOIN employee_profiles ep ON ep.userId = u.id
         WHERE ep.phone = ? AND u.isActive = 1 LIMIT 1`
      ).get(normalizedPhone);
      if (epRow) { user = epRow; deliveryMode = 'sms'; deliveryTarget = normalizedPhone; }

      if (!user) {
        const jpRow = db.prepare(
          `SELECT u.id, u.name, u.email, u.role, u.isActive, jp.phone
           FROM users u JOIN jobsite_profiles jp ON jp.userId = u.id
           WHERE jp.phone = ? AND u.isActive = 1 LIMIT 1`
        ).get(normalizedPhone);
        if (jpRow) { user = jpRow; deliveryMode = 'sms'; deliveryTarget = normalizedPhone; }
      }

      if (!user) {
        const adminRow = db.prepare(
          `SELECT id, name, email, role, isActive FROM users WHERE phone = ? AND isActive = 1 LIMIT 1`
        ).get(normalizedPhone);
        if (adminRow) { user = adminRow; deliveryMode = 'sms'; deliveryTarget = normalizedPhone; }
      }
    }
  }

  if (!user || !deliveryMode) return genericOk();

  try {
    if (deliveryMode === 'email') {
      await sendPasswordResetEmailForUser({
        id: user.id,
        name: user.name,
        email: deliveryTarget,
      }, 'forgot_password');
    } else if (deliveryMode === 'sms') {
      const resetRecord = createPasswordResetTokenRecord(user.id);
      const resetUrl = buildAppUrl('/portal-login', {
        resetToken: resetRecord.rawToken,
      }, 'password-reset-sms');
      logFlowEvent('password reset token created', {
        userId: user.id,
        deliveryMode,
        selectedBaseUrl: APP_BASE_URL,
        baseUrlSource: APP_URL_CONFIG.source,
        usedFallback: APP_URL_CONFIG.usedFallback,
        resetUrl,
        tokenHash: resetRecord.tokenHash,
        expiresAt: resetRecord.expiresAt,
      });
      const body = `Progress Staffing: Reset your password here (expires in 1 hour): ${resetUrl}`;
      await sendSmsNotification(deliveryTarget, body);
    }
  } catch (error) {
    logCaughtException('forgot password flow', error, {
      userId: user.id,
      deliveryMode,
      deliveryTarget,
    });
    // Don't expose delivery errors to prevent enumeration
  }

  return genericOk();
});

app.post('/api/auth/reset-password', (req, res) => {
  const rawToken = String(req.body && req.body.token || '').trim();
  const newPassword = String(req.body && req.body.newPassword || '');

  logFlowEvent('reset password submit received', {
    hasToken: Boolean(rawToken),
    tokenPreview: previewToken(rawToken),
    passwordLength: newPassword.length,
  });

  logFlowEvent('reset password token received', {
    tokenPreview: previewToken(rawToken),
  });

  if (!rawToken) {
    logFlowEvent('reset password response returned', {
      statusCode: 400,
      reason: 'missing-token',
    });
    return res.status(400).json({ error: 'Reset token is required.' });
  }

  const passwordValid = Boolean(newPassword) && newPassword.length >= 8;
  logFlowEvent('reset password validation result', {
    tokenPreview: previewToken(rawToken),
    passwordValid,
    passwordLength: newPassword.length,
  });

  if (!passwordValid) {
    logFlowEvent('reset password response returned', {
      statusCode: 400,
      reason: 'password-validation-failed',
      tokenPreview: previewToken(rawToken),
    });
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const tokenHash = hashToken(rawToken);
    const record = getPasswordResetTokenRecord(rawToken);

    logFlowEvent('reset password token lookup result', {
      tokenPreview: previewToken(rawToken),
      tokenHash,
      found: Boolean(record),
      tokenId: record ? record.id : null,
      userId: record ? record.userId : null,
      expiresAt: record ? record.expiresAt : null,
    });

    const now = Date.now();
    const isExpired = !record || Number(record.expiresAt || 0) < now;

    logFlowEvent('reset password token expiry check', {
      tokenPreview: previewToken(rawToken),
      found: Boolean(record),
      expiresAt: record ? record.expiresAt : null,
      checkedAt: now,
      expired: isExpired,
    });

    if (!record || isExpired) {
      const cleanupResult = invalidatePasswordResetTokenByHash(tokenHash);
      logFlowEvent('reset password token invalidation/cleanup', {
        tokenPreview: previewToken(rawToken),
        reason: record ? 'expired' : 'not-found',
        deletedCount: cleanupResult.changes,
      });
      logFlowEvent('reset password response returned', {
        statusCode: 400,
        reason: record ? 'expired-token' : 'invalid-token',
        tokenPreview: previewToken(rawToken),
      });
      return res.status(400).json({ error: 'This reset link has expired or is invalid. Please request a new one.' });
    }

    const user = db.prepare('SELECT id, email, isActive FROM users WHERE id = ?').get(record.userId);
    logFlowEvent('reset password user lookup result', {
      tokenPreview: previewToken(rawToken),
      userId: record.userId,
      found: Boolean(user),
      isActive: user ? Boolean(user.isActive) : false,
      email: user ? user.email : null,
    });

    if (!user || !user.isActive) {
      logFlowEvent('reset password response returned', {
        statusCode: 404,
        reason: 'user-not-found-or-inactive',
        tokenPreview: previewToken(rawToken),
        userId: record.userId,
      });
      return res.status(404).json({ error: 'Account not found.' });
    }

    logFlowEvent('reset password hashing started', {
      tokenPreview: previewToken(rawToken),
      userId: user.id,
    });
    const { salt, hash } = hashPassword(newPassword);
    logFlowEvent('reset password hashing completed', {
      tokenPreview: previewToken(rawToken),
      userId: user.id,
      saltLength: salt.length,
      hashLength: hash.length,
    });

    logFlowEvent('reset password database update attempted', {
      tokenPreview: previewToken(rawToken),
      userId: user.id,
    });

    const applyPasswordReset = db.transaction(() => {
      const updateResult = db.prepare('UPDATE users SET passwordHash = ?, passwordSalt = ? WHERE id = ?').run(hash, salt, user.id);
      if (updateResult.changes < 1) {
        throw new Error(`Password reset database update affected ${updateResult.changes} rows for user ${user.id}.`);
      }
      const sessionCleanupResult = db.prepare('DELETE FROM sessions WHERE userId = ?').run(user.id);
      const tokenCleanupResult = invalidatePasswordResetTokenById(record.id);
      return {
        updateResult,
        sessionCleanupResult,
        tokenCleanupResult,
      };
    });

    const resetResult = applyPasswordReset();

    logFlowEvent('reset password database update result', {
      tokenPreview: previewToken(rawToken),
      userId: user.id,
      updatedRows: resetResult.updateResult.changes,
      sessionRowsDeleted: resetResult.sessionCleanupResult.changes,
    });

    logFlowEvent('reset password token invalidation/cleanup', {
      tokenPreview: previewToken(rawToken),
      reason: 'reset-complete',
      deletedCount: resetResult.tokenCleanupResult.changes,
      tokenId: record.id,
    });

    logFlowEvent('password reset completed', { userId: user.id });
    logFlowEvent('reset password response returned', {
      statusCode: 200,
      reason: 'success',
      tokenPreview: previewToken(rawToken),
      userId: user.id,
    });
    return res.json({ reset: true, message: 'Password updated successfully. You can now sign in with your new password.' });
  } catch (error) {
    logCaughtException('reset password route', error, {
      tokenPreview: previewToken(rawToken),
      passwordLength: newPassword.length,
    });
    logFlowEvent('reset password response returned', {
      statusCode: 500,
      reason: 'exception',
      tokenPreview: previewToken(rawToken),
    });
    return res.status(500).json({ error: 'Unable to reset password right now. Please try again.' });
  }
});

app.get('/api/auth/me', authGuard(), (req, res) => {
  res.json({ user: sanitizeUser(req.auth), emailConfigured: isEmailServiceConfigured(), smtpConfigured: isEmailServiceConfigured() });
});

app.post('/api/admin/test-email', authGuard(['admin']), async (req, res) => {
  const to = String((req.body && req.body.to) || req.auth.email || '').trim().toLowerCase();
  const subject = String((req.body && req.body.subject) || 'Progress Staffing Postmark Test Email').trim();
  const text = String((req.body && req.body.text) || 'This is a test email sent via Postmark.').trim();
  const htmlInput = String((req.body && req.body.html) || '').trim();
  if (!to) return res.status(400).json({ error: 'Recipient email is required.' });
  if (!subject) return res.status(400).json({ error: 'Subject is required.' });

  const html = htmlInput || `<p>${escapeHtmlText(text)}</p>`;

  try {
    const result = await sendPostmarkTestEmail({ to, subject, text, html });
    return res.json({ sent: true, to, result });
  } catch (error) {
    logCaughtException('generic postmark test email', error, { to, subject });
    return res.status(500).json({ error: 'Failed to send Postmark test email.' });
  }
});

app.post('/api/admin/test-email/verification', authGuard(['admin']), async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Recipient email is required.' });

  const user = db
    .prepare('SELECT id, name, email, role, isActive FROM users WHERE email = ? LIMIT 1')
    .get(email);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'User not found.' });
  }

  try {
    const result = await sendAccountVerificationEmail(user, 'admin_test_route');
    return res.json({
      sent: true,
      email,
      verificationUrl: result.verificationUrl,
      verificationExpiresAt: result.expiresAt,
      providerResult: result.providerResult,
    });
  } catch (error) {
    logCaughtException('admin verification test email route', error, { email });
    return res.status(500).json({ error: 'Failed to send verification email.' });
  }
});

app.post('/api/admin/test-email/password-reset', authGuard(['admin']), async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Recipient email is required.' });

  const user = db
    .prepare('SELECT id, name, email, role, isActive FROM users WHERE email = ? LIMIT 1')
    .get(email);

  if (!user || !user.isActive) {
    return res.status(404).json({ error: 'User not found.' });
  }

  try {
    const result = await sendPasswordResetEmailForUser(user, 'admin_test_route');
    return res.json({
      sent: true,
      email,
      resetUrl: result.resetUrl,
      resetExpiresAt: result.expiresAt,
      providerResult: result.providerResult,
    });
  } catch (error) {
    logCaughtException('admin password reset test email route', error, { email });
    return res.status(500).json({ error: 'Failed to send password reset email.' });
  }
});

app.get('/api/users/:id', authGuard(['admin']), (req, res) => {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId) || userId < 1) return res.status(400).json({ error: 'Invalid user id.' });
  const user = db.prepare('SELECT id, name, email, role, isVerified, createdAt, lastLoginAt FROM users WHERE id = ? LIMIT 1').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'employee') {
    const profile = db.prepare('SELECT phone, address, city, state, zip, backgroundStatus FROM employee_profiles WHERE userId = ?').get(userId) || {};
    const appRow = db.prepare('SELECT industry, position FROM applications WHERE userId = ? OR email = ? ORDER BY createdAt DESC LIMIT 1').get(userId, user.email) || {};
    return res.json({ user: { ...user, profile: { ...profile, industry: appRow.industry || null, position: appRow.position || null } } });
  }
  const profile = db.prepare('SELECT companyName, contactName, phone, address, industryTrack FROM jobsite_profiles WHERE userId = ?').get(userId) || {};
  return res.json({ user: { ...user, profile } });
});

function listEmployeeDocumentsForBundle(userId) {
  return db
    .prepare(
      `SELECT
         id,
         userId,
         documentType,
         originalName,
         storedName,
         mimeType,
         fileSize,
         expirationDate,
         COALESCE(documentStatus, 'pending') AS documentStatus,
         uploadedByRole,
         createdAt
       FROM employee_documents
       WHERE userId = ?
       ORDER BY createdAt DESC, id DESC`
    )
    .all(userId);
}

function canEmployeeBundleDocument(doc, authUser) {
  if (!doc || !authUser) return false;
  if (Number(doc.userId) !== Number(authUser.id)) return false;
  if (String(doc.documentType || '').toLowerCase() === 'background_check' && String(doc.uploadedByRole || '').toLowerCase() !== 'admin') {
    return false;
  }
  return true;
}

async function handleEmployeeDocumentBundleDownloadRequest(req, res, targetEmployeeId, options = {}) {
  const employeeId = Number(targetEmployeeId);
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db.prepare("SELECT id, name, email, role FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (req.auth.role === 'employee' && Number(req.auth.id) !== employeeId) {
    return res.status(403).json({ error: 'Not authorized for this employee bundle.' });
  }

  const applications = db.prepare(
    `SELECT industry
     FROM applications
     WHERE userId = ? OR email = ?
     ORDER BY createdAt DESC`
  ).all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const track = industryToTrack(industry);

  if (req.auth.role === 'admin' && !canAdminViewEmployee(req.auth, employeeId, track)) {
    return res.status(403).json({ error: 'Forbidden - employee is outside your assigned scope.' });
  }

  const allDocuments = listEmployeeDocumentsForBundle(employeeId);
  const requiredUploadedDocumentSet = evaluateRequiredUploadedDocumentSet(industry, allDocuments);
  if (!requiredUploadedDocumentSet.complete) {
    return res.status(409).json({
      error: 'All required uploaded documents must be present before downloading the full document set.',
      missingDocuments: requiredUploadedDocumentSet.missingTypes,
    });
  }

  const accessibleDocuments = req.auth.role === 'employee'
    ? allDocuments.filter((doc) => canEmployeeBundleDocument(doc, req.auth))
    : allDocuments;

  if (!accessibleDocuments.length) {
    return res.status(404).json({ error: 'No uploaded documents are available for download.' });
  }

  console.info('[document-bundle] download requested', {
    actorUserId: req.auth.id,
    actorRole: req.auth.role,
    employeeId,
    documentCount: accessibleDocuments.length,
    scope: options.scope || 'employee-documents',
  });

  try {
    const archiveResult = await streamEmployeeDocumentArchive(res, {
      employee,
      documents: accessibleDocuments,
      archiveName: buildEmployeeDocumentBundleName(employee, options.archiveNamePrefix || 'employee-documents'),
    });

    if (!archiveResult.streamed) {
      return res.status(409).json({
        error: 'None of the employee documents were available to bundle.',
        missingFiles: archiveResult.missingEntries,
      });
    }

    console.info('[document-bundle] download completed', {
      actorUserId: req.auth.id,
      employeeId,
      addedCount: archiveResult.addedEntries.length,
      missingCount: archiveResult.missingEntries.length,
    });
    return null;
  } catch (error) {
    logCaughtException('employee document bundle download', error, {
      actorUserId: req.auth.id,
      employeeId,
      scope: options.scope || 'employee-documents',
    });
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to create document bundle.' });
    }
    return null;
  }
}

app.get('/api/admin/employees/:id/documents/download-all', authGuard(['admin']), (req, res) => {
  handleEmployeeDocumentBundleDownloadRequest(req, res, req.params.id, {
    scope: 'admin',
    archiveNamePrefix: 'employee-documents',
  });
});

app.get('/api/portal/onboarding/employees/:id/documents/download-all', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }
  handleEmployeeDocumentBundleDownloadRequest(req, res, req.params.id, {
    scope: 'onboarding',
    archiveNamePrefix: 'onboarding-files',
  });
});

app.get('/api/portal/employee/documents/download-all', authGuard(['employee']), (req, res) => {
  handleEmployeeDocumentBundleDownloadRequest(req, res, req.auth.id, {
    scope: 'employee',
    archiveNamePrefix: 'onboarding-files',
  });
});

app.get('/api/portal/documents/:id/file', authGuard(), async (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) {
    return res.status(400).json({ error: 'Invalid document id.' });
  }

  const doc = db
    .prepare(
      `SELECT
         d.id,
         d.userId,
         d.storedName,
         d.originalName,
         d.mimeType,
         d.documentType,
         d.uploadedByRole,
         COALESCE(d.documentStatus, 'pending') AS documentStatus,
         u.email AS employeeEmail
       FROM employee_documents d
       JOIN users u ON u.id = d.userId
       WHERE d.id = ?
       LIMIT 1`
    )
    .get(docId);

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // Admin can access all employee documents.
  if (req.auth.role === 'admin') {
    return sendStoredAsset(res, doc.storedName, {
      contentType: doc.mimeType,
      disposition: 'inline',
      downloadName: doc.originalName || 'document',
    });
  }

  // Employee can access only their own documents.
  if (req.auth.role === 'employee') {
    if (Number(doc.userId) !== Number(req.auth.id)) {
      return res.status(403).json({ error: 'Not authorized for this document.' });
    }
    if (String(doc.documentType || '').toLowerCase() === 'background_check' && String(doc.uploadedByRole || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Background document must be uploaded by admin.' });
    }
    return sendStoredAsset(res, doc.storedName, {
      contentType: doc.mimeType,
      disposition: 'inline',
      downloadName: doc.originalName || 'document',
    });
  }

  // Jobsite can access uploaded docs for assigned workers, excluding SSN/work authorization.
  if (req.auth.role === 'jobsite') {
    if (String(doc.documentType || '').toLowerCase() === 'social_security_or_work_authorization') {
      return res.status(403).json({ error: 'Document type is not available to clients.' });
    }

    const assignmentRows = db
      .prepare(
        `SELECT j.industry AS jobIndustry
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.jobId
         WHERE ja.employeeUserId = ?
           AND ja.status IN ('assigned', 'approved', 'completed', 'no_call_no_show')
           AND j.jobsiteUserId = ?`
      )
      .all(doc.userId, req.auth.id);

    if (!assignmentRows.length) {
      return res.status(403).json({ error: 'Not authorized for this document.' });
    }

    if (getEmployeeOnboardingStatus(doc.userId) !== 'active') {
      return res.status(403).json({ error: 'Employee is not active for client access.' });
    }

    const healthIndustries = new Set(['healthcare', 'cna', 'cma', 'rn', 'lpn', 'lvn', 'dietary']);
    const warehouseDocTypes = new Set(['resume', 'id_or_drivers_license', 'other']);
    const healthcareDocTypes = new Set([
      'resume',
      'id_or_drivers_license',
      'tuberculosis_screening_tb',
      'hepatitis_b',
      'mmr_varicella',
      'license_or_certification',
      'cpr_bls_certificate',
      'dependent_adult_abuse_training',
      'covid19_vaccine_card',
      'covid19_religious_exemption_form',
      'physical_form',
      'other',
    ]);

    const type = String(doc.documentType || '').toLowerCase();
    if (type === 'background_check' && String(doc.uploadedByRole || '').toLowerCase() !== 'admin') {
      return res.status(403).json({ error: 'Background document must be uploaded by admin.' });
    }
    const isAllowed = assignmentRows.some((row) => {
      const isHealthcareJob = healthIndustries.has(String(row.jobIndustry || '').toLowerCase());
      const allowedTypes = isHealthcareJob ? healthcareDocTypes : warehouseDocTypes;
      return allowedTypes.has(type);
    });

    if (!isAllowed) {
      return res.status(403).json({ error: 'Document type is not available for this client profile.' });
    }

    return sendStoredAsset(res, doc.storedName, {
      contentType: doc.mimeType,
      disposition: 'inline',
      downloadName: doc.originalName || 'document',
    });
  }

  // Onboarding can access employee documents, excluding SSN/work authorization.
  if (req.auth.role === 'onboarding') {
    if (String(doc.documentType || '').toLowerCase() === 'social_security_or_work_authorization') {
      return res.status(403).json({ error: 'Social Security documents are not available through this role.' });
    }

    return sendStoredAsset(res, doc.storedName, {
      contentType: doc.mimeType,
      disposition: 'inline',
      downloadName: doc.originalName || 'document',
    });
  }

  return res.status(403).json({ error: 'Not authorized for this document.' });
});

app.get('/api/portal/employee/dashboard', authGuard(['employee']), (req, res) => {
  const profile = db.prepare('SELECT * FROM employee_profiles WHERE userId = ?').get(req.auth.id) || {};

  const applications = db
    .prepare(
      `SELECT id, fullName, email, phone, industry, position, message, certificationAccepted, createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(req.auth.id, req.auth.email);

  const assignments = db
    .prepare(
      `SELECT
         ja.id,
         ja.status,
         ja.statusReason,
         ja.cancellationType,
         ja.createdAt,
         j.title,
         j.industry,
         j.statPayEnabled,
         j.statPaySignatureName,
         j.schedule,
         jp.companyName,
         jp.address AS clientAddress
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE ja.employeeUserId = ?
       ORDER BY ja.createdAt DESC`
    )
    .all(req.auth.id);

  const currentAssignments = assignments.filter((item) => ['assigned', 'approved'].includes(String(item.status || '').toLowerCase()));
  const pastAssignments = assignments.filter((item) => !['assigned', 'approved'].includes(String(item.status || '').toLowerCase()));

  const documents = db
    .prepare(
      `SELECT
         id,
         userId,
         applicationId,
         documentType,
         originalName,
         storedName,
         mimeType,
         fileSize,
         expirationDate,
         documentStatus,
         uploadedByRole,
         createdAt
       FROM employee_documents
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(req.auth.id)
    .map((doc) => ({
      ...doc,
      fileUrl: `/api/portal/documents/${doc.id}/file`,
    }));

  const industry = inferIndustryFromApplications(applications);
  const headerData = buildEmployeeProfileHeaderData(req.auth.id, req.auth.email, { applications, profile });
  const { compliance, backgroundConsentForm, hipaaComplianceForm, handbookForm, compensationAgreementForm } = evaluateEmployeeCompliance(req.auth.id, industry, documents);
  const requiredUploadedDocumentSet = evaluateRequiredUploadedDocumentSet(industry, documents);
  const onboardingStatus = computeEmployeeOnboardingStatus(req.auth.isActive, compliance, profile.backgroundStatus);

  const w4Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           legalName,
           addressLine,
           cityStateZip,
           filingStatus,
           multipleJobs,
           dependentsAmount,
           otherIncome,
           deductions,
           extraWithholding,
           signatureName,
           signedDate,
           createdAt,
           updatedAt
         FROM employee_w4_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(req.auth.id) || null;

  const w9Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           name,
           businessName,
           taxClassification,
           llcType,
           otherClassification,
           exemptPayeeCode,
           fatcaExemptionCode,
           addressLine,
           cityStateZip,
           tin,
           signatureName,
           signedDate,
           createdAt,
           updatedAt
         FROM employee_w9_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(req.auth.id) || null;

  const hasAdminBackgroundDocument = db
    .prepare(
      `SELECT 1
       FROM employee_documents
       WHERE userId = ?
         AND documentType = 'background_check'
         AND COALESCE(documentStatus, 'pending') = 'approved'
         AND uploadedByRole = 'admin'
       LIMIT 1`
    )
    .get(req.auth.id);

  res.json({
    user: sanitizeUser(req.auth),
    profile,
    applications,
    documents,
    compliance,
    requiredUploadedDocumentSetComplete: requiredUploadedDocumentSet.complete,
    requiredUploadedDocumentSetMissing: requiredUploadedDocumentSet.missingTypes,
    industryType: headerData.industryType,
    positionTitle: headerData.positionTitle,
    industryTrack: headerData.industryTrack,
    onboardingStatus,
    hasAdminBackgroundDocument: Boolean(hasAdminBackgroundDocument),
    ssnOnFile: Boolean(profile && profile.ssnEncrypted),
    w4Form,
    w9Form,
    backgroundConsentForm,
    hipaaComplianceForm,
    handbookForm,
    compensationAgreementForm,
    currentAssignments,
    pastAssignments,
    assignments,
  });
});

app.patch('/api/portal/employee/profile', authGuard(['employee']), (req, res) => {
  const { phone, address, city, state, zip, skills, certifications } = req.body || {};

  const phoneInput = String(phone || '').trim();
  const normalizedPhone = phoneInput ? normalizePhoneNumber(phoneInput) : '';
  const nextPhone = normalizedPhone || null;

  const nextAddressLine = String(address || '').trim();
  const nextCity = String(city || '').trim();
  const nextState = String(state || '').trim().toUpperCase();
  const nextZip = String(zip || '').trim();
  const nextSkills = String(skills || '').trim() || null;
  const nextCertifications = String(certifications || '').trim() || null;

  if (phoneInput && !normalizedPhone) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const hasAddressData = Boolean(nextAddressLine || nextCity || nextState || nextZip);
  if (hasAddressData && (!nextAddressLine || !nextCity || !nextState || !nextZip)) {
    return res.status(400).json({ error: 'Street address, city, state, and ZIP code are required when updating address.' });
  }

  if (nextState && !/^[A-Z]{2}$/.test(nextState)) {
    return res.status(400).json({ error: 'State must be a 2-letter code.' });
  }

  if (nextZip && !/^\d{5}(?:-\d{4})?$/.test(nextZip)) {
    return res.status(400).json({ error: 'ZIP code must be 5 digits or ZIP+4 format.' });
  }

  db.prepare(
    `INSERT INTO employee_profiles (userId, phone, address, city, state, zip, skills, certifications)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(userId) DO UPDATE SET
       phone = excluded.phone,
       address = excluded.address,
       city = excluded.city,
       state = excluded.state,
       zip = excluded.zip,
       skills = excluded.skills,
       certifications = excluded.certifications`
  ).run(
    req.auth.id,
    nextPhone,
    nextAddressLine || null,
    nextCity || null,
    nextState || null,
    nextZip || null,
    nextSkills,
    nextCertifications
  );

  return res.json({
    updated: true,
    profile: {
      phone: nextPhone,
      address: nextAddressLine || null,
      city: nextCity || null,
      state: nextState || null,
      zip: nextZip || null,
      skills: nextSkills,
      certifications: nextCertifications,
    },
  });
});

// ── SSN endpoints (employee: save + view; admin: view only) ─────────────────
app.post('/api/portal/employee/ssn', authGuard(['employee']), (req, res) => {
  const raw = String(req.body && req.body.ssn ? req.body.ssn : '').trim();
  const formatted = formatSSNForStorage(raw);
  if (!formatted) {
    return res.status(400).json({ error: 'SSN must be exactly 9 digits (e.g. 123-45-6789).' });
  }
  const encrypted = encryptSSN(formatted);
  db.prepare('UPDATE employee_profiles SET ssnEncrypted = ? WHERE userId = ?').run(encrypted, req.auth.id);
  runAsyncTask('notify_admins_ssn_submitted', () =>
    notifyAdminsAboutSsnSubmission(req.auth.id, req.auth.name)
  );
  return res.json({ success: true, last4: formatted.slice(-4) });
});

app.get('/api/portal/employee/ssn', authGuard(['employee']), (req, res) => {
  const row = db.prepare('SELECT ssnEncrypted FROM employee_profiles WHERE userId = ?').get(req.auth.id);
  if (!row || !row.ssnEncrypted) {
    return res.json({ ssn: null });
  }
  const ssn = decryptSSN(row.ssnEncrypted);
  return res.json({ ssn });
});

app.get('/api/admin/employees/:id/ssn', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }
  const employee = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }
  const row = db.prepare('SELECT ssnEncrypted FROM employee_profiles WHERE userId = ?').get(employeeId);
  if (!row || !row.ssnEncrypted) {
    return res.json({ ssn: null });
  }
  const ssn = decryptSSN(row.ssnEncrypted);
  logAdminAction(req.auth.id, 'employee_ssn_viewed', JSON.stringify({ employeeId }));
  return res.json({ ssn });
});

app.get('/api/portal/employee/timesheet', authGuard(['employee']), (_req, res) => {
  const timesheetPath = path.join(__dirname, 'progresstimesheet.pdf');
  if (!fs.existsSync(timesheetPath)) {
    return res.status(404).json({ error: 'Timesheet PDF not found.' });
  }

  return res.download(timesheetPath, 'Progress-Timesheet.pdf');
});

app.get('/api/portal/employee/timesheet/preview', authGuard(['employee']), (_req, res) => {
  const timesheetPath = path.join(__dirname, 'progresstimesheet.pdf');
  if (!fs.existsSync(timesheetPath)) {
    return res.status(404).json({ error: 'Timesheet PDF not found.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Progress-Timesheet.pdf"');
  return res.sendFile(timesheetPath);
});

app.get('/api/portal/employee/timeclock', authGuard(['employee']), (req, res) => {
  const assignments = db
    .prepare(
      `SELECT
         ja.id,
         j.id AS jobId,
         j.title,
         j.statPayEnabled,
         j.statPaySignatureName,
         j.schedule,
         jp.companyName,
         jp.address AS clientAddress
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE ja.employeeUserId = ?
         AND ja.status IN ('assigned', 'approved')
       ORDER BY ja.createdAt DESC`
    )
    .all(req.auth.id);

  const activeEntry = db
    .prepare(
      `SELECT
         t.id,
         t.assignmentId,
         t.clockInAt,
         j.title,
         jp.companyName
       FROM employee_time_clock_entries t
       JOIN jobs j ON j.id = t.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = t.jobsiteUserId
       WHERE t.employeeUserId = ?
         AND t.clockOutAt IS NULL
       ORDER BY t.clockInAt DESC
       LIMIT 1`
    )
    .get(req.auth.id) || null;

  const entries = db
    .prepare(
      `SELECT
         t.id,
         t.assignmentId,
         t.clockInAt,
         t.clockOutAt,
         j.title,
         jp.companyName
       FROM employee_time_clock_entries t
       JOIN jobs j ON j.id = t.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = t.jobsiteUserId
       WHERE t.employeeUserId = ?
       ORDER BY t.clockInAt DESC
       LIMIT 30`
    )
    .all(req.auth.id);

  res.json({ assignments, activeEntry, entries });
});

app.post('/api/portal/employee/timeclock/clock-in', authGuard(['employee']), async (req, res) => {
  const assignmentId = Number(req.body && req.body.assignmentId);
  const clientCoordinates = parseClientCoordinates(req.body || {});
  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    return res.status(400).json({ error: 'Valid assigned shift is required.' });
  }
  if (!clientCoordinates) {
    return res.status(400).json({ error: 'Location access is required to clock in at the jobsite.' });
  }

  const assignment = db
    .prepare(
      `SELECT
         ja.id,
         ja.employeeUserId,
         ja.status,
         j.id AS jobId,
         j.jobsiteUserId,
         jp.address AS jobsiteAddress
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE ja.id = ?
       LIMIT 1`
    )
    .get(assignmentId);

  if (!assignment || Number(assignment.employeeUserId) !== Number(req.auth.id) || !['assigned', 'approved'].includes(String(assignment.status || '').toLowerCase())) {
    return res.status(404).json({ error: 'Assigned shift not found.' });
  }

  const activeEntry = db
    .prepare(
      `SELECT id, assignmentId
       FROM employee_time_clock_entries
       WHERE employeeUserId = ?
         AND clockOutAt IS NULL
       ORDER BY clockInAt DESC
       LIMIT 1`
    )
    .get(req.auth.id);

  if (activeEntry) {
    if (Number(activeEntry.assignmentId) === assignmentId) {
      return res.status(409).json({ error: 'You are already clocked in for this shift.' });
    }
    return res.status(409).json({ error: 'Clock out from your current shift before clocking into another.' });
  }

  const geofenceCoordinates = await resolveJobsiteGeofenceCoordinates(assignment.jobsiteUserId);
  if (!geofenceCoordinates) {
    return res.status(400).json({ error: 'Assigned jobsite location is not configured for geofencing yet.' });
  }

  const distanceFeet = distanceFeetBetween(
    clientCoordinates.latitude,
    clientCoordinates.longitude,
    geofenceCoordinates.latitude,
    geofenceCoordinates.longitude
  );

  if (distanceFeet > CLOCK_GEOFENCE_FEET) {
    return res.status(403).json({ error: `You must be within ${CLOCK_GEOFENCE_FEET} ft of the assigned jobsite to clock in. Current distance: ${Math.round(distanceFeet)} ft.` });
  }

  const clockInAtIso = new Date().toISOString();

  db.prepare(
    `INSERT INTO employee_time_clock_entries (
       employeeUserId,
       assignmentId,
       jobId,
       jobsiteUserId,
       clockInLatitude,
       clockInLongitude,
       geofenceDistanceFeet,
       clockInAt,
       updatedAt
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.auth.id,
    assignmentId,
    assignment.jobId,
    assignment.jobsiteUserId || null,
    clientCoordinates.latitude,
    clientCoordinates.longitude,
    distanceFeet,
    clockInAtIso,
    clockInAtIso
  );

  return res.status(201).json({ clockedIn: true });
});

app.post('/api/portal/employee/timeclock/clock-out', authGuard(['employee']), async (req, res) => {
  const assignmentIdRaw = req.body && req.body.assignmentId;
  const clientCoordinates = parseClientCoordinates(req.body || {});
  const assignmentId = assignmentIdRaw === undefined || assignmentIdRaw === null || assignmentIdRaw === ''
    ? null
    : Number(assignmentIdRaw);

  if (assignmentIdRaw !== undefined && assignmentIdRaw !== null && assignmentIdRaw !== '' && (!Number.isInteger(assignmentId) || assignmentId < 1)) {
    return res.status(400).json({ error: 'Invalid assigned shift selected.' });
  }
  if (!clientCoordinates) {
    return res.status(400).json({ error: 'Location access is required to clock out at the jobsite.' });
  }

  const activeEntry = assignmentId === null
    ? db.prepare(
        `SELECT id, assignmentId, jobsiteUserId, clockInAt
         FROM employee_time_clock_entries
         WHERE employeeUserId = ?
           AND clockOutAt IS NULL
         ORDER BY clockInAt DESC
         LIMIT 1`
      ).get(req.auth.id)
    : db.prepare(
        `SELECT id, assignmentId, jobsiteUserId, clockInAt
         FROM employee_time_clock_entries
         WHERE employeeUserId = ?
           AND assignmentId = ?
           AND clockOutAt IS NULL
         ORDER BY clockInAt DESC
         LIMIT 1`
      ).get(req.auth.id, assignmentId);

  if (!activeEntry) {
    return res.status(404).json({ error: 'No active clock-in found to clock out.' });
  }

  const geofenceCoordinates = await resolveJobsiteGeofenceCoordinates(activeEntry.jobsiteUserId);
  if (!geofenceCoordinates) {
    return res.status(400).json({ error: 'Assigned jobsite location is not configured for geofencing yet.' });
  }

  const distanceFeet = distanceFeetBetween(
    clientCoordinates.latitude,
    clientCoordinates.longitude,
    geofenceCoordinates.latitude,
    geofenceCoordinates.longitude
  );

  if (distanceFeet > CLOCK_GEOFENCE_FEET) {
    return res.status(403).json({ error: `You must be within ${CLOCK_GEOFENCE_FEET} ft of the assigned jobsite to clock out. Current distance: ${Math.round(distanceFeet)} ft.` });
  }

  const clockOutAtIso = new Date().toISOString();

  db.prepare(
    `UPDATE employee_time_clock_entries
     SET clockOutAt = ?,
         clockOutLatitude = ?,
         clockOutLongitude = ?,
         geofenceDistanceFeet = ?,
         updatedAt = ?
     WHERE id = ?`
  ).run(clockOutAtIso, clientCoordinates.latitude, clientCoordinates.longitude, distanceFeet, clockOutAtIso, activeEntry.id);

  return res.json({ clockedOut: true });
});

// Auto-clock-out safety endpoint: if employee has an active punch and is outside
// the jobsite geofence, end the punch automatically to prevent clock abuse.
app.post('/api/portal/employee/timeclock/auto-clock-out', authGuard(['employee']), async (req, res) => {
  const clientCoordinates = parseClientCoordinates(req.body || {});
  if (!clientCoordinates) {
    return res.status(400).json({ error: 'Location access is required for automatic clock-out checks.' });
  }

  const activeEntry = db
    .prepare(
      `SELECT id, assignmentId, jobsiteUserId, clockInAt
       FROM employee_time_clock_entries
       WHERE employeeUserId = ?
         AND clockOutAt IS NULL
       ORDER BY clockInAt DESC
       LIMIT 1`
    )
    .get(req.auth.id);

  if (!activeEntry) {
    return res.json({ autoClockedOut: false, reason: 'no_active_clock_in' });
  }

  const geofenceCoordinates = await resolveJobsiteGeofenceCoordinates(activeEntry.jobsiteUserId);
  if (!geofenceCoordinates) {
    return res.status(400).json({ error: 'Assigned jobsite location is not configured for geofencing yet.' });
  }

  const distanceFeet = distanceFeetBetween(
    clientCoordinates.latitude,
    clientCoordinates.longitude,
    geofenceCoordinates.latitude,
    geofenceCoordinates.longitude
  );

  if (distanceFeet <= CLOCK_GEOFENCE_FEET) {
    return res.json({ autoClockedOut: false, reason: 'inside_geofence', distanceFeet: Math.round(distanceFeet) });
  }

  const autoClockOutAtIso = new Date().toISOString();

  db.prepare(
    `UPDATE employee_time_clock_entries
     SET clockOutAt = ?,
         clockOutLatitude = ?,
         clockOutLongitude = ?,
         geofenceDistanceFeet = ?,
         updatedAt = ?
     WHERE id = ?`
  ).run(autoClockOutAtIso, clientCoordinates.latitude, clientCoordinates.longitude, distanceFeet, autoClockOutAtIso, activeEntry.id);

  return res.json({ autoClockedOut: true, distanceFeet: Math.round(distanceFeet), assignmentId: activeEntry.assignmentId });
});

app.get('/api/notifications/vapid-public-key', authGuard(), (_req, res) => {
  res.json({ publicKey: vapidKeys ? vapidKeys.publicKey : null });
});

app.get('/api/realtime/stream', authGuard(), (req, res) => {
  const userId = Number(req.auth.id);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  if (!realtimeClients.has(userId)) {
    realtimeClients.set(userId, new Set());
  }

  const clients = realtimeClients.get(userId);
  clients.add(res);
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, userId })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ at: new Date().toISOString() })}\n\n`);
    } catch (_error) {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    const active = realtimeClients.get(userId);
    if (!active) return;
    active.delete(res);
    if (!active.size) {
      realtimeClients.delete(userId);
    }
  });
});

app.get('/api/portal/notifications', authGuard(), (req, res) => {
  const limit = Number(req.query.limit) || 25;
  res.json({ data: listPortalNotificationsForUser(req.auth.id, limit) });
});

app.patch('/api/portal/notifications/:id/read', authGuard(), (req, res) => {
  const notificationId = Number(req.params.id);
  if (!Number.isInteger(notificationId) || notificationId < 1) {
    return res.status(400).json({ error: 'Invalid notification id.' });
  }

  const notification = db.prepare('SELECT id FROM portal_notifications WHERE id = ? AND userId = ?').get(notificationId, req.auth.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  db.prepare(
    `UPDATE portal_notifications
     SET isRead = 1,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND userId = ?`
  ).run(notificationId, req.auth.id);

  res.json({ read: true });
});

app.delete('/api/portal/notifications/:id', authGuard(), (req, res) => {
  const notificationId = Number(req.params.id);
  if (!Number.isInteger(notificationId) || notificationId < 1) {
    return res.status(400).json({ error: 'Invalid notification id.' });
  }

  const notification = db.prepare('SELECT id FROM portal_notifications WHERE id = ? AND userId = ?').get(notificationId, req.auth.id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found.' });
  }

  db.prepare('DELETE FROM portal_notifications WHERE id = ? AND userId = ?').run(notificationId, req.auth.id);
  res.json({ deleted: true });
});

app.delete('/api/portal/notifications', authGuard(), (req, res) => {
  db.prepare('DELETE FROM portal_notifications WHERE userId = ? AND isRead = 1').run(req.auth.id);
  res.json({ deleted: true });
});

app.post('/api/notifications/subscribe', authGuard(), (req, res) => {
  const mandatoryPushLock = req.auth.role === 'employee'
    ? getMandatoryEmployeePushLockState(req.auth.id, req.auth.email)
    : { locked: false, reason: '' };

  if (!mandatoryPushLock.locked && req.auth.notificationPreferences && req.auth.notificationPreferences.push === false) {
    return res.status(403).json({ error: 'App push notifications are disabled in your account settings.' });
  }

  if (req.auth.role === 'employee') {
    const applications = db
      .prepare(
        `SELECT id, industry, position, createdAt
         FROM applications
         WHERE userId = ? OR email = ?
         ORDER BY createdAt DESC`
      )
      .all(req.auth.id, req.auth.email);

    const documents = db
      .prepare(
        `SELECT
           documentType,
           expirationDate,
           documentStatus,
           createdAt
         FROM employee_documents
         WHERE userId = ?
         ORDER BY createdAt DESC`
      )
      .all(req.auth.id);

    const industry = inferIndustryFromApplications(applications);
    const { compliance } = evaluateEmployeeCompliance(req.auth.id, industry, documents);
    if (!compliance.isComplete) {
      return res.status(403).json({ error: 'Push notifications are enabled after all required documents are approved by an administrator.' });
    }
  }

  const subscription = req.body && req.body.subscription;
  if (!vapidKeys) {
    return res.status(503).json({ error: 'Push notifications are not configured.' });
  }

  if (!subscription || !subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
    return res.status(400).json({ error: 'Valid push subscription is required.' });
  }

  db.prepare(
    `INSERT INTO notification_subscriptions (userId, endpoint, keysJson, updatedAt)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(endpoint) DO UPDATE SET
       userId = excluded.userId,
       keysJson = excluded.keysJson,
       updatedAt = CURRENT_TIMESTAMP`
  ).run(req.auth.id, String(subscription.endpoint), JSON.stringify(subscription.keys));

  res.status(201).json({ subscribed: true });
});

app.delete('/api/notifications/subscribe', authGuard(), (req, res) => {
  const endpoint = String((req.body && req.body.endpoint) || '').trim();
  if (!endpoint) {
    return res.status(400).json({ error: 'Subscription endpoint is required.' });
  }

  if (req.auth.role === 'employee') {
    const pushLockState = getMandatoryEmployeePushLockState(req.auth.id, req.auth.email);
    if (pushLockState.locked) {
      return res.status(403).json({ error: pushLockState.reason });
    }
  }

  db.prepare('DELETE FROM notification_subscriptions WHERE userId = ? AND endpoint = ?').run(req.auth.id, endpoint);
  res.json({ unsubscribed: true });
});

app.post('/api/portal/employee/documents', authGuard(['employee']), (req, res) => {
  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload document.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const applicationIdRaw = req.body.applicationId;
    const applicationId = applicationIdRaw ? Number(applicationIdRaw) : null;
    const documentType = req.body.documentType ? String(req.body.documentType).trim().toLowerCase() : 'resume';
    const expirationDateRaw = req.body.expirationDate ? String(req.body.expirationDate).trim() : null;
    const ssnRaw = req.body.ssn ? String(req.body.ssn).trim() : '';
    const ssnConfirm = String(req.body.ssnConfirm || '').trim().toLowerCase();

    if (applicationId !== null && (!Number.isInteger(applicationId) || applicationId < 1)) {
      discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Invalid applicationId value.' });
    }

    if (!ALLOWED_EMPLOYEE_DOCUMENT_TYPES.has(documentType)) {
      discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    if (ADMIN_ONLY_DOCUMENT_TYPES.has(documentType)) {
      discardUploadedFile(req.file);
      return res.status(403).json({ error: 'Background documents can only be uploaded by admin or onboarding.' });
    }

    if (documentType === 'tuberculosis_screening_tb') {
      const employeeTrack = getEmployeeIndustryTrack(req.auth.id, req.auth.email);
      if (employeeTrack !== 'healthcare') {
        discardUploadedFile(req.file);
        return res.status(403).json({ error: 'Tuberculosis screening (TB) is only required for healthcare worker profiles.' });
      }
    }

    if (documentType === 'social_security_or_work_authorization') {
      const formattedSsn = formatSSNForStorage(ssnRaw);
      const confirmed = ssnConfirm === 'true' || ssnConfirm === '1' || ssnConfirm === 'yes' || ssnConfirm === 'on';

      if (!formattedSsn) {
        discardUploadedFile(req.file);
        return res.status(400).json({ error: 'A valid Social Security number is required for verification before uploading this document.' });
      }

      if (!confirmed) {
        discardUploadedFile(req.file);
        return res.status(400).json({ error: 'You must confirm the Social Security number acknowledgment before uploading this document.' });
      }

      db.prepare('UPDATE employee_profiles SET ssnEncrypted = ? WHERE userId = ?').run(encryptSSN(formattedSsn), req.auth.id);
    }

    if (EXPIRATION_REQUIRED_DOCUMENT_TYPES.has(documentType)) {
      if (!expirationDateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDateRaw)) {
        discardUploadedFile(req.file);
        return res.status(400).json({ error: 'This document type requires a valid expiration date (YYYY-MM-DD).' });
      }
    }

    if (applicationId !== null) {
      const appRow = db
        .prepare('SELECT id FROM applications WHERE id = ? AND (userId = ? OR email = ?)')
        .get(applicationId, req.auth.id, req.auth.email);

      if (!appRow) {
        discardUploadedFile(req.file);
        return res.status(404).json({ error: 'Application not found for this employee.' });
      }
    }

    const insert = db.prepare(
      `INSERT INTO employee_documents
        (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    try {
      await persistUploadedFile(req.file, 'employee-documents');
      const info = insert.run(
        req.auth.id,
        applicationId,
        documentType || 'resume',
        req.file.originalname,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        expirationDateRaw,
        'pending',
        req.auth.id,
        'employee'
      );

      runAsyncTask('notify_admin_document', () =>
        notifyAdminsAboutDocumentUpload(req.auth.id, info.lastInsertRowid, documentType)
      );

      emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);

      return res.status(201).json({
        id: info.lastInsertRowid,
        fileUrl: `/api/portal/documents/${info.lastInsertRowid}/file`,
      });
    } catch (error) {
      discardUploadedFile(req.file);
      logCaughtException('employee document upload', error, { userId: req.auth.id, documentType });
      return res.status(500).json({ error: 'Failed to store document.' });
    }
  });
});

app.post('/api/admin/employees/:employeeId/documents', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db
    .prepare("SELECT id, name, email FROM users WHERE id = ? AND role = 'employee'")
    .get(employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const applications = db
    .prepare(
      `SELECT industry
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const track = industryToTrack(industry);

  if (!canAdminViewEmployee(req.auth, employeeId, track)) {
    return res.status(403).json({ error: 'Forbidden - employee is outside your assigned scope.' });
  }

  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload document.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No document file uploaded.' });
    }

    const documentType = req.body.documentType ? String(req.body.documentType).trim().toLowerCase() : '';
    const expirationDateRaw = req.body.expirationDate ? String(req.body.expirationDate).trim() : null;
    const checklistRule = profileForIndustry(industry).find((rule) => String(rule.type || '').trim().toLowerCase() === documentType) || null;

    if (!documentType || !checklistRule) {
      discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Document type is not applicable for this employee profile.' });
    }

    if (!ALLOWED_EMPLOYEE_DOCUMENT_TYPES.has(documentType) || ADMIN_ONLY_DOCUMENT_TYPES.has(documentType)) {
      discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Invalid document type.' });
    }

    if (checklistRule.requiresExpiration) {
      if (!expirationDateRaw || !/^\d{4}-\d{2}-\d{2}$/.test(expirationDateRaw)) {
        discardUploadedFile(req.file);
        return res.status(400).json({ error: 'This document type requires a valid expiration date (YYYY-MM-DD).' });
      }
    }

    try {
      await persistUploadedFile(req.file, 'employee-documents');
      const info = db
        .prepare(
          `INSERT INTO employee_documents
            (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
           VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 'pending', ?, 'admin')`
        )
        .run(
          employeeId,
          documentType,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
          expirationDateRaw,
          req.auth.id
        );

      logAdminAction(
        req.auth.id,
        'employee_document_uploaded_for_employee',
        JSON.stringify({ employeeId, documentId: info.lastInsertRowid, documentType })
      );

      emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);

      runAsyncTask('notify_employee_admin_uploaded_document', () =>
        Promise.allSettled([
          Promise.resolve(createPortalNotification({
            userId: employeeId,
            actorUserId: req.auth.id,
            category: 'document',
            title: 'Document Uploaded to Your Checklist',
            body: `An administrator uploaded your ${getDocumentTypeLabel(documentType)} document.`,
            url: buildPortalPath('/portal-employee', { task: 'employee-documents' }),
            metadata: { documentId: Number(info.lastInsertRowid), documentType },
            syncDomains: ['employee-dashboard', 'documents'],
          })),
        ])
      );

      return res.status(201).json({
        id: info.lastInsertRowid,
        fileUrl: `/api/portal/documents/${info.lastInsertRowid}/file`,
        documentStatus: 'pending',
      });
    } catch (error) {
      discardUploadedFile(req.file);
      logCaughtException('admin employee document upload', error, { employeeId, actorUserId: req.auth.id, documentType });
      return res.status(500).json({ error: 'Failed to store document.' });
    }
  });
});

app.post('/api/admin/employees/:employeeId/background-document', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.employeeId);

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db
    .prepare("SELECT id, email FROM users WHERE id = ? AND role = 'employee'")
    .get(employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // Check if all required documents (except background check) are uploaded and approved
  const applications = db
    .prepare(`SELECT industry FROM applications WHERE userId = ? OR email = ? ORDER BY createdAt DESC`)
    .all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const documents = db
    .prepare(
      `SELECT documentType, documentStatus FROM employee_documents
       WHERE userId = ? AND documentType != 'background_check'
       ORDER BY createdAt DESC`
    )
    .all(employeeId);

  const { compliance } = evaluateEmployeeCompliance(employeeId, industry, documents);
  
  // Block background document upload until all other required documents are approved
  if (!compliance.isComplete) {
    const missing = compliance.missingRequired.length > 0 
      ? ` Missing: ${compliance.missingRequired.join(', ')}.`
      : (compliance.missingExpiration.length > 0 
        ? ` Missing expiration dates: ${compliance.missingExpiration.join(', ')}.`
        : '');
    return res.status(400).json({ 
      error: `Cannot upload background document until all required employee documents are approved and complete.${missing}`,
      missingRequired: compliance.missingRequired,
      missingExpiration: compliance.missingExpiration,
    });
  }

  upload.single('document')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload background document.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No background file uploaded.' });
    }

    try {
      await persistUploadedFile(req.file, 'employee-documents');
      const info = db
        .prepare(
          `INSERT INTO employee_documents
            (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
           VALUES (?, NULL, 'background_check', ?, ?, ?, ?, NULL, 'approved', ?, 'admin')`
        )
        .run(
          employeeId,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
          req.auth.id
        );

      logAdminAction(
        req.auth.id,
        'employee_background_document_uploaded',
        JSON.stringify({ employeeId, documentId: info.lastInsertRowid })
      );

      const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);

      runAsyncTask('notify_employee_background_document', () =>
        Promise.allSettled([
          Promise.resolve(createPortalNotification({
            userId: employeeId,
            actorUserId: req.auth.id,
            category: 'document',
            title: 'Background Document Uploaded',
            body: 'An administrator uploaded your background check document.',
            url: buildPortalPath('/portal-employee', { task: 'employee-documents' }),
            metadata: { documentId: Number(info.lastInsertRowid), documentType: 'background_check' },
            syncDomains: ['employee-dashboard', 'documents'],
          })),
        ])
      );

      return res.status(201).json({
        id: info.lastInsertRowid,
        fileUrl: `/api/portal/documents/${info.lastInsertRowid}/file`,
        employeeOnboardingStatus: newStatus,
      });
    } catch (error) {
      discardUploadedFile(req.file);
      logCaughtException('admin background document upload', error, { employeeId, actorUserId: req.auth.id });
      return res.status(500).json({ error: 'Failed to store background document.' });
    }
  });
});

app.post('/api/portal/employee/w4', authGuard(['employee']), (req, res) => {
  const {
    legalName,
    addressLine,
    cityStateZip,
    filingStatus,
    multipleJobs,
    dependentsAmount,
    otherIncome,
    deductions,
    extraWithholding,
    signatureName,
    signedDate,
  } = req.body;

  const normalizedLegalName = normalizeSingleLineText(legalName, 160);
  const normalizedSignatureName = normalizeSingleLineText(signatureName, 160);
  const normalizedAddressLine = addressLine ? normalizeSingleLineText(addressLine, 255) : null;
  const normalizedCityStateZip = cityStateZip ? normalizeSingleLineText(cityStateZip, 160) : null;
  const normalizedSignedDate = String(signedDate || '').trim();

  if (!normalizedLegalName || !normalizedSignatureName || !normalizedSignedDate) {
    return res.status(400).json({ error: 'legalName, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedSignedDate)) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const normalizedFilingStatus = filingStatus ? String(filingStatus).trim().toLowerCase() : null;
  const validFilingStatuses = new Set(['single', 'married_filing_jointly', 'head_of_household']);
  if (normalizedFilingStatus && !validFilingStatuses.has(normalizedFilingStatus)) {
    return res.status(400).json({ error: 'Invalid filing status.' });
  }

  const numericOrNull = (value) => {
    if (value === undefined || value === null || String(value).trim() === '') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const upsert = db.prepare(
    `INSERT INTO employee_w4_forms (
        userId,
        legalName,
        addressLine,
        cityStateZip,
        filingStatus,
        multipleJobs,
        dependentsAmount,
        otherIncome,
        deductions,
        extraWithholding,
        signatureName,
        signedDate,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        legalName = excluded.legalName,
        addressLine = excluded.addressLine,
        cityStateZip = excluded.cityStateZip,
        filingStatus = excluded.filingStatus,
        multipleJobs = excluded.multipleJobs,
        dependentsAmount = excluded.dependentsAmount,
        otherIncome = excluded.otherIncome,
        deductions = excluded.deductions,
        extraWithholding = excluded.extraWithholding,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    normalizedLegalName,
    normalizedAddressLine,
    normalizedCityStateZip,
    normalizedFilingStatus,
    isTruthy(multipleJobs) ? 1 : 0,
    numericOrNull(dependentsAmount),
    numericOrNull(otherIncome),
    numericOrNull(deductions),
    numericOrNull(extraWithholding),
    normalizedSignatureName,
    normalizedSignedDate
  );

  return res.json({ updated: true });
});

app.delete('/api/portal/employee/w4', authGuard(['employee']), (req, res) => {
  db.prepare('DELETE FROM employee_w4_forms WHERE userId = ?').run(req.auth.id);
  return res.json({ cleared: true });
});

app.post('/api/portal/employee/w9', authGuard(['employee']), (req, res) => {
  const {
    name,
    businessName,
    taxClassification,
    llcType,
    otherClassification,
    exemptPayeeCode,
    fatcaExemptionCode,
    addressLine,
    cityStateZip,
    tin,
    signatureName,
    signedDate,
  } = req.body;

  const normalizedName = normalizeSingleLineText(name, 160);
  const normalizedBusinessName = businessName ? normalizeSingleLineText(businessName, 160) : null;
  const normalizedSignatureName = normalizeSingleLineText(signatureName, 160);
  const normalizedAddressLine = addressLine ? normalizeSingleLineText(addressLine, 255) : null;
  const normalizedCityStateZip = cityStateZip ? normalizeSingleLineText(cityStateZip, 160) : null;
  const normalizedExemptPayeeCode = exemptPayeeCode ? normalizeSingleLineText(exemptPayeeCode, 50) : null;
  const normalizedFatcaExemptionCode = fatcaExemptionCode ? normalizeSingleLineText(fatcaExemptionCode, 50) : null;
  const normalizedOtherClassification = otherClassification ? normalizeSingleLineText(otherClassification, 160) : null;
  const normalizedSignedDate = String(signedDate || '').trim();

  if (!normalizedName || !taxClassification || !tin || !normalizedSignatureName || !normalizedSignedDate) {
    return res.status(400).json({ error: 'name, taxClassification, tin, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedSignedDate)) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const VALID_TAX_CLASSIFICATIONS = new Set([
    'individual_sole_proprietor',
    'c_corporation',
    's_corporation',
    'partnership',
    'trust_estate',
    'llc',
    'other',
  ]);

  const normalizedClassification = String(taxClassification).trim().toLowerCase();
  if (!VALID_TAX_CLASSIFICATIONS.has(normalizedClassification)) {
    return res.status(400).json({ error: 'Invalid tax classification.' });
  }

  if (normalizedClassification === 'llc' && !llcType) {
    return res.status(400).json({ error: 'llcType is required when tax classification is LLC.' });
  }

  const VALID_LLC_TYPES = new Set(['C', 'S', 'P']);
  if (llcType && !VALID_LLC_TYPES.has(String(llcType).trim().toUpperCase())) {
    return res.status(400).json({ error: 'llcType must be C, S, or P.' });
  }

  // Validate TIN format: ###-##-#### (SSN) or ##-####### (EIN)
  const tinStr = String(tin).trim();
  if (!/^\d{3}-\d{2}-\d{4}$/.test(tinStr) && !/^\d{2}-\d{7}$/.test(tinStr)) {
    return res.status(400).json({ error: 'TIN must be a valid SSN (###-##-####) or EIN (##-#######).' });
  }

  const upsert = db.prepare(
    `INSERT INTO employee_w9_forms (
        userId,
        name,
        businessName,
        taxClassification,
        llcType,
        otherClassification,
        exemptPayeeCode,
        fatcaExemptionCode,
        addressLine,
        cityStateZip,
        tin,
        signatureName,
        signedDate,
        updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        name = excluded.name,
        businessName = excluded.businessName,
        taxClassification = excluded.taxClassification,
        llcType = excluded.llcType,
        otherClassification = excluded.otherClassification,
        exemptPayeeCode = excluded.exemptPayeeCode,
        fatcaExemptionCode = excluded.fatcaExemptionCode,
        addressLine = excluded.addressLine,
        cityStateZip = excluded.cityStateZip,
        tin = excluded.tin,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    normalizedName,
    normalizedBusinessName,
    normalizedClassification,
    llcType ? String(llcType).trim().toUpperCase() : null,
    normalizedOtherClassification,
    normalizedExemptPayeeCode,
    normalizedFatcaExemptionCode,
    normalizedAddressLine,
    normalizedCityStateZip,
    tinStr,
    normalizedSignatureName,
    normalizedSignedDate
  );

  return res.json({ updated: true });
});

app.delete('/api/portal/employee/w9', authGuard(['employee']), (req, res) => {
  db.prepare('DELETE FROM employee_w9_forms WHERE userId = ?').run(req.auth.id);
  return res.json({ cleared: true });
});

app.post('/api/portal/employee/background-consent', authGuard(['employee']), (req, res) => {
  const {
    acknowledged,
    legalName,
    signatureName,
    signedDate,
  } = req.body || {};

  if (!isTruthy(acknowledged)) {
    return res.status(400).json({ error: 'You must acknowledge and consent before signing.' });
  }

  if (!legalName || !signatureName || !signedDate) {
    return res.status(400).json({ error: 'legalName, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(signedDate))) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const upsert = db.prepare(
    `INSERT INTO employee_background_consent_forms (
        userId,
        acknowledged,
        legalName,
        signatureName,
        signedDate,
        consentVersion,
        ipAddress,
        userAgent,
        updatedAt
      )
      VALUES (?, 1, ?, ?, ?, 'v1', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        acknowledged = 1,
        legalName = excluded.legalName,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        consentVersion = excluded.consentVersion,
        ipAddress = excluded.ipAddress,
        userAgent = excluded.userAgent,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    String(legalName).trim(),
    String(signatureName).trim(),
    String(signedDate).trim(),
    String(req.ip || '').trim().slice(0, 255) || null,
    String(req.get('user-agent') || '').trim().slice(0, 500) || null,
  );

  const onboardingStatus = syncEmployeeActivationState(req.auth.id);
  emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);
  runAsyncTask('notify_admins_background_consent_signed', () =>
    notifyAdminsAboutFormSubmission(req.auth.id, req.auth.name, 'background-consent', 'Background Consent form')
  );

  return res.json({ updated: true, onboardingStatus });
});

app.post('/api/portal/employee/hipaa-compliance', authGuard(['employee']), (req, res) => {
  const {
    acknowledged,
    legalName,
    signatureName,
    signedDate,
  } = req.body || {};

  if (!isTruthy(acknowledged)) {
    return res.status(400).json({ error: 'You must acknowledge the HIPAA compliance statement before signing.' });
  }

  if (!legalName || !signatureName || !signedDate) {
    return res.status(400).json({ error: 'legalName, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(signedDate))) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const upsert = db.prepare(
    `INSERT INTO employee_hipaa_compliance_forms (
        userId,
        acknowledged,
        legalName,
        signatureName,
        signedDate,
        policyVersion,
        ipAddress,
        userAgent,
        updatedAt
      )
      VALUES (?, 1, ?, ?, ?, 'v1', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        acknowledged = 1,
        legalName = excluded.legalName,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        policyVersion = excluded.policyVersion,
        ipAddress = excluded.ipAddress,
        userAgent = excluded.userAgent,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    String(legalName).trim(),
    String(signatureName).trim(),
    String(signedDate).trim(),
    String(req.ip || '').trim().slice(0, 255) || null,
    String(req.get('user-agent') || '').trim().slice(0, 500) || null,
  );

  const onboardingStatus = syncEmployeeActivationState(req.auth.id);
  emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);
  runAsyncTask('notify_admins_hipaa_signed', () =>
    notifyAdminsAboutFormSubmission(req.auth.id, req.auth.name, 'hipaa-compliance', 'HIPAA Compliance Agreement')
  );

  return res.json({ updated: true, onboardingStatus });
});

app.post('/api/portal/employee/employee-handbook', authGuard(['employee']), (req, res) => {
  const {
    acknowledged,
    legalName,
    signatureName,
    signedDate,
  } = req.body || {};

  if (!isTruthy(acknowledged)) {
    return res.status(400).json({ error: 'You must acknowledge the Employee Handbook before signing.' });
  }

  if (!legalName || !signatureName || !signedDate) {
    return res.status(400).json({ error: 'legalName, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(signedDate))) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const upsert = db.prepare(
    `INSERT INTO employee_handbook_forms (
        userId,
        acknowledged,
        legalName,
        signatureName,
        signedDate,
        handbookVersion,
        ipAddress,
        userAgent,
        updatedAt
      )
      VALUES (?, 1, ?, ?, ?, 'v1', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        acknowledged = 1,
        legalName = excluded.legalName,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        handbookVersion = excluded.handbookVersion,
        ipAddress = excluded.ipAddress,
        userAgent = excluded.userAgent,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    String(legalName).trim(),
    String(signatureName).trim(),
    String(signedDate).trim(),
    String(req.ip || '').trim().slice(0, 255) || null,
    String(req.get('user-agent') || '').trim().slice(0, 500) || null,
  );

  const onboardingStatus = syncEmployeeActivationState(req.auth.id);
  emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);
  runAsyncTask('notify_admins_handbook_signed', () =>
    notifyAdminsAboutFormSubmission(req.auth.id, req.auth.name, 'employee-handbook', 'Employee Handbook')
  );

  return res.json({ updated: true, onboardingStatus });
});

app.post('/api/portal/employee/compensation-agreement', authGuard(['employee']), (req, res) => {
  const {
    acknowledged,
    legalName,
    signatureName,
    signedDate,
  } = req.body || {};

  if (!isTruthy(acknowledged)) {
    return res.status(400).json({ error: 'You must acknowledge the Healthcare Compensation Agreement before signing.' });
  }

  if (!legalName || !signatureName || !signedDate) {
    return res.status(400).json({ error: 'legalName, signatureName, and signedDate are required.' });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(signedDate))) {
    return res.status(400).json({ error: 'signedDate must be in YYYY-MM-DD format.' });
  }

  const upsert = db.prepare(
    `INSERT INTO employee_compensation_agreement_forms (
        userId,
        acknowledged,
        legalName,
        signatureName,
        signedDate,
        agreementVersion,
        ipAddress,
        userAgent,
        updatedAt
      )
      VALUES (?, 1, ?, ?, ?, 'v1', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(userId) DO UPDATE SET
        acknowledged = 1,
        legalName = excluded.legalName,
        signatureName = excluded.signatureName,
        signedDate = excluded.signedDate,
        agreementVersion = excluded.agreementVersion,
        ipAddress = excluded.ipAddress,
        userAgent = excluded.userAgent,
        updatedAt = CURRENT_TIMESTAMP`
  );

  upsert.run(
    req.auth.id,
    String(legalName).trim(),
    String(signatureName).trim(),
    String(signedDate).trim(),
    String(req.ip || '').trim().slice(0, 255) || null,
    String(req.get('user-agent') || '').trim().slice(0, 500) || null,
  );

  const onboardingStatus = syncEmployeeActivationState(req.auth.id);
  emitDomainSyncToAdmins(['onboarding', 'full'], ['admin-dashboard', 'documents']);
  runAsyncTask('notify_admins_comp_agreement_signed', () =>
    notifyAdminsAboutFormSubmission(req.auth.id, req.auth.name, 'compensation-agreement', 'Employee Compensation Agreement')
  );

  return res.json({ updated: true, onboardingStatus });
});

app.get('/api/portal/forms/:formType/:employeeId', authGuard(['admin', 'employee', 'jobsite', 'onboarding']), (req, res) => {
  const formType = String(req.params.formType || '').trim().toLowerCase();
  const employeeId = Number(req.params.employeeId);

  if (!['background-consent', 'hipaa-compliance', 'employee-handbook', 'compensation-agreement'].includes(formType)) {
    return res.status(400).json({ error: 'Invalid form type.' });
  }

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  if (req.auth.role === 'employee') {
    if (Number(req.auth.id) !== employeeId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else if (req.auth.role === 'admin' || req.auth.role === 'onboarding') {
    if (req.auth.role === 'admin' && !hasAdminScopeAccess(req.auth, ['onboarding'])) {
      return res.status(403).json({ error: 'Forbidden for this portal scope.' });
    }

    const employee = db
      .prepare(
        `SELECT id, email
         FROM users
         WHERE id = ? AND role = 'employee'
         LIMIT 1`
      )
      .get(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (req.auth.role === 'admin') {
      const applications = db
        .prepare(
          `SELECT industry
           FROM applications
           WHERE userId = ? OR email = ?
           ORDER BY createdAt DESC`
        )
        .all(employee.id, employee.email);
      const industry = inferIndustryFromApplications(applications);
      const track = industryToTrack(industry);
      if (!canAdminViewEmployee(req.auth, employeeId, track)) {
        return res.status(403).json({ error: 'Forbidden - employee is outside your assigned scope.' });
      }
    }
  } else if (req.auth.role === 'jobsite') {
    if (!canJobsiteAccessEmployeeForm(req.auth.id, employeeId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const formRecord = getSignedOnboardingFormRecord(formType, employeeId, { includeMeta: true });
  const download = String(req.query.download || '').trim().toLowerCase() === '1'
    || String(req.query.download || '').trim().toLowerCase() === 'true';

  const empUser = db.prepare('SELECT id, email FROM users WHERE id = ? LIMIT 1').get(employeeId);
  const employeePosition = empUser ? getEmployeePrimaryPosition(empUser.id, empUser.email) : '';

  return serveSignedOnboardingForm(res, formType, formRecord, { download, employeePosition });
});

app.delete('/api/portal/employee/applications/:id', authGuard(['employee']), (req, res) => {
  const applicationId = Number(req.params.id);
  const credential = getSubmittedCredential(req.body);

  if (!Number.isInteger(applicationId) || applicationId < 1) {
    return res.status(400).json({ error: 'Invalid application id.' });
  }

  if (!credential) {
    return res.status(400).json({ error: 'Password or 4-digit passcode is required to withdraw an application.' });
  }

  const employee = db
    .prepare('SELECT id, email, passwordHash, passwordSalt, passcodeHash, passcodeSalt FROM users WHERE id = ? AND role = ?')
    .get(req.auth.id, 'employee');

  if (!employee) {
    return res.status(404).json({ error: 'Employee account not found.' });
  }

  if (!verifyUserCredential(employee, credential)) {
    return res.status(401).json({ error: 'Password or passcode is incorrect.' });
  }

  const application = db
    .prepare('SELECT id, userId, email FROM applications WHERE id = ? AND (userId = ? OR email = ?)')
    .get(applicationId, req.auth.id, req.auth.email);

  if (!application) {
    return res.status(404).json({ error: 'Application not found for this employee.' });
  }

  const docs = db
    .prepare('SELECT id, storedName FROM employee_documents WHERE userId = ? AND applicationId = ?')
    .all(req.auth.id, applicationId);

  db.prepare('DELETE FROM employee_documents WHERE userId = ? AND applicationId = ?').run(req.auth.id, applicationId);
  db.prepare('DELETE FROM applications WHERE id = ?').run(applicationId);

  docs.forEach((doc) => {
    if (!doc || !doc.storedName) return;
    removeStoredFileLater(doc.storedName);
  });

  return res.json({ withdrawn: true, id: applicationId });
});

app.delete('/api/portal/employee/account', authGuard(['employee']), (req, res) => {
  const password = String(req.body && req.body.password ? req.body.password : '');
  if (!password) {
    return res.status(400).json({ error: 'Password is required.' });
  }

  const user = db
    .prepare('SELECT id, email, role, passwordHash, passwordSalt FROM users WHERE id = ? AND role = ?')
    .get(req.auth.id, 'employee');

  if (!user) {
    return res.status(404).json({ error: 'Employee account not found.' });
  }

  if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: 'Password is incorrect.' });
  }

  const userEmail = String(user.email || '').trim().toLowerCase();
  const documentRows = db
    .prepare('SELECT storedName FROM employee_documents WHERE userId = ?')
    .all(req.auth.id);

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM applications WHERE userId = ? OR lower(email) = ?').run(req.auth.id, userEmail);
    db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.auth.id, 'employee');
  });

  tx();

  for (const row of documentRows) {
    const storedName = String(row && row.storedName ? row.storedName : '').trim();
    if (!storedName) continue;
    removeStoredFileLater(storedName);
  }

  return res.json({ deleted: true });
});

app.get('/api/shifts/open', authGuard(), (req, res) => {
  const shiftAccess = req.auth.role === 'employee'
    ? getEmployeeShiftAccessState(req.auth.id, req.auth.email)
    : { allowed: true, reason: null };
  const shifts = shiftAccess.allowed ? getVisibleOpenShiftsForUser(req.auth) : [];
  const employeeTitle = req.auth.role === 'employee'
    ? getEmployeePrimaryPosition(req.auth.id, req.auth.email)
    : null;

  res.json({
    data: shifts,
    employeeTitle,
    shiftAccessBlockedReason: shiftAccess.allowed ? null : shiftAccess.reason,
    shiftAccessMessage: shiftAccess.allowed ? null : shiftAccess.message,
    shiftAccessCompliance: shiftAccess.allowed ? null : (shiftAccess.compliance || null),
  });
});

app.post('/api/shifts/:id/accept', authGuard(['employee']), (req, res) => {
  const jobId = Number(req.params.id);
  const credential = getSubmittedCredential(req.body);
  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid shift id.' });
  }

  if (!requireCredentialForUser(res, req.auth.id, credential, 'Password or 4-digit passcode is required to accept a shift.')) {
    return;
  }

  const shiftAccess = getEmployeeShiftAccessState(req.auth.id, req.auth.email);
  if (!shiftAccess.allowed) {
    return res.status(403).json({ error: shiftAccess.message || 'Complete required onboarding documents before accepting shifts.' });
  }

  const shift = db
    .prepare(
      `SELECT id, title, status, jobsiteUserId
       FROM jobs
       WHERE id = ? AND status = 'open'`
    )
    .get(jobId);

  if (!shift) {
    return res.status(404).json({ error: 'Open shift not found.' });
  }

  const employeeTitle = normalizeText(getEmployeePrimaryPosition(req.auth.id, req.auth.email));
  if (!employeeTitle) {
    return res.status(400).json({ error: 'Employee does not have a registered title yet.' });
  }

  if (normalizeText(shift.title) !== employeeTitle) {
    return res.status(403).json({ error: 'This shift does not match your registered title.' });
  }

  if (!industryMatchesTrack(shift.industry, getEmployeeIndustryTrack(req.auth.id, req.auth.email))) {
    return res.status(403).json({ error: 'This shift does not match your industry track.' });
  }

  const existingAssignment = db
    .prepare("SELECT id FROM job_assignments WHERE jobId = ? AND status IN ('assigned', 'approved') LIMIT 1")
    .get(jobId);
  if (existingAssignment) {
    return res.status(409).json({ error: 'Shift has already been taken.' });
  }

  const info = db
    .prepare('INSERT INTO job_assignments (jobId, employeeUserId, status) VALUES (?, ?, ?)')
    .run(jobId, req.auth.id, 'assigned');

  db.prepare("UPDATE jobs SET status = 'closed' WHERE id = ?").run(jobId);
  db.prepare('DELETE FROM shift_declines WHERE jobId = ? AND employeeUserId = ?').run(jobId, req.auth.id);

  if (Number.isInteger(Number(shift.jobsiteUserId)) && Number(shift.jobsiteUserId) > 0) {
    createPortalNotification({
      userId: Number(shift.jobsiteUserId),
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Shift accepted',
      body: `${req.auth.name || 'An employee'} accepted shift #${jobId}.`,
      url: buildPortalPath('/portal-jobsite'),
      syncDomains: ['jobsite-dashboard'],
    });
  }

  getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
    createPortalNotification({
      userId: admin.id,
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Shift accepted',
      body: `${req.auth.name || 'An employee'} accepted shift #${jobId}.`,
      url: buildPortalPath(getPortalPathForUser(admin)),
      syncDomains: ['admin-dashboard'],
    });
  });

  res.status(201).json({ accepted: true, assignmentId: info.lastInsertRowid });
});

app.post('/api/shifts/:id/decline', authGuard(['employee']), (req, res) => {
  const jobId = Number(req.params.id);
  const credential = getSubmittedCredential(req.body);
  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid shift id.' });
  }

  if (!requireCredentialForUser(res, req.auth.id, credential, 'Password or 4-digit passcode is required to decline a shift.')) {
    return;
  }

  const shift = db.prepare('SELECT id, jobsiteUserId FROM jobs WHERE id = ? AND status = ?').get(jobId, 'open');
  if (!shift) {
    return res.status(404).json({ error: 'Open shift not found.' });
  }

  db.prepare('INSERT OR IGNORE INTO shift_declines (jobId, employeeUserId) VALUES (?, ?)').run(jobId, req.auth.id);
  if (Number.isInteger(Number(shift.jobsiteUserId)) && Number(shift.jobsiteUserId) > 0) {
    createPortalNotification({
      userId: Number(shift.jobsiteUserId),
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Employee declined shift',
      body: `${req.auth.name || 'An employee'} declined shift #${jobId}.`,
      url: buildPortalPath('/portal-jobsite'),
      syncDomains: ['jobsite-dashboard'],
    });
  }
  res.json({ declined: true, id: jobId });
});

app.post('/api/shifts/assignments/:id/withdraw', authGuard(['employee']), (req, res) => {
  upload.single('doctorNote')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload doctor note.' });
    }

    const assignmentId = Number(req.params.id);
    const credential = getSubmittedCredential(req.body || {});
    const reason = String((req.body && req.body.reason) || '').trim();
    const cancellationTypeRaw = String((req.body && req.body.cancellationType) || '').trim().toLowerCase();
    const cancellationType = cancellationTypeRaw === 'medical' ? 'medical' : cancellationTypeRaw === 'non_medical' ? 'non_medical' : '';

    if (!Number.isInteger(assignmentId) || assignmentId < 1) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Invalid assignment id.' });
    }
    if (!reason) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'A cancellation reason is required.' });
    }
    if (!['medical', 'non_medical'].includes(cancellationType)) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Cancellation type must be medical or non_medical.' });
    }

    if (!requireCredentialForUser(res, req.auth.id, credential, 'Password or 4-digit passcode is required to withdraw a shift.')) {
      if (req.file) discardUploadedFile(req.file);
      return;
    }

    if (getEmployeeOnboardingStatus(req.auth.id) !== 'active') {
      const shiftAccess = getEmployeeShiftAccessState(req.auth.id, req.auth.email);
      if (req.file) discardUploadedFile(req.file);
      return res.status(403).json({ error: shiftAccess.message || 'Complete onboarding before withdrawing shifts.' });
    }

    const assignment = db
      .prepare(
        `SELECT
           ja.id,
           ja.jobId,
           ja.employeeUserId,
           ja.status,
           j.schedule,
           j.jobsiteUserId
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.jobId
         WHERE ja.id = ? AND ja.employeeUserId = ?`
      )
      .get(assignmentId, req.auth.id);

    if (!assignment || !['assigned', 'approved'].includes(String(assignment.status || '').toLowerCase())) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(404).json({ error: 'Assigned shift not found.' });
    }

    const shiftStart = parseShiftStartFromSchedule(assignment.schedule);
    const now = new Date();
    if (shiftStart && now.getTime() >= shiftStart.getTime()) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'This shift has already started. Employees can no longer cancel after start time.' });
    }

    const requiresDoctorNote = cancellationType === 'medical'
      && shiftStart
      && (shiftStart.getTime() - now.getTime()) <= (24 * 60 * 60 * 1000);

    if (requiresDoctorNote && !req.file) {
      return res.status(400).json({ error: 'A doctor note is required for medical cancellations within 24 hours of shift start.' });
    }

    let doctorNoteDocumentId = null;
    try {
      if (req.file) {
        await persistUploadedFile(req.file, 'employee-documents');
        const docInfo = db.prepare(
          `INSERT INTO employee_documents
            (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
           VALUES (?, NULL, 'doctor_note', ?, ?, ?, ?, NULL, 'pending', ?, 'employee')`
        ).run(
          req.auth.id,
          req.file.originalname,
          req.file.filename,
          req.file.mimetype,
          req.file.size,
          req.auth.id
        );
        doctorNoteDocumentId = Number(docInfo.lastInsertRowid);
      }

    const excuseInfo = db.prepare(
      `INSERT INTO employee_excuse_forms
        (employeeUserId, assignmentId, jobId, cancellationType, reason, doctorNoteDocumentId, shiftStartAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      req.auth.id,
      assignmentId,
      assignment.jobId,
      cancellationType,
      reason,
      doctorNoteDocumentId,
      shiftStart ? shiftStart.toISOString() : null
    );
    const excuseFormId = Number(excuseInfo.lastInsertRowid);

    db.prepare(
      `UPDATE job_assignments
       SET status = 'cancelled',
           statusReason = ?,
           cancellationType = ?,
           statusUpdatedByUserId = ?,
           statusUpdatedAt = CURRENT_TIMESTAMP,
           excuseFormId = ?
       WHERE id = ?`
    ).run(reason, cancellationType, req.auth.id, excuseFormId, assignmentId);

    db.prepare("UPDATE shift_offers SET status = 'cancelled', respondedAt = CURRENT_TIMESTAMP WHERE assignmentId = ? AND status = 'pending'").run(assignmentId);

    const activeCount = db.prepare(
      `SELECT COUNT(*) AS count
       FROM job_assignments
       WHERE jobId = ?
         AND status IN ('assigned', 'approved')`
    ).get(assignment.jobId);
    if (!activeCount || Number(activeCount.count) === 0) {
      db.prepare("UPDATE jobs SET status = 'open' WHERE id = ?").run(assignment.jobId);
    }

    const reasonSuffix = reason ? ` Reason: ${reason}` : '';
    if (Number.isInteger(Number(assignment.jobsiteUserId)) && Number(assignment.jobsiteUserId) > 0) {
      createPortalNotification({
        userId: Number(assignment.jobsiteUserId),
        actorUserId: req.auth.id,
        category: 'shift',
        title: 'Employee cancelled shift',
        body: `Assignment #${assignmentId} was cancelled (${cancellationType.replace('_', ' ')}).${reasonSuffix}`,
        url: buildPortalPath('/portal-jobsite'),
        syncDomains: ['jobsite-dashboard'],
      });
    }

    getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
      createPortalNotification({
        userId: admin.id,
        actorUserId: req.auth.id,
        category: 'shift',
        title: 'Employee cancellation submitted',
        body: `Assignment #${assignmentId} was cancelled (${cancellationType.replace('_', ' ')}).${reasonSuffix}`,
        url: buildPortalPath(getPortalPathForUser(admin)),
        syncDomains: ['admin-dashboard', 'documents'],
      });
    });

      return res.json({ withdrawn: true, id: assignmentId, excuseFormId, requiresDoctorNote });
    } catch (error) {
      if (req.file) discardUploadedFile(req.file);
      logCaughtException('shift withdrawal doctor note upload', error, { assignmentId, employeeUserId: req.auth.id });
      return res.status(500).json({ error: 'Failed to store doctor note.' });
    }
  });
});

  // ── NCNS (No-Call-No-Show) documentation endpoints ──────────────────────────
  app.get('/api/portal/employee/ncns-assignments', authGuard(['employee']), (req, res) => {
    const now = new Date();
    const rows = db.prepare(
      `SELECT
         ja.id,
         ja.jobId,
         ja.status,
         ja.excuseFormId,
         j.title AS shiftTitle,
         j.schedule,
         jp.companyName,
         ef.cancellationType AS excuseCancellationType,
         ef.doctorNoteDocumentId,
         ef.doctorNoteAcknowledged,
         ef.submittedAsNcns,
         ef.reason AS excuseReason
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       LEFT JOIN employee_excuse_forms ef ON ef.id = ja.excuseFormId
       WHERE ja.employeeUserId = ? AND ja.status = 'no_call_no_show'
       ORDER BY ja.createdAt DESC`
    ).all(req.auth.id).map((row) => {
      const shiftEnd = parseShiftEndFromSchedule(row.schedule);
      const windowExpiredAt = shiftEnd ? new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000) : null;
      return {
        ...row,
        shiftEndAt: shiftEnd ? shiftEnd.toISOString() : null,
        windowExpiredAt: windowExpiredAt ? windowExpiredAt.toISOString() : null,
        withinWindow: windowExpiredAt ? now < windowExpiredAt : false,
        alreadySubmitted: Boolean(row.excuseFormId && row.submittedAsNcns),
      };
    });
    res.json({ data: rows });
  });

  app.post('/api/shifts/assignments/:id/ncns-excuse', authGuard(['employee']), (req, res) => {
    upload.single('doctorNote')(req, res, async (uploadErr) => {
      if (uploadErr) {
        return res.status(400).json({ error: uploadErr.message || 'Failed to upload file.' });
      }

      const assignmentId = Number(req.params.id);
      const cancellationTypeRaw = String((req.body && req.body.cancellationType) || '').trim().toLowerCase();
      const cancellationType = cancellationTypeRaw === 'medical' ? 'medical' : cancellationTypeRaw === 'non_medical' ? 'non_medical' : '';
      const reason = String((req.body && req.body.reason) || '').trim();
      const doctorNoteAcknowledged = (req.body && req.body.doctorNoteAcknowledged) === 'true' || (req.body && req.body.doctorNoteAcknowledged) === '1' ? 1 : 0;

      if (!Number.isInteger(assignmentId) || assignmentId < 1) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'Invalid assignment id.' });
      }
      if (!['medical', 'non_medical'].includes(cancellationType)) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'Documentation type must be medical or non_medical.' });
      }
      if (!reason && cancellationType === 'non_medical') {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'A reason is required for non-medical no-call-no-show documentation.' });
      }
      if (cancellationType === 'medical' && !req.file) {
        return res.status(400).json({ error: 'A doctor\'s note document is required for medical no-call-no-show documentation.' });
      }
      if (cancellationType === 'medical' && !doctorNoteAcknowledged) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'You must acknowledge that the uploaded document is a valid doctor\'s note.' });
      }

      const assignment = db.prepare(
        `SELECT ja.id, ja.jobId, ja.employeeUserId, ja.status, ja.excuseFormId,
                j.schedule, j.jobsiteUserId
         FROM job_assignments ja
         JOIN jobs j ON j.id = ja.jobId
         WHERE ja.id = ? AND ja.employeeUserId = ?`
      ).get(assignmentId, req.auth.id);

      if (!assignment || String(assignment.status).toLowerCase() !== 'no_call_no_show') {
        if (req.file) discardUploadedFile(req.file);
        return res.status(404).json({ error: 'No-call-no-show assignment not found.' });
      }

      // Check if already submitted (immutable once submitted)
      if (assignment.excuseFormId) {
        const existingForm = db.prepare('SELECT id, submittedAsNcns FROM employee_excuse_forms WHERE id = ?').get(assignment.excuseFormId);
        if (existingForm && existingForm.submittedAsNcns) {
          if (req.file) discardUploadedFile(req.file);
          return res.status(409).json({ error: 'Documentation has already been submitted for this absence and cannot be changed.' });
        }
      }

      // Verify 24-hour window from shift END
      const shiftEnd = parseShiftEndFromSchedule(assignment.schedule);
      const now = new Date();
      if (!shiftEnd) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'Unable to determine shift end time.' });
      }
      const windowEnd = new Date(shiftEnd.getTime() + 24 * 60 * 60 * 1000);
      if (now > windowEnd) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(410).json({ error: 'The 24-hour documentation window has expired. No further documentation can be submitted for this absence.' });
      }

      let doctorNoteDocumentId = null;
      try {
        if (req.file) {
          await persistUploadedFile(req.file, 'employee-documents');
          const docInfo = db.prepare(
            `INSERT INTO employee_documents
              (userId, applicationId, documentType, originalName, storedName, mimeType, fileSize, expirationDate, documentStatus, uploadedByUserId, uploadedByRole)
             VALUES (?, NULL, 'doctor_note', ?, ?, ?, ?, NULL, 'pending', ?, 'employee')`
          ).run(req.auth.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size, req.auth.id);
          doctorNoteDocumentId = Number(docInfo.lastInsertRowid);
        }

      const excuseInfo = db.prepare(
        `INSERT INTO employee_excuse_forms
          (employeeUserId, assignmentId, jobId, cancellationType, reason, doctorNoteDocumentId, shiftStartAt, shiftEndAt, submittedAsNcns, doctorNoteAcknowledged)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, 1, ?)`
      ).run(
        req.auth.id, assignmentId, assignment.jobId,
        cancellationType, reason || 'No-call-no-show',
        doctorNoteDocumentId,
        shiftEnd.toISOString(),
        doctorNoteAcknowledged
      );
      const excuseFormId = Number(excuseInfo.lastInsertRowid);

      db.prepare(
        `UPDATE job_assignments SET excuseFormId = ? WHERE id = ?`
      ).run(excuseFormId, assignmentId);

      const employeeUser = db.prepare('SELECT name FROM users WHERE id = ?').get(req.auth.id);
      const employeeName = employeeUser ? employeeUser.name : 'An employee';
      const docTypeLabel = cancellationType === 'medical' ? "doctor's note" : 'reason statement';

      getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
        createPortalNotification({
          userId: admin.id,
          actorUserId: req.auth.id,
          category: 'shift',
          title: 'NCNS documentation submitted',
          body: `${employeeName} submitted ${docTypeLabel} for their no-call-no-show on assignment #${assignmentId}.`,
          url: buildPortalPath(getPortalPathForUser(admin)),
          syncDomains: ['admin-dashboard', 'documents'],
        });
      });

      if (Number.isInteger(Number(assignment.jobsiteUserId)) && Number(assignment.jobsiteUserId) > 0) {
        createPortalNotification({
          userId: Number(assignment.jobsiteUserId),
          actorUserId: req.auth.id,
          category: 'shift',
          title: 'NCNS documentation received',
          body: `An employee submitted ${docTypeLabel} for their no-call-no-show on assignment #${assignmentId}.`,
          url: buildPortalPath('/portal-jobsite'),
          syncDomains: ['jobsite-dashboard'],
        });
      }

        return res.json({ submitted: true, excuseFormId });
      } catch (error) {
        if (req.file) discardUploadedFile(req.file);
        logCaughtException('ncns doctor note upload', error, { assignmentId, employeeUserId: req.auth.id });
        return res.status(500).json({ error: 'Failed to store supporting documentation.' });
      }
    });
  });
  // ─────────────────────────────────────────────────────────────────────────────

  app.get('/api/shifts/offers', authGuard(['employee']), (req, res) => {
  res.json({ data: getShiftOffersForEmployee(req.auth.id) });
});

app.post('/api/shifts/assignments/:id/offer', authGuard(['employee']), (req, res) => {
  const assignmentId = Number(req.params.id);
  const recipientEmail = String(req.body.recipientEmail || '').trim().toLowerCase();
  const credential = getSubmittedCredential(req.body);

  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    return res.status(400).json({ error: 'Invalid assignment id.' });
  }

  if (!recipientEmail) {
    return res.status(400).json({ error: 'Recipient email is required.' });
  }

  if (!requireCredentialForUser(res, req.auth.id, credential, 'Password or 4-digit passcode is required to offer a shift.')) {
    return;
  }

  if (getEmployeeOnboardingStatus(req.auth.id) !== 'active') {
    const shiftAccess = getEmployeeShiftAccessState(req.auth.id, req.auth.email);
    return res.status(403).json({ error: shiftAccess.message || 'Only active employees can privately offer shifts.' });
  }

  const assignment = db
    .prepare(
      `SELECT
         ja.id,
         ja.jobId,
         ja.employeeUserId,
         ja.status,
         j.title AS shiftTitle,
         jp.companyName
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE ja.id = ? AND ja.employeeUserId = ?`
    )
    .get(assignmentId, req.auth.id);

  if (!assignment || assignment.status !== 'assigned') {
    return res.status(404).json({ error: 'Assigned shift not found.' });
  }

  const recipient = db
    .prepare('SELECT id, email, role, isActive FROM users WHERE email = ?')
    .get(recipientEmail);

  if (!recipient || recipient.role !== 'employee' || !recipient.isActive) {
    return res.status(404).json({ error: 'Eligible employee not found.' });
  }

  if (getEmployeeOnboardingStatus(recipient.id) !== 'active') {
    return res.status(403).json({ error: 'That employee must complete onboarding before receiving a private shift offer.' });
  }

  if (Number(recipient.id) === Number(req.auth.id)) {
    return res.status(400).json({ error: 'You cannot offer a shift to yourself.' });
  }

  const senderTitle = normalizeText(getEmployeePrimaryPosition(req.auth.id, req.auth.email));
  const recipientTitle = normalizeText(getEmployeePrimaryPosition(recipient.id, recipient.email));
  if (!senderTitle || senderTitle !== normalizeText(assignment.shiftTitle) || recipientTitle !== senderTitle) {
    return res.status(403).json({ error: 'Shift offers are limited to employees with the same registered title.' });
  }

  const existingOffer = db
    .prepare('SELECT id FROM shift_offers WHERE assignmentId = ? AND toEmployeeUserId = ? AND status = ?')
    .get(assignmentId, recipient.id, 'pending');
  if (existingOffer) {
    return res.status(409).json({ error: 'A pending offer already exists for this employee.' });
  }

  const info = db
    .prepare('INSERT INTO shift_offers (assignmentId, fromEmployeeUserId, toEmployeeUserId, status) VALUES (?, ?, ?, ?)')
    .run(assignmentId, req.auth.id, recipient.id, 'pending');

  const offerNotification = {
    id: Number(info.lastInsertRowid),
    shiftTitle: assignment.shiftTitle,
    companyName: assignment.companyName,
    fromEmployeeName: req.auth.name,
  };
  runAsyncTask('notify_shift_offer', () => notifyEmployeeAboutShiftOffer(recipient, offerNotification));

  res.status(201).json({ offered: true, id: info.lastInsertRowid });
});

app.post('/api/shifts/offers/:id/respond', authGuard(['employee']), (req, res) => {
  const offerId = Number(req.params.id);
  const action = String(req.body.action || '').trim().toLowerCase();
  const credential = getSubmittedCredential(req.body);

  if (!Number.isInteger(offerId) || offerId < 1) {
    return res.status(400).json({ error: 'Invalid offer id.' });
  }

  if (!['accept', 'decline'].includes(action)) {
    return res.status(400).json({ error: 'Invalid offer action.' });
  }

  if (!requireCredentialForUser(res, req.auth.id, credential, 'Password or 4-digit passcode is required to respond to a shift offer.')) {
    return;
  }

  const offer = db
    .prepare(
      `SELECT
         so.id,
         so.assignmentId,
         so.toEmployeeUserId,
         so.status,
         ja.jobId,
         ja.status AS assignmentStatus,
         j.title AS shiftTitle
       FROM shift_offers so
       JOIN job_assignments ja ON ja.id = so.assignmentId
       JOIN jobs j ON j.id = ja.jobId
       WHERE so.id = ? AND so.toEmployeeUserId = ?`
    )
    .get(offerId, req.auth.id);

  if (!offer || offer.status !== 'pending') {
    return res.status(404).json({ error: 'Pending shift offer not found.' });
  }

  const recipientTitle = normalizeText(getEmployeePrimaryPosition(req.auth.id, req.auth.email));
  if (recipientTitle !== normalizeText(offer.shiftTitle)) {
    return res.status(403).json({ error: 'This shift does not match your registered title.' });
  }

  if (action === 'decline') {
    db.prepare("UPDATE shift_offers SET status = 'declined', respondedAt = CURRENT_TIMESTAMP WHERE id = ?").run(offerId);
    return res.json({ declined: true, id: offerId });
  }

  if (getEmployeeOnboardingStatus(req.auth.id) !== 'active') {
    const shiftAccess = getEmployeeShiftAccessState(req.auth.id, req.auth.email);
    return res.status(403).json({ error: shiftAccess.message || 'Complete onboarding before accepting shift offers.' });
  }

  if (offer.assignmentStatus !== 'assigned') {
    return res.status(409).json({ error: 'This shift is no longer available for reassignment.' });
  }

  db.prepare('UPDATE job_assignments SET employeeUserId = ? WHERE id = ?').run(req.auth.id, offer.assignmentId);
  db.prepare("UPDATE shift_offers SET status = 'accepted', respondedAt = CURRENT_TIMESTAMP WHERE id = ?").run(offerId);
  db.prepare("UPDATE shift_offers SET status = 'cancelled', respondedAt = CURRENT_TIMESTAMP WHERE assignmentId = ? AND id <> ? AND status = 'pending'").run(offer.assignmentId, offerId);
  db.prepare('DELETE FROM shift_declines WHERE jobId = ? AND employeeUserId = ?').run(offer.jobId, req.auth.id);

  res.json({ accepted: true, id: offerId });
});

app.get('/api/messages', authGuard(), (req, res) => {
  res.json({
    contacts: getMessageContactsForUser(req.auth),
    messages: getMessagesForUser(req.auth.id),
  });
});

app.post('/api/messages', authGuard(), messageSendLimiter, (req, res) => {
  const recipientRaw = req.body.recipientUserId;
  const recipientGroup = String(req.body.recipientGroup || '').trim().toLowerCase();
  const sendToAllEmployees = recipientGroup === 'employees' || String(recipientRaw || '').trim().toLowerCase() === 'all-employees';
  const sendToAllClients = recipientGroup === 'clients' || recipientGroup === 'jobsites' || String(recipientRaw || '').trim().toLowerCase() === 'all-clients';
  const recipientUserId = Number(recipientRaw);
  const body = String(req.body.body || '').trim();
  const senderName = String(req.auth.name || req.auth.email || 'A user').trim();

  if (!body) {
    return res.status(400).json({ error: 'Message body is required.' });
  }

  const filteredMessage = maskInappropriateLanguage(body);
  const safeBody = String(filteredMessage.text || '').trim();
  if (!safeBody) {
    return res.status(400).json({ error: 'Message body is required.' });
  }

  if (sendToAllEmployees || sendToAllClients) {
    if (getMessagingActorType(req.auth) !== 'admin') {
      return res.status(403).json({ error: 'Only admins can send bulk messages.' });
    }

    const targetRole = sendToAllEmployees ? 'employee' : 'jobsite';
    const recipients = db
      .prepare('SELECT id, role, portalScope FROM users WHERE role = ? AND isActive = 1 AND id <> ? ORDER BY id ASC')
      .all(targetRole, req.auth.id);

    if (!recipients.length) {
      return res.status(404).json({ error: sendToAllEmployees ? 'No active employees found.' : 'No active clients found.' });
    }

    const insertMany = db.transaction((rows) => {
      const stmt = db.prepare('INSERT INTO direct_messages (senderUserId, recipientUserId, body) VALUES (?, ?, ?)');
      rows.forEach((row) => {
        stmt.run(req.auth.id, row.id, safeBody);
      });
    });

    insertMany(recipients);
    recipients.forEach((row) => {
      createPortalNotification({
        userId: row.id,
        actorUserId: req.auth.id,
        category: 'message',
        title: 'New Message',
        body: `${senderName} sent you a new message.`,
        url: buildPortalPath(getPortalPathForUser(row), { task: 'messages' }),
        metadata: { senderUserId: req.auth.id },
        syncDomains: ['messages'],
      });
    });
    return res.status(201).json({
      sent: true,
      mode: sendToAllEmployees ? 'all-employees' : 'all-clients',
      sentCount: recipients.length,
      redacted: filteredMessage.redacted,
    });
  }

  if (!Number.isInteger(recipientUserId) || recipientUserId < 1) {
    return res.status(400).json({ error: 'Valid recipient is required.' });
  }

  if (recipientUserId === req.auth.id) {
    return res.status(400).json({ error: 'You cannot message yourself.' });
  }

  const recipient = db.prepare('SELECT id, email, role, portalScope FROM users WHERE id = ? AND isActive = 1').get(recipientUserId);
  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found.' });
  }

  if (!canUsersDirectMessage(req.auth, recipient)) {
    return res.status(403).json({ error: `${getMessagingPortalLabel(req.auth)} cannot message ${getMessagingPortalLabel(recipient).toLowerCase()} accounts.` });
  }

  const info = db
    .prepare('INSERT INTO direct_messages (senderUserId, recipientUserId, body) VALUES (?, ?, ?)')
    .run(req.auth.id, recipientUserId, safeBody);

  createPortalNotification({
    userId: recipientUserId,
    actorUserId: req.auth.id,
    category: 'message',
    title: 'New Message',
    body: `${senderName} sent you a new message.`,
    url: buildPortalPath(getPortalPathForUser(recipient), { task: 'messages' }),
    metadata: { senderUserId: req.auth.id, messageId: Number(info.lastInsertRowid) },
    syncDomains: ['messages'],
  });

  res.status(201).json({ sent: true, id: info.lastInsertRowid, redacted: filteredMessage.redacted });
});

app.delete('/api/messages/:id', authGuard(), (req, res) => {
  const messageId = Number(req.params.id);
  if (!Number.isInteger(messageId) || messageId < 1) {
    return res.status(400).json({ error: 'Invalid message id.' });
  }

  const message = db
    .prepare('SELECT id, senderUserId, recipientUserId FROM direct_messages WHERE id = ?')
    .get(messageId);
  if (!message) {
    return res.status(404).json({ error: 'Message not found.' });
  }

  const isSender = Number(message.senderUserId) === Number(req.auth.id);
  const isRecipient = Number(message.recipientUserId) === Number(req.auth.id);
  if (!isSender && !isRecipient) {
    return res.status(403).json({ error: 'Not allowed to modify this message.' });
  }

  if (isSender) {
    db.prepare('UPDATE direct_messages SET senderDeletedAt = CURRENT_TIMESTAMP WHERE id = ?').run(messageId);
  } else {
    db.prepare('UPDATE direct_messages SET recipientDeletedAt = CURRENT_TIMESTAMP WHERE id = ?').run(messageId);
  }

  // Hard-delete only when both sides deleted their local copy.
  db.prepare('DELETE FROM direct_messages WHERE id = ? AND senderDeletedAt IS NOT NULL AND recipientDeletedAt IS NOT NULL').run(messageId);

  emitRealtimeEventToUser(Number(message.senderUserId), 'portal-sync', { domains: ['messages'] });
  if (Number(message.recipientUserId) !== Number(message.senderUserId)) {
    emitRealtimeEventToUser(Number(message.recipientUserId), 'portal-sync', { domains: ['messages'] });
  }

  return res.json({ deleted: true });
});

app.patch('/api/account', authGuard(), async (req, res) => {
  const {
    name,
    newEmail,
    newPassword,
    newPasscode,
    removePasscode,
    notifyEmailEnabled,
    notifySmsEnabled,
    notifyPushEnabled,
    requireBiometricSensitive,
    preferredLanguage,
    phone,
    address,
    city,
    state,
    zip,
    skills,
    certifications,
    companyName,
    contactName,
  } = req.body || {};
  const credential = getSubmittedCredential(req.body);
  const normalizedNewEmail = newEmail ? String(newEmail).trim().toLowerCase() : '';
  const normalizedNewPassword = newPassword ? String(newPassword) : '';
  const normalizedNewPasscode = String(newPasscode || '').trim() ? normalizePasscode(newPasscode) : '';
  const shouldRemovePasscode = isTruthy(removePasscode);
  const wantsNotifyEmail = notifyEmailEnabled === undefined ? null : isTruthy(notifyEmailEnabled);
  const wantsNotifySms = notifySmsEnabled === undefined ? null : isTruthy(notifySmsEnabled);
  const wantsNotifyPush = notifyPushEnabled === undefined ? null : isTruthy(notifyPushEnabled);
  const wantsSensitiveBiometric = requireBiometricSensitive === undefined ? null : isTruthy(requireBiometricSensitive);
  const wantsPreferredLanguage = preferredLanguage === undefined ? null : normalizePreferredLanguage(preferredLanguage, '');
  const wantsName = name === undefined ? null : normalizeSingleLineText(name, 120);

  if (!credential.trim()) {
    return res.status(400).json({ error: 'Current password or 4-digit passcode is required.' });
  }

  if (normalizedNewEmail && !isValidEmailAddress(normalizedNewEmail)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  if (normalizedNewPassword && normalizedNewPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  if (String(newPasscode || '').trim() && !normalizedNewPasscode) {
    return res.status(400).json({ error: 'Passcode must be exactly 4 digits.' });
  }

  if (name !== undefined && wantsName.length < 2) {
    return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
  }

  if (preferredLanguage !== undefined && !wantsPreferredLanguage) {
    return res.status(400).json({ error: 'Selected language is not supported.' });
  }

  const currentUser = db
    .prepare(
      `SELECT
         id,
         name,
         email,
         pendingEmail,
         pendingEmailVerificationToken,
         pendingEmailVerificationExpiresAt,
         role,
         passwordHash,
         passwordSalt,
         passcodeHash,
         passcodeSalt,
         notifyEmailEnabled,
         notifySmsEnabled,
         notifyPushEnabled,
         requireBiometricSensitive,
         preferredLanguage
       FROM users
       WHERE id = ?`
    )
    .get(req.auth.id);

  if (!currentUser) {
    return res.status(404).json({ error: 'Account not found.' });
  }

  if (!verifyUserCredential(currentUser, credential)) {
    return res.status(401).json({ error: 'Current password or passcode is incorrect.' });
  }

  let nextName = currentUser.name;
  let nextPasswordHash = currentUser.passwordHash;
  let nextPasswordSalt = currentUser.passwordSalt;
  let nextPasscodeHash = currentUser.passcodeHash || null;
  let nextPasscodeSalt = currentUser.passcodeSalt || null;
  let nextNotifyEmailEnabled = Number(currentUser.notifyEmailEnabled) === 1;
  let nextNotifySmsEnabled = Number(currentUser.notifySmsEnabled) === 1;
  let nextNotifyPushEnabled = Number(currentUser.notifyPushEnabled) === 1;
  let nextRequireBiometricSensitive = Number(currentUser.requireBiometricSensitive) === 1;
  let nextPreferredLanguage = normalizePreferredLanguage(currentUser.preferredLanguage, 'en');
  let nextPendingEmail = currentUser.pendingEmail || null;
  let nextPendingEmailVerificationToken = currentUser.pendingEmailVerificationToken || null;
  let nextPendingEmailVerificationExpiresAt = Number(currentUser.pendingEmailVerificationExpiresAt || 0) || null;
  let emailChangeVerificationRecord = null;

  if (wantsName !== null) {
    nextName = wantsName;
  }

  if (normalizedNewPassword) {
    const passwordRecord = hashPassword(normalizedNewPassword);
    nextPasswordHash = passwordRecord.hash;
    nextPasswordSalt = passwordRecord.salt;
  }

  if (shouldRemovePasscode) {
    nextPasscodeHash = null;
    nextPasscodeSalt = null;
  }

  if (normalizedNewPasscode) {
    const passcodeRecord = hashPassword(normalizedNewPasscode);
    nextPasscodeHash = passcodeRecord.hash;
    nextPasscodeSalt = passcodeRecord.salt;
  }

  if (wantsNotifyEmail !== null) nextNotifyEmailEnabled = wantsNotifyEmail;
  if (wantsNotifySms !== null) nextNotifySmsEnabled = wantsNotifySms;
  if (wantsNotifyPush !== null) nextNotifyPushEnabled = wantsNotifyPush;
  if (wantsSensitiveBiometric !== null) nextRequireBiometricSensitive = wantsSensitiveBiometric;
  if (wantsPreferredLanguage !== null) nextPreferredLanguage = wantsPreferredLanguage;

  if (req.auth.role === 'employee' && !nextNotifyPushEnabled) {
    const pushLockState = getMandatoryEmployeePushLockState(currentUser.id, req.auth.email || currentUser.email);
    if (pushLockState.locked) {
      return res.status(403).json({ error: pushLockState.reason });
    }
  }

  if (normalizedNewEmail && normalizedNewEmail !== currentUser.email) {
    if (!isEmailServiceConfigured()) {
      return res.status(503).json({ error: 'Email changes are unavailable until outbound email is configured on the server.' });
    }

    const emailTaken = db
      .prepare('SELECT id FROM users WHERE id <> ? AND (email = ? OR pendingEmail = ?) LIMIT 1')
      .get(currentUser.id, normalizedNewEmail, normalizedNewEmail);
    if (emailTaken) {
      return res.status(409).json({ error: 'That email is already in use.' });
    }

    emailChangeVerificationRecord = createPendingEmailVerificationRecord();
    nextPendingEmail = normalizedNewEmail;
    nextPendingEmailVerificationToken = emailChangeVerificationRecord.rawToken;
    nextPendingEmailVerificationExpiresAt = emailChangeVerificationRecord.expiresAt;
  }

  let nextProfile = null;
  let profileChanged = false;

  if (currentUser.role === 'employee') {
    const currentProfile = db
      .prepare('SELECT phone, address, city, state, zip, skills, certifications FROM employee_profiles WHERE userId = ?')
      .get(currentUser.id) || {};

    const phoneInput = phone === undefined ? String(currentProfile.phone || '') : String(phone || '').trim();
    const normalizedPhone = phoneInput ? normalizePhoneNumber(phoneInput) : '';
    if (phone !== undefined && phoneInput && !normalizedPhone) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
    }

    const nextAddressLine = address === undefined ? String(currentProfile.address || '').trim() : normalizeMultiLineText(address, 160);
    const nextCity = city === undefined ? String(currentProfile.city || '').trim() : normalizeSingleLineText(city, 80);
    const nextState = state === undefined
      ? String(currentProfile.state || '').trim().toUpperCase()
      : normalizeSingleLineText(state, 2).toUpperCase();
    const nextZip = zip === undefined ? String(currentProfile.zip || '').trim() : normalizeSingleLineText(zip, 10);
    const addressValidationError = validateStructuredAddress(
      nextAddressLine,
      nextCity,
      nextState,
      nextZip,
      'Street address, city, state, and ZIP code are required when updating address.'
    );
    if (addressValidationError) {
      return res.status(400).json({ error: addressValidationError });
    }

    nextProfile = {
      phone: normalizedPhone || null,
      address: nextAddressLine || null,
      city: nextCity || null,
      state: nextState || null,
      zip: nextZip || null,
      skills: skills === undefined ? (currentProfile.skills || null) : normalizeMultiLineText(skills, 240) || null,
      certifications: certifications === undefined ? (currentProfile.certifications || null) : normalizeMultiLineText(certifications, 240) || null,
    };

    profileChanged = [
      ['phone', nextProfile.phone, currentProfile.phone || null],
      ['address', nextProfile.address, currentProfile.address || null],
      ['city', nextProfile.city, currentProfile.city || null],
      ['state', nextProfile.state, currentProfile.state || null],
      ['zip', nextProfile.zip, currentProfile.zip || null],
      ['skills', nextProfile.skills, currentProfile.skills || null],
      ['certifications', nextProfile.certifications, currentProfile.certifications || null],
    ].some(([, nextValue, currentValue]) => String(nextValue || '') !== String(currentValue || ''));
  }

  if (currentUser.role === 'jobsite') {
    const currentProfile = db
      .prepare(
        `SELECT
           companyName,
           contactName,
           phone,
           address,
           city,
           state,
           zip,
           industryTrack,
           geofenceLatitude,
           geofenceLongitude
         FROM jobsite_profiles
         WHERE userId = ?`
      )
      .get(currentUser.id) || {};

    const clientProfileUpdateRequested = [companyName, contactName, phone, address, city, state, zip].some((value) => value !== undefined);
    const nextCompanyName = companyName === undefined ? String(currentProfile.companyName || '').trim() : normalizeSingleLineText(companyName, 160);
    const nextContactName = contactName === undefined ? String(currentProfile.contactName || '').trim() : normalizeSingleLineText(contactName, 120);
    const phoneInput = phone === undefined ? String(currentProfile.phone || '') : String(phone || '').trim();
    const normalizedPhone = phoneInput ? normalizePhoneNumber(phoneInput) : '';
    if (phone !== undefined && phoneInput && !normalizedPhone) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
    }

    const nextAddressLine = address === undefined ? String(currentProfile.address || '').trim() : normalizeMultiLineText(address, 160);
    const nextCity = city === undefined ? String(currentProfile.city || '').trim() : normalizeSingleLineText(city, 80);
    const nextState = state === undefined
      ? String(currentProfile.state || '').trim().toUpperCase()
      : normalizeSingleLineText(state, 2).toUpperCase();
    const nextZip = zip === undefined ? String(currentProfile.zip || '').trim() : normalizeSingleLineText(zip, 10);
    const addressValidationError = validateStructuredAddress(
      nextAddressLine,
      nextCity,
      nextState,
      nextZip,
      'Street address, city, state, and ZIP code are required when updating mailing address.'
    );
    if (addressValidationError) {
      return res.status(400).json({ error: addressValidationError });
    }

    if (clientProfileUpdateRequested && !nextCompanyName) {
      return res.status(400).json({ error: 'Company name cannot be empty.' });
    }

    if (clientProfileUpdateRequested && !nextContactName) {
      return res.status(400).json({ error: 'Primary contact name cannot be empty.' });
    }

    nextProfile = {
      companyName: nextCompanyName || null,
      contactName: nextContactName || null,
      phone: normalizedPhone || null,
      address: nextAddressLine || null,
      city: nextCity || null,
      state: nextState || null,
      zip: nextZip || null,
      industryTrack: currentProfile.industryTrack || null,
      geofenceLatitude: currentProfile.geofenceLatitude ?? null,
      geofenceLongitude: currentProfile.geofenceLongitude ?? null,
    };

    profileChanged = [
      ['companyName', nextProfile.companyName, currentProfile.companyName || null],
      ['contactName', nextProfile.contactName, currentProfile.contactName || null],
      ['phone', nextProfile.phone, currentProfile.phone || null],
      ['address', nextProfile.address, currentProfile.address || null],
      ['city', nextProfile.city, currentProfile.city || null],
      ['state', nextProfile.state, currentProfile.state || null],
      ['zip', nextProfile.zip, currentProfile.zip || null],
    ].some(([, nextValue, currentValue]) => String(nextValue || '') !== String(currentValue || ''));
  }

  const credentialsChanged =
    nextPasswordHash !== currentUser.passwordHash
    || nextPasswordSalt !== currentUser.passwordSalt
    || String(nextPasscodeHash || '') !== String(currentUser.passcodeHash || '')
    || String(nextPasscodeSalt || '') !== String(currentUser.passcodeSalt || '');
  const preferencesChanged =
    nextNotifyEmailEnabled !== (Number(currentUser.notifyEmailEnabled) === 1)
    || nextNotifySmsEnabled !== (Number(currentUser.notifySmsEnabled) === 1)
    || nextNotifyPushEnabled !== (Number(currentUser.notifyPushEnabled) === 1)
    || nextRequireBiometricSensitive !== (Number(currentUser.requireBiometricSensitive) === 1);
  const nameChanged = nextName !== currentUser.name;
  const languageChanged = nextPreferredLanguage !== normalizePreferredLanguage(currentUser.preferredLanguage, 'en');
  const emailChangeRequested = Boolean(emailChangeVerificationRecord);

  if (!nameChanged && !credentialsChanged && !preferencesChanged && !languageChanged && !profileChanged && !emailChangeRequested) {
    return res.status(400).json({ error: 'No account settings were changed.' });
  }

  if (emailChangeVerificationRecord) {
    try {
      await sendPendingEmailVerificationEmail(
        { id: currentUser.id, name: nextName, email: currentUser.email },
        nextPendingEmail,
        emailChangeVerificationRecord,
        'account_update'
      );
    } catch (error) {
      logCaughtException('pending email verification send', error, {
        userId: currentUser.id,
        nextEmail: nextPendingEmail,
      });
      return res.status(502).json({ error: 'Unable to send the verification email for your new address right now.' });
    }
  }

  const tx = db.transaction(() => {
    db.prepare(
      `UPDATE users
       SET name = ?,
           passwordHash = ?,
           passwordSalt = ?,
           passcodeHash = ?,
           passcodeSalt = ?,
           notifyEmailEnabled = ?,
           notifySmsEnabled = ?,
           notifyPushEnabled = ?,
           requireBiometricSensitive = ?,
           preferredLanguage = ?,
           pendingEmail = ?,
           pendingEmailVerificationToken = ?,
           pendingEmailVerificationExpiresAt = ?
       WHERE id = ?`
    ).run(
      nextName,
      nextPasswordHash,
      nextPasswordSalt,
      nextPasscodeHash,
      nextPasscodeSalt,
      nextNotifyEmailEnabled ? 1 : 0,
      nextNotifySmsEnabled ? 1 : 0,
      nextNotifyPushEnabled ? 1 : 0,
      nextRequireBiometricSensitive ? 1 : 0,
      nextPreferredLanguage,
      nextPendingEmail,
      nextPendingEmailVerificationToken,
      nextPendingEmailVerificationExpiresAt,
      currentUser.id
    );

    if (currentUser.role === 'employee' && nextProfile) {
      db.prepare(
        `INSERT INTO employee_profiles (userId, phone, address, city, state, zip, skills, certifications)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
           phone = excluded.phone,
           address = excluded.address,
           city = excluded.city,
           state = excluded.state,
           zip = excluded.zip,
           skills = excluded.skills,
           certifications = excluded.certifications`
      ).run(
        currentUser.id,
        nextProfile.phone,
        nextProfile.address,
        nextProfile.city,
        nextProfile.state,
        nextProfile.zip,
        nextProfile.skills,
        nextProfile.certifications
      );

      if (nameChanged) {
        db.prepare('UPDATE applications SET fullName = ? WHERE userId = ?').run(nextName, currentUser.id);
      }
    }

    if (currentUser.role === 'jobsite' && nextProfile) {
      db.prepare(
        `INSERT INTO jobsite_profiles (
           userId,
           companyName,
           contactName,
           phone,
           address,
           city,
           state,
           zip,
           industryTrack,
           geofenceLatitude,
           geofenceLongitude
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(userId) DO UPDATE SET
           companyName = excluded.companyName,
           contactName = excluded.contactName,
           phone = excluded.phone,
           address = excluded.address,
           city = excluded.city,
           state = excluded.state,
           zip = excluded.zip`
      ).run(
        currentUser.id,
        nextProfile.companyName,
        nextProfile.contactName,
        nextProfile.phone,
        nextProfile.address,
        nextProfile.city,
        nextProfile.state,
        nextProfile.zip,
        nextProfile.industryTrack,
        nextProfile.geofenceLatitude,
        nextProfile.geofenceLongitude
      );
    }

    if (!nextNotifyPushEnabled) {
      db.prepare('DELETE FROM notification_subscriptions WHERE userId = ?').run(currentUser.id);
    }
  });

  tx();

  res.json({
    updated: true,
    name: nextName,
    email: currentUser.email,
    pendingEmail: nextPendingEmail,
    emailChangePending: Boolean(nextPendingEmail),
    emailChangeVerificationExpiresAt: nextPendingEmailVerificationExpiresAt || Number(currentUser.pendingEmailVerificationExpiresAt || 0) || null,
    passcodeEnabled: Boolean(nextPasscodeHash),
    notificationPreferences: {
      email: nextNotifyEmailEnabled,
      sms: nextNotifySmsEnabled,
      push: nextNotifyPushEnabled,
    },
    securityPreferences: {
      requireBiometricSensitive: nextRequireBiometricSensitive,
    },
    preferredLanguage: nextPreferredLanguage,
    profile: nextProfile,
  });
});

// Lightweight preference-only update — no credential required
app.patch('/api/account/preferences', authGuard(), (req, res) => {
  const { notifyEmailEnabled, notifySmsEnabled, notifyPushEnabled, preferredLanguage } = req.body || {};
  const wantsEmail = notifyEmailEnabled === undefined ? null : isTruthy(notifyEmailEnabled);
  const wantsSms   = notifySmsEnabled   === undefined ? null : isTruthy(notifySmsEnabled);
  const wantsPush  = notifyPushEnabled  === undefined ? null : isTruthy(notifyPushEnabled);
  const wantsLanguage = preferredLanguage === undefined ? null : normalizePreferredLanguage(preferredLanguage, '');
  if (preferredLanguage !== undefined && !wantsLanguage) {
    return res.status(400).json({ error: 'Selected language is not supported.' });
  }
  if (wantsEmail === null && wantsSms === null && wantsPush === null && wantsLanguage === null) {
    return res.status(400).json({ error: 'No preferences specified.' });
  }
  const user = db.prepare(
    'SELECT notifyEmailEnabled, notifySmsEnabled, notifyPushEnabled, preferredLanguage FROM users WHERE id = ?'
  ).get(req.auth.id);
  if (!user) return res.status(404).json({ error: 'Account not found.' });
  const nextEmail = wantsEmail !== null ? wantsEmail : (Number(user.notifyEmailEnabled) === 1);
  const nextSms   = wantsSms   !== null ? wantsSms   : (Number(user.notifySmsEnabled)   === 1);
  const nextPush  = wantsPush  !== null ? wantsPush  : (Number(user.notifyPushEnabled)  === 1);
  const nextPreferredLanguage = wantsLanguage !== null ? wantsLanguage : normalizePreferredLanguage(user.preferredLanguage, 'en');
  if (req.auth.role === 'employee' && !nextPush) {
    const pushLockState = getMandatoryEmployeePushLockState(req.auth.id, req.auth.email);
    if (pushLockState.locked) {
      return res.status(403).json({ error: pushLockState.reason });
    }
  }
  db.prepare(
    'UPDATE users SET notifyEmailEnabled = ?, notifySmsEnabled = ?, notifyPushEnabled = ?, preferredLanguage = ? WHERE id = ?'
  ).run(nextEmail ? 1 : 0, nextSms ? 1 : 0, nextPush ? 1 : 0, nextPreferredLanguage, req.auth.id);
  if (!nextPush) {
    db.prepare('DELETE FROM notification_subscriptions WHERE userId = ?').run(req.auth.id);
  }
  res.json({
    updated: true,
    notificationPreferences: { email: nextEmail, sms: nextSms, push: nextPush },
    preferredLanguage: nextPreferredLanguage,
  });
});

app.get('/api/portal/jobsite/dashboard', authGuard(['jobsite']), (req, res) => {
  const profile = db.prepare('SELECT * FROM jobsite_profiles WHERE userId = ?').get(req.auth.id) || {};
  const jobsiteTrack = getJobsiteIndustryTrack(req.auth.id);

  const jobs = db
    .prepare(
      `SELECT id, title, industry, payRate, schedule, status, statPayEnabled, statPaySignatureName, statPaySignedAt, createdAt
       FROM jobs
       WHERE jobsiteUserId = ?
       ORDER BY createdAt DESC`
    )
    .all(req.auth.id)
    .filter((job) => industryMatchesTrack(job.industry, jobsiteTrack));

  const assignments = db
    .prepare(
      `SELECT
         ja.id,
         ja.status,
        ja.statusReason,
        ja.cancellationType,
        ja.statusUpdatedAt,
         j.title AS jobTitle,
        j.schedule AS jobSchedule,
         j.industry AS jobIndustry,
         u.name AS employeeName,
         u.id AS employeeUserId,
         ep.backgroundStatus AS backgroundStatus,
         (
           SELECT a.position FROM applications a
           WHERE (a.userId = u.id OR a.email = u.email)
           ORDER BY a.createdAt DESC LIMIT 1
         ) AS employeePosition
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       JOIN users u ON u.id = ja.employeeUserId
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE j.jobsiteUserId = ?
       ORDER BY ja.createdAt DESC`
    )
     .all(req.auth.id)
     .filter((assignment) => {
       if (!industryMatchesTrack(assignment.jobIndustry, jobsiteTrack)) return false;
       return getEmployeeOnboardingStatus(assignment.employeeUserId) === 'active';
     });

  const healthIndustries = new Set(['healthcare', 'cna', 'cma', 'rn', 'lpn', 'lvn', 'dietary']);
  const warehouseDocTypes = new Set([
    'resume',
    'id_or_drivers_license',
    'other',
  ]);
  const healthcareDocTypes = new Set([
    'resume',
    'id_or_drivers_license',
    'tuberculosis_screening_tb',
    'hepatitis_b',
    'mmr_varicella',
    'license_or_certification',
    'cpr_bls_certificate',
    'dependent_adult_abuse_training',
    'covid19_vaccine_card',
    'covid19_religious_exemption_form',
    'other',
  ]);

  const workerDocuments = [];
  const workerComplianceForms = [];
  const workerComplianceSeen = new Set();
  assignments.forEach((assignment) => {
    const isHealthcareJob = healthIndustries.has(String(assignment.jobIndustry || '').toLowerCase());
    const allowedTypes = isHealthcareJob ? healthcareDocTypes : warehouseDocTypes;

    const docs = db
      .prepare(
        `SELECT
           id,
           documentType,
           originalName,
           storedName,
           expirationDate,
           createdAt,
            uploadedByRole,
           COALESCE(documentStatus, 'pending') AS documentStatus
         FROM employee_documents
         WHERE userId = ?
         ORDER BY createdAt DESC`
      )
      .all(assignment.employeeUserId)
      .filter((doc) => {
        const type = String(doc.documentType || '').toLowerCase();
        if (type === 'social_security_or_work_authorization') return false;
        if (type === 'background_check' && String(doc.uploadedByRole || '').toLowerCase() !== 'admin') return false;
        if (!allowedTypes.has(type)) return false;
        return true;
      })
      .map((doc) => ({
        ...doc,
        assignmentId: assignment.id,
        employeeUserId: assignment.employeeUserId,
        employeeName: assignment.employeeName,
        employeePosition: assignment.employeePosition,
        backgroundStatus: assignment.backgroundStatus,
        jobTitle: assignment.jobTitle,
        jobIndustry: assignment.jobIndustry,
        fileUrl: `/api/portal/documents/${doc.id}/file`,
      }));

    workerDocuments.push(...docs);

    if (!workerComplianceSeen.has(assignment.employeeUserId)) {
      workerComplianceSeen.add(assignment.employeeUserId);
      const backgroundConsentForm = getEmployeeBackgroundConsentForm(assignment.employeeUserId);
      const hipaaComplianceForm = getEmployeeHipaaComplianceForm(assignment.employeeUserId);
      workerComplianceForms.push({
        employeeUserId: assignment.employeeUserId,
        employeeName: assignment.employeeName,
        employeePosition: assignment.employeePosition,
        jobTitle: assignment.jobTitle,
        backgroundStatus: assignment.backgroundStatus,
        backgroundConsentSigned: Boolean(backgroundConsentForm && backgroundConsentForm.acknowledged),
        backgroundConsentSignedDate: backgroundConsentForm ? backgroundConsentForm.signedDate : null,
        hipaaComplianceSigned: Boolean(hipaaComplianceForm && hipaaComplianceForm.acknowledged),
        hipaaComplianceSignedDate: hipaaComplianceForm ? hipaaComplianceForm.signedDate : null,
        updatedAt: [
          backgroundConsentForm ? backgroundConsentForm.updatedAt : null,
          hipaaComplianceForm ? hipaaComplianceForm.updatedAt : null,
        ].filter(Boolean).sort().slice(-1)[0] || null,
      });
    }
  });

  res.json({
    user: sanitizeUser(req.auth),
    profile: {
      ...profile,
      industryTrack: jobsiteTrack,
    },
    jobs,
    assignments,
    workerDocuments,
    workerComplianceForms,
  });
});

app.post('/api/portal/jobsite/jobs', authGuard(['jobsite']), (req, res) => {
  const { title, industry, payRate, schedule } = req.body;
  const statPayEnabled = isTruthy(req.body && req.body.statPayEnabled) ? 1 : 0;
  const statPaySignatureName = String((req.body && req.body.statPaySignature) || '').trim();
  const jobsiteTrack = getJobsiteIndustryTrack(req.auth.id);

  if (!title || !industry) {
    return res.status(400).json({ error: 'title and industry are required.' });
  }

  if (!industryMatchesTrack(industry, jobsiteTrack)) {
    return res.status(403).json({ error: `This client account is restricted to ${jobsiteTrack} roles.` });
  }

  if (statPayEnabled && statPaySignatureName.length < 2) {
    return res.status(400).json({ error: 'A typed client signature is required to approve STAT PAY.' });
  }

  const info = db
    .prepare(
      `INSERT INTO jobs (
         jobsiteUserId,
         title,
         industry,
         payRate,
         schedule,
         statPayEnabled,
         statPaySignatureName,
         statPaySignedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.auth.id,
      title.trim(),
      industry.trim(),
      payRate || null,
      schedule || null,
      statPayEnabled,
      statPayEnabled ? statPaySignatureName : null,
      statPayEnabled ? new Date().toISOString() : null
    );

  const job = db
    .prepare(
      `SELECT
         j.id,
         j.title,
         j.industry,
         j.payRate,
         j.schedule,
         j.jobsiteUserId,
         u.name AS jobsiteName,
         jp.companyName
       FROM jobs j
       JOIN users u ON u.id = j.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       WHERE j.id = ?`
    )
    .get(info.lastInsertRowid);

  if (job && normalizeText(job.title)) {
    runAsyncTask('notify_open_shift', () => notifyMatchingEmployeesAboutOpenShift(job));
  }

  emitDomainSyncToAdmins(['scheduling', 'full'], ['admin-dashboard', 'jobsite-dashboard']);

  res.status(201).json({ id: info.lastInsertRowid });
});

app.put('/api/portal/jobsite/jobs/:id', authGuard(['jobsite']), (req, res) => {
  const jobId = Number(req.params.id);
  const { title, industry, payRate, schedule, status } = req.body;
  const statPayEnabled = isTruthy(req.body && req.body.statPayEnabled) ? 1 : 0;
  const incomingStatPaySignature = String((req.body && req.body.statPaySignature) || '').trim();
  const jobsiteTrack = getJobsiteIndustryTrack(req.auth.id);

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid job id.' });
  }

  if (!title || !industry) {
    return res.status(400).json({ error: 'title and industry are required.' });
  }

  if (!industryMatchesTrack(industry, jobsiteTrack)) {
    return res.status(403).json({ error: `This client account is restricted to ${jobsiteTrack} roles.` });
  }

  const normalizedStatus = normalizeJobStatus(status, 'open');
  if (!JOB_STATUS_VALUES.has(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid job status.' });
  }

  const existing = db
    .prepare('SELECT id, statPaySignatureName FROM jobs WHERE id = ? AND jobsiteUserId = ?')
    .get(jobId, req.auth.id);

  if (!existing) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const resolvedSignature = incomingStatPaySignature || String(existing.statPaySignatureName || '').trim();
  if (statPayEnabled && resolvedSignature.length < 2) {
    return res.status(400).json({ error: 'A typed client signature is required to approve STAT PAY.' });
  }

  db.prepare(
    `UPDATE jobs
      SET title = ?,
          industry = ?,
          payRate = ?,
          schedule = ?,
          status = ?,
          statPayEnabled = ?,
          statPaySignatureName = ?,
          statPaySignedAt = ?
     WHERE id = ? AND jobsiteUserId = ?`
  ).run(
    String(title).trim(),
    String(industry).trim(),
    payRate ? String(payRate).trim() : null,
    schedule ? String(schedule).trim() : null,
    normalizedStatus,
    statPayEnabled,
    statPayEnabled ? resolvedSignature : null,
    statPayEnabled ? new Date().toISOString() : null,
    jobId,
    req.auth.id
  );

  res.json({ id: jobId, updated: true });
});

app.patch('/api/portal/jobsite/jobs/:id/status', authGuard(['jobsite']), (req, res) => {
  const jobId = Number(req.params.id);
  const normalizedStatus = normalizeJobStatus(req.body && req.body.status, '');

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid job id.' });
  }

  if (!JOB_STATUS_VALUES.has(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid job status.' });
  }

  const info = db
    .prepare('UPDATE jobs SET status = ? WHERE id = ? AND jobsiteUserId = ?')
    .run(normalizedStatus, jobId, req.auth.id);

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  res.json({ id: jobId, status: normalizedStatus });
});

app.patch('/api/portal/jobsite/jobs/:id/stat-pay', authGuard(['jobsite']), (req, res) => {
  const jobId = Number(req.params.id);
  const statPayEnabled = isTruthy(req.body && req.body.statPayEnabled) ? 1 : 0;
  const statPaySignatureName = String((req.body && req.body.signature) || '').trim();

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid job id.' });
  }

  if (statPayEnabled && statPaySignatureName.length < 2) {
    return res.status(400).json({ error: 'A typed client signature is required to approve STAT PAY.' });
  }

  const info = db
    .prepare(
      `UPDATE jobs
       SET statPayEnabled = ?,
           statPaySignatureName = ?,
           statPaySignedAt = ?
       WHERE id = ? AND jobsiteUserId = ?`
    )
    .run(
      statPayEnabled,
      statPayEnabled ? statPaySignatureName : null,
      statPayEnabled ? new Date().toISOString() : null,
      jobId,
      req.auth.id
    );

  if (info.changes === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const updated = db.prepare('SELECT id, status, statPaySignatureName, statPaySignedAt FROM jobs WHERE id = ?').get(jobId);
  const activeAssignments = db
    .prepare(
      `SELECT employeeUserId
       FROM job_assignments
       WHERE jobId = ?
         AND status IN ('assigned', 'approved', 'completed', 'no_call_no_show')`
    )
    .all(jobId);
  const notifyUserIds = new Set(activeAssignments.map((row) => Number(row.employeeUserId)).filter((id) => Number.isInteger(id) && id > 0));

  notifyUserIds.forEach((employeeUserId) => {
    createPortalNotification({
      userId: employeeUserId,
      actorUserId: req.auth.id,
      category: 'shift',
      title: statPayEnabled ? 'Shift marked STAT PAY' : 'STAT PAY removed',
      body: statPayEnabled
        ? `Your shift has been marked as STAT PAY by the client and signed by ${statPaySignatureName}.`
        : 'STAT PAY was removed from your shift by the client.',
      url: buildPortalPath('/portal-employee'),
      syncDomains: ['employee-dashboard', 'timesheets'],
    });
  });

  getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
    createPortalNotification({
      userId: admin.id,
      actorUserId: req.auth.id,
      category: 'shift',
      title: statPayEnabled ? 'Client marked STAT PAY' : 'Client removed STAT PAY',
      body: statPayEnabled
        ? `Shift #${jobId} is now STAT PAY (signed by ${statPaySignatureName}).`
        : `Shift #${jobId} is no longer STAT PAY.`,
      url: buildPortalPath(getPortalPathForUser(admin)),
      syncDomains: ['admin-dashboard', 'timesheets'],
    });
  });

  res.json({
    id: jobId,
    statPayEnabled: Boolean(statPayEnabled),
    statPaySignatureName: updated ? updated.statPaySignatureName : null,
    statPaySignedAt: updated ? updated.statPaySignedAt : null,
    status: updated ? updated.status : null,
  });
});

app.patch('/api/portal/jobsite/assignments/:id/status', authGuard(['jobsite']), (req, res) => {
  const assignmentId = Number(req.params.id);
  const status = normalizeAssignmentStatus(req.body && req.body.status, '');
  const statusReason = String((req.body && req.body.reason) || '').trim();

  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    return res.status(400).json({ error: 'Invalid assignment id.' });
  }
  if (!ASSIGNMENT_STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: 'Invalid assignment status.' });
  }
  if ((status === 'cancelled' || status === 'no_call_no_show') && !statusReason) {
    return res.status(400).json({ error: 'A reason is required for this status update.' });
  }

  const assignment = db.prepare(
    `SELECT ja.id, ja.jobId, ja.employeeUserId, j.jobsiteUserId
     FROM job_assignments ja
     JOIN jobs j ON j.id = ja.jobId
     WHERE ja.id = ? AND j.jobsiteUserId = ?`
  ).get(assignmentId, req.auth.id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  db.prepare(
    `UPDATE job_assignments
     SET status = ?,
         statusReason = ?,
         statusUpdatedByUserId = ?,
         statusUpdatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(status, statusReason || null, req.auth.id, assignmentId);

  if (status === 'cancelled') {
    const activeCount = db.prepare(
      `SELECT COUNT(*) AS count
       FROM job_assignments
       WHERE jobId = ?
         AND status IN ('assigned', 'approved')`
    ).get(assignment.jobId);
    if (!activeCount || Number(activeCount.count) === 0) {
      db.prepare("UPDATE jobs SET status = 'open' WHERE id = ?").run(assignment.jobId);
    }
  }

  createPortalNotification({
    userId: assignment.employeeUserId,
    actorUserId: req.auth.id,
    category: 'shift',
    title: 'Shift status updated by client',
    body: `Your shift status is now ${status.replaceAll('_', ' ')}.${statusReason ? ` Reason: ${statusReason}` : ''}`,
    url: buildPortalPath('/portal-employee'),
    syncDomains: ['employee-dashboard', 'timesheets'],
  });

  getActiveAdminUsersForScopes(['scheduling']).forEach((admin) => {
    createPortalNotification({
      userId: admin.id,
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Client updated assignment status',
      body: `Assignment #${assignmentId} is now ${status.replaceAll('_', ' ')}.${statusReason ? ` Reason: ${statusReason}` : ''}`,
      url: buildPortalPath(getPortalPathForUser(admin)),
      syncDomains: ['admin-dashboard'],
    });
  });

  res.json({ id: assignmentId, status, reason: statusReason || null });
});

app.patch('/api/portal/jobsite/profile', authGuard(['jobsite']), (req, res) => {
  const { companyName, contactName, phone, address, city, state, zip } = req.body || {};

  const nextCompanyName = String(companyName || '').trim();
  const nextContactName = String(contactName || '').trim();
  const phoneInput = String(phone || '').trim();
  const nextPhone = phoneInput ? normalizePhoneNumber(phoneInput) : null;
  const nextAddressLine = normalizeMultiLineText(address, 160);
  const nextCity = normalizeSingleLineText(city, 80);
  const nextState = normalizeSingleLineText(state, 2).toUpperCase();
  const nextZip = normalizeSingleLineText(zip, 10);

  if (!nextCompanyName) {
    return res.status(400).json({ error: 'Company name cannot be empty.' });
  }

  if (!nextContactName) {
    return res.status(400).json({ error: 'Primary contact name cannot be empty.' });
  }

  if (phoneInput && !nextPhone) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const addressValidationError = validateStructuredAddress(
    nextAddressLine,
    nextCity,
    nextState,
    nextZip,
    'Street address, city, state, and ZIP code are required when updating physical address.'
  );
  if (addressValidationError) {
    return res.status(400).json({ error: addressValidationError });
  }

  db.prepare(
    `UPDATE jobsite_profiles
     SET companyName = ?, contactName = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?
     WHERE userId = ?`
  ).run(nextCompanyName, nextContactName, nextPhone, nextAddressLine || null, nextCity || null, nextState || null, nextZip || null, req.auth.id);

  return res.json({
    updated: true,
    profile: {
      companyName: nextCompanyName,
      contactName: nextContactName,
      phone: nextPhone,
      address: nextAddressLine || null,
      city: nextCity || null,
      state: nextState || null,
      zip: nextZip || null,
    },
  });
});

app.delete('/api/portal/jobsite/profile', authGuard(['jobsite']), (req, res) => {
  const currentPasscode = normalizePasscode(req.body && req.body.passcode);

  if (!currentPasscode) {
    return res.status(400).json({ error: 'A valid 4-digit passcode is required to withdraw profile.' });
  }

  const jobsite = db
    .prepare('SELECT id, passwordHash, passwordSalt, passcodeHash, passcodeSalt FROM users WHERE id = ? AND role = ?')
    .get(req.auth.id, 'jobsite');

  if (!jobsite) {
    return res.status(404).json({ error: 'Jobsite account not found.' });
  }

  if (!jobsite.passcodeHash || !jobsite.passcodeSalt) {
    return res.status(400).json({ error: 'Set a 4-digit passcode in Account settings before withdrawing your profile.' });
  }

  if (!verifyPassword(currentPasscode, jobsite.passcodeSalt, jobsite.passcodeHash)) {
    return res.status(401).json({ error: 'Passcode is incorrect.' });
  }

  const info = db.prepare('DELETE FROM users WHERE id = ? AND role = ?').run(req.auth.id, 'jobsite');
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Jobsite account not found.' });
  }

  return res.json({ withdrawn: true });
});

app.get('/api/portal/admin/dashboard', authGuard(['admin']), (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const employees = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employee'").get().count;
  const jobsites = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'jobsite'").get().count;
  const jobsOpen = db.prepare("SELECT COUNT(*) as count FROM jobs WHERE status = 'open'").get().count;
  const applications = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'employee' AND isActive = 1")
    .get().count;

  res.json({
    user: sanitizeUser(req.auth),
    stats: {
      totalUsers,
      employees,
      jobsites,
      jobsOpen,
      applications,
    },
  });
});

app.get('/api/admin/users', authGuard(['admin']), (req, res) => {
  try {
    const users = db
      .prepare(
        `SELECT u.id, u.name, u.email, u.role, u.isActive, u.createdAt, u.lastLoginAt
         FROM users u
         ORDER BY u.createdAt DESC`
      )
      .all()
      .map((user) => {
        const normalizedRole = String(user.role || '').trim().toLowerCase();
        if (normalizedRole === 'jobsite') {
          return { ...user, industryTrack: getJobsiteIndustryTrack(user.id) };
        }
        if (normalizedRole === 'employee') {
          return { ...user, industryTrack: getEmployeeIndustryTrack(user.id, user.email) };
        }
        return { ...user, industryTrack: '' };
      });

    res.json({ data: users });
  } catch (error) {
    console.error('[admin-users] failed to load admin users', {
      path: req.originalUrl || req.path,
      adminUserId: req.auth && req.auth.id,
      message: error && error.message ? error.message : String(error),
      stack: error && error.stack ? error.stack : null,
    });
    res.status(500).json({ error: 'Failed to load admin users.' });
  }
});

app.get('/api/admin/diagnostics/timesheet-reminders', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['scheduling'])) {
    return res.status(403).json({ error: 'Forbidden for this portal scope.' });
  }

  const dateText = String(req.query.date || '').trim();
  const parsedDate = dateText && /^\d{4}-\d{2}-\d{2}$/.test(dateText)
    ? new Date(`${dateText}T12:00:00`)
    : new Date();

  if (Number.isNaN(parsedDate.getTime())) {
    return res.status(400).json({ error: 'date must be YYYY-MM-DD.' });
  }

  const weekOffset = Number.parseInt(String(req.query.weekOffset || '0'), 10);
  if (!Number.isInteger(weekOffset)) {
    return res.status(400).json({ error: 'weekOffset must be an integer.' });
  }

  const reminderTypeRaw = String(req.query.reminderType || '').trim().toLowerCase();
  const reminderType = reminderTypeRaw === 'paper_timesheet_monday_8am'
    ? 'paper_timesheet_monday_8am'
    : reminderTypeRaw === 'paper_timesheet_sunday_12pm'
      ? 'paper_timesheet_sunday_12pm'
      : 'paper_timesheet_sunday_12pm';

  const window = getWorkWeekWindow(parsedDate, weekOffset);
  const eligibleEmployees = getEmployeesWithPendingPaperTimesheetReminderForWeek(window.periodStart, window.periodEnd);

  const employees = eligibleEmployees.map((employee) => {
    const workedDates = db
      .prepare(
        `SELECT clockInAt
         FROM employee_time_clock_entries
         WHERE employeeUserId = ?
           AND clockOutAt IS NOT NULL
           AND (timesheetId IS NULL OR timesheetId = 0)
         ORDER BY clockInAt ASC`
      )
      .all(employee.id)
      .map((row) => formatLocalDateYmd(parseStoredDateTime(row.clockInAt)))
      .filter((workedDay) => Boolean(workedDay && workedDay >= window.periodStart && workedDay <= window.periodEnd));

    const lockState = getMandatoryEmployeePushLockState(employee.id, employee.email, parsedDate);
    const reminderLogged = db.prepare(
      `SELECT createdAt
       FROM timesheet_reminder_logs
       WHERE userId = ? AND reminderType = ? AND weekKey = ?
       ORDER BY createdAt DESC
       LIMIT 1`
    ).get(employee.id, reminderType, window.weekKey);

    return {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      workedDates: Array.from(new Set(workedDates)),
      reminderAlreadyLogged: Boolean(reminderLogged),
      reminderLoggedAt: reminderLogged ? reminderLogged.createdAt : null,
      mandatoryPushLock: Boolean(lockState.locked),
      mandatoryPushLockSource: lockState.source || '',
      mandatoryPushLockReason: lockState.reason || '',
    };
  });

  res.json({
    evaluatedAt: parsedDate.toISOString(),
    reminderType,
    weekOffset,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    weekKey: window.weekKey,
    eligibleCount: employees.length,
    pendingCount: employees.filter((employee) => !employee.reminderAlreadyLogged).length,
    employees,
  });
});

app.patch('/api/admin/users/:id/industry-track', authGuard(['admin']), (req, res) => {
  const userId = Number(req.params.id);
  const track = String(req.body && req.body.industryTrack || '').trim().toLowerCase();

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }
  if (!['warehouse', 'healthcare'].includes(track)) {
    return res.status(400).json({ error: 'industryTrack must be warehouse or healthcare.' });
  }

  const targetUser = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }
  if (targetUser.role !== 'jobsite') {
    return res.status(400).json({ error: 'Industry track can only be changed for jobsite users.' });
  }

  const profileExists = db.prepare('SELECT userId FROM jobsite_profiles WHERE userId = ?').get(userId);
  if (profileExists) {
    db.prepare('UPDATE jobsite_profiles SET industryTrack = ? WHERE userId = ?').run(track, userId);
  } else {
    db.prepare('INSERT INTO jobsite_profiles (userId, industryTrack) VALUES (?, ?)').run(userId, track);
  }

  logAdminAction(req.auth.id, 'user_industry_track_updated', JSON.stringify({ userId, track }));
  return res.json({ id: userId, industryTrack: track });
});

app.delete('/api/admin/users/:id', authGuard(['admin']), (req, res) => {
  const userId = Number(req.params.id);
  const currentCredential = getSubmittedCredential(req.body);
  const hasValidAdminCredential = verifyAdminCredentialForSensitiveAction(req.auth.id, currentCredential);

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (userId === req.auth.id) {
    return res.status(403).json({ error: 'You cannot delete your own admin account.' });
  }

  const targetUser = db
    .prepare('SELECT id, name, email, role FROM users WHERE id = ?')
    .get(userId);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  if (targetUser.role === 'admin') {
    return res.status(403).json({ error: 'Admin users cannot be deleted.' });
  }

  if (targetUser.role === 'employee') {
    if (!currentCredential) {
      return res.status(400).json({ error: 'Admin password or 4-digit passcode is required to delete an employee.' });
    }

    if (!hasValidAdminCredential) {
      return res.status(401).json({ error: 'Admin password or passcode is incorrect.' });
    }
  }

  if (!requireSensitiveActionAuthorization(req, res, 'admin-user-delete', currentCredential)) {
    return;
  }

  const docs = db
    .prepare('SELECT storedName FROM employee_documents WHERE userId = ?')
    .all(userId);

  const info = db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'User not found.' });
  }

  docs.forEach((doc) => {
    if (!doc || !doc.storedName) return;
    removeStoredFileLater(doc.storedName);
  });

  logAdminAction(
    req.auth.id,
    'user_deleted',
    JSON.stringify({ deletedUserId: targetUser.id, deletedUserEmail: targetUser.email, deletedUserRole: targetUser.role })
  );

  return res.json({ deleted: true, id: targetUser.id });
});

app.post('/api/admin/users/:id/reset-password', authGuard(['admin']), (req, res) => {
  const userId = Number(req.params.id);
  const newPassword = String(req.body.newPassword || '');
  const currentCredential = getSubmittedCredential(req.body);
  const shouldRemovePasscode = isTruthy(req.body.removePasscode);
  const hasValidAdminCredential = verifyAdminCredentialForSensitiveAction(req.auth.id, currentCredential);

  if (!Number.isInteger(userId) || userId < 1) {
    return res.status(400).json({ error: 'Invalid user id.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  if (currentCredential && !hasValidAdminCredential) {
    return res.status(401).json({ error: 'Admin password or passcode is incorrect.' });
  }

  if (!requireSensitiveActionAuthorization(req, res, 'admin-password-reset', currentCredential)) {
    return;
  }

  const targetUser = db
    .prepare('SELECT id, email, role, passcodeHash, passcodeSalt FROM users WHERE id = ?')
    .get(userId);

  if (!targetUser) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const passwordRecord = hashPassword(newPassword);
  const nextPasscodeHash = shouldRemovePasscode ? null : targetUser.passcodeHash;
  const nextPasscodeSalt = shouldRemovePasscode ? null : targetUser.passcodeSalt;

  db.prepare(
    'UPDATE users SET passwordHash = ?, passwordSalt = ?, passcodeHash = ?, passcodeSalt = ? WHERE id = ?'
  ).run(
    passwordRecord.hash,
    passwordRecord.salt,
    nextPasscodeHash,
    nextPasscodeSalt,
    userId
  );

  logAdminAction(
    req.auth.id,
    'user_password_reset',
    JSON.stringify({ resetUserId: targetUser.id, resetUserEmail: targetUser.email, resetUserRole: targetUser.role, passcodeCleared: shouldRemovePasscode })
  );

  return res.json({ reset: true, id: targetUser.id });
});

app.get('/api/admin/employees', authGuard(['admin']), (req, res) => {
  const employees = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.isActive,
         ep.phone,
        ep.address,
        ep.city,
        ep.state,
        ep.zip,
         ep.backgroundStatus,
         ep.skills,
         ep.certifications
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.role = 'employee'
       ORDER BY u.createdAt DESC`
    )
    .all()
    .map((employee) => {
      const applications = db
        .prepare(
          `SELECT id, industry, position, createdAt
           FROM applications
           WHERE userId = ? OR email = ?
           ORDER BY createdAt DESC`
        )
        .all(employee.id, employee.email);

      const documents = db
        .prepare(
          `SELECT
             id,
             documentType,
             originalName,
             expirationDate,
             documentStatus,
             uploadedByRole,
             createdAt,
             storedName
           FROM employee_documents
           WHERE userId = ?
           ORDER BY createdAt DESC`
        )
        .all(employee.id)
        .map((doc) => ({
          ...doc,
          fileUrl: `/api/portal/documents/${doc.id}/file`,
        }));

      const industry = inferIndustryFromApplications(applications);
      const track = industryToTrack(industry);
      const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
      const onboardingStatus = computeEmployeeOnboardingStatus(employee.isActive, compliance, employee.backgroundStatus);
      const latestApp = applications[0] || {};

      return {
        ...employee,
        industry: track,
        position: latestApp.position || null,
        onboardingStatus,
        complianceComplete: Boolean(compliance.isComplete),
      };
    })
    .filter((employee) => canAdminViewEmployee(req.auth, employee.id, employee.industry));

  res.json({ data: employees });
});

app.get('/api/admin/employees/:id/profile', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.id);

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  const employee = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.isActive,
         u.createdAt,
         ep.phone,
        ep.address,
        ep.city,
        ep.state,
        ep.zip,
         ep.backgroundStatus,
         ep.skills,
         ep.certifications
       FROM users u
       LEFT JOIN employee_profiles ep ON ep.userId = u.id
       WHERE u.id = ? AND u.role = 'employee'
       LIMIT 1`
    )
    .get(employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const applications = db
    .prepare(
      `SELECT
         id,
         fullName,
         email,
         phone,
         industry,
         position,
         certificationAccepted,
         createdAt
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);

  const industry = inferIndustryFromApplications(applications);
  const track = industryToTrack(industry);

  // Check if admin has permission to view this employee
  if (!canAdminViewEmployee(req.auth, employeeId, track)) {
    return res.status(403).json({ error: 'Forbidden - employee is outside your assigned scope.' });
  }

  const documents = db
    .prepare(
      `SELECT
         id,
         documentType,
         originalName,
         mimeType,
         fileSize,
         expirationDate,
         documentStatus,
         uploadedByRole,
         createdAt,
         storedName
       FROM employee_documents
       WHERE userId = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id)
    .map((doc) => ({
      ...doc,
      fileUrl: `/api/portal/documents/${doc.id}/file`,
    }));

  const { compliance } = evaluateEmployeeCompliance(employee.id, industry, documents);
  const backgroundConsentForm = getEmployeeBackgroundConsentForm(employee.id, { includeMeta: true });
  const hipaaComplianceForm = getEmployeeHipaaComplianceForm(employee.id, { includeMeta: true });
  const handbookForm = getEmployeeHandbookForm(employee.id, { includeMeta: true });
  const compensationAgreementForm = getEmployeeCompensationAgreementForm(employee.id, { includeMeta: true });
  const onboardingStatus = computeEmployeeOnboardingStatus(employee.isActive, compliance, employee.backgroundStatus);

  const ssnRow = db.prepare('SELECT ssnEncrypted FROM employee_profiles WHERE userId = ?').get(employeeId);

  const w4Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           legalName,
           addressLine,
           cityStateZip,
           filingStatus,
           multipleJobs,
           dependentsAmount,
           otherIncome,
           deductions,
           extraWithholding,
           signatureName,
           signedDate,
           createdAt,
           updatedAt
         FROM employee_w4_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(employeeId) || null;

  const w9Form =
    db
      .prepare(
        `SELECT
           id,
           userId,
           name,
           businessName,
           taxClassification,
           llcType,
           otherClassification,
           exemptPayeeCode,
           fatcaExemptionCode,
           addressLine,
           cityStateZip,
           tin,
           signatureName,
           signedDate,
           createdAt,
           updatedAt
         FROM employee_w9_forms
         WHERE userId = ?
         LIMIT 1`
      )
      .get(employeeId) || null;

  res.json({
    employee,
    applications,
    documents,
    compliance,
    onboardingStatus,
    ssnOnFile: Boolean(ssnRow && ssnRow.ssnEncrypted),
    w4Form,
    w9Form,
    backgroundConsentForm,
    hipaaComplianceForm,
    handbookForm,
    compensationAgreementForm,
  });
});

async function handleEmployeeDocumentReminderRequest(req, res) {
  const employeeId = Number(req.params.employeeId);
  const documentType = String(req.body && req.body.documentType ? req.body.documentType : '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  if (!documentType) {
    return res.status(400).json({ error: 'documentType is required.' });
  }

  const employee = db.prepare("SELECT id, email FROM users WHERE id = ? AND role = 'employee'").get(employeeId);
  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const applications = db
    .prepare(
      `SELECT industry
       FROM applications
       WHERE userId = ? OR email = ?
       ORDER BY createdAt DESC`
    )
    .all(employee.id, employee.email);
  const industry = inferIndustryFromApplications(applications);
  const checklistTypes = new Set(
    profileForIndustry(industry)
      .filter((rule) => Boolean(rule.required))
      .map((rule) => String(rule.type || '').toLowerCase())
  );
  if (!checklistTypes.has(documentType)) {
    return res.status(400).json({ error: 'Document type is not applicable for this employee profile.' });
  }

  const lockKey = tryAcquireManualDocumentReminderLock(employee.id, documentType);
  if (!lockKey) {
    return res.status(409).json({ error: 'A reminder for this document is already being sent.' });
  }

  try {
    const reminderResult = await sendEmployeeDocumentReminder({
      employeeUserId: employee.id,
      actorUserId: req.auth.id,
      documentType,
      reason: 'admin_manual',
      weekKey: null,
    });

    logAdminAction(
      req.auth.id,
      'employee_document_reminder_sent',
      JSON.stringify({ employeeId: employee.id, documentType, delivery: reminderResult.delivery || null })
    );

    return res.json({
      sent: Boolean(reminderResult.sent),
      employeeId: employee.id,
      documentType,
      delivery: reminderResult.delivery || {},
      directUrl: reminderResult.directUrl || null,
      fallbackUrl: reminderResult.fallbackUrl || null,
    });
  } finally {
    releaseManualDocumentReminderLock(lockKey);
  }
}

app.post('/api/admin/employees/:employeeId/document-reminders', authGuard(['admin']), (req, res) => {
  handleEmployeeDocumentReminderRequest(req, res).catch((error) => {
    logCaughtException('admin employee document reminder', error, {
      employeeId: req.params.employeeId,
      actorUserId: req.auth && req.auth.id,
      documentType: req.body && req.body.documentType,
    });
    res.status(500).json({ error: 'Failed to send reminder.' });
  });
});

app.post('/api/portal/onboarding/employees/:employeeId/document-reminders', authGuard(['admin']), (req, res) => {
  if (!hasAdminScopeAccess(req.auth, ['onboarding'])) {
    return res.status(403).json({ error: 'Forbidden - onboarding scope required.' });
  }
  handleEmployeeDocumentReminderRequest(req, res).catch((error) => {
    logCaughtException('onboarding employee document reminder', error, {
      employeeId: req.params.employeeId,
      actorUserId: req.auth && req.auth.id,
      documentType: req.body && req.body.documentType,
    });
    res.status(500).json({ error: 'Failed to send reminder.' });
  });
});

app.put('/api/admin/employees/:employeeId/documents/:docId/review', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const docId = Number(req.params.docId);
  const action = String(req.body.action || '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1 || !Number.isInteger(docId) || docId < 1) {
    return res.status(400).json({ error: 'Invalid employee or document id.' });
  }
  if (!['approved', 'denied'].includes(action)) {
    return res.status(400).json({ error: 'action must be \'approved\' or \'denied\'.' });
  }

  const doc = db
    .prepare('SELECT id, documentType, userId FROM employee_documents WHERE id = ? AND userId = ?')
    .get(docId, employeeId);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found for this employee.' });
  }

  db.prepare('UPDATE employee_documents SET documentStatus = ? WHERE id = ?').run(action, docId);
  markNotificationsCompletedByTask('document_review', docId);

  runAsyncTask('notify_employee_doc_review', () =>
    notifyEmployeeAboutDocumentReview(employeeId, docId, doc.documentType, action)
  );

  const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);
  res.json({ id: docId, documentStatus: action, employeeOnboardingStatus: newStatus });
});

app.get('/api/admin/excuse-forms', authGuard(['admin']), (req, res) => {
  const forms = db.prepare(
    `SELECT
       ef.id,
       ef.employeeUserId,
       ef.assignmentId,
       ef.jobId,
       ef.cancellationType,
       ef.reason,
       ef.doctorNoteDocumentId,
       ef.shiftStartAt,
       ef.cancelledAt,
       ef.status,
       ef.adminSignature,
       ef.reviewedByUserId,
       ef.reviewedAt,
       u.name AS employeeName,
       u.email AS employeeEmail,
       j.title AS jobTitle,
       j.schedule AS jobSchedule,
       d.originalName AS doctorNoteName,
       d.storedName AS doctorNoteStoredName,
       d.documentStatus AS doctorNoteStatus
     FROM employee_excuse_forms ef
     JOIN users u ON u.id = ef.employeeUserId
     LEFT JOIN jobs j ON j.id = ef.jobId
     LEFT JOIN employee_documents d ON d.id = ef.doctorNoteDocumentId
     ORDER BY ef.cancelledAt DESC, ef.id DESC`
  ).all();

  res.json({
    data: forms.map((item) => ({
      ...item,
      doctorNoteFileUrl: item.doctorNoteDocumentId ? `/api/portal/documents/${item.doctorNoteDocumentId}/file` : null,
    })),
  });
});

app.post('/api/admin/excuse-forms/:id/review', authGuard(['admin']), (req, res) => {
  const excuseFormId = Number(req.params.id);
  const action = String((req.body && req.body.action) || '').trim().toLowerCase();
  const signature = String((req.body && req.body.signature) || '').trim();

  if (!Number.isInteger(excuseFormId) || excuseFormId < 1) {
    return res.status(400).json({ error: 'Invalid excuse form id.' });
  }
  if (!['approved', 'denied'].includes(action)) {
    return res.status(400).json({ error: 'action must be approved or denied.' });
  }
  if (action === 'approved' && signature.length < 2) {
    return res.status(400).json({ error: 'A typed admin signature is required to approve.' });
  }

  const form = db.prepare(
    `SELECT id, employeeUserId, doctorNoteDocumentId, status
     FROM employee_excuse_forms
     WHERE id = ?`
  ).get(excuseFormId);

  if (!form) {
    return res.status(404).json({ error: 'Excuse form not found.' });
  }
  if (String(form.status || '').toLowerCase() !== 'pending') {
    return res.status(409).json({ error: 'Excuse form has already been reviewed.' });
  }

  db.prepare(
    `UPDATE employee_excuse_forms
     SET status = ?,
         adminSignature = ?,
         reviewedByUserId = ?,
         reviewedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(action, action === 'approved' ? signature : null, req.auth.id, excuseFormId);

  if (Number.isInteger(Number(form.doctorNoteDocumentId)) && Number(form.doctorNoteDocumentId) > 0) {
    db.prepare('UPDATE employee_documents SET documentStatus = ? WHERE id = ?').run(action, Number(form.doctorNoteDocumentId));
  }

  createPortalNotification({
    userId: Number(form.employeeUserId),
    actorUserId: req.auth.id,
    category: 'document',
    title: action === 'approved' ? 'Excuse form approved' : 'Excuse form denied',
    body: action === 'approved'
      ? 'Your excuse form was approved and signed by admin.'
      : 'Your excuse form was denied by admin.',
    url: buildPortalPath('/portal-employee'),
    syncDomains: ['employee-dashboard', 'documents'],
  });

  logAdminAction(req.auth.id, 'employee_excuse_form_reviewed', JSON.stringify({ excuseFormId, action }));
  res.json({ id: excuseFormId, status: action });
});

app.patch('/api/admin/employees/:employeeId/background-status', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const status = String(req.body.status || '').trim().toLowerCase();

  if (!Number.isInteger(employeeId) || employeeId < 1) {
    return res.status(400).json({ error: 'Invalid employee id.' });
  }

  if (!['passed', 'needs_further_attention'].includes(status)) {
    return res.status(400).json({ error: 'status must be passed or needs_further_attention.' });
  }

  const employee = db
    .prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'")
    .get(employeeId);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  db.prepare('UPDATE employee_profiles SET backgroundStatus = ? WHERE userId = ?').run(status, employeeId);

  logAdminAction(
    req.auth.id,
    'employee_background_status_updated',
    JSON.stringify({ employeeId, status })
  );

  const newStatus = checkAndAutoActivateEmployee(employeeId, req.auth.id);
  runAsyncTask('notify_employee_bg_status_admin', () =>
    notifyEmployeeAboutBackgroundStatusChange(employeeId, status)
  );
  return res.json({ employeeId, status, employeeOnboardingStatus: newStatus });
});

app.get('/api/admin/jobs', authGuard(['admin']), (req, res) => {
  const jobs = db
    .prepare(
      `SELECT
         j.id,
         j.title,
         j.industry,
         j.payRate,
         j.schedule,
         j.status,
         j.statPayEnabled,
         j.statPaySignatureName,
         j.statPaySignedAt,
         j.createdAt,
         j.jobsiteUserId,
         u.name AS jobsiteName,
        jp.companyName,
         jp.address AS clientAddress,
         CASE
           WHEN EXISTS (
             SELECT 1
             FROM job_assignments ja
             WHERE ja.jobId = j.id
                AND ja.status IN ('assigned', 'approved')
           ) THEN 'Assigned'
           ELSE 'Unassigned'
         END AS assignmentCategory,
         (
           SELECT uAssigned.name
           FROM job_assignments jaAssigned
           JOIN users uAssigned ON uAssigned.id = jaAssigned.employeeUserId
           WHERE jaAssigned.jobId = j.id
             AND jaAssigned.status IN ('assigned', 'approved')
           ORDER BY jaAssigned.createdAt DESC
           LIMIT 1
         ) AS assignedEmployeeName,
         (
           SELECT jaAssigned.id
           FROM job_assignments jaAssigned
           WHERE jaAssigned.jobId = j.id
             AND jaAssigned.status IN ('assigned', 'approved')
           ORDER BY jaAssigned.createdAt DESC
           LIMIT 1
         ) AS activeAssignmentId,
         (
           SELECT jaAssigned.status
           FROM job_assignments jaAssigned
           WHERE jaAssigned.jobId = j.id
             AND jaAssigned.status IN ('assigned', 'approved')
           ORDER BY jaAssigned.createdAt DESC
           LIMIT 1
         ) AS activeAssignmentStatus,
         (
           SELECT jaAssigned.statusReason
           FROM job_assignments jaAssigned
           WHERE jaAssigned.jobId = j.id
             AND jaAssigned.status IN ('assigned', 'approved')
           ORDER BY jaAssigned.createdAt DESC
           LIMIT 1
         ) AS activeAssignmentReason,
         (
           SELECT ts.status
           FROM job_assignments jaTimesheet
           JOIN timesheets ts ON ts.assignmentId = jaTimesheet.id
           WHERE jaTimesheet.jobId = j.id
           ORDER BY ts.updatedAt DESC, ts.id DESC
           LIMIT 1
         ) AS latestTimesheetStatus
       FROM jobs j
       JOIN users u ON u.id = j.jobsiteUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       ORDER BY j.createdAt DESC`
    )
    .all();

  res.json({ data: jobs });
});

app.patch('/api/admin/jobs/:id/status', authGuard(['admin']), (req, res) => {
  const jobId = Number(req.params.id);
  const status = normalizeJobStatus(req.body && req.body.status, '');

  if (!Number.isInteger(jobId) || jobId < 1) {
    return res.status(400).json({ error: 'Invalid job id.' });
  }
  if (!JOB_STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: 'Invalid job status.' });
  }

  const info = db.prepare('UPDATE jobs SET status = ? WHERE id = ?').run(status, jobId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Job not found.' });
  }

  const job = db.prepare('SELECT jobsiteUserId FROM jobs WHERE id = ?').get(jobId);

  logAdminAction(req.auth.id, 'job_status_updated', JSON.stringify({ jobId, status }));

  const assignmentUsers = db
    .prepare(
      `SELECT DISTINCT employeeUserId
       FROM job_assignments
       WHERE jobId = ?`
    )
    .all(jobId);

  assignmentUsers.forEach((row) => {
    const employeeUserId = Number(row.employeeUserId);
    if (!Number.isInteger(employeeUserId) || employeeUserId < 1) return;
    createPortalNotification({
      userId: employeeUserId,
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Shift status updated by admin',
      body: `Shift #${jobId} is now ${status}.`,
      url: buildPortalPath('/portal-employee'),
      syncDomains: ['employee-dashboard'],
    });
  });

  if (job && Number.isInteger(Number(job.jobsiteUserId)) && Number(job.jobsiteUserId) > 0) {
    createPortalNotification({
      userId: Number(job.jobsiteUserId),
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Shift status updated by admin',
      body: `Shift #${jobId} is now ${status}.`,
      url: buildPortalPath('/portal-jobsite'),
      syncDomains: ['jobsite-dashboard'],
    });
  }

  res.json({ id: jobId, status });
});

function getContractRecordById(contractId) {
  return db.prepare(
    `SELECT
       c.*,
       u.name AS clientUserName,
       jp.companyName AS clientCompanyName,
       jp.contactName AS clientContactName
     FROM contracts c
     JOIN users u ON u.id = c.jobsiteUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
     WHERE c.id = ?`
  ).get(contractId);
}

app.get('/api/admin/contracts/:id', authGuard(['admin']), (req, res) => {
  const contractId = Number(req.params.id);
  if (!Number.isInteger(contractId) || contractId < 1) {
    return res.status(400).json({ error: 'Invalid contract id.' });
  }
  const contract = getContractRecordById(contractId);
  if (!contract) return res.status(404).json({ error: 'Contract not found.' });
  return res.json({ ...contract, fileUrl: `/api/contracts/${contract.id}/file` });
});

app.get('/api/admin/contracts', authGuard(['admin']), (req, res) => {
  const requestedTrack = String(req.query.industryTrack || '').trim().toLowerCase();
  const values = [];
  let whereClause = '';
  if (requestedTrack === 'warehouse' || requestedTrack === 'healthcare') {
    whereClause = 'WHERE c.industryTrack = ?';
    values.push(requestedTrack);
  }

  const data = db.prepare(
    `SELECT
       c.id,
       c.industryTrack,
       c.jobsiteUserId,
       c.originalName,
       c.status,
       c.clientOpenedAt,
       c.clientSignedAt,
       c.clientSignatureName,
       c.adminSignedAt,
      c.adminSignatureName,
      c.declinedReason,
      c.withdrawnReason,
      c.executedAt,
      c.renewalDueAt,
      c.renewalNotifiedAt,
      c.renewalClientDecision,
      c.renewalAdminDecision,
      c.clientRenewalSignatureName,
      c.adminRenewalSignatureName,
      c.clientWithdrawalSignatureName,
      c.clientWithdrawalSignedAt,
      c.adminWithdrawalSignatureName,
      c.adminWithdrawalSignedAt,
      c.withdrawalInitiatedAt,
      c.createdAt,
      u.name AS clientUserName,
      jp.companyName AS clientCompanyName,
      jp.contactName AS clientContactName
     FROM contracts c
     JOIN users u ON u.id = c.jobsiteUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
     ${whereClause}
     ORDER BY c.createdAt DESC`
  ).all(...values).map((item) => ({
    ...item,
    fileUrl: `/api/contracts/${item.id}/file`,
  }));

  res.json({ data });
});

app.get('/api/admin/contracts/bank', authGuard(['admin']), (req, res) => {
  const data = db.prepare(
    `SELECT
       c.id,
       c.industryTrack,
       c.jobsiteUserId,
       c.originalName,
       c.status,
       c.createdAt,
       u.name AS clientUserName,
       jp.companyName AS clientCompanyName
     FROM contracts c
     JOIN users u ON u.id = c.jobsiteUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
     ORDER BY c.createdAt DESC`
  ).all().map((item) => ({
    ...item,
    fileUrl: `/api/contracts/${item.id}/file`,
  }));

  res.json({ data });
});

// ── Contract Bank (storage-only, no client) ──────────────────────────────────
app.get('/api/admin/contract-bank', authGuard(['admin']), (req, res) => {
  const track = String(req.query.industryTrack || '').trim().toLowerCase();
  const vals = [];
  let where = '';
  if (track === 'warehouse' || track === 'healthcare') {
    where = 'WHERE industryTrack = ?';
    vals.push(track);
  }
  const data = db.prepare(`SELECT * FROM contract_bank ${where} ORDER BY createdAt DESC`)
    .all(...vals)
    .map((item) => ({ ...item, fileUrl: `/api/contract-bank/${item.id}/file` }));
  res.json({ data });
});

app.post('/api/admin/contract-bank', authGuard(['admin']), upload.array('contract', 20), (req, res) => {
  const industryTrack = String(req.body && req.body.industryTrack || '').trim().toLowerCase();
  const files = Array.isArray(req.files) ? req.files : [];
  const removeFiles = () => discardUploadedFiles(files);

  if (!files.length) return res.status(400).json({ error: 'At least one PDF is required.' });
  if (!['warehouse', 'healthcare'].includes(industryTrack)) {
    removeFiles();
    return res.status(400).json({ error: 'Valid industry track is required.' });
  }

  const insert = db.prepare(
    `INSERT INTO contract_bank (industryTrack, uploadedByAdminUserId, originalName, storedName, mimeType, fileSize)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const ids = [];
  const insertMany = db.transaction((uploadedFiles) => {
    uploadedFiles.forEach((file) => {
      const result = insert.run(industryTrack, req.auth.id, file.originalname, file.filename, file.mimetype, file.size);
      ids.push(Number(result.lastInsertRowid));
    });
  });
  persistUploadedFiles(files, 'contract-bank').then(() => {
    try {
      insertMany(files);
    } catch (err) {
      removeFiles();
      throw err;
    }
    emitContractsDomainSyncToAdmins();
    return res.status(201).json({ ids, count: ids.length, created: true });
  }).catch((error) => {
    removeFiles();
    logCaughtException('contract bank upload', error, { actorUserId: req.auth.id, industryTrack });
    return res.status(500).json({ error: 'Failed to store contract bank upload.' });
  });
});

app.get('/api/contract-bank/:id/file', authGuard(['admin']), async (req, res) => {
  const bankId = Number(req.params.id);
  if (!Number.isInteger(bankId) || bankId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM contract_bank WHERE id = ?').get(bankId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  return sendStoredAsset(res, entry.storedName, {
    contentType: entry.mimeType,
    disposition: 'attachment',
    downloadName: entry.originalName || 'Contract.pdf',
    missingMessage: 'File missing from storage.',
  });
});

app.post('/api/admin/contract-bank/:id/send', authGuard(['admin']), (req, res) => {
  const bankId = Number(req.params.id);
  const jobsiteUserId = Number(req.body && req.body.jobsiteUserId);
  if (!Number.isInteger(bankId) || bankId < 1) return res.status(400).json({ error: 'Invalid bank contract id.' });
  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) return res.status(400).json({ error: 'Valid client is required.' });

  const entry = db.prepare('SELECT * FROM contract_bank WHERE id = ?').get(bankId);
  if (!entry) return res.status(404).json({ error: 'Bank contract not found.' });

  const client = db.prepare('SELECT id, role FROM users WHERE id = ?').get(jobsiteUserId);
  if (!client || client.role !== 'jobsite') return res.status(404).json({ error: 'Client account not found.' });

  const nowIso = new Date().toISOString();
  const result = db.prepare(
    `INSERT INTO contracts (industryTrack, jobsiteUserId, uploadedByAdminUserId, originalName, storedName, mimeType, fileSize, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).run(entry.industryTrack, jobsiteUserId, req.auth.id, entry.originalName, entry.storedName, entry.mimeType, entry.fileSize, nowIso, nowIso);

  runAsyncTask('notify_jobsite_contract_available', () =>
    notifyJobsiteAboutContractAvailable(jobsiteUserId, Number(result.lastInsertRowid), entry.originalName, entry.industryTrack, req.auth.id)
  );

  emitContractsDomainSyncToAdmins();

  return res.status(201).json({ id: Number(result.lastInsertRowid), created: true });
});

app.delete('/api/admin/contract-bank/:id', authGuard(['admin']), (req, res) => {
  const bankId = Number(req.params.id);
  if (!Number.isInteger(bankId) || bankId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM contract_bank WHERE id = ?').get(bankId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  db.prepare('DELETE FROM contract_bank WHERE id = ?').run(bankId);
  // Only remove the physical file if no active contract references it
  const ref = db.prepare('SELECT COUNT(*) as n FROM contracts WHERE storedName = ?').get(entry.storedName);
  if (!ref || ref.n === 0) {
    removeStoredFileLater(entry.storedName);
  }
  emitContractsDomainSyncToAdmins();
  return res.json({ deleted: true });
});

// ── Miscellaneous Documents ───────────────────────────────────────────────────
app.get('/api/admin/misc-docs', authGuard(['admin']), (req, res) => {
  const data = db.prepare('SELECT * FROM misc_docs ORDER BY createdAt DESC')
    .all()
    .map((item) => ({ ...item, fileUrl: `/api/misc-docs/${item.id}/file` }));
  res.json({ data });
});

app.get('/api/admin/misc-docs/recipients', authGuard(['admin']), (req, res) => {
  const employees = db.prepare(
    `SELECT id, name, email, isActive
     FROM users
     WHERE role = 'employee'
     ORDER BY COALESCE(isActive, 0) DESC, name COLLATE NOCASE ASC, id ASC`
  ).all();

  return res.json({ employees });
});

app.post('/api/admin/misc-docs', authGuard(['admin']), upload.array('document', 20), (req, res) => {
  const description = String((req.body && req.body.description) || '').trim().slice(0, 255) || null;
  const files = Array.isArray(req.files) ? req.files : [];
  const removeFiles = () => discardUploadedFiles(files);

  if (!files.length) return res.status(400).json({ error: 'At least one file is required.' });

  const insert = db.prepare(
    `INSERT INTO misc_docs (uploadedByAdminUserId, originalName, storedName, mimeType, fileSize, description)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const ids = [];
  const insertMany = db.transaction((uploadedFiles) => {
    uploadedFiles.forEach((file) => {
      const result = insert.run(req.auth.id, file.originalname, file.filename, file.mimetype, file.size, description);
      ids.push(Number(result.lastInsertRowid));
    });
  });
  persistUploadedFiles(files, 'misc-docs').then(() => {
    try {
      insertMany(files);
    } catch (err) {
      removeFiles();
      throw err;
    }
    emitContractsDomainSyncToAdmins();
    return res.status(201).json({ ids, count: ids.length, created: true });
  }).catch((error) => {
    removeFiles();
    logCaughtException('misc doc upload', error, { actorUserId: req.auth.id });
    return res.status(500).json({ error: 'Failed to store document upload.' });
  });
});

app.get('/api/misc-docs/:id/file', authGuard(['admin']), async (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM misc_docs WHERE id = ?').get(docId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  return sendStoredAsset(res, entry.storedName, {
    contentType: entry.mimeType,
    disposition: 'attachment',
    downloadName: entry.originalName || 'document',
    missingMessage: 'File missing from storage.',
  });
});

app.delete('/api/admin/misc-docs/:id', authGuard(['admin']), (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM misc_docs WHERE id = ?').get(docId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  db.prepare('DELETE FROM misc_docs WHERE id = ?').run(docId);
  removeStoredFileLater(entry.storedName);
  emitContractsDomainSyncToAdmins();
  return res.json({ deleted: true });
});

app.post('/api/admin/misc-docs/:id/send', authGuard(['admin']), (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const entry = db.prepare('SELECT * FROM misc_docs WHERE id = ?').get(docId);
  if (!entry) return res.status(404).json({ error: 'Document not found.' });

  const employeeUserId = req.body && req.body.employeeUserId ? Number(req.body.employeeUserId) : null;

  if (!employeeUserId) {
    return res.status(400).json({ error: 'A valid employee recipient is required.' });
  }

  const insert = db.prepare(
    'INSERT OR IGNORE INTO misc_doc_sends (miscDocId, recipientUserId, sentByAdminUserId) VALUES (?, ?, ?)'
  );
  const recipients = [];
  const tx = db.transaction(() => {
    insert.run(docId, employeeUserId, req.auth.id);
    recipients.push(employeeUserId);
  });
  tx();

  recipients.forEach((uid) => {
    emitRealtimeEventToUser(uid, 'portal-sync', { domains: ['misc-docs'] });
  });
  emitContractsDomainSyncToAdmins();
  return res.json({ sent: true, recipients });
});

app.get('/api/portal/employee/misc-docs', authGuard(['employee']), (req, res) => {
  const rows = db.prepare(`
    SELECT md.id, md.originalName, md.mimeType, md.fileSize, md.description, mds.sentAt
    FROM misc_doc_sends mds
    JOIN misc_docs md ON md.id = mds.miscDocId
    WHERE mds.recipientUserId = ?
    ORDER BY mds.sentAt DESC
  `).all(req.auth.id);
  const data = rows.map((r) => ({ ...r, fileUrl: `/api/portal/employee/misc-docs/${r.id}/file` }));
  return res.json({ data });
});

app.get('/api/portal/employee/misc-docs/:id/file', authGuard(['employee']), async (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const send = db.prepare('SELECT * FROM misc_doc_sends WHERE miscDocId = ? AND recipientUserId = ?').get(docId, req.auth.id);
  if (!send) return res.status(403).json({ error: 'Access denied.' });
  const entry = db.prepare('SELECT * FROM misc_docs WHERE id = ?').get(docId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  return sendStoredAsset(res, entry.storedName, {
    contentType: entry.mimeType,
    disposition: 'attachment',
    downloadName: entry.originalName || 'document',
    missingMessage: 'File missing from storage.',
  });
});

app.get('/api/portal/jobsite/misc-docs', authGuard(['jobsite']), (req, res) => {
  const rows = db.prepare(`
    SELECT md.id, md.originalName, md.mimeType, md.fileSize, md.description, mds.sentAt
    FROM misc_doc_sends mds
    JOIN misc_docs md ON md.id = mds.miscDocId
    WHERE mds.recipientUserId = ?
    ORDER BY mds.sentAt DESC
  `).all(req.auth.id);
  const data = rows.map((r) => ({ ...r, fileUrl: `/api/portal/jobsite/misc-docs/${r.id}/file` }));
  return res.json({ data });
});

app.get('/api/portal/jobsite/misc-docs/:id/file', authGuard(['jobsite']), async (req, res) => {
  const docId = Number(req.params.id);
  if (!Number.isInteger(docId) || docId < 1) return res.status(400).json({ error: 'Invalid id.' });
  const send = db.prepare('SELECT * FROM misc_doc_sends WHERE miscDocId = ? AND recipientUserId = ?').get(docId, req.auth.id);
  if (!send) return res.status(403).json({ error: 'Access denied.' });
  const entry = db.prepare('SELECT * FROM misc_docs WHERE id = ?').get(docId);
  if (!entry) return res.status(404).json({ error: 'Not found.' });
  return sendStoredAsset(res, entry.storedName, {
    contentType: entry.mimeType,
    disposition: 'attachment',
    downloadName: entry.originalName || 'document',
    missingMessage: 'File missing from storage.',
  });
});
// ─────────────────────────────────────────────────────────────────────────────

app.patch('/api/admin/contracts/:id/industry-track', authGuard(['admin']), (req, res) => {
  const contractId = Number(req.params.id);
  const track = String(req.body && req.body.industryTrack || '').trim().toLowerCase();

  if (!Number.isInteger(contractId) || contractId < 1) {
    return res.status(400).json({ error: 'Invalid contract id.' });
  }
  if (!['warehouse', 'healthcare'].includes(track)) {
    return res.status(400).json({ error: 'industryTrack must be warehouse or healthcare.' });
  }

  const contract = db.prepare('SELECT id FROM contracts WHERE id = ?').get(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found.' });
  }

  db.prepare('UPDATE contracts SET industryTrack = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(track, contractId);
  logAdminAction(req.auth.id, 'contract_industry_track_updated', JSON.stringify({ contractId, track }));
  emitContractsDomainSyncToAdmins();

  return res.json({ id: contractId, industryTrack: track });
});

app.post('/api/admin/contracts', authGuard(['admin']), upload.array('contract', 20), (req, res) => {
  const industryTrack = String(req.body && req.body.industryTrack || '').trim().toLowerCase();
  const jobsiteUserId = Number(req.body && req.body.jobsiteUserId);
  const files = Array.isArray(req.files) ? req.files : [];
  const removeUploadedFiles = () => discardUploadedFiles(files);

  if (!files.length) {
    return res.status(400).json({ error: 'Contract PDF is required.' });
  }
  if (!['warehouse', 'healthcare'].includes(industryTrack)) {
    removeUploadedFiles();
    return res.status(400).json({ error: 'Valid contract industry is required.' });
  }
  if (!Number.isInteger(jobsiteUserId) || jobsiteUserId < 1) {
    removeUploadedFiles();
    return res.status(400).json({ error: 'Valid client is required.' });
  }

  const client = db.prepare('SELECT id, role FROM users WHERE id = ?').get(jobsiteUserId);
  if (!client || client.role !== 'jobsite') {
    removeUploadedFiles();
    return res.status(404).json({ error: 'Client account not found.' });
  }

  const nowIso = new Date().toISOString();
  const insertContract = db.prepare(
    `INSERT INTO contracts (
       industryTrack,
       jobsiteUserId,
       uploadedByAdminUserId,
       originalName,
       storedName,
       mimeType,
       fileSize,
       status,
       createdAt,
       updatedAt
     ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
  );
  const findBankByStoredName = db.prepare('SELECT id FROM contract_bank WHERE storedName = ? LIMIT 1');
  const insertBank = db.prepare(
    `INSERT INTO contract_bank (industryTrack, uploadedByAdminUserId, originalName, storedName, mimeType, fileSize)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const createdIds = [];
  const insertMany = db.transaction((uploadedFiles) => {
    uploadedFiles.forEach((file) => {
      const result = insertContract.run(
        industryTrack,
        jobsiteUserId,
        req.auth.id,
        file.originalname,
        file.filename,
        file.mimetype,
        file.size,
        nowIso,
        nowIso
      );
      createdIds.push(Number(result.lastInsertRowid));

      const existingBank = findBankByStoredName.get(file.filename);
      if (!existingBank) {
        insertBank.run(
          industryTrack,
          req.auth.id,
          file.originalname,
          file.filename,
          file.mimetype,
          file.size
        );
      }
    });
  });

  persistUploadedFiles(files, 'contracts').then(() => {
    try {
      insertMany(files);
    } catch (error) {
      removeUploadedFiles();
      throw error;
    }

    createdIds.forEach((contractId, index) => {
      const file = files[index];
      runAsyncTask('notify_jobsite_contract_available', () =>
        notifyJobsiteAboutContractAvailable(jobsiteUserId, contractId, file ? file.originalname : 'Contract', industryTrack, req.auth.id)
      );
    });

    emitContractsDomainSyncToAdmins();

    return res.status(201).json({
      id: createdIds[0] || null,
      ids: createdIds,
      created: true,
      count: createdIds.length,
    });
  }).catch((error) => {
    removeUploadedFiles();
    logCaughtException('admin contract upload', error, { actorUserId: req.auth.id, jobsiteUserId, industryTrack });
    return res.status(500).json({ error: 'Failed to store contract upload.' });
  });
});

app.get('/api/contracts/:id/file', authGuard(['admin', 'jobsite']), async (req, res) => {
  const contractId = Number(req.params.id);
  if (!Number.isInteger(contractId) || contractId < 1) {
    return res.status(400).json({ error: 'Invalid contract id.' });
  }

  const contract = getContractRecordById(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found.' });
  }

  const canAccess = req.auth.role === 'admin' || (req.auth.role === 'jobsite' && Number(contract.jobsiteUserId) === Number(req.auth.id));
  if (!canAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.auth.role === 'jobsite') {
    db.prepare('UPDATE contracts SET clientOpenedAt = COALESCE(clientOpenedAt, CURRENT_TIMESTAMP), updatedAt = CURRENT_TIMESTAMP WHERE id = ?').run(contractId);
  }

  return sendStoredAsset(res, contract.storedName, {
    contentType: contract.mimeType,
    disposition: 'attachment',
    downloadName: contract.originalName || 'Contract.pdf',
    missingMessage: 'Contract file is missing from storage.',
  });
});

app.get('/api/portal/jobsite/contracts', authGuard(['jobsite']), (req, res) => {
  const data = db.prepare(
    `SELECT
       c.id,
       c.industryTrack,
       c.originalName,
       c.status,
       c.clientOpenedAt,
       c.clientSignedAt,
       c.clientSignatureName,
       c.adminSignedAt,
       c.adminSignatureName,
       c.declinedReason,
       c.withdrawnReason,
       c.executedAt,
       c.renewalDueAt,
       c.renewalNotifiedAt,
       c.renewalClientDecision,
       c.renewalAdminDecision,
       c.clientRenewalSignatureName,
       c.adminRenewalSignatureName,
       c.clientWithdrawalSignatureName,
       c.clientWithdrawalSignedAt,
       c.adminWithdrawalSignatureName,
       c.adminWithdrawalSignedAt,
       c.withdrawalInitiatedAt,
       c.createdAt,
       u.name AS clientUserName,
       jp.companyName AS clientCompanyName,
       jp.contactName AS clientContactName
     FROM contracts c
     JOIN users u ON u.id = c.jobsiteUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
     WHERE c.jobsiteUserId = ?
     ORDER BY c.createdAt DESC`
  ).all(req.auth.id).map((item) => ({
    ...item,
    fileUrl: `/api/contracts/${item.id}/file`,
  }));

  res.json({ data });
});

app.post('/api/portal/jobsite/contracts/:id/sign', authGuard(['jobsite']), (req, res) => {
  const contractId = Number(req.params.id);
  const signature = String(req.body && req.body.signatureName || '').trim();
  const authorized = Number(req.body && req.body.authorized ? 1 : 0);

  const contract = getContractRecordById(contractId);
  if (!contract || Number(contract.jobsiteUserId) !== Number(req.auth.id)) {
    return res.status(404).json({ error: 'Contract not found.' });
  }
  if (String(contract.status) !== 'pending') {
    return res.status(400).json({ error: 'Only pending contracts can be signed.' });
  }
  if (!contract.clientOpenedAt) {
    return res.status(400).json({ error: 'You must open the contract attachment before signing.' });
  }
  if (contract.clientSignedAt) {
    return res.status(400).json({ error: 'Client signature is already recorded.' });
  }
  if (!signature || signature.length < 2) {
    return res.status(400).json({ error: 'A typed signature is required.' });
  }
  if (!authorized) {
    return res.status(400).json({ error: 'Authorization checkbox is required.' });
  }

  db.prepare(
    `UPDATE contracts
     SET clientSignedAt = CURRENT_TIMESTAMP,
         clientSignatureName = ?,
         clientAuthorized = 1,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(signature, contractId);

  markNotificationsCompletedByTask('contract_review', contractId, req.auth.id);
  runAsyncTask('notify_admins_contract_signed', () =>
    notifyAdminsAboutClientSignedContract({
      ...contract,
      id: contractId,
      clientSignatureName: signature,
      jobsiteName: contract.clientCompanyName || contract.clientContactName || contract.clientUserName,
    })
  );

  emitContractsDomainSyncToAdmins();

  return res.json({ signed: true });
});

app.post('/api/admin/contracts/:id/sign', authGuard(['admin']), (req, res) => {
  const contractId = Number(req.params.id);
  const signature = String(req.body && req.body.signatureName || '').trim();
  const authorized = Number(req.body && req.body.authorized ? 1 : 0);

  const contract = getContractRecordById(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found.' });
  }
  if (String(contract.status) !== 'pending') {
    return res.status(400).json({ error: 'Only pending contracts can be signed.' });
  }
  if (!contract.clientOpenedAt || !contract.clientSignedAt) {
    return res.status(400).json({ error: 'Client must open and sign the contract first.' });
  }
  if (contract.adminSignedAt) {
    return res.status(400).json({ error: 'Administrator signature is already recorded.' });
  }
  if (!signature || signature.length < 2) {
    return res.status(400).json({ error: 'A typed signature is required.' });
  }
  if (!authorized) {
    return res.status(400).json({ error: 'Authorization checkbox is required.' });
  }

  const executedAtDate = new Date();
  const renewalDueDate = new Date(executedAtDate);
  renewalDueDate.setFullYear(renewalDueDate.getFullYear() + 1);
  db.prepare(
    `UPDATE contracts
     SET adminSignedAt = CURRENT_TIMESTAMP,
         adminSignatureName = ?,
         adminAuthorized = 1,
         status = 'executed',
         executedAt = ?,
         renewalDueAt = ?,
         renewalNotifiedAt = NULL,
         renewalClientDecision = NULL,
         renewalAdminDecision = NULL,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(signature, executedAtDate.toISOString(), renewalDueDate.toISOString(), contractId);

  markNotificationsCompletedByTask('contract_admin_sign', contractId);
  runAsyncTask('notify_contract_executed_admins', () =>
    notifyAdminsAboutContractOutcome({
      ...contract,
      id: contractId,
      adminSignatureName: signature,
      jobsiteName: contract.clientCompanyName || contract.clientContactName || contract.clientUserName,
    }, 'executed')
  );
  runAsyncTask('notify_contract_executed_jobsite', () =>
    notifyJobsiteAboutContractExecuted({
      ...contract,
      id: contractId,
    })
  );

  emitContractsDomainSyncToAdmins();

  return res.json({ executed: true });
});

app.post('/api/portal/jobsite/contracts/:id/decline', authGuard(['jobsite']), (req, res) => {
  const contractId = Number(req.params.id);
  const reason = String(req.body && req.body.reason || '').trim();
  const contract = getContractRecordById(contractId);

  if (!contract || Number(contract.jobsiteUserId) !== Number(req.auth.id)) {
    return res.status(404).json({ error: 'Contract not found.' });
  }
  if (String(contract.status) !== 'pending') {
    return res.status(400).json({ error: 'Only pending contracts can be declined.' });
  }

  db.prepare(
    `UPDATE contracts
     SET status = 'declined',
         declinedAt = CURRENT_TIMESTAMP,
         declinedReason = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(reason || null, contractId);

  markNotificationsCompletedByTask('contract_review', contractId, req.auth.id);
  runAsyncTask('notify_contract_declined_admins', () =>
    notifyAdminsAboutContractOutcome({
      ...contract,
      id: contractId,
      declinedReason: reason || null,
      jobsiteName: contract.clientCompanyName || contract.clientContactName || contract.clientUserName,
    }, 'declined')
  );

  emitContractsDomainSyncToAdmins();

  return res.json({ declined: true });
});

app.post('/api/portal/jobsite/contracts/:id/withdraw', authGuard(['jobsite']), (req, res) => {
  const contractId = Number(req.params.id);
  const reason = String(req.body && req.body.reason || '').trim();
  const credential = getSubmittedCredential(req.body || {});
  const contract = getContractRecordById(contractId);

  if (!contract || Number(contract.jobsiteUserId) !== Number(req.auth.id)) {
    return res.status(404).json({ error: 'Contract not found.' });
  }
  if (String(contract.status) === 'executed') {
    return res.status(400).json({ error: 'Executed contracts cannot be withdrawn.' });
  }
  if (!reason) {
    return res.status(400).json({ error: 'Withdrawal reason is required.' });
  }

  const verifiedUser = requireCredentialForUser(res, req.auth.id, credential);
  if (!verifiedUser) return;

  db.prepare(
    `UPDATE contracts
     SET status = 'withdrawn',
         withdrawnAt = CURRENT_TIMESTAMP,
         withdrawnReason = ?,
         withdrawnByUserId = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(reason, verifiedUser.id, contractId);

  markNotificationsCompletedByTask('contract_review', contractId, req.auth.id);
  runAsyncTask('notify_contract_withdrawn_admins', () =>
    notifyAdminsAboutContractOutcome({
      ...contract,
      id: contractId,
      withdrawnReason: reason,
      jobsiteName: contract.clientCompanyName || contract.clientContactName || contract.clientUserName,
    }, 'withdrawn')
  );

  emitContractsDomainSyncToAdmins();

  return res.json({ withdrawn: true });
});

  // ── Contract delete (admin only; pending/declined/withdrawn only) ─────────────
  app.delete('/api/admin/contracts/:id', authGuard(['admin']), (req, res) => {
    const contractId = Number(req.params.id);
    if (!Number.isInteger(contractId) || contractId < 1) {
      return res.status(400).json({ error: 'Invalid contract id.' });
    }
    const contract = getContractRecordById(contractId);
    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    const deletableStatuses = new Set(['pending', 'declined', 'withdrawn']);
    if (!deletableStatuses.has(String(contract.status))) {
      return res.status(403).json({ error: 'Signed, active, and cancelled contracts cannot be deleted. Only pending, declined, or pre-execution withdrawn contracts may be removed.' });
    }
    db.prepare('DELETE FROM contracts WHERE id = ?').run(contractId);
    logAdminAction(req.auth.id, 'contract_deleted', JSON.stringify({ contractId, status: contract.status }));
    emitContractsDomainSyncToAdmins();
    return res.json({ deleted: true });
  });

  // ── Client initiates cancellation of an executed contract ────────────────────
  app.post('/api/portal/jobsite/contracts/:id/initiate-cancellation', authGuard(['jobsite']), (req, res) => {
    const contractId = Number(req.params.id);
    const signature = String((req.body && req.body.signatureName) || '').trim();
    const reason = String((req.body && req.body.reason) || '').trim();
    const contract = getContractRecordById(contractId);

    if (!contract || Number(contract.jobsiteUserId) !== Number(req.auth.id)) {
      return res.status(404).json({ error: 'Contract not found.' });
    }
    if (String(contract.status) !== 'executed') {
      return res.status(400).json({ error: 'Only fully executed contracts can be cancelled through this process.' });
    }
    if (contract.clientWithdrawalSignedAt) {
      return res.status(409).json({ error: 'A cancellation request is already in progress for this contract.' });
    }
    if (!signature || signature.length < 2) {
      return res.status(400).json({ error: 'Your typed electronic signature is required to initiate cancellation.' });
    }
    if (!reason) {
      return res.status(400).json({ error: 'A reason for cancellation is required.' });
    }

    db.prepare(
      `UPDATE contracts
       SET status = 'withdrawal_pending',
           clientWithdrawalSignatureName = ?,
           clientWithdrawalSignedAt = CURRENT_TIMESTAMP,
           withdrawalInitiatedAt = CURRENT_TIMESTAMP,
           withdrawnReason = ?,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(signature, reason, contractId);

    runAsyncTask('notify_withdrawal_initiated', () =>
      notifyAboutWithdrawalInitiated({
        ...contract,
        id: contractId,
        clientCompanyName: contract.clientCompanyName,
        clientUserName: contract.clientUserName,
      })
    );

    emitContractsDomainSyncToAdmins();

    return res.json({ initiated: true });
  });

  // ── Admin confirms contract cancellation ─────────────────────────────────────
  app.post('/api/admin/contracts/:id/confirm-cancellation', authGuard(['admin']), (req, res) => {
    const contractId = Number(req.params.id);
    const signature = String((req.body && req.body.signatureName) || '').trim();
    const contract = getContractRecordById(contractId);

    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    if (String(contract.status) !== 'withdrawal_pending') {
      return res.status(400).json({ error: 'This contract is not awaiting cancellation confirmation.' });
    }
    if (!signature || signature.length < 2) {
      return res.status(400).json({ error: 'Administrator electronic signature is required to confirm cancellation.' });
    }

    db.prepare(
      `UPDATE contracts
       SET status = 'cancelled',
           adminWithdrawalSignatureName = ?,
           adminWithdrawalSignedAt = CURRENT_TIMESTAMP,
           updatedAt = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(signature, contractId);

    markNotificationsCompletedByTask('contract_cancel_confirm', contractId);
    logAdminAction(req.auth.id, 'contract_cancelled', JSON.stringify({ contractId }));
    runAsyncTask('notify_contract_cancelled', () =>
      notifyAboutContractCancelled({ ...contract, id: contractId })
    );

    emitContractsDomainSyncToAdmins();

    return res.json({ cancelled: true });
  });

  // ── Jobsite client: renewal decision ─────────────────────────────────────────
  app.post('/api/portal/jobsite/contracts/:id/renewal-decision', authGuard(['jobsite']), (req, res) => {
    const contractId = Number(req.params.id);
    const decision = String((req.body && req.body.decision) || '').trim().toLowerCase();
    const signature = String((req.body && req.body.signatureName) || '').trim();
    const contract = getContractRecordById(contractId);

    if (!contract || Number(contract.jobsiteUserId) !== Number(req.auth.id)) {
      return res.status(404).json({ error: 'Contract not found.' });
    }
    if (!['executed', 'renewal_pending'].includes(String(contract.status))) {
      return res.status(400).json({ error: 'This contract is not eligible for a renewal decision.' });
    }
    if (!contract.renewalNotifiedAt) {
      return res.status(400).json({ error: 'A renewal notification has not been issued for this contract yet.' });
    }
    if (!['renew', 'deny'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be renew or deny.' });
    }
    if (decision === 'renew' && (!signature || signature.length < 2)) {
      return res.status(400).json({ error: 'Your typed electronic signature is required to renew the contract.' });
    }

    db.prepare(
      `UPDATE contracts SET renewalClientDecision = ?, clientRenewalSignatureName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(decision, decision === 'renew' ? signature : null, contractId);

    const updated = getContractRecordById(contractId);
    if (updated.renewalClientDecision === 'deny' || updated.renewalAdminDecision === 'deny') {
      db.prepare(`UPDATE contracts SET status = 'expired', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(contractId);
    } else if (updated.renewalClientDecision === 'renew' && updated.renewalAdminDecision === 'renew') {
      const newExecutedAt = new Date();
      const newRenewalDue = new Date(newExecutedAt);
      newRenewalDue.setFullYear(newRenewalDue.getFullYear() + 1);
      db.prepare(
        `UPDATE contracts SET status = 'executed', executedAt = ?, renewalDueAt = ?, renewalNotifiedAt = NULL,
         renewalClientDecision = NULL, renewalAdminDecision = NULL, clientRenewalSignatureName = NULL, adminRenewalSignatureName = NULL,
         updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(newExecutedAt.toISOString(), newRenewalDue.toISOString(), contractId);
      runAsyncTask('notify_contract_renewed', () => notifyAboutContractRenewed({ ...updated, id: contractId }));
    } else {
      db.prepare(`UPDATE contracts SET status = 'renewal_pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(contractId);
    }

    emitContractsDomainSyncToAdmins();

    return res.json({ decision, recorded: true });
  });

  // ── Admin: renewal decision ───────────────────────────────────────────────────
  app.post('/api/admin/contracts/:id/renewal-decision', authGuard(['admin']), (req, res) => {
    const contractId = Number(req.params.id);
    const decision = String((req.body && req.body.decision) || '').trim().toLowerCase();
    const signature = String((req.body && req.body.signatureName) || '').trim();
    const contract = getContractRecordById(contractId);

    if (!contract) return res.status(404).json({ error: 'Contract not found.' });
    if (!['executed', 'renewal_pending'].includes(String(contract.status))) {
      return res.status(400).json({ error: 'This contract is not eligible for a renewal decision.' });
    }
    if (!contract.renewalNotifiedAt) {
      return res.status(400).json({ error: 'A renewal notification has not been issued for this contract yet.' });
    }
    if (!['renew', 'deny'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be renew or deny.' });
    }
    if (decision === 'renew' && (!signature || signature.length < 2)) {
      return res.status(400).json({ error: 'Administrator electronic signature is required to renew the contract.' });
    }

    db.prepare(
      `UPDATE contracts SET renewalAdminDecision = ?, adminRenewalSignatureName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(decision, decision === 'renew' ? signature : null, contractId);

    logAdminAction(req.auth.id, 'contract_renewal_decision', JSON.stringify({ contractId, decision }));
    const updated = getContractRecordById(contractId);
    if (updated.renewalClientDecision === 'deny' || updated.renewalAdminDecision === 'deny') {
      db.prepare(`UPDATE contracts SET status = 'expired', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(contractId);
    } else if (updated.renewalClientDecision === 'renew' && updated.renewalAdminDecision === 'renew') {
      const newExecutedAt = new Date();
      const newRenewalDue = new Date(newExecutedAt);
      newRenewalDue.setFullYear(newRenewalDue.getFullYear() + 1);
      db.prepare(
        `UPDATE contracts SET status = 'executed', executedAt = ?, renewalDueAt = ?, renewalNotifiedAt = NULL,
         renewalClientDecision = NULL, renewalAdminDecision = NULL, clientRenewalSignatureName = NULL, adminRenewalSignatureName = NULL,
         updatedAt = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(newExecutedAt.toISOString(), newRenewalDue.toISOString(), contractId);
      runAsyncTask('notify_contract_renewed', () => notifyAboutContractRenewed({ ...updated, id: contractId }));
    } else {
      db.prepare(`UPDATE contracts SET status = 'renewal_pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`).run(contractId);
    }

    emitContractsDomainSyncToAdmins();

    return res.json({ decision, recorded: true });
  });
  // ─────────────────────────────────────────────────────────────────────────────

  app.get('/api/admin/documents', authGuard(['admin']), (req, res) => {
  const documents = db
    .prepare(
      `SELECT
         d.id,
         d.userId,
         d.applicationId,
         d.documentType,
         d.originalName,
         d.storedName,
         d.expirationDate,
         d.createdAt,
         d.uploadedByRole,
         COALESCE(d.documentStatus, 'pending') AS documentStatus,
         u.name AS employeeName,
         u.email AS employeeEmail,
         (
           SELECT a.position
           FROM applications a
           WHERE a.userId = u.id OR a.email = u.email
           ORDER BY a.createdAt DESC
           LIMIT 1
         ) AS employeePosition
       FROM employee_documents d
       JOIN users u ON u.id = d.userId
       WHERE u.role = 'employee'
       ORDER BY d.createdAt DESC`
    )
    .all()
    .map((doc) => ({
      ...doc,
      fileUrl: `/api/portal/documents/${doc.id}/file`,
    }));

  res.json({ data: documents });
});

app.get('/api/admin/assignments', authGuard(['admin']), (req, res) => {
  const assignments = db
    .prepare(
      `SELECT
         ja.id,
         ja.status,
        ja.statusReason,
        ja.cancellationType,
        ja.statusUpdatedAt,
         ja.createdAt,
         ja.jobId,
         ja.employeeUserId,
         j.title AS jobTitle,
         employee.name AS employeeName,
         employee.email AS employeeEmail,
         jp.companyName AS companyName
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       JOIN users employee ON employee.id = ja.employeeUserId
       LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
       ORDER BY ja.createdAt DESC`
    )
    .all();

  res.json({ data: assignments });
});

app.post('/api/admin/assignments', authGuard(['admin']), (req, res) => {
  const jobId = Number(req.body.jobId);
  const employeeUserId = Number(req.body.employeeUserId);

  if (!Number.isInteger(jobId) || jobId < 1 || !Number.isInteger(employeeUserId) || employeeUserId < 1) {
    return res.status(400).json({ error: 'jobId and employeeUserId must be valid integers.' });
  }

  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!job) return res.status(404).json({ error: 'Job not found.' });

  const employee = db
    .prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'")
    .get(employeeUserId);
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });

  if (getEmployeeOnboardingStatus(employeeUserId) !== 'active') {
    return res.status(403).json({ error: 'Only active employees can be assigned to client shifts.' });
  }

  const duplicate = db
    .prepare(
      "SELECT id FROM job_assignments WHERE jobId = ? AND employeeUserId = ? AND status IN ('assigned', 'approved') LIMIT 1"
    )
    .get(jobId, employeeUserId);
  if (duplicate) {
    return res.status(409).json({ error: 'Employee already has an active assignment for this job.' });
  }

  const info = db
    .prepare('INSERT INTO job_assignments (jobId, employeeUserId, status) VALUES (?, ?, ?)')
    .run(jobId, employeeUserId, 'assigned');

  logAdminAction(req.auth.id, 'assignment_created', JSON.stringify({ jobId, employeeUserId }));
  res.status(201).json({ id: info.lastInsertRowid });
});

app.patch('/api/admin/assignments/:id', authGuard(['admin']), (req, res) => {
  const assignmentId = Number(req.params.id);
  const status = normalizeAssignmentStatus(req.body && req.body.status, '');
  const statusReason = String((req.body && req.body.reason) || '').trim();

  if (!Number.isInteger(assignmentId) || assignmentId < 1) {
    return res.status(400).json({ error: 'Invalid assignment id.' });
  }

  if (!ASSIGNMENT_STATUS_VALUES.has(status)) {
    return res.status(400).json({ error: 'Invalid assignment status.' });
  }
  if ((status === 'cancelled' || status === 'no_call_no_show') && !statusReason) {
    return res.status(400).json({ error: 'A reason is required for this status update.' });
  }

  const assignment = db.prepare('SELECT id, jobId, employeeUserId FROM job_assignments WHERE id = ?').get(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const info = db.prepare(
    `UPDATE job_assignments
     SET status = ?,
         statusReason = ?,
         statusUpdatedByUserId = ?,
         statusUpdatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(status, statusReason || null, req.auth.id, assignmentId);
  if (info.changes === 0) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  if (status === 'cancelled') {
    const activeCount = db.prepare(
      `SELECT COUNT(*) AS count
       FROM job_assignments
       WHERE jobId = ?
         AND status IN ('assigned', 'approved')`
    ).get(assignment.jobId);
    if (!activeCount || Number(activeCount.count) === 0) {
      db.prepare("UPDATE jobs SET status = 'open' WHERE id = ?").run(assignment.jobId);
    }
  }

  createPortalNotification({
    userId: assignment.employeeUserId,
    actorUserId: req.auth.id,
    category: 'shift',
    title: 'Shift status updated by admin',
    body: `Your shift status is now ${status.replaceAll('_', ' ')}.${statusReason ? ` Reason: ${statusReason}` : ''}`,
    url: buildPortalPath('/portal-employee'),
    syncDomains: ['employee-dashboard', 'timesheets'],
  });

  const jobsiteRow = db.prepare('SELECT jobsiteUserId FROM jobs WHERE id = ?').get(assignment.jobId);
  if (jobsiteRow && Number.isInteger(Number(jobsiteRow.jobsiteUserId)) && Number(jobsiteRow.jobsiteUserId) > 0) {
    createPortalNotification({
      userId: Number(jobsiteRow.jobsiteUserId),
      actorUserId: req.auth.id,
      category: 'shift',
      title: 'Admin updated assignment status',
      body: `Assignment #${assignmentId} is now ${status.replaceAll('_', ' ')}.${statusReason ? ` Reason: ${statusReason}` : ''}`,
      url: buildPortalPath('/portal-jobsite'),
      syncDomains: ['jobsite-dashboard'],
    });
  }

  logAdminAction(req.auth.id, 'assignment_status_updated', JSON.stringify({ assignmentId, status, reason: statusReason || null }));
  res.json({ id: assignmentId, status, reason: statusReason || null });
});

app.patch('/api/admin/account', authGuard(['admin']), (req, res) => {
  const { newEmail, newPassword, newPasscode, removePasscode, notifyEmailEnabled, notifySmsEnabled, notifyPushEnabled, requireBiometricSensitive } = req.body;
  const credential = getSubmittedCredential(req.body);
  const normalizedNewEmail = newEmail ? String(newEmail).trim().toLowerCase() : '';
  const normalizedNewPassword = newPassword ? String(newPassword) : '';
  const normalizedNewPasscode = String(newPasscode || '').trim() ? normalizePasscode(newPasscode) : '';
  const shouldRemovePasscode = isTruthy(removePasscode);
  const wantsNotifyEmail = notifyEmailEnabled === undefined ? null : isTruthy(notifyEmailEnabled);
  const wantsNotifySms = notifySmsEnabled === undefined ? null : isTruthy(notifySmsEnabled);
  const wantsNotifyPush = notifyPushEnabled === undefined ? null : isTruthy(notifyPushEnabled);
  const wantsSensitiveBiometric = requireBiometricSensitive === undefined ? null : isTruthy(requireBiometricSensitive);

  if (!credential.trim()) {
    return res.status(400).json({ error: 'Current password or 4-digit passcode is required.' });
  }

  if (normalizedNewPassword && normalizedNewPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }

  if (String(newPasscode || '').trim() && !normalizedNewPasscode) {
    return res.status(400).json({ error: 'Passcode must be exactly 4 digits.' });
  }

  const admin = db
    .prepare('SELECT id, email, passwordHash, passwordSalt, passcodeHash, passcodeSalt, notifyEmailEnabled, notifySmsEnabled, notifyPushEnabled, requireBiometricSensitive FROM users WHERE id = ? AND role = ?')
    .get(req.auth.id, 'admin');

  if (!admin) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }

  if (!verifyUserCredential(admin, credential)) {
    return res.status(401).json({ error: 'Current password or passcode is incorrect.' });
  }

  let nextEmail = admin.email;
  let nextPasswordHash = admin.passwordHash;
  let nextPasswordSalt = admin.passwordSalt;
  let nextPasscodeHash = admin.passcodeHash || null;
  let nextPasscodeSalt = admin.passcodeSalt || null;
  let nextNotifyEmailEnabled = Number(admin.notifyEmailEnabled) === 1;
  let nextNotifySmsEnabled = Number(admin.notifySmsEnabled) === 1;
  let nextNotifyPushEnabled = Number(admin.notifyPushEnabled) === 1;
  let nextRequireBiometricSensitive = Number(admin.requireBiometricSensitive) === 1;

  if (normalizedNewEmail && normalizedNewEmail !== admin.email) {
    const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id <> ?').get(normalizedNewEmail, admin.id);
    if (emailTaken) {
      return res.status(409).json({ error: 'That email is already in use.' });
    }
    nextEmail = normalizedNewEmail;
  }

  if (normalizedNewPassword) {
    const passwordRecord = hashPassword(normalizedNewPassword);
    nextPasswordHash = passwordRecord.hash;
    nextPasswordSalt = passwordRecord.salt;
  }

  if (shouldRemovePasscode) {
    nextPasscodeHash = null;
    nextPasscodeSalt = null;
  }

  if (normalizedNewPasscode) {
    const passcodeRecord = hashPassword(normalizedNewPasscode);
    nextPasscodeHash = passcodeRecord.hash;
    nextPasscodeSalt = passcodeRecord.salt;
  }

  if (wantsNotifyEmail !== null) nextNotifyEmailEnabled = wantsNotifyEmail;
  if (wantsNotifySms !== null) nextNotifySmsEnabled = wantsNotifySms;
  if (wantsNotifyPush !== null) nextNotifyPushEnabled = wantsNotifyPush;
  if (wantsSensitiveBiometric !== null) nextRequireBiometricSensitive = wantsSensitiveBiometric;

  const credentialsChanged =
    nextEmail !== admin.email
    || nextPasswordHash !== admin.passwordHash
    || nextPasswordSalt !== admin.passwordSalt
    || String(nextPasscodeHash || '') !== String(admin.passcodeHash || '')
    || String(nextPasscodeSalt || '') !== String(admin.passcodeSalt || '');
  const preferencesChanged =
    nextNotifyEmailEnabled !== (Number(admin.notifyEmailEnabled) === 1)
    || nextNotifySmsEnabled !== (Number(admin.notifySmsEnabled) === 1)
    || nextNotifyPushEnabled !== (Number(admin.notifyPushEnabled) === 1)
    || nextRequireBiometricSensitive !== (Number(admin.requireBiometricSensitive) === 1);

  if (!credentialsChanged && !preferencesChanged) {
    return res.status(400).json({ error: 'No account settings were changed.' });
  }

  db.prepare(
    `UPDATE users
     SET email = ?,
         passwordHash = ?,
         passwordSalt = ?,
         passcodeHash = ?,
         passcodeSalt = ?,
         notifyEmailEnabled = ?,
         notifySmsEnabled = ?,
         notifyPushEnabled = ?,
         requireBiometricSensitive = ?
     WHERE id = ?`
  ).run(
    nextEmail,
    nextPasswordHash,
    nextPasswordSalt,
    nextPasscodeHash,
    nextPasscodeSalt,
    nextNotifyEmailEnabled ? 1 : 0,
    nextNotifySmsEnabled ? 1 : 0,
    nextNotifyPushEnabled ? 1 : 0,
    nextRequireBiometricSensitive ? 1 : 0,
    admin.id
  );

  if (!nextNotifyPushEnabled) {
    db.prepare('DELETE FROM notification_subscriptions WHERE userId = ?').run(admin.id);
  }

  logAdminAction(
    req.auth.id,
    'admin_account_updated',
    JSON.stringify({
      emailChanged: nextEmail !== admin.email,
      passwordChanged: Boolean(normalizedNewPassword),
      passcodeChanged: Boolean(normalizedNewPasscode) || shouldRemovePasscode,
      notificationPreferencesChanged: preferencesChanged,
    })
  );

  res.json({
    updated: true,
    email: nextEmail,
    passcodeEnabled: Boolean(nextPasscodeHash),
    notificationPreferences: {
      email: nextNotifyEmailEnabled,
      sms: nextNotifySmsEnabled,
      push: nextNotifyPushEnabled,
    },
    securityPreferences: {
      requireBiometricSensitive: nextRequireBiometricSensitive,
    },
  });
});

app.get('/api/applications', authGuard(['admin']), (req, res) => {
  const applications = db.prepare('SELECT * FROM applications ORDER BY createdAt DESC').all();
  res.json({ data: applications });
});

app.post('/api/apply', (req, res) => {
  const {
    fullName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    password,
    passcode,
    industry,
    position,
    message,
    certifyAgreement,
  } = req.body;

  if (!fullName || !email || !phone || !address || !city || !state || !zip || !industry) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  if (!isTruthy(certifyAgreement)) {
    return res.status(400).json({ error: 'You must certify the employment statement before submitting.' });
  }

  const phoneDigits = String(phone || '').replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return res.status(400).json({ error: 'Phone number must be exactly 10 digits.' });
  }

  const normalizedState = String(state || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedState)) {
    return res.status(400).json({ error: 'State must be a valid 2-letter code.' });
  }

  const zipDigits = String(zip || '').replace(/\D/g, '');
  if (!(zipDigits.length === 5 || zipDigits.length === 9)) {
    return res.status(400).json({ error: 'Zip code must be 5 or 9 digits.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const normalizedPasscode = normalizePasscode(passcode);
  const existingEmployee = db
    .prepare("SELECT id, role FROM users WHERE email = ? AND role = 'employee' LIMIT 1")
    .get(normalizedEmail);

  if (!existingEmployee && normalizedPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  if (String(passcode || '').trim() && !normalizedPasscode) {
    return res.status(400).json({ error: 'Passcode must be exactly 4 digits.' });
  }

  let employeeUserId = existingEmployee ? Number(existingEmployee.id) : null;

  if (!employeeUserId) {
    const passwordRecord = hashPassword(normalizedPassword);
    const passcodeRecord = normalizedPasscode ? hashPassword(normalizedPasscode) : null;
    const createdUser = db
      .prepare(
        'INSERT INTO users (name, email, role, passwordHash, passwordSalt, passcodeHash, passcodeSalt) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        String(fullName).trim(),
        normalizedEmail,
        'employee',
        passwordRecord.hash,
        passwordRecord.salt,
        passcodeRecord ? passcodeRecord.hash : null,
        passcodeRecord ? passcodeRecord.salt : null
      );

    employeeUserId = Number(createdUser.lastInsertRowid);

    db.prepare('INSERT INTO employee_profiles (userId, phone, address, city, state, zip, skills, certifications) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      employeeUserId,
      phoneDigits,
      String(address).trim(),
      String(city).trim(),
      normalizedState,
      zipDigits,
      null,
      null
    );
  }

  const insert = db.prepare(
    `INSERT INTO applications
      (userId, fullName, email, phone, address, city, state, zip, industry, position, message, certificationAccepted)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const info = insert.run(
    employeeUserId,
    String(fullName).trim(),
    normalizedEmail,
    phoneDigits,
    String(address).trim(),
    String(city).trim(),
    normalizedState,
    zipDigits,
    String(industry).trim(),
    position ? String(position).trim() : null,
    message ? String(message).trim() : null,
    1
  );

  buildEmployeeProfileHeaderData(employeeUserId, normalizedEmail);

  const nextStepUrl = existingEmployee
    ? `/portal-login?email=${encodeURIComponent(normalizedEmail)}&applied=1`
    : `/portal-employee`;

  if (existingEmployee) {
    return res.status(201).json({
      id: info.lastInsertRowid,
      nextStepUrl,
      existingPortalAccount: true,
    });
  }

  const session = createSession(employeeUserId);
  setSessionCookie(res, session.token);

  res.status(201).json({
    id: info.lastInsertRowid,
    nextStepUrl,
    existingPortalAccount: false,
    token: session.token,
    expiresAt: session.expiresAt,
  });
});

// ─── Timesheets: Employee routes ─────────────────────────────────────────────

// Helper: compute hours between two ISO datetime strings
function hoursWorked(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  if (ms <= 0) return 0;
  return Math.round((ms / 3600000) * 100) / 100;
}

// GET /api/portal/employee/timesheets
// Returns submitted timesheets + unsubmitted (fully clocked-out) clock entries
app.get('/api/portal/employee/timesheets', authGuard(['employee']), (req, res) => {
  const timesheets = db.prepare(
    `SELECT
       ts.id,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.paperOriginalName,
       ts.paperStoredName,
       ts.status,
       ts.submittedAt,
       ts.submittedBy,
       ts.approvedAt,
       ts.approvalSignature,
       ts.notes,
       j.title AS jobTitle,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      j.statPaySignatureName,
       jp.companyName,
       jp.address AS facilityAddress
     FROM timesheets ts
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     WHERE ts.employeeUserId = ?
     ORDER BY ts.periodStart DESC`
  ).all(req.auth.id);

  const unsubmitted = db.prepare(
    `SELECT
       t.id,
       t.assignmentId,
       t.clockInAt,
       t.clockOutAt,
       j.id AS jobId,
       j.title,
       j.jobsiteUserId,
       jp.companyName
     FROM employee_time_clock_entries t
     JOIN jobs j ON j.id = t.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
     WHERE t.employeeUserId = ?
       AND t.clockOutAt IS NOT NULL
       AND (t.timesheetId IS NULL OR t.timesheetId = 0)
     ORDER BY t.clockInAt DESC`
  ).all(req.auth.id);

  const assignments = db.prepare(
    `SELECT ja.id, ja.status, j.id AS jobId, j.title, j.statPayEnabled, j.statPaySignatureName, j.jobsiteUserId, jp.companyName
     FROM job_assignments ja
     JOIN jobs j ON j.id = ja.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
     WHERE ja.employeeUserId = ?
       AND ja.status IN ('assigned', 'approved')
     ORDER BY ja.createdAt DESC`
  ).all(req.auth.id);

  res.json({ timesheets, unsubmitted, assignments });
});

// POST /api/portal/employee/timesheets/submit
app.post('/api/portal/employee/timesheets/submit', authGuard(['employee']), (req, res) => {
  const body = req.body || {};
  const assignmentId = Number(body.assignmentId);
  const periodStart = String(body.periodStart || '').trim();
  const periodEnd = String(body.periodEnd || '').trim();
  const notes = String(body.notes || '').trim().slice(0, 1000);
  const clockEntryIds = Array.isArray(body.clockEntryIds) ? body.clockEntryIds.map(Number).filter(n => Number.isInteger(n) && n > 0) : [];

  if (!Number.isInteger(assignmentId) || assignmentId < 1) return res.status(400).json({ error: 'Valid assignment is required.' });
  if (!periodStart || !periodEnd) return res.status(400).json({ error: 'Period start and end dates are required.' });
  if (clockEntryIds.length === 0) return res.status(400).json({ error: 'Select at least one clock entry to submit.' });

  const assignment = db.prepare(
    `SELECT ja.id, ja.jobId, j.jobsiteUserId
     FROM job_assignments ja
     JOIN jobs j ON j.id = ja.jobId
     WHERE ja.id = ? AND ja.employeeUserId = ?`
  ).get(assignmentId, req.auth.id);

  if (!assignment) return res.status(404).json({ error: 'Assignment not found.' });

  // Validate all entries belong to this employee & assignment and are fully clocked out with no existing timesheet
  const placeholders = clockEntryIds.map(() => '?').join(',');
  const entries = db.prepare(
    `SELECT id, clockInAt, clockOutAt, timesheetId
     FROM employee_time_clock_entries
     WHERE id IN (${placeholders}) AND employeeUserId = ? AND assignmentId = ?`
  ).all(...clockEntryIds, req.auth.id, assignmentId);

  if (entries.length !== clockEntryIds.length) return res.status(400).json({ error: 'One or more selected entries are invalid or do not belong to this assignment.' });

  const alreadySubmitted = entries.filter(e => e.timesheetId && e.timesheetId !== 0);
  if (alreadySubmitted.length > 0) return res.status(400).json({ error: 'One or more selected entries have already been submitted in a timesheet.' });

  const incomplete = entries.filter(e => !e.clockOutAt);
  if (incomplete.length > 0) return res.status(400).json({ error: 'All selected entries must be fully clocked out before submitting.' });

  const entriesJson = JSON.stringify(entries.map(e => ({
    type: 'clock',
    clockEntryId: e.id,
    clockIn: e.clockInAt,
    clockOut: e.clockOutAt,
    hours: hoursWorked(e.clockInAt, e.clockOutAt),
  })));

  const totalHours = entries.reduce((sum, e) => sum + hoursWorked(e.clockInAt, e.clockOutAt), 0);

  const info = db.prepare(
     `INSERT INTO timesheets (employeeUserId, jobsiteUserId, assignmentId, jobId, periodStart, periodEnd, entriesJson, totalHours, source, status, submittedBy, notes, submittedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'clock', 'pending_approval', 'employee', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).run(req.auth.id, assignment.jobsiteUserId || null, assignmentId, assignment.jobId, periodStart, periodEnd, entriesJson, Math.round(totalHours * 100) / 100, notes || null);

  const timesheetId = info.lastInsertRowid;

  // Mark clock entries as submitted
  db.prepare(`UPDATE employee_time_clock_entries SET timesheetId = ?, updatedAt = CURRENT_TIMESTAMP WHERE id IN (${placeholders})`).run(timesheetId, ...clockEntryIds);

  runAsyncTask('notify_jobsite_timesheet_submitted_clock', () =>
    notifyJobsiteAboutTimesheetSubmitted({
      jobsiteUserId: assignment.jobsiteUserId,
      employeeUserId: req.auth.id,
      employeeName: req.auth.name,
      actorUserId: req.auth.id,
      timesheetId,
      source: 'clock',
      periodStart,
      periodEnd,
    })
  );

  runAsyncTask('notify_admins_timesheet_submitted_clock', () =>
    notifyAdminsAboutTimesheetSubmittedByEmployee({
      timesheetId,
      employeeUserId: req.auth.id,
      employeeName: req.auth.name,
      periodStart,
      periodEnd,
    })
  );

  emitDomainSyncToAdmins(['scheduling', 'full'], ['admin-dashboard', 'timesheets']);

  res.status(201).json({ id: timesheetId, submitted: true });
});

// POST /api/portal/employee/timesheets/upload
// Submit a weekly timesheet (7 daily entries) with required paper proof file.
app.post('/api/portal/employee/timesheets/upload', authGuard(['employee']), (req, res) => {
  upload.single('timesheetFile')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'Failed to upload timesheet file.' });
    }

    const assignmentId = Number(req.body && req.body.assignmentId);
    const periodStart = String((req.body && req.body.periodStart) || '').trim();
    const periodEnd = String((req.body && req.body.periodEnd) || '').trim();
    const notes = String((req.body && req.body.notes) || '').trim().slice(0, 1000);
    const entriesRaw = String((req.body && req.body.entries) || '').trim();

    if (!Number.isInteger(assignmentId) || assignmentId < 1) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'Valid assignment is required.' });
    }
    if (!periodStart || !periodEnd) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'periodStart and periodEnd are required.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'A paper timesheet upload is required for manual timesheet submission.' });
    }

    // Parse multi-day entries (new format) or fall back to legacy single-day fields
    let rawEntries;
    if (entriesRaw) {
      try {
        rawEntries = JSON.parse(entriesRaw);
      } catch {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'Invalid entries format.' });
      }
    } else {
      // Legacy single-day support
      const workedDate = String((req.body && req.body.workedDate) || '').trim();
      const startTime = String((req.body && req.body.startTime) || '').trim();
      const endTime = String((req.body && req.body.endTime) || '').trim();
      if (!workedDate || !startTime || !endTime) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: 'entries or workedDate/startTime/endTime are required.' });
      }
      rawEntries = [{ date: workedDate, startTime, endTime, lunchMinutes: 30 }];
    }

    if (!Array.isArray(rawEntries) || rawEntries.length === 0) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'At least one day entry is required.' });
    }

    const assignment = db.prepare(
      `SELECT ja.id, ja.jobId, j.jobsiteUserId
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       WHERE ja.id = ? AND ja.employeeUserId = ?`
    ).get(assignmentId, req.auth.id);

    if (!assignment) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    // Build validated entries and compute total net hours
    const builtEntries = [];
    let totalHoursSum = 0;
    const sourceClockEntryIds = [];

    for (const entry of rawEntries) {
      const date = String(entry.date || '').trim();
      const startTime = String(entry.startTime || '').trim();
      const endTime = String(entry.endTime || '').trim();
      const lunchMinutes = Number.isFinite(Number(entry.lunchMinutes)) ? Math.max(0, Math.min(120, Number(entry.lunchMinutes))) : 30;
      const breakReason = String(entry.breakReason || '').trim().slice(0, 500);
      const sourceClockEntryId = Number(entry.clockEntryId);

      if (!date || !startTime || !endTime) continue;
      if (lunchMinutes === 0 && !breakReason) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: `Entry for ${date}: no-break reason is required when lunch is 0 minutes.` });
      }

      // Handle overnight: if clock-out time is before clock-in, advance date by one day
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      let clockOutDate = date;
      if (eH * 60 + eM <= sH * 60 + sM) {
        const nextDay = new Date(date + 'T00:00:00');
        nextDay.setDate(nextDay.getDate() + 1);
        clockOutDate = nextDay.toISOString().slice(0, 10);
      }

      const clockInIso = `${date}T${startTime}:00`;
      const clockOutIso = `${clockOutDate}T${endTime}:00`;
      const rawHours = hoursWorked(clockInIso, clockOutIso);

      if (rawHours <= 0) {
        if (req.file) discardUploadedFile(req.file);
        return res.status(400).json({ error: `Entry for ${date}: end time must be later than start time.` });
      }

      const netHours = Math.max(0, rawHours - lunchMinutes / 60);
      totalHoursSum += netHours;

      builtEntries.push({
        type: Number.isInteger(sourceClockEntryId) && sourceClockEntryId > 0 ? 'clock' : 'paper',
        date,
        clockIn: clockInIso,
        clockOut: clockOutIso,
        hours: Math.round(netHours * 100) / 100,
        lunchMinutes,
        breakReason: breakReason || '',
        clockEntryId: Number.isInteger(sourceClockEntryId) && sourceClockEntryId > 0 ? sourceClockEntryId : null,
      });

      if (Number.isInteger(sourceClockEntryId) && sourceClockEntryId > 0) {
        sourceClockEntryIds.push(sourceClockEntryId);
      }
    }

    if (builtEntries.length === 0) {
      if (req.file) discardUploadedFile(req.file);
      return res.status(400).json({ error: 'No valid day entries provided.' });
    }

    const entriesJson = JSON.stringify(builtEntries);

    try {
      await persistUploadedFile(req.file, 'timesheets');
      const info = db.prepare(
        `INSERT INTO timesheets (
           employeeUserId,
           jobsiteUserId,
           assignmentId,
           jobId,
           periodStart,
           periodEnd,
           entriesJson,
           totalHours,
           source,
           paperOriginalName,
           paperStoredName,
           paperMimeType,
           paperFileSize,
           status,
           submittedBy,
           notes,
           submittedAt,
           updatedAt
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'paper', ?, ?, ?, ?, 'pending_approval', 'employee', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
      ).run(
        req.auth.id,
        assignment.jobsiteUserId || null,
        assignmentId,
        assignment.jobId,
        periodStart,
        periodEnd,
        entriesJson,
        Math.round(totalHoursSum * 100) / 100,
        req.file ? req.file.originalname : null,
        req.file ? req.file.filename : null,
        req.file ? req.file.mimetype : null,
        req.file ? req.file.size : null,
        notes || null
      );

      if (sourceClockEntryIds.length) {
        const uniqueIds = Array.from(new Set(sourceClockEntryIds));
        const placeholders = uniqueIds.map(() => '?').join(',');
        db.prepare(
          `UPDATE employee_time_clock_entries
           SET timesheetId = ?, updatedAt = CURRENT_TIMESTAMP
           WHERE employeeUserId = ?
             AND id IN (${placeholders})`
        ).run(info.lastInsertRowid, req.auth.id, ...uniqueIds);
      }

      runAsyncTask('notify_jobsite_timesheet_submitted_paper', () =>
        notifyJobsiteAboutTimesheetSubmitted({
          jobsiteUserId: assignment.jobsiteUserId,
          employeeUserId: req.auth.id,
          employeeName: req.auth.name,
          actorUserId: req.auth.id,
          timesheetId: Number(info.lastInsertRowid),
          source: 'paper',
          periodStart,
          periodEnd,
        })
      );

      emitDomainSyncToAdmins(['scheduling', 'full'], ['admin-dashboard', 'timesheets']);

      return res.status(201).json({ id: info.lastInsertRowid, submitted: true });
    } catch (error) {
      discardUploadedFile(req.file);
      logCaughtException('paper timesheet upload', error, { employeeUserId: req.auth.id, assignmentId });
      return res.status(500).json({ error: 'Failed to store timesheet file.' });
    }
  });
});

app.get('/api/portal/timesheets/:id/file', authGuard(), async (req, res) => {
  const timesheetId = Number(req.params.id);
  if (!Number.isInteger(timesheetId) || timesheetId < 1) {
    return res.status(400).json({ error: 'Invalid timesheet id.' });
  }

  const row = db.prepare(
    `SELECT id, employeeUserId, jobsiteUserId, paperOriginalName, paperStoredName
     FROM timesheets
     WHERE id = ?`
  ).get(timesheetId);

  if (!row || !row.paperStoredName) {
    return res.status(404).json({ error: 'Timesheet file not found.' });
  }

  const canAccess = req.auth.role === 'admin'
    || (req.auth.role === 'employee' && Number(row.employeeUserId) === Number(req.auth.id))
    || (req.auth.role === 'jobsite' && Number(row.jobsiteUserId) === Number(req.auth.id));

  if (!canAccess) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  return sendStoredAsset(res, row.paperStoredName, {
    contentType: row.paperMimeType,
    disposition: 'attachment',
    downloadName: row.paperOriginalName || 'Timesheet.pdf',
    missingMessage: 'Timesheet file is missing from storage.',
  });
});

// ─── Timesheets: Jobsite routes ───────────────────────────────────────────────

// GET /api/portal/jobsite/timesheets
app.get('/api/portal/jobsite/timesheets', authGuard(['jobsite']), (req, res) => {
  const timesheets = db.prepare(
    `SELECT
       ts.id,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.paperOriginalName,
       ts.paperStoredName,
       ts.status,
       ts.submittedAt,
       ts.submittedBy,
       ts.approvedAt,
       ts.approvalSignature,
       ts.entriesJson,
       ts.notes,
       u.name AS employeeName,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      j.statPaySignatureName,
       jp.companyName AS facilityName,
       jp.address AS facilityAddress,
       j.title AS jobTitle,
       (
         SELECT a.position FROM applications a
         WHERE (a.userId = u.id OR a.email = u.email)
         ORDER BY a.createdAt DESC LIMIT 1
       ) AS employeePosition
     FROM timesheets ts
     JOIN users u ON u.id = ts.employeeUserId
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     WHERE ts.jobsiteUserId = ?
     ORDER BY ts.status = 'pending_approval' DESC, ts.periodStart DESC`
  ).all(req.auth.id);

  res.json({
    timesheets: timesheets.map((ts) => ({
      ...ts,
      paperFileUrl: ts.paperStoredName ? `/api/portal/timesheets/${ts.id}/file` : null,
    })),
  });
});

// POST /api/portal/jobsite/timesheets/:id/approve
app.post('/api/portal/jobsite/timesheets/:id/approve', authGuard(['jobsite']), (req, res) => {
  const tsId = Number(req.params.id);
  if (!Number.isInteger(tsId) || tsId < 1) return res.status(400).json({ error: 'Invalid timesheet ID.' });

  const signature = String((req.body && req.body.signature) || '').trim();
  if (!signature || signature.length < 2) return res.status(400).json({ error: 'A typed signature (full name) is required to approve.' });
  if (signature.length > 200) return res.status(400).json({ error: 'Signature is too long.' });

  const ts = db.prepare(
    `SELECT
       ts.id,
       ts.employeeUserId,
       ts.status,
       ts.source,
       ts.entriesJson,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       u.name AS employeeName,
       (
         SELECT a.position FROM applications a
         WHERE (a.userId = u.id OR a.email = u.email)
         ORDER BY a.createdAt DESC LIMIT 1
       ) AS employeePosition,
       jp.companyName AS facilityName,
       jp.address AS facilityAddress
     FROM timesheets ts
     JOIN users u ON u.id = ts.employeeUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     WHERE ts.id = ? AND ts.jobsiteUserId = ?`
  ).get(tsId, req.auth.id);

  if (!ts) return res.status(404).json({ error: 'Timesheet not found.' });
  if (ts.status !== 'pending_approval') return res.status(409).json({ error: 'This timesheet has already been processed.' });

  db.prepare(
    `UPDATE timesheets
     SET status = 'approved',
         approvedAt = CURRENT_TIMESTAMP,
         approvalSignature = ?,
         approvedByUserId = ?,
         updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(signature, req.auth.id, tsId);

  let workedWindow = `${ts.periodStart || 'N/A'} to ${ts.periodEnd || 'N/A'}`;
  try {
    const parsed = JSON.parse(ts.entriesJson || '[]');
    if (Array.isArray(parsed) && parsed.length) {
      const first = parsed[0];
      const last = parsed[parsed.length - 1];
      const firstIn = first && first.clockIn ? new Date(first.clockIn).toLocaleString() : null;
      const lastOut = last && last.clockOut ? new Date(last.clockOut).toLocaleString() : null;
      if (firstIn || lastOut) {
        workedWindow = `${firstIn || 'N/A'} - ${lastOut || 'N/A'}`;
      }
    }
  } catch (_error) {
    // Keep period fallback.
  }

  runAsyncTask('notify_admins_timesheet_approved', () =>
    notifyAdminsAboutTimesheetApproved({
      timesheetId: ts.id,
      source: ts.source || 'clock',
      employeeName: ts.employeeName,
      employeePosition: ts.employeePosition,
      facilityName: ts.facilityName,
      streetAddress: ts.facilityAddress,
      workedWindow,
      approvalSignature: signature,
      approvedAt: new Date().toISOString(),
    })
  );

  runAsyncTask('notify_employee_timesheet_approved', () =>
    notifyEmployeeAboutTimesheetApproved({
      employeeUserId: ts.employeeUserId,
      timesheetId: ts.id,
      periodStart: ts.periodStart,
      periodEnd: ts.periodEnd,
    })
  );

  emitDomainSyncToAdmins(['scheduling', 'full'], ['admin-dashboard', 'timesheets']);

  res.json({ approved: true });
});

// ─── Timesheets: Admin routes ─────────────────────────────────────────────────

function normalizeTimesheetSource(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['clock', 'manual', 'paper'].includes(normalized) ? normalized : '';
}

function normalizeTimesheetStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return ['pending_approval', 'approved'].includes(normalized) ? normalized : '';
}

function csvEscape(value) {
  if (value === null || value === undefined) return '""';
  const text = String(value).replace(/\r\n|\r|\n/g, ' ').replace(/"/g, '""');
  return `"${text}"`;
}

function buildTimesheetCsvFilename(periodStart, periodEnd) {
  if (periodStart && periodEnd) {
    return `timesheet-summary-${periodStart}-to-${periodEnd}.csv`;
  }
  return 'timesheet-summary-all-periods.csv';
}

// GET /api/admin/timesheets
app.get('/api/admin/timesheets', authGuard(['admin']), (req, res) => {
  const timesheets = db.prepare(
    `SELECT
       ts.id,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.paperOriginalName,
       ts.paperStoredName,
       ts.status,
       ts.submittedAt,
       ts.submittedBy,
       ts.approvedAt,
       ts.approvalSignature,
       ts.entriesJson,
       ts.notes,
       u.name AS employeeName,
       u.id AS employeeUserId,
       j.title AS jobTitle,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      j.statPaySignatureName,
       jp.companyName,
       jp.address AS facilityAddress
     FROM timesheets ts
     JOIN users u ON u.id = ts.employeeUserId
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     ORDER BY ts.createdAt DESC`
  ).all();

  res.json({
    timesheets: timesheets.map((ts) => ({
      ...ts,
      paperFileUrl: ts.paperStoredName ? `/api/portal/timesheets/${ts.id}/file` : null,
    })),
  });
});

// GET /api/admin/timesheets/export.csv
app.get('/api/admin/timesheets/export.csv', authGuard(['admin']), (req, res) => {
  const periodStart = String(req.query.periodStart || '').trim();
  const periodEnd = String(req.query.periodEnd || '').trim();
  const employeeUserId = Number(req.query.employeeUserId);
  const source = normalizeTimesheetSource(req.query.source);
  const status = normalizeTimesheetStatus(req.query.status);

  const periodStartValid = !periodStart || /^\d{4}-\d{2}-\d{2}$/.test(periodStart);
  const periodEndValid = !periodEnd || /^\d{4}-\d{2}-\d{2}$/.test(periodEnd);
  if (!periodStartValid || !periodEndValid) {
    return res.status(400).json({ error: 'Invalid pay period format.' });
  }
  if ((periodStart && !periodEnd) || (!periodStart && periodEnd)) {
    return res.status(400).json({ error: 'Both period start and period end are required when filtering by pay period.' });
  }

  const where = [];
  const params = [];

  if (periodStart && periodEnd) {
    where.push('ts.periodStart = ? AND ts.periodEnd = ?');
    params.push(periodStart, periodEnd);
  }

  if (Number.isInteger(employeeUserId) && employeeUserId > 0) {
    where.push('ts.employeeUserId = ?');
    params.push(employeeUserId);
  }

  if (source) {
    where.push('LOWER(ts.source) = ?');
    params.push(source);
  }

  if (status) {
    where.push('LOWER(ts.status) = ?');
    params.push(status);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(
    `SELECT
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.status,
       ts.submittedBy,
       ts.submittedAt,
       ts.approvedAt,
       ts.approvalSignature,
       ts.notes,
       u.id AS employeeUserId,
       u.name AS employeeName,
       j.title AS jobTitle,
       jp.companyName,
       jp.address AS facilityAddress
     FROM timesheets ts
     JOIN users u ON u.id = ts.employeeUserId
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     ${whereSql}
     ORDER BY ts.periodStart DESC, ts.periodEnd DESC, u.name ASC, ts.createdAt DESC`
  ).all(...params);

  const headers = [
    'Pay Period Start',
    'Pay Period End',
    'Employee Name',
    'Employee ID',
    'Shift',
    'Client',
    'Facility Address',
    'Total Hours',
    'Source',
    'Status',
    'Submitted By',
    'Submitted At',
    'Approved At',
    'Approval Signature',
    'Notes',
  ];

  const csvLines = [headers.map(csvEscape).join(',')];
  for (const row of rows) {
    csvLines.push([
      row.periodStart || '',
      row.periodEnd || '',
      row.employeeName || '',
      row.employeeUserId || '',
      row.jobTitle || '',
      row.companyName || '',
      row.facilityAddress || '',
      Number(row.totalHours || 0).toFixed(2),
      row.source || '',
      row.status || '',
      row.submittedBy || '',
      row.submittedAt || '',
      row.approvedAt || '',
      row.approvalSignature || '',
      row.notes || '',
    ].map(csvEscape).join(','));
  }

  const filename = buildTimesheetCsvFilename(periodStart, periodEnd);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  return res.send(csvLines.join('\r\n'));
});

// GET /api/admin/employees/:id/timesheets
app.get('/api/admin/employees/:id/timesheets', authGuard(['admin']), (req, res) => {
  const employeeId = Number(req.params.id);
  if (!Number.isInteger(employeeId) || employeeId < 1) return res.status(400).json({ error: 'Invalid employee ID.' });

  const timesheets = db.prepare(
    `SELECT
       ts.id,
       ts.periodStart,
       ts.periodEnd,
       ts.totalHours,
       ts.source,
       ts.paperOriginalName,
       ts.paperStoredName,
       ts.status,
       ts.submittedAt,
       ts.submittedBy,
       ts.approvedAt,
       ts.approvalSignature,
       ts.entriesJson,
       ts.notes,
       j.title AS jobTitle,
      COALESCE(j.statPayEnabled, 0) AS statPayEnabled,
      j.statPaySignatureName,
       jp.companyName,
       jp.address AS facilityAddress,
       ts.jobsiteUserId,
       ts.assignmentId
     FROM timesheets ts
     LEFT JOIN jobs j ON j.id = ts.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = ts.jobsiteUserId
     WHERE ts.employeeUserId = ?
     ORDER BY ts.periodStart DESC`
  ).all(employeeId);

  // Also return unsubmitted clock entries for this employee
  const unsubmitted = db.prepare(
    `SELECT
       t.id,
       t.assignmentId,
       t.clockInAt,
       t.clockOutAt,
       j.id AS jobId,
       j.title,
       j.jobsiteUserId,
       jp.companyName
     FROM employee_time_clock_entries t
     JOIN jobs j ON j.id = t.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
     WHERE t.employeeUserId = ?
       AND t.clockOutAt IS NOT NULL
       AND (t.timesheetId IS NULL OR t.timesheetId = 0)
     ORDER BY t.clockInAt DESC`
  ).all(employeeId);

  const assignments = db.prepare(
    `SELECT ja.id, ja.status, j.id AS jobId, j.title, j.jobsiteUserId, jp.companyName
     FROM job_assignments ja
     JOIN jobs j ON j.id = ja.jobId
     LEFT JOIN jobsite_profiles jp ON jp.userId = j.jobsiteUserId
     WHERE ja.employeeUserId = ?
     ORDER BY ja.createdAt DESC`
  ).all(employeeId);

  res.json({
    timesheets: timesheets.map((ts) => ({
      ...ts,
      paperFileUrl: ts.paperStoredName ? `/api/portal/timesheets/${ts.id}/file` : null,
    })),
    unsubmitted,
    assignments,
  });
});

// POST /api/admin/timesheets/manual
app.post('/api/admin/timesheets/manual', authGuard(['admin']), (req, res) => {
  const body = req.body || {};
  const employeeUserId = Number(body.employeeUserId);
  const assignmentId = body.assignmentId ? Number(body.assignmentId) : null;
  const periodStart = String(body.periodStart || '').trim();
  const periodEnd = String(body.periodEnd || '').trim();
  const notes = String(body.notes || '').trim().slice(0, 1000);
  const rawEntries = Array.isArray(body.entries) ? body.entries : [];

  if (!Number.isInteger(employeeUserId) || employeeUserId < 1) return res.status(400).json({ error: 'Valid employee is required.' });
  if (!periodStart || !periodEnd) return res.status(400).json({ error: 'Period start and end dates are required.' });
  if (rawEntries.length === 0) return res.status(400).json({ error: 'At least one time entry is required.' });

  // Validate each entry has date, clockIn, clockOut
  for (const entry of rawEntries) {
    if (!entry.date || !entry.clockIn || !entry.clockOut) {
      return res.status(400).json({ error: 'Each entry must have a date, clock-in time, and clock-out time.' });
    }
    const inMs = new Date(entry.clockIn).getTime();
    const outMs = new Date(entry.clockOut).getTime();
    if (isNaN(inMs) || isNaN(outMs) || outMs <= inMs) {
      return res.status(400).json({ error: `Invalid times for entry on ${entry.date}: clock-out must be after clock-in.` });
    }
  }

  // Look up employee & assignment
  const employee = db.prepare('SELECT id FROM users WHERE id = ? AND role = ?').get(employeeUserId, 'employee');
  if (!employee) return res.status(404).json({ error: 'Employee not found.' });

  let jobId = null;
  let jobsiteUserId = null;
  if (assignmentId) {
    const assignment = db.prepare(
      `SELECT ja.id, ja.jobId, j.jobsiteUserId
       FROM job_assignments ja
       JOIN jobs j ON j.id = ja.jobId
       WHERE ja.id = ? AND ja.employeeUserId = ?`
    ).get(assignmentId, employeeUserId);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found for this employee.' });
    jobId = assignment.jobId;
    jobsiteUserId = assignment.jobsiteUserId;
  }

  const entriesJson = JSON.stringify(rawEntries.map(e => ({
    type: 'manual',
    clockEntryId: null,
    date: String(e.date).trim(),
    clockIn: String(e.clockIn).trim(),
    clockOut: String(e.clockOut).trim(),
    hours: hoursWorked(e.clockIn, e.clockOut),
    notes: String(e.entryNotes || '').trim().slice(0, 500),
  })));

  const totalHours = rawEntries.reduce((sum, e) => sum + hoursWorked(e.clockIn, e.clockOut), 0);

  const info = db.prepare(
     `INSERT INTO timesheets (employeeUserId, jobsiteUserId, assignmentId, jobId, periodStart, periodEnd, entriesJson, totalHours, source, status, submittedBy, notes, submittedAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', 'pending_approval', 'admin', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
  ).run(employeeUserId, jobsiteUserId || null, assignmentId || null, jobId || null, periodStart, periodEnd, entriesJson, Math.round(totalHours * 100) / 100, notes || null);

  // Log admin action
  db.prepare(`INSERT INTO admin_logs (adminUserId, action, details) VALUES (?, ?, ?)`)
    .run(req.auth.id, 'manual_timesheet_submit', JSON.stringify({ timesheetId: info.lastInsertRowid, employeeUserId, periodStart, periodEnd }));

  const employeeRow = db.prepare('SELECT name FROM users WHERE id = ?').get(employeeUserId) || {};
  runAsyncTask('notify_jobsite_timesheet_submitted_manual', () =>
    notifyJobsiteAboutTimesheetSubmitted({
      jobsiteUserId,
      employeeUserId,
      employeeName: employeeRow.name || `Employee ${employeeUserId}`,
      actorUserId: req.auth.id,
      timesheetId: Number(info.lastInsertRowid),
      source: 'manual',
      periodStart,
      periodEnd,
    })
  );

  res.status(201).json({ id: info.lastInsertRowid, submitted: true });
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

let expirationReminderLastRunMinuteKey = '';
let paperTimesheetReminderLastRunMinuteKey = '';

function runWeeklyExpirationReminderSweep(now = new Date()) {
  const employees = db
    .prepare("SELECT id, name, email FROM users WHERE role = 'employee' AND isActive = 1 ORDER BY id ASC")
    .all();

  const weekKey = formatWeeklyReminderWeekKey(now);
  employees.forEach((employee) => {
    const expiring = getEmployeeExpiringRequiredDocuments(employee.id, employee.email, 30);
    expiring.forEach((item) => {
      runAsyncTask('notify_employee_document_expiration_reminder', () =>
        sendEmployeeDocumentReminder({
          employeeUserId: employee.id,
          actorUserId: null,
          documentType: item.documentType,
          reason: 'expiration_auto',
          weekKey,
          expirationDate: item.expirationDate,
          daysUntilExpiration: item.daysUntilExpiration,
        })
      );
    });
  });
}

function startExpirationReminderScheduler() {
  const tick = () => {
    try {
      const now = new Date();
      const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (minuteKey === expirationReminderLastRunMinuteKey) return;
      expirationReminderLastRunMinuteKey = minuteKey;

      const isMonday = now.getDay() === 1;
      const isTenAm = now.getHours() === 10 && now.getMinutes() === 0;
      if (!isMonday || !isTenAm) return;

      runWeeklyExpirationReminderSweep(now);
    } catch (error) {
      console.error('expiration reminder scheduler failed:', error);
    }
  };

  tick();
  setInterval(tick, 60 * 1000);
}

function runMandatoryPaperTimesheetReminderSweep(now = new Date(), reminderType = '') {
  const normalizedReminderType = String(reminderType || '').trim().toLowerCase();
  if (!normalizedReminderType) return;

  const targetWeek = normalizedReminderType === 'paper_timesheet_monday_8am'
    ? getWorkWeekWindow(now, -1)
    : getWorkWeekWindow(now, 0);

  const employees = getEmployeesWithPendingPaperTimesheetReminderForWeek(targetWeek.periodStart, targetWeek.periodEnd);
  employees.forEach((employee) => {
    runAsyncTask('notify_employee_paper_timesheet_reminder', () =>
      sendEmployeePaperTimesheetReminder({
        employeeUserId: employee.id,
        reminderType: normalizedReminderType,
        weekKey: targetWeek.weekKey,
        periodStart: targetWeek.periodStart,
        periodEnd: targetWeek.periodEnd,
      })
    );
  });
}

function startPaperTimesheetReminderScheduler() {
  const tick = () => {
    try {
      const now = new Date();
      const minuteKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      if (minuteKey === paperTimesheetReminderLastRunMinuteKey) return;
      paperTimesheetReminderLastRunMinuteKey = minuteKey;

      const isSundayNoon = now.getDay() === 0 && now.getHours() === 12 && now.getMinutes() === 0;
      const isMondayEightAm = now.getDay() === 1 && now.getHours() === 8 && now.getMinutes() === 0;

      if (isSundayNoon) {
        runMandatoryPaperTimesheetReminderSweep(now, 'paper_timesheet_sunday_noon');
      }

      if (isMondayEightAm) {
        runMandatoryPaperTimesheetReminderSweep(now, 'paper_timesheet_monday_8am');
      }
    } catch (error) {
      console.error('paper timesheet reminder scheduler failed:', error);
    }
  };

  tick();
  setInterval(tick, 60 * 1000);
}

function checkContractRenewals() {
  const now = new Date();
  const dueContracts = db.prepare(
    `SELECT c.*, u.name AS clientUserName, jp.companyName AS clientCompanyName
     FROM contracts c
     JOIN users u ON u.id = c.jobsiteUserId
     LEFT JOIN jobsite_profiles jp ON jp.userId = c.jobsiteUserId
     WHERE c.status = 'executed'
       AND c.renewalDueAt IS NOT NULL
       AND c.renewalDueAt <= ?
       AND c.renewalNotifiedAt IS NULL`
  ).all(now.toISOString());

  for (const contract of dueContracts) {
    db.prepare(`UPDATE contracts SET renewalNotifiedAt = ?, status = 'renewal_pending', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(now.toISOString(), contract.id);
    runAsyncTask(`contract_renewal_notify_${contract.id}`, () => notifyContractRenewalDue({ ...contract, id: contract.id }));
  }
}

server.listen(port, () => {
  if (isUsingPostgres) {
    runSafePostgresMigrations(db);
  }
  startExpirationReminderScheduler();
  startPaperTimesheetReminderScheduler();
  // Check for contract renewals on startup and then hourly
  checkContractRenewals();
  setInterval(checkContractRenewals, 60 * 60 * 1000);

  // Purge expired sessions every hour to prevent table bloat
  const purgeExpiredSessions = () => {
    try {
      db.prepare("DELETE FROM sessions WHERE expiresAt <= strftime('%s', 'now')").run();
    } catch (error) {
      logCaughtException('purge expired sessions', error);
    }
  };
  purgeExpiredSessions();
  setInterval(purgeExpiredSessions, 60 * 60 * 1000);

  const purgeExpiredPasswordResetTokens = () => {
    try {
      cleanupExpiredPasswordResetTokens();
    } catch (error) {
      logCaughtException('purge expired password reset tokens', error);
    }
  };
  purgeExpiredPasswordResetTokens();
  setInterval(purgeExpiredPasswordResetTokens, 15 * 60 * 1000);

  console.log('Progress Staffing server running.', {
    port,
    environment: APP_URL_CONFIG.environment,
    appBaseUrl: APP_BASE_URL,
    appBaseUrlSource: APP_URL_CONFIG.source,
    usedAppBaseUrlFallback: APP_URL_CONFIG.usedFallback,
  });
});
