# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Overview

AURAsync is a fully independent dating and social matching web app. The frontend is a React SPA and the backend is a self-hosted Express + MongoDB API. There are no external platform dependencies or low-code builders.

## Development Commands

### Frontend (project root)
- **Install dependencies:** `npm install`
- **Run dev server:** `npm run dev` (Vite, proxies `/api` to `localhost:5000`)
- **Build:** `npm run build`
- **Lint:** `npx eslint .` (ESLint config at `eslint.config.js`)

### Backend (`server/`)
- **Install dependencies:** `cd server && npm install`
- **Run dev server:** `npm run dev` (uses `node --watch`)
- **Run production:** `npm start`

There is no test framework configured in this project.

## Environment Setup

Create `server/.env` based on `server/.env.example`:

```
MONGODB_URI=mongodb://localhost:27017/aurasync
JWT_SECRET=change_this_to_a_random_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PORT=5000
```

The Vite dev server proxies `/api` requests to `http://localhost:5000` (configured in `vite.config.js`).

## Architecture

### Tech Stack

**Frontend:**
- **React** (JSX) with **Vite** bundler
- **Tailwind CSS** + **PostCSS** for styling
- **shadcn/ui** component library (`src/components/ui/`) — configured via `components.json`
- **Framer Motion** for animations (swipe gestures, transitions)
- **Lucide React** for icons
- **date-fns** for date formatting
- **@tanstack/react-query** for data fetching / caching
- **axios** for HTTP requests to the backend API

**Backend (`server/`):**
- **Express** REST API
- **MongoDB** via **Mongoose** ODM
- **JWT** authentication (`bcryptjs` + `jsonwebtoken`)
- **Cloudinary** for image uploads (`multer` + `multer-storage-cloudinary`)

### Path Alias

`@/` resolves to `src/` (configured in `jsconfig.json` and `vite.config.js`). Always use `@/` imports.

### Key Directories

- `src/api/apiClient.js` — Axios instance with JWT auth interceptor. All backend calls go through this.
- `src/api/entities.js` — Service modules for each API resource (auth, profiles, matches, messages, groups, events, verification, subscriptions, upload).
- `src/api/llmService.js` — Client-side icebreaker message generator (template-based, no external LLM dependency).
- `src/pages/` — Top-level route pages (Discover, Chat, Groups, Matches, MyProfile, ProfileSetup, Landing, Verification, HotLove).
- `src/components/` — Feature components organized by domain:
  - `discover/` — Match cards with swipe-to-like/pass, search filters
  - `events/` — Event creation and display
  - `groups/` — Group creation and display
  - `matches/` — Match feedback
  - `profile/` — Profile editing (hobbies, values, photos, AI bio, dealbreakers, lifestyle, etc.)
  - `verification/` — Personality verification flow
  - `ui/` — shadcn/ui primitives (do not edit directly; managed by shadcn CLI)
- `src/lib/` — Auth context (`AuthContext.jsx`), query client, utilities
- `src/hooks/` — Custom hooks (e.g. `use-mobile.jsx` for responsive detection)
- `server/models/` — Mongoose schemas for all data entities
- `server/routes/` — Express route handlers for each API resource
- `server/middleware/` — JWT auth middleware
- `server/config/` — Cloudinary configuration
- `entities/` — JSON schema reference for the data model (documentation only)

### Data Model

Mongoose models in `server/models/`. Key entities:

- **User** — Authentication credentials (email, hashed password)
- **UserProfile** — Dating profile (display name, age, interests, values, relationship goals, location, verification status)
- **DailyMatch** — AI-generated daily match with compatibility score and reasons
- **Like / Match** — Like actions and mutual matches
- **Message** — Chat messages between matched users
- **Group / Event** — Social groups and group events
- **MatchFeedback** — Feedback on match quality
- **Subscription** — Premium subscription status
- **VerificationRequest** — Selfie-based identity verification (pending/approved/rejected)

### API Communication Pattern

- `src/api/apiClient.js` creates an axios instance pointed at `/api` with automatic JWT token attachment.
- `src/api/entities.js` exports service objects (e.g. `profileService`, `matchService`) that wrap axios calls.
- Pages and components use `@tanstack/react-query` with these services for data fetching.
- On 401 responses, the interceptor clears the token and redirects to the landing page.

## Coding Conventions

- **UI color scheme:** Gradient from `rose-500` to `purple-600` is the primary brand style. Use this consistently for CTAs and accent elements.
- **Rounded corners:** Use `rounded-2xl` / `rounded-3xl` for cards and modals. Use `rounded-xl` for inputs and smaller elements.
- **Component pattern:** Feature components receive data and callbacks as props. State management is local (`useState`) with API services for persistence.
- **Form pattern:** Forms use a `form` state object with a `set(key, value)` helper: `const set = (k, v) => setForm(f => ({ ...f, [k]: v }))`.
- **Mobile-first:** Design for mobile, then use `md:` breakpoints for desktop layout changes.
