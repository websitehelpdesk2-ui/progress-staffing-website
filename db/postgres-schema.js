const POSTGRES_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  pendingEmail TEXT,
  role TEXT NOT NULL CHECK(role IN ('employee', 'jobsite', 'admin')),
  passwordHash TEXT NOT NULL,
  passwordSalt TEXT NOT NULL,
  passcodeHash TEXT,
  passcodeSalt TEXT,
  notifyEmailEnabled BIGINT NOT NULL DEFAULT 1,
  notifySmsEnabled BIGINT NOT NULL DEFAULT 1,
  notifyPushEnabled BIGINT NOT NULL DEFAULT 1,
  isActive BIGINT NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt TIMESTAMP,
  isVerified BIGINT NOT NULL DEFAULT 0,
  emailVerificationToken TEXT,
  emailVerificationExpiresAt BIGINT,
  pendingEmailVerificationToken TEXT,
  pendingEmailVerificationExpiresAt BIGINT,
  portalScope TEXT NOT NULL DEFAULT 'full',
  requireBiometricSensitive BIGINT NOT NULL DEFAULT 0,
  adminEmployeeIndustryTrack TEXT DEFAULT NULL,
  preferredLanguage TEXT NOT NULL DEFAULT 'en'
);

CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT REFERENCES users(id) ON DELETE SET NULL,
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
  certificationAccepted BIGINT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_profiles (
  userId BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  skills TEXT,
  certifications TEXT,
  backgroundStatus TEXT,
  ssnEncrypted TEXT,
  industryType TEXT,
  positionTitle TEXT
);

CREATE TABLE IF NOT EXISTS jobsite_profiles (
  userId BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  companyName TEXT,
  contactName TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  geofenceLatitude DOUBLE PRECISION,
  geofenceLongitude DOUBLE PRECISION,
  industryTrack TEXT
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmail TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmailVerificationToken TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmailVerificationExpiresAt BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferredLanguage TEXT NOT NULL DEFAULT 'en';
ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS zip TEXT;

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  jobsiteUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  industry TEXT NOT NULL,
  payRate TEXT,
  schedule TEXT,
  statPayEnabled BIGINT NOT NULL DEFAULT 0,
  statPaySignatureName TEXT,
  statPaySignedAt TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'closed', 'draft')),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_assignments (
  id BIGSERIAL PRIMARY KEY,
  jobId BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'approved', 'completed', 'cancelled', 'no_call_no_show')),
  statusReason TEXT,
  cancellationType TEXT,
  statusUpdatedByUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  statusUpdatedAt TIMESTAMP,
  excuseFormId BIGINT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL UNIQUE,
  expiresAt BIGINT NOT NULL,
  createdAt BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tokenHash TEXT NOT NULL UNIQUE,
  expiresAt BIGINT NOT NULL,
  createdAt BIGINT NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);

