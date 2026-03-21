# OmicsTrack — Roles & Access Control (RBAC)

## Role Definitions

| Role | Users | Purpose |
|------|-------|---------|
| **Admin** | Esperance Umumararungu (PI) | Full system control — manages everything |
| **Data Entry** | Site colleagues at KFH, RMH, etc. | Add/edit patients and workflow data at assigned sites |
| **Supervisor / Viewer** | Prof. Mutesa, Prof. Masaisa | Read-only oversight across all sites |
| **Liege Team** | Prof. Twizere or designated colleague | View all data + confirm sample receipt in Liege |

## Default Credentials (MVP Only)

| User | Username | Password | Role |
|------|----------|----------|------|
| Esperance Umumararungu | esperance | leuktrack2025 | Admin |
| Supervisor Rwanda | supervisor | viewer2025 | Supervisor |
| Liege Team | liege_user | liege2025 | Liege |

> Passwords are stored in plaintext for MVP. Must be hashed before production.

## Access Control Matrix

### Navigation Tabs

| Tab | Admin | Data Entry | Supervisor | Liege |
|-----|-------|------------|------------|-------|
| Dashboard | Full stats | Site-filtered stats | All stats (read-only) | All stats + pipeline focus |
| Patients | All patients | Own site(s) only | All patients (read-only) | All patients (read-only) |
| Shipments | -- | -- | -- | Dedicated pipeline view |
| Users | Full CRUD | -- | -- | -- |

### Patient Operations

| Action | Admin | Data Entry | Supervisor | Liege |
|--------|-------|------------|------------|-------|
| View patient list | All sites | Assigned sites only | All sites | All sites |
| Search / filter | Yes | Yes (within sites) | Yes | Yes |
| Add patient | Yes | Yes (at own sites) | No | No |
| Edit patient info | Yes | Yes (at own sites) | No | No |
| Delete patient | No (not in MVP) | No | No | No |

### Workflow Steps

| Step | Admin | Data Entry | Supervisor | Liege |
|------|-------|------------|------------|-------|
| Consent — fill/upload | Read/Write | Read/Write | Read-Only | Read-Only |
| Questionnaire — fill/upload | Read/Write | Read/Write | Read-Only | Read-Only |
| Sample Collection | Read/Write | Read/Write | Read-Only | Read-Only |
| PBMC Isolation | Read/Write | Read/Write | Read-Only | Read-Only |
| Transfer — submit shipment | Read/Write | Read/Write | Read-Only | Read-Only |
| Transfer — confirm receipt | **Yes** | No | No | **Yes** |

### User Management

| Action | Admin | Data Entry | Supervisor | Liege |
|--------|-------|------------|------------|-------|
| View user list | Yes | No | No | No |
| Create user | Yes | No | No | No |
| Remove user | Yes (non-default) | No | No | No |
| Assign sites to entry user | Yes | No | No | No |

## Role-Specific UI Behavior

### Admin
- **Badge color**: Teal (`--ac`)
- **Navigation**: Dashboard, Patients, Users
- **Dashboard**: Shows global stats for all sites, user count
- **Patients**: Full access — add, edit, fill all workflow steps
- **Users tab**: Create/remove users, assign sites

### Data Entry
- **Badge color**: Green (`--ok`)
- **Navigation**: Dashboard, Patients
- **Site restriction banner**: Displays at top of patient list — "Showing patients at: [CHUK, RMH]"
- **No sites assigned**: Shows warning alert — "No sites assigned. Contact your administrator."
- **Dashboard**: Shows stats filtered to their assigned sites
- **Patients**: Can add (auto-assigns to their first site), edit, and fill all workflow steps
- **Cannot**: Access Users tab, confirm receipt

### Supervisor / Viewer
- **Badge color**: Blue-gray (`--viewer`)
- **Navigation**: Dashboard, Patients
- **"View Only" indicator**: Persistent pill in header
- **All inputs disabled**: Subtle visual overlay on forms, no submit buttons shown
- **Dashboard**: Full global stats (read-only)
- **Patients**: Can view all, search, filter — cannot add, edit, or submit

### Liege Team
- **Badge color**: Purple (`--liege`)
- **Navigation**: Dashboard, Patients, **Shipments**
- **Shipments tab** (unique to Liege): Shows all patients grouped by transfer status:
  - Pre-Collection — workflow not yet at transfer stage
  - Ready for Shipment — PBMC complete, transfer not submitted
  - In Transit — transfer submitted, receipt not yet confirmed
  - Received in Liege — receipt confirmed
- **Patient detail**: Transfer step is highlighted/expanded by default
- **Can confirm receipt**: Date, notes, and confirmation checkbox
- **All other steps**: Read-only

## Site Restriction Logic (Data Entry)

```
When role === 'entry':
  1. Check user.sites array
  2. If sites.length === 0:
     → Show warning: "No sites assigned"
     → Show empty patient list
  3. If sites.length > 0:
     → Filter patients where patient.facility is in user.sites
     → Show banner: "Showing patients at: [site1, site2]"
     → When adding patient, facility dropdown limited to user.sites
```

## Audit Trail

Every significant action is logged:

| Action | Logged By | Details |
|--------|-----------|---------|
| `user.login` | System | "User [name] logged in" |
| `patient.create` | User who created | "Patient [code] - [name] added" |
| `patient.update` | User who edited | "Patient [code] updated" |
| `consent.submit` | User who submitted | "Consent submitted for [code]" |
| `questionnaire.submit` | User who submitted | "Questionnaire submitted for [code]" |
| `collection.submit` | User who submitted | "Collection saved for [code]" |
| `pbmc.submit` | User who submitted | "PBMC data saved for [code]" |
| `transfer.submit` | User who submitted | "Transfer submitted for [code]" |
| `transfer.receipt` | Liege/Admin who confirmed | "Receipt confirmed for [code] by [name]" |
| `user.create` | Admin who created | "User [name] created with role [role]" |
| `user.remove` | Admin who removed | "User [name] removed" |

Each audit entry stores:
```
{
  id: string,
  timestamp: ISO 8601,
  userId: string,
  userName: string,
  action: string,
  entityType: string,
  entityId: string,
  details: string
}
```
