# AuthentiCheck Frontend

**Verify what you buy. Protect what you make.**

AuthentiCheck is a product-authenticity platform. Manufacturers register their products, issue unique one-time codes for every pack, and see how those codes are checked in the field. Consumers check a pack in seconds with a QR scan or a short code. This repository is the web frontend: the public verification flow, the manufacturer dashboard and the platform-admin console.

---

## Mission and vision

**Mission.** Give every consumer a fast, honest way to check a product, and give every manufacturer the tools to issue, track and investigate the codes on their packs.

**Vision.** A market where counterfeit and recalled products are caught at the point of purchase, and where trust in a pack comes from evidence rather than packaging alone.

**Principles the product follows**

- **Honest by design.** A registered code does not prove a product is genuine. Consumer-facing copy says what we know, what we don't know and what to do next. It never calls a product "counterfeit".
- **Privacy first.** Consumers never see who checked a code or where. Flags and cases are internal leads for review, never shown to consumers.
- **Regulated categories are gated.** Pharmaceuticals stay locked behind a release gate until review, identifier, source-of-truth, recall and reporting items are complete. Regulatory references that haven't been independently verified are labelled "Provided by the manufacturer · not independently checked".

---

## How it works

1. **Register.** A company signs up and is reviewed by platform staff. Once approved, the team adds products (with consumer-visible details and a live consumer preview) and submits them for review.
2. **Issue.** For each batch, the company issues codes. Issuance runs as a background job with reconciliation (requested, generated, failed) and print exports.
3. **Check.** A consumer scans the QR code or types the 12-character code (for example `7KQ2-M9XW-4PRT`; dashes optional). The result is one of: first check, checked before, withdrawn, not recognised, invalid format, unavailable, deactivated or expired.
4. **Monitor.** Checks feed the dashboard: checks per day, genuine results, open flags and open cases.
5. **Investigate.** Suspicious patterns raise flags. Investigators open cases, review read-only check events, add notes and record an outcome.

### Surfaces

| Surface | Audience | Routes |
|---|---|---|
| Public verification | Consumers, mobile-first | `/verify`, `/how-to-contact` |
| Manufacturer dashboard | Company owners, admins, editors | `/dashboard`, `/catalogue`, `/issuance`, `/risk`, `/webhooks`, `/settings` |
| Account and onboarding | Everyone | `/login`, `/register`, `/onboarding`, `/accept-invite` |
| Platform console | AuthentiCheck staff | `/platform` |

Team roles are `owner`, `admin` and `editor`. Editors can submit products only when the owner has enabled it for them.

> **Status.** Overview checks, products, batches (create, list and detail facts), staff sign-in with MFA, tenant applications and the public verify flow are wired to the API. Code issuance, batch jobs and exports, investigations and parts of the overview still use sample data and are marked "Sample data" in the UI. See [docs/BACKEND_API_REQUIREMENTS.md](docs/BACKEND_API_REQUIREMENTS.md) for what is outstanding.

---

## Technology

| Area | Choice |
|---|---|
| Framework | [Next.js](https://nextjs.org) 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| State | Zustand (in-memory auth and active company) |
| Forms and validation | React Hook Form, Zod |
| Charts | Recharts |
| QR codes | qrcode.react |
| Language | TypeScript |
| Tooling | ESLint, Turbopack |

**Architecture notes**

- `app/` holds routes in three groups: `(public)`, `(auth)` (dashboard, behind login) and `(staff)` (platform admin).
- `components/` is organised by feature (`catalogue`, `issuance`, `risk`, `verify`, `team`, ...) with shared primitives in `ui/` and `shared/`.
- `lib/api/` is a typed client per backend area. All requests go through `apiFetch` in `lib/api/client.ts`.
- **Auth.** The access token lives in memory only. A refresh cookie (set by the backend at login) restores the session through `/auth/refresh`; concurrent 401s share a single refresh call. Company-scoped endpoints rely on the tenant (`tid`) in the access token.
- **Times** are ISO 8601 UTC from the API and shown in West Africa Time (WAT).

> This project uses a version of Next.js with breaking changes from older releases. Before changing framework-level code, read the relevant guide in `node_modules/next/dist/docs/`.

---

## Getting started

### Prerequisites

- Node.js 20 or later
- npm
- The AuthentiCheck backend API running locally (default `http://localhost:8000`)

### Install

```bash
npm install
```

### Configure

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_APP_ENV=development
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API, including `/api/v1` |
| `NEXT_PUBLIC_APP_ENV` | Environment label (for example `development`, `production`) |

The backend must allow this app's origin in CORS and set the refresh cookie for it.

### Run

```bash
npm run dev      # development server at http://localhost:3000
npm run build    # production build
npm run start    # serve the production build
npm run lint     # lint the codebase
```

---

## Documentation

| Document | Contents |
|---|---|
| [docs/ENDPOINT_REFERENCE.md](docs/ENDPOINT_REFERENCE.md) | Backend endpoint reference |
| [docs/BACKEND_API_REQUIREMENTS.md](docs/BACKEND_API_REQUIREMENTS.md) | Consolidated list of what the frontend needs from the backend |
| [docs/PRODUCTS_API_REQUIREMENTS.md](docs/PRODUCTS_API_REQUIREMENTS.md) | Products tab |
| [docs/BATCHES_CODES_API_REQUIREMENTS.md](docs/BATCHES_CODES_API_REQUIREMENTS.md) | Batches and codes |
| [docs/INVESTIGATIONS_API_REQUIREMENTS.md](docs/INVESTIGATIONS_API_REQUIREMENTS.md) | Investigations |

## Troubleshooting

- **Company pages show "A valid X-Tenant-ID header with an active membership is required" after a refresh.** The backend's `/auth/refresh` must issue a token that carries the tenant. Tracked as AUTH-5 in the backend requirements.
- **Requests fail with CORS errors.** Check that `NEXT_PUBLIC_API_BASE_URL` matches the running backend and that the backend allows `http://localhost:3000`.
