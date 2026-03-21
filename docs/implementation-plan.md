# OmicsTrack — Implementation Plan

**Status: COMPLETE** — All 8 phases implemented. Build passes with 0 errors. 55 modules, 17.8KB CSS, 209KB JS.

## Context

OmicsTrack was a single-file React prototype (`LeukTrack_MVP.jsx`, ~1100 lines) with a dark theme, broken storage (`window.storage` API doesn't exist in browsers), and minimal role differentiation. It has been rebuilt into a multi-file architecture with light theme, proper localStorage, role-specific UX, and animated navigation.

This plan rebuilds the app with a clean light theme, proper localStorage persistence, clear role-based UX, improved navigation (Aceternity UI-inspired), and a proper data model designed for future database migration.

## What Changes

| Area | Current | Target |
|------|---------|--------|
| Theme | Dark (teal/navy) | Light (white/teal, professional) |
| Storage | `window.storage.get/set` (broken) | `localStorage` via repository pattern |
| File structure | Single 1100-line file | ~35 files across organized directories |
| Navigation | Basic tabs, no animation | Animated sliding indicator, role-specific tabs |
| Roles | Barely differentiated | Distinct colors, banners, views per role |
| Liege experience | Same as viewer + receipt checkbox (broken) | Dedicated Shipments pipeline view |
| Data model | No audit fields, age as string | Audit trail, proper types, schema versioning |
| Responsiveness | Minimal | Phone, tablet, desktop with bottom nav on mobile |
| Seed data | 4 real patients (correct) | Keep as-is, remove any hallucinated data |

## Phases

### Phase 1: Foundation
**Files:** constants/, storage/, main.jsx

1. Create `src/constants/index.js` — SITES, LK_TYPES, STEP_KEYS, ROLES, STORAGE_KEYS
2. Create `src/constants/seedData.js` — 3 default users + 4 real patients (age as number)
3. Create `src/constants/translations.js` — Extract T object, add Shipments tab strings
4. Create `src/constants/questionnaire.js` — Extract QF field definitions
5. Create `src/storage/engine.js` — StorageEngine class using localStorage (synchronous)
6. Create `src/storage/repository.js` — PatientRepo, UserRepo, StepRepo, AuditRepo
7. Create `src/storage/migrate.js` — Schema version check + migration runner
8. Create `src/styles/variables.css` — Light theme CSS custom properties
9. Create `src/styles/base.css` — Reset, typography, body defaults

**Verification:** Import engine.js and test get/set in browser console

### Phase 2: Context & Hooks
**Files:** context/, hooks/

10. Create `src/context/AppContext.jsx` — User, lang, patients, users, audit
11. Create `src/hooks/useAuth.js` — Login/logout with session persistence
12. Create `src/hooks/usePatients.js` — Patient CRUD + audit logging
13. Create `src/hooks/useUsers.js` — User CRUD + audit logging
14. Create `src/hooks/useStepData.js` — Generic step data hook (load/save/submit)
15. Create `src/hooks/useTranslation.js` — Language switching + persistence

**Verification:** Wrap a test component in AppContext, verify login/logout works

### Phase 3: Layout & Navigation
**Files:** components/layout/, styles/layout.css, styles/animations.css

16. Create `src/components/layout/Header.jsx` — Brand, language dropdown, role badge (distinct colors), logout
17. Create `src/components/layout/Navigation.jsx` — Animated tabs with sliding indicator, role-filtered tabs
18. Create `src/components/layout/MobileNav.jsx` — Bottom nav bar for phones
19. Create `src/components/layout/PageShell.jsx` — Header + nav + main content wrapper
20. Create `src/styles/layout.css` — App shell, header, nav styles
21. Create `src/styles/animations.css` — fadeIn, tab slide, hover transitions

**Verification:** Login and see header + animated nav rendering correctly

### Phase 4: Shared Components
**Files:** components/shared/, styles/components.css

22. Create `src/components/shared/Card.jsx`
23. Create `src/components/shared/Badge.jsx`
24. Create `src/components/shared/Alert.jsx`
25. Create `src/components/shared/SigPad.jsx` — Extract from monolith
26. Create `src/components/shared/FileUpload.jsx`
27. Create `src/components/shared/Toggle.jsx`
28. Create `src/components/shared/SearchBar.jsx`
29. Create `src/components/shared/FilterChips.jsx`
30. Create `src/components/shared/ProgressBar.jsx`
31. Create `src/components/shared/Accordion.jsx`
32. Create `src/components/shared/RoleBanner.jsx` — Site restriction, view-only, Liege banners
33. Create `src/styles/components.css` — All component styles

**Verification:** Render each shared component in isolation to confirm styling

### Phase 5: Auth & Dashboard
**Files:** components/auth/, components/dashboard/

34. Create `src/components/auth/LoginPage.jsx` — Light theme login with branding
35. Create `src/components/dashboard/StatCard.jsx`
36. Create `src/components/dashboard/StatGrid.jsx` — Bento-style layout
37. Create `src/components/dashboard/BreakdownChart.jsx` — By type/facility bars
38. Create `src/components/dashboard/RecentPatients.jsx`
39. Create `src/components/dashboard/ShipmentPipeline.jsx` — Liege-only pipeline view
40. Create `src/components/dashboard/Dashboard.jsx` — Role-aware container

**Verification:** Login as each role, verify dashboard shows appropriate content

### Phase 6: Patient Views
**Files:** components/patients/

41. Create `src/components/patients/PatientRow.jsx`
42. Create `src/components/patients/PatientList.jsx` — With RoleBanner, search, filters
43. Create `src/components/patients/AddPatientForm.jsx` — Age as number, site restriction for entry
44. Create `src/components/patients/EditPatientForm.jsx`
45. Create `src/components/patients/PatientDetail.jsx` — Banner + step bar + step content

**Verification:** Add a patient, search, filter, open detail view

### Phase 7: Workflow Steps
**Files:** components/workflow/

46. Create `src/components/workflow/StepBar.jsx`
47. Create `src/components/workflow/ConsentStep.jsx`
48. Create `src/components/workflow/QuestionnaireStep.jsx`
49. Create `src/components/workflow/CollectionStep.jsx`
50. Create `src/components/workflow/PBMCStep.jsx`
51. Create `src/components/workflow/TransferStep.jsx` — Fix receipt checkbox

**Verification:** Walk through all 5 steps for a patient, verify data persists on reload

### Phase 8: Users & Integration
**Files:** components/users/, App.jsx

52. Create `src/components/users/UserRow.jsx`
53. Create `src/components/users/UserManagement.jsx`
54. Create `src/App.jsx` — Wire context, routing, auth guard
55. Update `src/main.jsx` — Import all CSS, run migrations, render App
56. Create `src/styles/responsive.css` — Breakpoint overrides

**Verification:** Full end-to-end test (see below)

## Bug Fixes Included

| Bug | Fix |
|-----|-----|
| `window.storage.get/set` doesn't exist | Replace with synchronous `localStorage.getItem/setItem` |
| Receipt checkbox hardcoded `checked={false}` | Bind to `data.receiptConfirmed` state |
| Age stored as string `'48'` | Store as number `48`, parse on input |
| Viewer and Liege have same badge color | Viewer: blue (`#4B6BFB`), Liege: purple (`#7C3AED`) |
| Entry users with no sites see nothing | Show warning banner: "No sites assigned" |
| No audit trail | Log every save/submit with userId, timestamp, action |
| Liege has no dedicated view | Add Shipments tab with pipeline kanban |

## End-to-End Verification

After implementation, test the following scenarios:

1. **Fresh start**: Clear localStorage, open app — should show login with seed data loaded
2. **Admin login**: esperance / leuktrack2025 — sees Dashboard, Patients, Users tabs
3. **Add patient**: As admin, add patient code 005 — verify it appears in list, persists on reload
4. **Workflow**: Open patient 001, complete all 5 steps — verify step bar updates, data persists
5. **Entry user**: Create entry user assigned to KFH only — verify they see only KFH patients
6. **Viewer login**: supervisor / viewer2025 — verify all inputs disabled, no add/edit buttons
7. **Liege login**: liege_user / liege2025 — verify Shipments tab, can confirm receipt on submitted transfer
8. **Language**: Switch to French, then Kinyarwanda — verify all strings update
9. **Mobile**: Resize to phone width — verify bottom nav, single-column layout
10. **Persistence**: Reload browser — verify all data, session, and language preference persist
