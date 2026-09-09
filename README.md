# 🌟 LifeShelf Backend — Production REST API

> A robust, secure, and extensible backend API for **LifeShelf** — a personal space where users collect, organize, plan, and track everything they want to watch, read, study, visit, and do.

---

## 📑 Table of Contents

- [1. Product Overview](#1-product-overview)
- [2. Architecture & Design Principles](#2-architecture--design-principles)
- [3. Technology Stack](#3-technology-stack)
- [4. Project Structure](#4-project-structure)
- [5. Security & Multi-Tenant Data Isolation](#5-security--multi-tenant-data-isolation)
- [6. Cloud Storage & AES-256-GCM Encryption](#6-cloud-storage--aes-256-gcm-encryption)
- [7. Media Asset System](#7-media-asset-system)
- [8. Content Domains & Dynamic Features](#8-content-domains--dynamic-features)
- [9. Environment Variables](#9-environment-variables)
- [10. Installation & Running Locally](#10-installation--running-locally)
- [11. Database Setup & Prisma Migrations](#11-database-setup--prisma-migrations)
- [12. Docker & Containerization](#12-docker--containerization)
- [13. Running Automated Tests](#13-running-automated-tests)
- [14. API Documentation (Swagger/OpenAPI)](#14-api-documentation-swaggeropenapi)
- [15. API Endpoints Reference](#15-api-endpoints-reference)

---

## 1. Product Overview

**LifeShelf** puts users in 100% control of their personal lifestyle planning and media tracking without forced dependency on external movie, book, or travel databases:

* 🎬 **Watch — Movies**: Custom runtime, director, cast, status (`PLANNED`, `WATCHING`, `WATCHED`, `DROPPED`), priority, tags, personal reviews.
* 📺 **Watch — TV & Web Series**: Complete Series $\rightarrow$ Seasons $\rightarrow$ Episodes hierarchy. Real-time dynamic progress calculation, individual episode watch tracking with timestamps, and personal notes.
* 📚 **Read — Books, Articles, Papers, Blogs, Docs**: Flexible page-based or percentage progress synchronization.
* 🎓 **Study — Courses, Skills, Technologies, Certifications**: Comprehensive tracking with attached learning resources (YouTube, courses, documentation).
* ✈️ **Travel — Places & Trips**: Maintain places you want to visit and organize multi-destination trips with itinerary ordering and budgeting.
* 📅 **Plan — Personal Activities**: Schedule activities linked directly to books, episodes, topics, or custom items.
* 🏷️ **Tags & Dashboard**: User-owned reusable tags and aggregated analytics (continue watching/reading/learning, upcoming plans, recent completions).

---

## 2. Architecture & Design Principles

LifeShelf uses a clean, layered modular domain architecture:

```text
HTTP Request
     │
[Middlewares] (Helmet, CORS, Rate Limit, Correlation ID, Auth, Zod Validation)
     │
[Controllers] (Request reception, parameter parsing, response formatting)
     │
[Services]    (Pure business logic, dynamic calculations, authorization)
     │
[Prisma ORM]  (Scoped database queries enforcing `userId`)
     │
[PostgreSQL]  (ACID transactions, foreign keys, cascades, indexes)
```

For media & cloud providers:
```text
StorageService
     │
StorageProvider Interface
     │
CloudinaryProvider (initialized dynamically with decrypted user credentials)
```

### Core Product Rules
1. **User owns their data**: Strict multi-tenant isolation enforced at the database query level (`where: { id, userId }`).
2. **Images are optional**: All items can be created with or without media.
3. **Reusable default media**: Built-in default covers are application-owned (`userId: null, isDefault: true`) and never copied into users' cloud accounts.
4. **Encrypted secrets at rest**: User cloud storage credentials (Cloudinary API secrets) are encrypted with AES-256-GCM before database insertion. Secrets are NEVER returned in API responses, logged, or exposed.
5. **Dynamic derived data**: Series progress (percentage, completed seasons, next unwatched episode) is calculated dynamically from episodes rather than storing stale derived values.
6. **Provider abstraction**: New providers (AWS S3, Google Cloud Storage, MinIO) can be added by implementing `StorageProvider` without touching content business logic.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js (v20+) |
| **Framework** | Express.js 4.x |
| **Language** | TypeScript (Strict mode, zero `any`) |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma ORM 6.x |
| **Authentication** | JWT (jsonwebtoken) & bcryptjs |
| **Validation** | Zod (Body, Query, Params) |
| **Encryption** | AES-256-GCM (Node.js crypto) |
| **Cloud Storage** | Cloudinary SDK via `StorageProvider` abstraction |
| **Documentation** | Swagger / OpenAPI 3.0 (`swagger-ui-express`) |
| **Logging** | Winston structured logging with automated credential redaction |
| **Testing** | Vitest & Supertest |
| **Containerization**| Docker & Docker Compose |

---

## 4. Project Structure

```text
src/
├── app.ts                          # Express app configuration & middleware pipeline
├── server.ts                       # Server bootstrap & graceful shutdown listeners
│
├── config/
│   ├── env.ts                      # Zod-validated environment configuration
│   ├── database.ts                 # Prisma Client singleton
│   ├── logger.ts                   # Winston structured logger with redaction
│   └── swagger.ts                  # OpenAPI 3.0 configuration
│
├── common/
│   ├── constants/
│   │   └── defaults.ts             # Built-in system default media assets
│   ├── errors/
│   │   └── app-error.ts            # AppError, NotFoundError, UnauthorizedError, etc.
│   └── utils/
│       ├── api-response.ts         # Standard ApiResponse builder
│       └── pagination.ts           # Pagination query parsers & page calculators
│
├── middleware/
│   ├── auth.middleware.ts          # JWT bearer token verification
│   ├── error.middleware.ts         # Centralized error handler returning standard schema
│   ├── rate-limit.middleware.ts    # Rate limiting for general and auth routes
│   ├── request-id.middleware.ts    # X-Request-ID correlation header
│   ├── upload.middleware.ts        # Multer memory storage & MIME validation
│   └── validation.middleware.ts    # Generic Zod validation middleware
│
├── services/
│   ├── encryption.service.ts       # AES-256-GCM encryption, decryption, and secret masking
│   └── storage.service.ts          # Storage manager resolving user providers
│
├── integrations/
│   └── storage/
│       ├── storage-provider.interface.ts # StorageProvider contract
│       └── cloudinary.provider.ts        # Cloudinary implementation
│
├── modules/
│   ├── auth/                       # Register, Login, Me, Change Password, Profile
│   ├── storage/                    # User cloud configuration endpoints
│   ├── media/                      # Upload, Library, Default covers
│   ├── tags/                       # Reusable tags and associations
│   ├── movies/                     # Movies CRUD, filtering, search, pagination
│   ├── series/                     # Series, Seasons, Episodes, Progress tracking
│   ├── readlist/                   # Books, articles, papers with progress
│   ├── studylist/                  # Courses, skills, certs + learning resources
│   ├── travel/                     # Places and multi-place Trips
│   ├── plans/                      # Scheduled personal plans
│   └── dashboard/                  # Aggregated analytics & continue widgets
│
└── types/
    └── express.d.ts                # Express Request type extensions (user, requestId)

prisma/
├── schema.prisma                   # Database schema with relations & indices
└── seed.ts                         # Seeds default media covers

tests/                              # Comprehensive Vitest test suite
├── api.test.ts
├── auth.test.ts
├── encryption.test.ts
├── ownership.test.ts
├── series-progress.test.ts
└── storage-provider.test.ts
```

---

## 5. Security & Multi-Tenant Data Isolation

### Query-Level Scoping
Every resource query enforces user ownership:
```typescript
// Example: Movie fetch
const movie = await prisma.movie.findFirst({
  where: { id: movieId, userId: req.user.id },
  include: { mediaAsset: true, tags: { include: { tag: true } } }
});
if (!movie) throw new NotFoundError('Movie');
```
Attempts by User A to fetch, edit, or delete User B's records always return a `404 Not Found`, completely preventing enumeration and data leakage.

### Security Layers
* **Helmet**: Secure HTTP headers (HSTS, clickjacking prevention, MIME sniff block).
* **CORS**: Configurable allowed origins.
* **Rate Limiting**:
  * General API: 300 requests per 15 minutes.
  * Sensitive Auth endpoints: 30 requests per 15 minutes.
* **Password Hashing**: Salted bcrypt password hashes (never stored in plaintext).
* **Upload Security**: Multer configured with memory storage (no disk temp files), strict MIME whitelist (`image/jpeg`, `image/png`, `image/webp`), and 5MB size limit.

---

## 6. Cloud Storage & AES-256-GCM Encryption

Users can link their personal Cloudinary credentials under `POST /api/storage/cloudinary`:
```json
{
  "cloudName": "my-cloud",
  "apiKey": "123456789012345",
  "apiSecret": "abcdefghijklmnopqrstuvwxyz123"
}
```

### Encryption Flow:
1. The server receives the credentials.
2. Credentials are encrypted into an authenticated AES-256-GCM ciphertext with a unique random 16-byte initialization vector (`iv`) and 16-byte authentication tag (`authTag`).
3. Only the ciphertext, iv, and authTag are saved to PostgreSQL.
4. The master encryption key is read from `ENCRYPTION_KEY` and is never saved in the database.
5. In responses, only masked keys are returned (`"apiKey": "********2345"`). The secret is never sent back.

---

## 7. Media Asset System

When creating movies, series, books, or places, users have three image choices:

1. **Option A — Upload a new image**: Uploaded to their personal Cloudinary account via `POST /api/media/upload`.
2. **Option B — Choose an existing image**: Re-use any existing media asset from `GET /api/media`.
3. **Option C — Use built-in default covers**: Fetch built-in system covers from `GET /api/media/defaults` (Movie, Series, Book, Study, Travel, Generic).

---

## 8. Content Domains & Dynamic Features

### Dynamic Series Progress Calculation
Series progress is calculated in real-time from child seasons and episodes without redundant derived database writes:
* `totalEpisodes`: Count of all episodes across all seasons.
* `watchedEpisodes`: Count of episodes where `watched: true`.
* `progress`: `Math.round((watchedEpisodes / totalEpisodes) * 100)`.
* `completedSeasons`: Count of seasons where every episode has been watched.
* `nextUnwatchedEpisode`: The earliest unwatched episode ordered by `seasonNumber`, `episodeNumber`.

### Episode Tracking
Mark an episode as watched or unwatched with an optional personal note:
* `POST /api/episodes/:id/watched` $\rightarrow$ Sets `watched = true`, `watchedAt = current timestamp`, updates note.
* `DELETE /api/episodes/:id/watched` $\rightarrow$ Sets `watched = false`, `watchedAt = null`.

### Readlist Progress Synchronization
Supports either a direct percentage or page progress (`currentPage` / `totalPages` $\rightarrow$ auto-calculates progress %).

---

## 9. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Runtime environment | `development` / `production` / `test` |
| `PORT` | API port | `5000` |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated or `*`) | `http://localhost:3000,http://localhost:5173` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://lifeshelf:lifeshelf_secret@localhost:5432/lifeshelf_db?schema=public` |
| `JWT_SECRET` | Secret key for signing JWTs (min 16 chars) | `your_super_secret_jwt_key_here` |
| `JWT_EXPIRES_IN` | Expiration for JWT tokens | `7d` |
| `ENCRYPTION_KEY` | 32-byte key for AES-256-GCM (64 hex characters or 32 raw chars) | `0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef` |
| `CLOUDINARY_CLOUD_NAME` | Optional global fallback Cloudinary cloud name | `demo-cloud` |
| `CLOUDINARY_API_KEY` | Optional global fallback Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Optional global fallback Cloudinary API secret | `secret` |

---

## 10. Installation & Running Locally

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd life-shelf-backend
npm install
```

### 2. Generate Prisma Client
```bash
npm run prisma:generate
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5000`. Interactive OpenAPI documentation will be accessible at `http://localhost:5000/api/docs`.

---

## 11. Database Setup & Prisma Migrations

### Run Migrations
To push schema changes to your PostgreSQL instance:
```bash
npm run prisma:migrate
# or for local development without migration history:
npm run prisma:push
```

### Seed Built-in Default Media Assets
```bash
npm run prisma:seed
```

### Prisma Studio (Visual DB Explorer)
```bash
npm run prisma:studio
```

---

## 12. Docker & Containerization

A complete Docker setup is included with PostgreSQL and the API server.

### Start All Services (PostgreSQL + Backend API)
```bash
docker compose up -d --build
```
This runs:
* PostgreSQL 16 on port `5432` with a persistent volume.
* LifeShelf Backend API on port `5000`.

### Stop Services
```bash
docker compose down
```

---

## 13. Running Automated Tests

The test suite runs with **Vitest**:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run type check
npm run typecheck
```

**Test Coverage Highlights:**
* **Authentication**: Registration, password hashing, JWT signing & verification, login verification, duplicate rejection.
* **Multi-Tenant Isolation**: Verified that User A cannot read, modify, or delete User B's movies, series, places, or trips.
* **Encryption**: Roundtrip AES-256-GCM encryption/decryption, tampered auth tag rejection, secret masking.
* **Series Progress**: Zero state, partial watch progress, completed season counting, next unwatched episode resolution, 100% completion state.
* **Storage Abstraction**: Provider contract verification, encrypted config resolution.
* **API Middleware**: Health checks, OpenAPI JSON, 401 unauthorized protection, 404 formatting.

---

## 14. API Documentation (Swagger/OpenAPI)

Interactive Swagger UI documentation is available at:
```text
http://localhost:5000/api/docs
```
Raw OpenAPI 3.0 specification is available at:
```text
http://localhost:5000/api/docs.json
```

---

## 15. API Endpoints Reference

### 🔐 Authentication
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Login and receive JWT
* `POST /api/auth/logout` — Logout
* `GET /api/auth/me` — Get current user profile & storage status
* `POST /api/auth/change-password` — Change password
* `PATCH /api/auth/profile` — Update display name & avatar
* `POST /api/auth/forgot-password` — Request password reset

### ☁️ Cloud Storage
* `GET /api/storage` — Get current storage provider config (masked)
* `POST /api/storage/cloudinary` — Configure and verify Cloudinary credentials
* `DELETE /api/storage/cloudinary` — Remove Cloudinary credentials

### 🖼️ Media Library
* `GET /api/media` — List user uploaded media (paginated)
* `GET /api/media/defaults` — List built-in default cover images
* `POST /api/media/upload` — Upload an image (multipart `file`)
* `DELETE /api/media/:id` — Delete a personal media asset

### 🏷️ Tags
* `GET /api/tags` — List user tags with item usage counts
* `POST /api/tags` — Create a tag
* `PATCH /api/tags/:id` — Update tag name or color
* `DELETE /api/tags/:id` — Delete a tag

### 🎬 Movies
* `GET /api/movies` — List movies (filter by `status`, `priority`, `genre`, `tagId`, search, sort, pagination)
* `POST /api/movies` — Create a movie
* `GET /api/movies/:id` — Get movie details
* `PATCH /api/movies/:id` — Update movie
* `DELETE /api/movies/:id` — Delete movie

### 📺 Series, Seasons & Episodes
* `GET /api/series` — List series with computed progress
* `POST /api/series` — Create series (optionally with nested seasons/episodes)
* `GET /api/series/:id` — Get series details with dynamic progress & next unwatched episode
* `PATCH /api/series/:id` — Update series
* `DELETE /api/series/:id` — Delete series
* `POST /api/series/:id/seasons` — Add season to series
* `PATCH /api/seasons/:id` — Update season
* `DELETE /api/seasons/:id` — Delete season
* `POST /api/seasons/:id/episodes` — Add episode to season
* `PATCH /api/episodes/:id` — Update episode
* `DELETE /api/episodes/:id` — Delete episode
* `POST /api/episodes/:id/watched` — Mark episode watched (with optional note)
* `DELETE /api/episodes/:id/watched` — Unmark episode watched

### 📚 Readlist
* `GET /api/readlist` — List reading items (filter by `type`, `status`, `priority`, search)
* `POST /api/readlist` — Create reading item
* `GET /api/readlist/:id` — Get reading item
* `PATCH /api/readlist/:id` — Update reading item & progress
* `DELETE /api/readlist/:id` — Delete reading item

### 🎓 Studylist
* `GET /api/studylist` — List study items
* `POST /api/studylist` — Create study item
* `GET /api/studylist/:id` — Get study item with attached resources
* `PATCH /api/studylist/:id` — Update study item
* `DELETE /api/studylist/:id` — Delete study item
* `POST /api/studylist/:id/resources` — Attach resource (docs, tutorial, video)
* `PATCH /api/studylist/resources/:id` — Update resource
* `DELETE /api/studylist/resources/:id` — Delete resource

### ✈️ Travel (Places & Trips)
* `GET /api/travel/places` — List travel places
* `POST /api/travel/places` — Create travel place
* `GET /api/travel/places/:id` — Get travel place
* `PATCH /api/travel/places/:id` — Update travel place
* `DELETE /api/travel/places/:id` — Delete travel place
* `GET /api/travel/trips` — List trips
* `POST /api/travel/trips` — Create multi-place trip
* `GET /api/travel/trips/:id` — Get trip details
* `PATCH /api/travel/trips/:id` — Update trip
* `DELETE /api/travel/trips/:id` — Delete trip
* `POST /api/travel/trips/:id/places` — Add destination to trip
* `DELETE /api/travel/trips/:id/places/:placeId` — Remove destination from trip

### 📅 Plans
* `GET /api/plans` — List scheduled plans (filter by `status`, `type`, date range)
* `POST /api/plans` — Create plan
* `GET /api/plans/:id` — Get plan
* `PATCH /api/plans/:id` — Update plan
* `DELETE /api/plans/:id` — Delete plan

### 📊 Dashboard
* `GET /api/dashboard` — Aggregated user metrics, continue watching, continue reading, continue studying, upcoming plans, and recently completed items.

---

## 📜 License

This project is licensed under the MIT License.
