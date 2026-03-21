# OmicsTrack Architecture

## Overview

OmicsTrack is a single-page React application for tracking leukemia research patient enrollment, clinical data collection, biological sample processing, and international sample transfer across multiple sites in Rwanda.

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | React 18.3 | Single-page app |
| Build | Vite 6 | Dev server + production build |
| Styling | Plain CSS + CSS Custom Properties | No Tailwind, no CSS-in-JS |
| Storage | localStorage (MVP) | Repository pattern for future DB migration |
| State | React Context + Hooks | No Redux/Zustand needed at this scale |
| Routing | State-based (no router) | Views controlled by `view` state in context |

## File Structure

```
OmicsTrack/
  index.html
  package.json
  vite.config.js
  docs/                           # Documentation
  src/
    main.jsx                      # Entry point: imports CSS, runs migrations, renders App
    App.jsx                       # Root: context provider, auth guard, view switching

    constants/
      index.js                    # SITES, LK_TYPES, STEP_KEYS, ROLES, STORAGE_KEYS
      translations.js             # T object (en/fr/ki) — all UI strings
      questionnaire.js            # QF field definitions (sections A-F)
      seedData.js                 # Default users + 4 real patients

    storage/
      engine.js                   # StorageEngine class (localStorage wrapper)
      repository.js               # Domain repositories: PatientRepo, UserRepo, StepRepo, AuditRepo
      migrate.js                  # Schema version checking + data migration

    hooks/
      useAuth.js                  # Login/logout, session persistence
      usePatients.js              # Patient CRUD with audit logging
      useUsers.js                 # User CRUD with audit logging
      useStepData.js              # Generic per-step data: load/save/submit
      useTranslation.js           # Language switching + preference persistence

    context/
      AppContext.jsx              # Central context provider

    components/
      layout/
        Header.jsx                # Brand, language picker, role badge, logout
        Navigation.jsx            # Animated tab bar with sliding indicator
        MobileNav.jsx             # Bottom nav for phone screens
        PageShell.jsx             # Assembles header + nav + content

      auth/
        LoginPage.jsx             # Login form with branding

      dashboard/
        Dashboard.jsx             # Role-aware dashboard container
        StatCard.jsx              # Single stat display
        StatGrid.jsx              # Bento-style grid layout
        BreakdownChart.jsx        # Bar charts for type/facility
        RecentPatients.jsx        # Last 5 enrolled patients
        ShipmentPipeline.jsx      # Liege-only: sample pipeline kanban

      patients/
        PatientList.jsx           # Search, filter, patient rows
        PatientRow.jsx            # Single patient card
        PatientDetail.jsx         # Banner + step bar + active step
        AddPatientForm.jsx        # New patient form
        EditPatientForm.jsx       # Inline edit form

      workflow/
        StepBar.jsx               # 5-step progress indicator
        ConsentStep.jsx           # Consent: upload/fill + signatures
        QuestionnaireStep.jsx     # 6-section accordion form
        CollectionStep.jsx        # Sample collection
        PBMCStep.jsx              # PBMC isolation + storage
        TransferStep.jsx          # Shipment + receipt confirmation

      users/
        UserManagement.jsx        # User list + add form (admin only)
        UserRow.jsx               # Single user display

      shared/
        SigPad.jsx                # Canvas-based signature capture
        FileUpload.jsx            # Drag/click upload zone
        Badge.jsx                 # Colored status badge
        Card.jsx                  # Card with hover effect
        Alert.jsx                 # Info/success/warning/error bar
        Toggle.jsx                # Upload vs Fill mode toggle
        SearchBar.jsx             # Search input with icon
        FilterChips.jsx           # Chip-style filter buttons
        ProgressBar.jsx           # Linear progress bar
        Accordion.jsx             # Expandable section
        RoleBanner.jsx            # Role-specific contextual banner

    styles/
      variables.css               # CSS custom properties (light theme)
      base.css                    # Reset, typography, body
      layout.css                  # App shell, header, nav
      components.css              # Cards, buttons, inputs, badges
      animations.css              # Transitions, fadeIn, sliding indicator
      responsive.css              # Breakpoint overrides
```

## Data Flow

```
User Interaction
      |
      v
Component (UI)
      |
      v
Hook (usePatients, useStepData, etc.)
      |
      v
Repository (PatientRepo, StepRepo, etc.)
      |
      v
StorageEngine (localStorage.getItem / setItem)
```

Components never access localStorage directly. The repository layer is the only code that touches the storage engine. This means migrating to a server-side database only requires changing `repository.js`.

## State Management

```
AppContext provides:
  - user: User | null
  - lang: 'en' | 'fr' | 'ki'
  - t: translation object for current language
  - patients: Patient[]
  - users: User[]
  - login(user), logout()
  - setLang(lang)
  - addPatient(patient), updatePatient(patient)
  - addUser(user), removeUser(userId)
  - logAudit(action, entityType, entityId, details)
```

## Startup Sequence

1. `main.jsx` imports all CSS files
2. `migrate.js` runs — checks schema version, migrates old data if needed
3. `App.jsx` renders — loads users, patients, session from repository
4. If session found, auto-login the user
5. If no session, show LoginPage
6. On successful login, render PageShell with role-appropriate navigation

## Key Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Single-page (no router) | State-based views | Only 4-5 views, no deep linking needed for MVP |
| Context over Redux | React Context + hooks | < 10 users, < 250 patients — no performance concerns |
| localStorage over IndexedDB | localStorage via repository | Simpler API, sufficient for MVP data sizes |
| CSS files over CSS-in-JS | Separate .css files | Keep build simple, no runtime overhead |
| No Tailwind | CSS custom properties | Matches existing codebase pattern, reduces complexity |
| Repository pattern | Abstraction over storage | One-file change to migrate to a real database |
