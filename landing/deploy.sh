#!/bin/bash

# Deploy FeedYum Landing Page to Cloud Run
# Builds Docker image (nginx serving Next.js static export) via Cloud Build — no local Docker needed.

SERVICE_NAME="freehuman-landing"
REGION="europe-west1"
PROJECT_ID="gen-lang-client-0254164349"

echo "🚀 Deploying ${SERVICE_NAME} to Cloud Run (source build)..."
echo "   Project : $PROJECT_ID"
echo "   Region  : $REGION"
echo ""

gcloud run deploy $SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --source . \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Landing page deployed successfully!"
    URL=$(gcloud run services describe $SERVICE_NAME --project $PROJECT_ID --region $REGION --format='value(status.url)' 2>/dev/null)
    echo "🌍 Live URL: ${URL}"
else
    echo "❌ Deploy failed. Check the errors above."
    exit 1
fi
