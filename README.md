# OmicsTrack

Data tracking application for the research study **"Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population"**.

**Principal Investigator:** Esperance Umumararungu
**Affiliations:** National Reference Laboratory (NRL), Kigali, Rwanda &middot; GIGA-CMB, Universit&eacute; de Li&egrave;ge, Belgium

## Overview

OmicsTrack manages the end-to-end workflow for leukemia patient sample collection, processing, and international shipment:

- **Patient enrollment** with demographic and clinical data
- **Informed consent** capture (upload or digital signatures)
- **Questionnaire** completion (6-section clinical questionnaire)
- **Sample collection** documentation (3 EDTA tubes per patient)
- **PBMC isolation** with QC metrics (cell count, viability, storage location)
- **Shipment management** for bulk sample transfer from Rwanda to Li&egrave;ge
- **Reception QC** with origin vs destination quality comparison

## Tech Stack

- React 18 + Vite 6
- Plain CSS with custom properties (no Tailwind)
- localStorage persistence (repository pattern for future database migration)
- Trilingual: English, French, Kinyarwanda

## Quick Start

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Default Admin Account

| Username    | Password        | Role  |
|-------------|-----------------|-------|
| esperance   | leuktrack2025   | Admin |

Additional default accounts are seeded on first launch (viewer, li&egrave;ge team). The admin account is protected and will be automatically restored if removed.

### Build for Production

```bash
npm run build
npm run preview
```

The production build outputs to `dist/`.

## Roles & Access Control

| Role   | Dashboard | Patients | Shipments | Users |
|--------|-----------|----------|-----------|-------|
| Admin  | Full      | Full     | Create + View | Manage |
| Entry  | View      | Add + Edit (site-restricted) | Create | - |
| Viewer | View      | View only | - | - |
| Li&egrave;ge  | View      | View + Transfer tab | Receive | - |

## Project Structure

```
src/
  App.jsx                  # Main app with role-based view guard
  main.jsx                 # Entry point
  context/AppContext.jsx    # Global state (React Context)
  storage/
    engine.js              # localStorage wrapper
    repository.js          # Domain repositories (User, Patient, Step, Shipment)
    migrate.js             # Schema migrations (v0-v4)
  constants/
    index.js               # Sites, roles, storage keys
    translations.js        # i18n strings (en/fr/ki)
    questionnaire.js       # Questionnaire field definitions
    seedData.js            # Default users + seed patients
  components/
    auth/LoginPage.jsx
    layout/Header.jsx, Navigation.jsx
    dashboard/Dashboard.jsx, ShipmentPipeline.jsx
    patients/PatientList.jsx, PatientDetail.jsx, AddPatientForm.jsx
    workflow/ConsentStep.jsx, QuestionnaireStep.jsx, CollectionStep.jsx, PBMCStep.jsx, TransferStep.jsx
    shipments/ShipmentHub.jsx, CreateShipmentForm.jsx, ShipmentCard.jsx, ShipmentDetail.jsx
    users/UserManagement.jsx
    shared/SigPad.jsx, FileViewer.jsx
  hooks/
    useStepData.js         # Per-patient workflow step state
    useShipments.js        # Shipment CRUD operations
  styles/                  # CSS (variables, base, layout, components, animations)
```

## Documentation

Detailed documentation is available in the [docs/](docs/) folder:

- [Architecture](docs/architecture.md)
- [Roles & RBAC](docs/roles-and-rbac.md)
- [Data Model](docs/data-model.md)
- [User Flows](docs/user-flows.md)
- [Theme Design](docs/theme-design.md)
- [Implementation Plan](docs/implementation-plan.md)

## Deployment

This is a static SPA. After `npm run build`, deploy the `dist/` folder to any static hosting provider (Hostinger, Netlify, Vercel, etc.).

For Hostinger:
1. Run `npm run build`
2. Upload the contents of `dist/` to the `public_html` directory
3. No server-side configuration needed

## License

Private research project. All rights reserved.
