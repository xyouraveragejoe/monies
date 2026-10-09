# Monies

A calm personal finance planner for building a steady pot of money for your future.
Track net worth, plan retirement, manage debt, explore life scenarios, and chat with an AI planner.

## Run it on your computer

```bash
npm install
npm run dev        # opens http://localhost:5173
npm run build      # makes the production bundle in dist/
```

Needs Node.js 18 or newer.

## Deploy

Push to GitHub. Vercel detects Vite automatically (build command `npm run build`, output folder `dist`).
Every branch gets its own preview link; `main` is the live site.

## Environment variables (used from the next stage, when Supabase is added)

Copy `.env.example` to `.env.local` and fill in your values. Add the same two names in
Vercel under Project > Settings > Environment Variables. Never commit `.env` files, and never use a
`service_role` or secret key in this app.

## Where things are

```
src/
  main.js            starts the app
  App.js             layout, navigation, loading and saving
  styles.css         the Orchard theme
  lib/               money formatting, currencies, exchange rates, defaults, storage
  components/        NumInput, dashboard hero (tree), modals
  pages/             one file per page
```

## Where your data lives right now

In your browser's localStorage, on one device. The next stage moves it to Supabase so it follows you across devices.
