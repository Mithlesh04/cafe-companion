---
name: deploy
description: Deploy the Café Companion to Vercel Hobby (free) with Gemini and optional Firestore, or to Google Cloud Run. Use when asked to deploy, ship, release, or set up hosting.
---

# Deploy

Target: **Vercel Hobby**, free. No GitHub Actions in this repo; Vercel builds from GitHub pushes or the CLI. Cloud Run via `Dockerfile` is the alternative. Full guide: `docs/DEPLOYMENT.md`.

## First deploy from this machine
```bash
vercel whoami                    # must print the account; otherwise `vercel login`
vercel link                      # Hobby scope, project name cafe-companion
vercel env add GEMINI_API_KEY production
vercel env add STAFF_PIN production
vercel --prod
```
Then in the Vercel dashboard connect the GitHub repo `Mithlesh04/cafe-companion` so pushes to `main` redeploy.

## Persistence on Vercel
Serverless functions do not share memory. For a pilot, set `FIRESTORE_ENABLED=true` and `FIREBASE_SERVICE_ACCOUNT` (base64 of a Firebase Spark service-account key). For a quick demo, memory mode is acceptable.

## Verify a release
```bash
curl -s https://<app>.vercel.app/api/health
```
Expect `mode: gemini` when the key is set. Open `/staff`, enter the PIN, click **Load pilot data**, walk `/order` once.

## Rollback
Vercel dashboard → Deployments → pick the previous one → Promote to Production.

## Cloud Run (alternative)
See the gcloud block in `docs/DEPLOYMENT.md`. Needs a billing-enabled project and gcloud installed.
