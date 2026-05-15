# OmicsTrack

Data tracking application for the research study **"Characterization of Omics Perturbations Driving Leukemia in the Rwandan Population"**.

**Principal Investigator:** Esperance Umumararungu
**Affiliations:** National Reference Laboratory (NRL), Kigali, Rwanda &middot; GIGA-CMB, Universit&eacute; de Li&egrave;ge, Belgium

**Production:** [https://omicstrack.com](https://omicstrack.com)

## Overview

OmicsTrack manages the end-to-end workflow for leukemia patient sample collection, processing, and international shipment:

- **Patient enrollment** with demographic and clinical data
- **Informed consent** capture (upload or digital signatures) with PDF generation
- **Questionnaire** completion (6-section clinical questionnaire) with PDF generation
- **Sample collection** documentation (3 EDTA tubes per patient)
- **PBMC isolation** with QC metrics (cell count, viability, storage location)
- **Shipment management** for bulk sample transfer from Rwanda to Li&egrave;ge
- **Reception QC** with origin vs destination quality comparison

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Frontend | React 18, Vite 6, plain CSS with custom props |
| Backend  | Node.js, Express, Knex.js                     |
| Database | PostgreSQL 16                                 |
| Auth     | JWT (access + refresh tokens, bcrypt)          |
| Proxy    | nginx with Let's Encrypt SSL (certbot)        |
| Deploy   | Docker Compose on Hostinger VPS               |
| i18n     | English, French, Kinyarwanda                  |

## Local Development

### Frontend only (localStorage mode)

```bash
cd client
npm install
npm run dev
```

Runs at `http://localhost:5173`.

### Full stack (Docker)

```bash
docker compose up --build
```

This starts PostgreSQL, the Express API server, and nginx. The app is available at `http://localhost`.

### Default Admin Account

| Username  | Password      | Role  |
|-----------|---------------|-------|
| esperance | leuktrack2025 | Admin |

Additional default accounts (viewer, li&egrave;ge team) are seeded on first launch.

## Roles & Access Control

| Role   | Dashboard | Patients | Shipments | Users | PII Access |
|--------|-----------|----------|-----------|-------|------------|
| Admin  | Full      | Full     | Create + View | Manage | Configurable |
| Entry  | View      | Add + Edit (site-restricted) | Create | - | Configurable |
| Viewer | View      | View only | - | - | Configurable |
| Li&egrave;ge  | View      | View + Transfer tab | Receive | - | Off by default |

### PII Access Control

Patient personal data (name, age, facility) can be hidden on a per-user basis. When creating a user, admins can toggle the **"Can view patient personal data"** permission. This is enforced both server-side (API responses strip PII fields) and client-side (UI hides the fields entirely). By default, li&egrave;ge users have PII access disabled.

## Project Structure

```
client/                      # React SPA
  src/
    App.jsx                  # Main app with role-based view guard
    main.jsx                 # Entry point
    context/AppContext.jsx    # Global state (React Context)
    storage/                 # localStorage repos (MVP mode)
    constants/               # Sites, roles, translations, seed data
    components/              # Auth, layout, dashboard, patients, workflow, shipments, users
    hooks/                   # useStepData, useShipments
    styles/                  # CSS variables, base, layout, components, animations

server/                      # Express API
  src/
    index.js                 # Entry point
    config/                  # DB, auth, upload settings
    controllers/             # Route handlers
    db/                      # Knex migrations & seeds
    middleware/              # Auth, validation, error handling
    routes/                  # API route definitions
    services/                # Business logic
    validation/              # Request schemas

docker/
  Dockerfile.client          # Multi-stage: Vite build + nginx
  Dockerfile.server          # Node.js API server
  nginx.conf                 # SSL config (HTTPS + HTTP-to-HTTPS redirect)
  nginx-http.conf            # HTTP-only config (used during initial cert issuance)
  nginx-entrypoint.sh        # Selects SSL or HTTP config based on cert availability

docker-compose.yml           # Production deployment (db, server, nginx, certbot)
```

## Production Deployment

The app is deployed via **Hostinger Docker Manager** connected to the GitHub repository.

### Architecture

```
Internet
  |
  :80/:443
  |
nginx (SSL termination, static files, reverse proxy)
  |
  /api/*  -->  Express server (:3001)
  |
  PostgreSQL (:5432)
```

### SSL (Let's Encrypt + certbot)

SSL is handled automatically:

1. On first deploy, nginx starts in HTTP-only mode
2. The certbot container requests a certificate via HTTP-01 challenge
3. On next restart, nginx detects the certificate and switches to HTTPS mode
4. Certbot renews the certificate automatically every 12 hours (if needed)

### Deploy Steps

1. Push changes to `main` branch on GitHub
2. In Hostinger Docker Manager, redeploy (or delete + recreate if image caching is an issue)
3. After first deploy, restart the nginx container so it picks up the newly issued SSL cert

### Environment Variables (set in docker-compose.yml)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Access token signing key |
| `JWT_REFRESH_SECRET` | Refresh token signing key |
| `JWT_ACCESS_EXPIRY` | Access token lifetime (default: 15m) |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime (default: 7d) |
| `CORS_ORIGIN` | Allowed frontend origin |
| `UPLOAD_DIR` | File upload directory inside container |
| `NODE_ENV` | Set to `production` |

## Documentation

Detailed documentation is available in the [docs/](docs/) folder:

- [Architecture](docs/architecture.md)
- [Roles & RBAC](docs/roles-and-rbac.md)
- [Data Model](docs/data-model.md)
- [User Flows](docs/user-flows.md)
- [Theme Design](docs/theme-design.md)
- [Implementation Plan](docs/implementation-plan.md)

## License

Private research project. All rights reserved.
