<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/fa08ac01-b4fc-4915-bcf3-988b794a442b

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and set **`GEMINI_API_KEY`** (from [Google AI Studio](https://aistudio.google.com/apikey)).
3. Start the dev server (Express + Vite): `npm run dev`
4. Open **http://localhost:3000**

Optional: set **`STRIPE_SECRET_KEY`** and **`APP_URL`** in `.env.local` for “Go Pro” checkout. Without Stripe, checkout shows a clear message instead of failing silently.

**Production:** `npm run build`, then run with `NODE_ENV=production` (for example PowerShell: `$env:NODE_ENV='production'; npm start`).
