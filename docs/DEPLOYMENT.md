# Deployment

Primary target is **Vercel Hobby** (free, no card, Next.js native). Gemini is the Google technology; Firestore on the free Spark plan is the recommended store. Cloud Run remains supported via the `Dockerfile` for teams that already have a billing-enabled GCP project.

GitHub Actions is intentionally not used in this repo (account minutes). Vercel builds on every push to `main` through its GitHub integration, or you deploy from the CLI.

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | For live AI | Free key from Google AI Studio. Without it the app runs in demo mode. |
| `GEMINI_MODEL` | No | Default `gemini-3.8-flash`, which is free of charge on the Gemini API standard tier. |
| `FIRESTORE_ENABLED` | On Vercel: yes | Serverless functions do not share memory, so orders and feedback need Firestore to persist. |
| `FIREBASE_SERVICE_ACCOUNT` | With Firestore on Vercel | Service-account key JSON, raw or base64. |
| `GOOGLE_CLOUD_PROJECT` | Optional | Taken from the service account when omitted. |
| `STAFF_PIN` | Yes in production | Minimum 4 characters. Default `2468` is for local only. |
| `RATE_LIMIT_PER_MINUTE` | No | Default 60 per IP per route scope, per instance. |

## Vercel, step by step

```bash
vercel login                      # once
vercel link                       # creates the project, pick the Hobby scope
vercel env add GEMINI_API_KEY production
vercel env add STAFF_PIN production
vercel env add FIRESTORE_ENABLED production      # true
vercel env add FIREBASE_SERVICE_ACCOUNT production
vercel --prod
```

`vercel.json` pins the Mumbai region and enables silent GitHub deployments. After the first deploy, connect the GitHub repo in the Vercel dashboard so pushes to `main` redeploy automatically.

### Free Firestore for Vercel

1. console.firebase.google.com → Add project (Spark plan, no card).
2. Build → Firestore Database → Create database (production mode; server-side access ignores rules).
3. Project settings → Service accounts → Generate new private key.
4. `base64 -w0 key.json` and paste the output as `FIREBASE_SERVICE_ACCOUNT` in Vercel.

Without Firestore the app still works on Vercel, but state lives in each function instance. Fine for a quick demo, not for a pilot.

### Verify

```bash
curl https://<your-app>.vercel.app/api/health     # mode gemini, store firestore
```
Open `/staff`, enter the PIN, click "Load pilot data", then walk `/order` once.

## Google Cloud Run (alternative)

```bash
export PROJECT_ID=your-project REGION=asia-south1
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
gcloud artifacts repositories create apps --repository-format=docker --location=$REGION
gcloud firestore databases create --location=$REGION
printf '%s' "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
printf '%s' "$(openssl rand -hex 4)" | gcloud secrets create STAFF_PIN --data-file=-
gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) .
gcloud run deploy cafe-companion \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) \
  --region $REGION --allow-unauthenticated --memory 512Mi --max-instances 4 \
  --set-env-vars GEMINI_MODEL=gemini-3.8-flash,FIRESTORE_ENABLED=true,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,STAFF_PIN=STAFF_PIN:latest
```
Firebase App Hosting is also supported through `apphosting.yaml`.

## Local container

```bash
pnpm docker:build && pnpm docker:run     # http://localhost:8080
```

## Operations

- Health: `GET /api/health` returns mode, model, store and time.
- Logs: one warning line per Gemini fallback prefixed `[module]`; never request bodies.
- Rollback on Vercel: Deployments → previous deployment → Promote to Production.
- Cost: Vercel Hobby and Firestore Spark are free; `gemini-3.8-flash` is free on the standard tier within its rate limits.
