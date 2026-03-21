# OmicsTrack — User Flows

## 1. Login Flow

```
[Login Page]
    |
    ├── Enter username + password
    ├── Select language (EN / FR / KI)
    └── Click "Sign In"
          |
          ├── Invalid → Show error message
          └── Valid → Save session → Redirect to Dashboard
```

## 2. Admin Flow

```
[Login as Admin]
    |
    ├── [Dashboard]
    |     ├── View total patients, on treatment, active sites, user count
    |     ├── Leukemia type breakdown (progress bars)
    |     ├── Facility breakdown (progress bars)
    |     └── Recently enrolled patients (click to view)
    |
    ├── [Patients]
    |     ├── Search by name or code
    |     ├── Filter by leukemia type or facility
    |     ├── Click "+ Add Patient" → Fill form → Save
    |     └── Click patient row → [Patient Detail]
    |           ├── View/edit patient info
    |           ├── Step bar: Consent → Questionnaire → Collection → PBMC → Transfer
    |           ├── Fill any step (upload or digital)
    |           ├── Submit each step → Locked from further editing
    |           └── Transfer step: Submit shipment + Confirm receipt
    |
    └── [Users]
          ├── View all users with role badges
          ├── Click "+ Add User" → Set name, username, password, role, sites
          └── Remove non-default users
```

## 3. Data Entry Flow

```
[Login as Data Entry]
    |
    ├── [Dashboard]
    |     └── Stats filtered to assigned sites only
    |
    └── [Patients]
          ├── Banner: "Showing patients at: [KFH, RMH]"
          ├── (If no sites assigned → Warning: "No sites assigned")
          ├── Search/filter within assigned sites
          ├── Click "+ Add Patient"
          |     └── Facility dropdown limited to assigned sites
          └── Click patient row → [Patient Detail]
                ├── Edit patient info
                ├── Fill all 5 workflow steps
                ├── Submit each step → Locked
                └── Transfer: Submit shipment (cannot confirm receipt)
```

## 4. Supervisor / Viewer Flow

```
[Login as Supervisor]
    |
    ├── Header shows "View Only" indicator
    |
    ├── [Dashboard]
    |     └── Full global stats (read-only)
    |
    └── [Patients]
          ├── View all patients across all sites
          ├── Search and filter
          └── Click patient row → [Patient Detail]
                ├── View patient info (no edit button)
                ├── View all workflow steps (all inputs disabled)
                ├── No submit buttons shown
                └── Transfer: View shipment info (no actions)
```

## 5. Liege Team Flow

```
[Login as Liege]
    |
    ├── [Dashboard]
    |     └── Full stats + pipeline summary
    |
    ├── [Patients]
    |     ├── View all patients (read-only)
    |     └── Click patient row → [Patient Detail]
    |           ├── View all steps (read-only)
    |           ├── Transfer step expanded by default
    |           └── If shipment submitted → "Confirm Receipt" form:
    |                 ├── Enter received date
    |                 ├── Enter receipt notes
    |                 ├── Check confirmation checkbox
    |                 └── Click "Confirm Receipt"
    |
    └── [Shipments] ← Unique to Liege role
          ├── Pipeline view grouping patients by status:
          |
          |   Pre-Collection        Ready for Shipment      In Transit          Received
          |   ┌──────────────┐     ┌──────────────────┐   ┌──────────────┐   ┌──────────────┐
          |   │ Patient 005  │     │ Patient 003      │   │ Patient 001  │   │ Patient 002  │
          |   │ CHUK · AML   │     │ RMH · CLL        │   │ RMH · AML    │   │ KFH · AML    │
          |   │ Step: Consent│     │ PBMC complete    │   │ Shipped 3/15 │   │ Recv'd 3/18  │
          |   └──────────────┘     └──────────────────┘   │ [Confirm]    │   └──────────────┘
          |                                                └──────────────┘
          |
          └── Click "Confirm" on In Transit card → Opens receipt form
```

## 6. Patient Workflow (5 Steps)

Each patient progresses through 5 sequential steps. Any step can be navigated to at any time, but the step bar visually tracks completion.

### Step 1: Informed Consent

```
[Choose Mode]
    |
    ├── [Upload Mode]
    |     ├── Upload scanned/photo consent form
    |     ├── Check "form signed by patient and researcher"
    |     ├── Capture patient finger signature (canvas)
    |     ├── Capture researcher finger signature (canvas)
    |     └── Submit → Step marked complete, form locked
    |
    └── [Digital Fill Mode]
          ├── Read consent text on screen
          ├── Check confirmation checkbox
          ├── Capture patient finger signature
          ├── Capture researcher finger signature
          └── Submit → Step marked complete, form locked
```

### Step 2: Questionnaire

```
[Choose Mode]
    |
    ├── [Upload Mode]
    |     ├── Upload scanned/photo questionnaire
    |     ├── Mark each section (A-F) as complete via checkboxes
    |     └── Submit → Locked
    |
    └── [Digital Fill Mode]
          ├── Progress bar: N/6 sections complete
          ├── Section A: Identity (accordion) → Fill fields → Mark complete
          ├── Section B: Socio-economic → Fill → Mark complete
          ├── Section C: Health → Fill → Mark complete
          ├── Section D: Clinical/Diagnosis → Fill → Mark complete
          ├── Section E: Treatment History → Fill → Mark complete
          ├── Section F: Environmental → Fill → Mark complete
          └── Submit → Locked
```

### Step 3: Sample Collection

```
├── Enter date & time of collection
├── Confirm leukemia type (pre-filled, editable)
├── Confirm all 3 EDTA tubes collected (visual tube indicators)
└── Submit → Locked
```

### Step 4: PBMC Isolation

```
├── Select isolation location (CHUK/RMH/KFH/Butaro/NRL)
├── Enter date & time of isolation
├── Enter cell count (cells/mL)
├── Enter viability (%)
├── Enter concentration (cells/mL)
├── Enter number of vials
├── Storage location:
│     ├── Site
│     ├── Fridge ID
│     ├── Shelf number
│     └── Box number
└── Submit → Locked
```

### Step 5: Transfer to Liege

```
[Shipment] (Admin or Data Entry)
├── Enter shipment date
├── Enter shipment conditions/notes
└── Submit shipment → Shipment section locked

[Receipt] (Liege or Admin only — appears after shipment submitted)
├── Enter date received in Liege
├── Enter receipt notes
├── Check confirmation checkbox
└── Confirm receipt → Transfer fully complete
```

## 7. Language Switching

- Available at login page and in the header (any time)
- Toggles between English, Francais, Kinyarwanda
- Preference saved to localStorage
- All labels, buttons, form fields, status messages update immediately
- Language preference persists across sessions