CREATE TABLE IF NOT EXISTS admin_logs (
  id BIGSERIAL PRIMARY KEY,
  adminUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_documents (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  applicationId BIGINT REFERENCES applications(id) ON DELETE SET NULL,
  documentType TEXT NOT NULL DEFAULT 'resume',
  originalName TEXT NOT NULL,
  storedName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  expirationDate TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  documentStatus TEXT,
  uploadedByUserId BIGINT,
  uploadedByRole TEXT
);

CREATE TABLE IF NOT EXISTS employee_w4_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  legalName TEXT NOT NULL,
  addressLine TEXT,
  cityStateZip TEXT,
  filingStatus TEXT,
  multipleJobs BIGINT NOT NULL DEFAULT 0,
  dependentsAmount DOUBLE PRECISION,
  otherIncome DOUBLE PRECISION,
  deductions DOUBLE PRECISION,
  extraWithholding DOUBLE PRECISION,
  signatureName TEXT NOT NULL,
  signedDate TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_w9_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_background_consent_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  acknowledged BIGINT NOT NULL DEFAULT 0,
  legalName TEXT NOT NULL,
  signatureName TEXT NOT NULL,
  signedDate TEXT NOT NULL,
  consentVersion TEXT NOT NULL DEFAULT 'v1',
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_hipaa_compliance_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  acknowledged BIGINT NOT NULL DEFAULT 0,
  legalName TEXT NOT NULL,
  signatureName TEXT NOT NULL,
  signedDate TEXT NOT NULL,
  policyVersion TEXT NOT NULL DEFAULT 'v1',
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_handbook_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  acknowledged BIGINT NOT NULL DEFAULT 0,
  legalName TEXT NOT NULL,
  signatureName TEXT NOT NULL,
  signedDate TEXT NOT NULL,
  handbookVersion TEXT NOT NULL DEFAULT 'v1',
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_compensation_agreement_forms (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  acknowledged BIGINT NOT NULL DEFAULT 0,
  legalName TEXT NOT NULL,
  signatureName TEXT NOT NULL,
  signedDate TEXT NOT NULL,
  agreementVersion TEXT NOT NULL DEFAULT 'v1',
  ipAddress TEXT,
  userAgent TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_declines (
  id BIGSERIAL PRIMARY KEY,
  jobId BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  employeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(jobId, employeeUserId)
);

CREATE TABLE IF NOT EXISTS shift_offers (
  id BIGSERIAL PRIMARY KEY,
  assignmentId BIGINT NOT NULL REFERENCES job_assignments(id) ON DELETE CASCADE,
  fromEmployeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  toEmployeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'declined', 'cancelled')),
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  respondedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS direct_messages (
  id BIGSERIAL PRIMARY KEY,
  senderUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipientUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  senderDeletedAt TIMESTAMP,
  recipientDeletedAt TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_time_clock_entries (
  id BIGSERIAL PRIMARY KEY,
  employeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmentId BIGINT NOT NULL REFERENCES job_assignments(id) ON DELETE CASCADE,
  jobId BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  jobsiteUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  clockInAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  clockInLatitude DOUBLE PRECISION,
  clockInLongitude DOUBLE PRECISION,
  clockOutAt TIMESTAMP,
  clockOutLatitude DOUBLE PRECISION,
  clockOutLongitude DOUBLE PRECISION,
  geofenceDistanceFeet DOUBLE PRECISION,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  timesheetId BIGINT
);

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  keysJson TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portal_notifications (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actorUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'activity',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  url TEXT,
  taskType TEXT,
  taskRefId BIGINT,
  metadataJson TEXT,
  isRead BIGINT NOT NULL DEFAULT 0,
  isCompleted BIGINT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_reminder_logs (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  documentType TEXT NOT NULL,
  reason TEXT NOT NULL,
  weekKey TEXT,
  actorUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, documentType, reason, weekKey)
);

CREATE TABLE IF NOT EXISTS timesheets (
  id BIGSERIAL PRIMARY KEY,
  employeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  jobsiteUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  assignmentId BIGINT REFERENCES job_assignments(id) ON DELETE SET NULL,
  jobId BIGINT REFERENCES jobs(id) ON DELETE SET NULL,
  periodStart TEXT NOT NULL,
  periodEnd TEXT NOT NULL,
  entriesJson TEXT NOT NULL DEFAULT '[]',
  totalHours DOUBLE PRECISION NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'clock',
  paperOriginalName TEXT,
  paperStoredName TEXT,
  paperMimeType TEXT,
  paperFileSize BIGINT,
  status TEXT NOT NULL DEFAULT 'pending_approval',
  submittedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submittedBy TEXT NOT NULL DEFAULT 'employee',
  approvedAt TIMESTAMP,
  approvalSignature TEXT,
  approvedByUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS timesheet_reminder_logs (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reminderType TEXT NOT NULL,
  weekKey TEXT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(userId, reminderType, weekKey)
);

CREATE TABLE IF NOT EXISTS contracts (
  id BIGSERIAL PRIMARY KEY,
  industryTrack TEXT NOT NULL CHECK(industryTrack IN ('warehouse', 'healthcare')),
  jobsiteUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploadedByAdminUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  originalName TEXT NOT NULL,
  storedName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'executed', 'declined', 'withdrawn', 'withdrawal_pending', 'renewal_pending', 'cancelled', 'expired')),
  clientOpenedAt TIMESTAMP,
  clientSignedAt TIMESTAMP,
  clientSignatureName TEXT,
  clientAuthorized BIGINT NOT NULL DEFAULT 0,
  adminSignedAt TIMESTAMP,
  adminSignatureName TEXT,
  adminAuthorized BIGINT NOT NULL DEFAULT 0,
  declinedAt TIMESTAMP,
  declinedReason TEXT,
  withdrawnAt TIMESTAMP,
  withdrawnReason TEXT,
  withdrawnByUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  executedAt TIMESTAMP,
  renewalDueAt TIMESTAMP,
  renewalNotifiedAt TIMESTAMP,
  renewalClientDecision TEXT,
  renewalAdminDecision TEXT,
  clientRenewalSignatureName TEXT,
  adminRenewalSignatureName TEXT,
  clientWithdrawalSignatureName TEXT,
  clientWithdrawalSignedAt TIMESTAMP,
  adminWithdrawalSignatureName TEXT,
  adminWithdrawalSignedAt TIMESTAMP,
  withdrawalInitiatedAt TIMESTAMP,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contract_bank (
  id BIGSERIAL PRIMARY KEY,
  industryTrack TEXT NOT NULL CHECK(industryTrack IN ('warehouse', 'healthcare')),
  uploadedByAdminUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  originalName TEXT NOT NULL,
  storedName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS misc_docs (
  id BIGSERIAL PRIMARY KEY,
  uploadedByAdminUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  originalName TEXT NOT NULL,
  storedName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  fileSize BIGINT NOT NULL,
  description TEXT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS misc_doc_sends (
  id BIGSERIAL PRIMARY KEY,
  miscDocId BIGINT NOT NULL REFERENCES misc_docs(id) ON DELETE CASCADE,
  recipientUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sentByAdminUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sentAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_excuse_forms (
  id BIGSERIAL PRIMARY KEY,
  employeeUserId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignmentId BIGINT NOT NULL REFERENCES job_assignments(id) ON DELETE CASCADE,
  jobId BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  cancellationType TEXT NOT NULL CHECK(cancellationType IN ('medical', 'non_medical')),
  reason TEXT NOT NULL,
  doctorNoteDocumentId BIGINT REFERENCES employee_documents(id) ON DELETE SET NULL,
  shiftStartAt TEXT,
  cancelledAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'denied')),
  adminSignature TEXT,
  reviewedByUserId BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reviewedAt TEXT,
  doctorNoteAcknowledged BIGINT NOT NULL DEFAULT 0,
  shiftEndAt TEXT,
  submittedAsNcns BIGINT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_passkeys (
  id BIGSERIAL PRIMARY KEY,
  userId BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credentialId TEXT NOT NULL UNIQUE,
  publicKey TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  transports TEXT,
  deviceType TEXT,
  backedUp BIGINT NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  lastUsedAt TIMESTAMP
);
`;

function splitCommaSeparated(input) {
  const parts = [];
  let current = '';
  let depth = 0;
  let inString = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const prev = index > 0 ? input[index - 1] : '';
    if (char === '\'' && prev !== '\\') {
      inString = !inString;
    }
    if (!inString) {
      if (char === '(') depth += 1;
      if (char === ')') depth = Math.max(0, depth - 1);
      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function buildSchemaMetadata(sql) {
  const tableColumns = {};
  const columnCaseMap = {};
  const createTablePattern = /CREATE TABLE IF NOT EXISTS\s+(\w+)\s*\(([\s\S]*?)\);/gi;
  let match = createTablePattern.exec(sql);
  while (match) {
    const tableName = match[1];
    const body = match[2];
    const columns = [];
    splitCommaSeparated(body).forEach((entry) => {
      if (!entry) return;
      if (/^(FOREIGN KEY|UNIQUE|CHECK|CONSTRAINT)\b/i.test(entry)) return;
      const nameMatch = entry.match(/^([A-Za-z_][A-Za-z0-9_]*)\b/);
      if (!nameMatch) return;
      const columnName = nameMatch[1];
      columns.push(columnName);
      columnCaseMap[columnName.toLowerCase()] = columnName;
    });
    tableColumns[tableName] = columns;
    match = createTablePattern.exec(sql);
  }
  return { tableColumns, columnCaseMap };
}

const schemaMetadata = buildSchemaMetadata(POSTGRES_SCHEMA_SQL);

// Safe, idempotent column-add migrations.
// These run on every Postgres startup (not gated by AUTO_DB_BOOTSTRAP)
// so that new columns are always present regardless of when the schema
// was first bootstrapped.
const POSTGRES_SAFE_MIGRATIONS = [
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmail TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmailVerificationToken TEXT',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS pendingEmailVerificationExpiresAt BIGINT',
  "ALTER TABLE users ADD COLUMN IF NOT EXISTS preferredLanguage TEXT NOT NULL DEFAULT 'en'",
  'ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS city TEXT',
  'ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS state TEXT',
  'ALTER TABLE jobsite_profiles ADD COLUMN IF NOT EXISTS zip TEXT',
];

module.exports = {
  POSTGRES_SCHEMA_SQL,
  POSTGRES_SAFE_MIGRATIONS,
  TABLE_COLUMNS: schemaMetadata.tableColumns,
  COLUMN_CASE_MAP: schemaMetadata.columnCaseMap,
};