# Deployment

Primary target is **Google Cloud Run**. The same container runs anywhere Docker runs. Firebase App Hosting is supported through `apphosting.yaml`.

## Environment variables

| Name | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | For live AI | From Google AI Studio or a Vertex-backed key. Without it the app runs in demo mode. |
| `GEMINI_MODEL` | No | Default `gemini-3.8-flash`. |
| `FIRESTORE_ENABLED` | No | `true` in production. Uses Application Default Credentials. |
| `GOOGLE_CLOUD_PROJECT` | With Firestore | Project id. Cloud Run sets it automatically for ADC; set explicitly to be safe. |
| `STAFF_PIN` | Yes in production | Minimum 4 characters. Default `2468` is for local only. |
| `RATE_LIMIT_PER_MINUTE` | No | Default 60 per IP per route scope. |

## Cloud Run, step by step

```bash
export PROJECT_ID=your-project REGION=asia-south1
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
gcloud artifacts repositories create apps --repository-format=docker --location=$REGION
gcloud firestore databases create --location=$REGION

printf '%s' "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
printf '%s' "$(openssl rand -hex 4)" | gcloud secrets create STAFF_PIN --data-file=-

SA=$(gcloud projects describe $PROJECT_ID --format 'value(projectNumber)')-compute@developer.gserviceaccount.com
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:$SA --role roles/secretmanager.secretAccessor
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:$SA --role roles/datastore.user

gcloud builds submit --tag $REGION-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) .
gcloud run deploy cafe-companion \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) \
  --region $REGION --allow-unauthenticated --memory 512Mi --cpu 1 --max-instances 4 --concurrency 80 \
  --set-env-vars GEMINI_MODEL=gemini-3.8-flash,FIRESTORE_ENABLED=true,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,STAFF_PIN=STAFF_PIN:latest
```

Verify: `curl $(gcloud run services describe cafe-companion --region $REGION --format 'value(status.url)')/api/health`.

## GitHub Actions

`deploy-cloud-run.yml` deploys on a `v*` tag or manual dispatch using Workload Identity Federation. Repository secrets needed: `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT`. Set up WIF once:

```bash
gcloud iam workload-identity-pools create github --location global
gcloud iam workload-identity-pools providers create-oidc github --location global --workload-identity-pool github \
  --issuer-uri https://token.actions.githubusercontent.com --attribute-mapping "google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition "assertion.repository=='Mithlesh04/cafe-companion'"
gcloud iam service-accounts create deployer
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:deployer@$PROJECT_ID.iam.gserviceaccount.com --role roles/run.admin
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:deployer@$PROJECT_ID.iam.gserviceaccount.com --role roles/cloudbuild.builds.editor
gcloud projects add-iam-policy-binding $PROJECT_ID --member serviceAccount:deployer@$PROJECT_ID.iam.gserviceaccount.com --role roles/iam.serviceAccountUser
```

## Firebase App Hosting

```bash
firebase apphosting:backends:create --project $PROJECT_ID --location $REGION
firebase apphosting:secrets:set GEMINI_API_KEY
firebase apphosting:secrets:set STAFF_PIN
```
Connect the GitHub repo in the console; `apphosting.yaml` supplies runtime config.

## Local container

```bash
pnpm docker:build && pnpm docker:run     # http://localhost:8080
```

## Operations

- Logs: Cloud Logging. The app logs one warning line per Gemini fallback prefixed `[module]`, never request bodies.
- Health: `GET /api/health` returns mode, model, store and time. The Dockerfile has a HEALTHCHECK on it.
- Rollback: `gcloud run services update-traffic cafe-companion --to-revisions <rev>=100`.
- Cost at café scale: Cloud Run scales to zero; Gemini Flash usage for a few hundred chats a day is cents.
