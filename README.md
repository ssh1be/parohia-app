# Parohia

Monorepo for the Parohia mobile app, the parohia.app website and desktop dashboard, and the shared Supabase backend.

```
apps/mobile       Expo app (iOS/Android), shipped with EAS
apps/web          Next.js site + desktop dashboard, hosted on Netlify
packages/shared   Types, Supabase client factory, services, auth routing, design tokens
supabase/         Edge Functions, email templates, schema + migrations
```

Both apps talk to the same Supabase project. Business logic (parishes, onboarding, bulletin, channels, chant, confession, calendar, account) lives in `@parohia/shared`; each app registers its own Supabase client and storage with `configureShared()` at startup.

## Getting started

Requires Node 22+ and npm 11 (npm workspaces + Turborepo).

```bash
npm install            # from the repo root; installs every workspace
npm run dev:web        # http://localhost:3030
npm run dev:mobile     # Expo dev server
npm run typecheck      # shared + mobile + web
npm run build:web      # production build of apps/web
```

### Environment

| App | File | Variables |
| --- | --- | --- |
| mobile | `apps/mobile/.env.local` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY` |
| web | `apps/web/.env.local` (see `.env.example`) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY`, `NEXT_PUBLIC_SITE_URL`, optional `NEXT_PUBLIC_APP_STORE_URL` |

The web values are the same Supabase project and Google key as mobile.

## Web dashboard

The dashboard is desktop-only. Phones are redirected to `/get-the-app`, and narrow windows show a "use the app" message.

- **Auth:** email + password via `@supabase/ssr` (cookie session). New accounts confirm with the 6-digit email code on `/verify`. Password reset goes through `/auth/callback?next=/reset-password`.
- **Routing:** `proxy.ts` refreshes the session and protects `/dashboard/*` and `/onboarding/*`. Server layouts call `resolveAuthDestination` (shared with mobile) to route to the dashboard, onboarding, or parish selection.
- **Onboarding:** role → profile → join a parish / register a parish / skip (assigns the "No Parish" placeholder).
- **Dashboard:** Today, Calendar, Bulletin, Confession, Parish, Settings. Admin tools (posting, channels and managers, confession schedule, parish/priest/donation/calendar settings) appear for parish admins; channel managers can post to their channels. Bulletin and confession are hidden for members without a parish, and confession is hidden when the parish has it turned off.

## Deploying

### Web (Netlify)

Site settings (Project configuration → Build & deploy → Build settings):

- **Base directory:** empty (repo root, where the lockfile lives)
- **Package directory:** `apps/web` (Netlify reads `apps/web/netlify.toml` from here)
- **Build command / publish:** leave empty in the UI; `netlify.toml` sets `npx turbo run build --filter=@parohia/web` and `apps/web/.next`
- **Environment variables:** the `NEXT_PUBLIC_*` values above, with `NEXT_PUBLIC_SITE_URL=https://parohia.app`

Pushes that only touch `apps/mobile` or `supabase/` skip the web build (the `ignore` command in `netlify.toml`). Turborepo runs in strict env mode; `NEXT_PUBLIC_*` vars pass through automatically, but any new server-only variable must be added to `turbo.json`.

### Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration, add:

- `https://parohia.app/auth/callback`
- `http://localhost:3030/auth/callback`

Keep the existing mobile deep-link redirects. The sign-up email template must include the `{{ .Token }}` code (already the case for mobile OTP).

### Mobile (EAS)

Run EAS from `apps/mobile` (`eas build`, `eas submit`, `eas update`). Expo's default Metro config detects the npm workspace, so `@parohia/shared` resolves without extra setup.

### Edge Functions

```bash
supabase functions deploy send-bulletin-push
supabase functions deploy delete-parish-admin-account
```

Run from the repo root (the `supabase/` folder lives there now).

## Cutover checklist

1. Point the Netlify site at this repo with package directory `apps/web` (base directory empty), add the env vars, and deploy.
2. Add the Supabase redirect URLs above.
3. Smoke test on production: sign in, sign up + email code, password reset, onboarding, each dashboard page as both a member and an admin.
4. Archive the old `Parohia-landing` GitHub repo (its history is preserved in `apps/web`).
