# TSL

A shopping list for watches, cars and property saved from any site, built to be added to an iPhone Home Screen.

This is phase 1 of the [build plan](https://claude.ai/code/artifact/794ae335-d2f5-4549-a242-fedc5750583f): paste a listing's link and TSL saves it with its photo, title and price. If a site blocks that, the listing is still saved and its details can be filled in by hand. Price tracking and alerts come in phase 2.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no settings, data is kept in an embedded database in `.data/` and there's no passcode.

## Settings

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | Postgres connection string, e.g. from Supabase (Project settings → Database → connection string, "Transaction pooler"). Needed when hosted, since the embedded database can't run on Vercel. |
| `APP_PASSCODE` | The passcode needed to open the app. Leave unset only for local use. |

## Put it online (Vercel + Supabase)

1. Create a free Supabase project and copy its Postgres connection string.
2. Import this repository into Vercel, add `DATABASE_URL` and `APP_PASSCODE`, and deploy. Tables are created on first use.
3. On the iPhone, open the Vercel link in Safari, enter the passcode, then tap Share → Add to Home Screen.

## Checks

```bash
npm test          # unit tests for reading listing pages
npm run typecheck
npm run lint
npm run build
```
