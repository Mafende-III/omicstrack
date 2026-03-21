# OmicsTrack — Data Model & Storage Design

## Storage Strategy

### MVP: localStorage
- All data stored as JSON strings in the browser's localStorage
- Per-patient workflow data stored under individual keys to avoid large monolithic objects
- Repository pattern abstracts storage — components never touch localStorage directly
- Schema versioning enables safe migrations

### Future: Server-side Database
- Only `repository.js` needs to change — hooks and components stay identical
- Repository methods become async (API calls instead of localStorage reads)
- Data shapes remain the same

## Storage Keys

| Key Pattern | Stores | Example |
|-------------|--------|---------|
| `lt_schema_v` | Schema version number | `2` |
| `lt_users` | All users array | `[User, User, ...]` |
| `lt_patients` | All patients array | `[Patient, Patient, ...]` |
| `lt_session` | Current login session | `{ id: 'u_esp' }` |
| `lt_prefs` | User preferences | `{ lang: 'en' }` |
| `lt_audit` | Audit log entries | `[AuditEntry, ...]` |
| `lt_consent_{patientId}` | Consent step data | `ConsentData` |
| `lt_quest_{patientId}` | Questionnaire step data | `QuestionnaireData` |
| `lt_collect_{patientId}` | Collection step data | `CollectionData` |
| `lt_pbmc_{patientId}` | PBMC isolation step data | `PBMCData` |
| `lt_transfer_{patientId}` | Transfer step data | `TransferData` |

## Data Types

### User

```
{
  id: string               // 'u_' + unique identifier
  name: string             // Full name
  username: string         // Login username
  password: string         // Plaintext (MVP only)
  role: 'admin' | 'entry' | 'viewer' | 'liege'
  sites: string[]          // Assigned facilities (relevant for 'entry' role)
  isDefault: boolean       // Seed users cannot be deleted
  createdAt: string        // ISO 8601
  createdBy: string        // userId of creator
}
```

### Patient

```
{
  id: string               // 'p_' + unique identifier
  code: string             // 3-digit code: '001', '002', etc. (must be unique)
  name: string             // Full name
  age: number              // Age in years (number, NOT string)
  leukemiaType: 'AML' | 'ALL' | 'CLL' | 'CML' | 'Other'
  treatment: 'On Treatment' | 'Not on Treatment'
  facility: string         // One of: CHUK, RMH, KFH, Butaro Hospital
  enrolledAt: string       // ISO 8601
  enrolledBy: string       // userId who enrolled this patient
  updatedAt: string        // ISO 8601 (last edit)
  updatedBy: string        // userId who last edited
}
```

### Consent Step Data

```
{
  mode: 'upload' | 'fill'
  confirmed: boolean               // Checkbox: form signed
  patientSignature: string | null   // base64 data URL from canvas
  researcherSignature: string | null
  file: string | null               // Uploaded file as base64 data URL
  fileName: string
  submitted: boolean
  submittedAt: string | null        // ISO 8601
  submittedBy: string | null        // userId
}
```

### Questionnaire Step Data

```
{
  mode: 'upload' | 'fill'
  fields: {                         // Keyed by field ID
    q_age: string,
    q_married: string,
    q_children: string,
    q_residence: string,
    ...                             // 21 fields across sections A-F
  }
  sectionsDone: {                   // Keyed by section letter
    A: boolean,
    B: boolean,
    C: boolean,
    D: boolean,
    E: boolean,
    F: boolean
  }
  file: string | null
  fileName: string
  submitted: boolean
  submittedAt: string | null
  submittedBy: string | null
}
```

### Collection Step Data

```
{
  dateTime: string                  // ISO datetime
  leukemiaType: string             // Confirmed type at collection
  tubesConfirmed: boolean          // All 3 EDTA tubes collected
  submitted: boolean
  submittedAt: string | null
  submittedBy: string | null
}
```

### PBMC Isolation Step Data

```
{
  location: string                  // CHUK, RMH, KFH, Butaro Hospital, or NRL
  dateTime: string                  // ISO datetime
  cellCount: string                 // cells/mL (text, lab format varies)
  viability: string                 // Percentage
  concentration: string             // cells/mL
  vials: number                     // Number of vials
  storage: {
    site: string                    // Storage site name
    fridge: string                  // Fridge ID
    shelf: string                   // Shelf number
    box: string                     // Box number
  }
  submitted: boolean
  submittedAt: string | null
  submittedBy: string | null
}
```

### Transfer Step Data

```
{
  shipDate: string                  // Date shipped
  shipNotes: string                 // Conditions / notes
  submitted: boolean                // Shipment submitted
  submittedAt: string | null
  submittedBy: string | null

  receiptConfirmed: boolean         // Receipt confirmed by Liege
  receiptDate: string               // Date received
  receiptNotes: string              // Receipt notes
  receiptConfirmedAt: string | null // ISO 8601
  receiptConfirmedBy: string | null // userId of Liege user who confirmed
}
```

### Audit Log Entry

```
{
  id: string                        // UUID
  timestamp: string                 // ISO 8601
  userId: string
  userName: string
  action: string                    // e.g. 'patient.create', 'consent.submit'
  entityType: string                // 'patient', 'user', 'consent', etc.
  entityId: string                  // Patient or user ID
  details: string                   // Human-readable summary
}
```

## Real Patient Seed Data

These are the only 4 real patients (from Patients Code.docx):

| Code | Name | Age | Leukemia Type | Treatment | Facility |
|------|------|-----|---------------|-----------|----------|
| 001 | GASANA Claude | 48 | AML | On Treatment | RMH |
| 002 | Nsengiyumva Schadrack | 46 | AML | Not on Treatment | KFH |
| 003 | Uzaribara Ignace | 61 | CLL | Not on Treatment | RMH |
| 004 | Ruzagiriza Cyriac | 87 | AML | Not on Treatment | RMH |

## Schema Migration

On app startup, `migrate.js` checks the stored schema version and applies any needed migrations:

- **v0 -> v1**: Migrate from broken `window.storage` to `localStorage`, copy old keys if they exist
- **v1 -> v2**: Convert patient age from string to number, add audit fields with defaults

Each migration is idempotent — running it twice produces the same result.

## localStorage Capacity

localStorage typically allows 5-10MB per origin. Estimated usage:

| Data | Size Estimate |
|------|--------------|
| 4 patients (JSON) | ~1 KB |
| 3 users (JSON) | ~500 bytes |
| Consent per patient (with signatures) | ~100 KB each |
| Questionnaire per patient | ~5 KB each |
| Collection per patient | ~500 bytes each |
| PBMC per patient | ~1 KB each |
| Transfer per patient | ~500 bytes each |
| Audit log (100 entries) | ~20 KB |

For 248 target patients with signatures and uploads, storage could reach 25-50 MB — exceeding localStorage limits. This confirms the need to migrate to a server-side database before reaching full enrollment.
