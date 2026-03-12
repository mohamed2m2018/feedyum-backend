#!/bin/bash

# Deploy staging backend to Cloud Run using source-based deploy
# No local Docker needed — builds in the cloud via Cloud Build

SERVICE_NAME="makeit-be-staging"
REGION="europe-west1"
PROJECT_ID="gen-lang-client-0254164349"
ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Read env vars from .env, override MONGO_URI with staging, set NODE_ENV=staging
echo "📋 Reading env vars from $ENV_FILE..."

ENV_VARS=""
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
        continue
    fi

    KEY="${line%%=*}"
    VALUE="${line#*=}"

    # Override MONGO_URI with staging value
    if [[ "$KEY" == "MONGO_URI" ]]; then
        STAGING_URI=$(grep "^MONGO_URI_STAGING=" "$ENV_FILE" | cut -d'=' -f2-)
        if [[ -z "$STAGING_URI" ]]; then
            echo "Error: MONGO_URI_STAGING not found in .env"
            exit 1
        fi
        VALUE="$STAGING_URI"
    fi

    # Skip MONGO_URI_STAGING itself (not needed in Cloud Run)
    if [[ "$KEY" == "MONGO_URI_STAGING" ]]; then
        continue
    fi

    if [ -z "$ENV_VARS" ]; then
        ENV_VARS="${KEY}=${VALUE}"
    else
        ENV_VARS="${ENV_VARS},${KEY}=${VALUE}"
    fi
done < "$ENV_FILE"

# Add NODE_ENV=staging (prevents cron jobs from running)
ENV_VARS="${ENV_VARS},NODE_ENV=staging"

echo "🚀 Deploying ${SERVICE_NAME} to Cloud Run (source build)..."
gcloud run deploy $SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "^,^$ENV_VARS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Staging deployed successfully!"
    URL=$(gcloud run services describe $SERVICE_NAME --project $PROJECT_ID --region $REGION --format='value(status.url)' 2>/dev/null)
    echo "🌍 Staging URL: ${URL}"
    echo ""
    echo "Update constants.js with: ${URL}/api"
else
    echo "❌ Deploy failed. Check the errors above."
fi
