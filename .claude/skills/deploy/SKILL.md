---
name: deploy
description: Deploy the Café Companion to Google Cloud Run (or Firebase App Hosting) and verify the release. Use when asked to deploy, ship, release, or set up hosting.
---

# Deploy

Target: **Cloud Run** (container from `Dockerfile`), secrets in **Secret Manager**, data in **Firestore**. Firebase App Hosting is a drop-in alternative via `apphosting.yaml`.

## One-time project setup
```bash
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com firestore.googleapis.com
gcloud artifacts repositories create apps --repository-format=docker --location=asia-south1
gcloud firestore databases create --location=asia-south1
printf '%s' "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-
printf '%s' "$STAFF_PIN"      | gcloud secrets create STAFF_PIN --data-file=-
```
Grant the Cloud Run runtime service account `roles/secretmanager.secretAccessor` and `roles/datastore.user`.

## Manual deploy from this machine
```bash
gcloud builds submit --tag asia-south1-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) .
gcloud run deploy cafe-companion \
  --image asia-south1-docker.pkg.dev/$PROJECT_ID/apps/cafe-companion:$(git rev-parse --short HEAD) \
  --region asia-south1 --allow-unauthenticated --memory 512Mi --max-instances 4 \
  --set-env-vars GEMINI_MODEL=gemini-3.8-flash,FIRESTORE_ENABLED=true,GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,STAFF_PIN=STAFF_PIN:latest
```

## From GitHub
`.github/workflows/deploy-cloud-run.yml` runs on `workflow_dispatch` or a `v*` tag. It needs repo secrets `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_SERVICE_ACCOUNT` (Workload Identity Federation, no JSON keys).

## Verify a release
```bash
URL=$(gcloud run services describe cafe-companion --region asia-south1 --format 'value(status.url)')
curl -s $URL/api/health      # expect mode gemini, store firestore
```
Then open `$URL/staff`, enter the PIN, click "Load pilot data", and walk `/order` once.

## Rollback
```bash
gcloud run revisions list --service cafe-companion --region asia-south1
gcloud run services update-traffic cafe-companion --region asia-south1 --to-revisions REVISION=100
```

## Local container check
```bash
docker build -t cafe-companion . && docker run --rm -p 8080:8080 -e STAFF_PIN=2468 cafe-companion
```
