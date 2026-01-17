#!/bin/bash

# Configuration
SERVICE_NAME="makeit-be"
REGION="europe-west1"
PROJECT_ID="inseperable-73edb"

echo "Deploying secrets to Cloud Run service: $SERVICE_NAME in project: $PROJECT_ID..."

gcloud run services update $SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --set-env-vars "^,^MONGO_URI=mongodb+srv://mohamed2m2018:22233322@cookbook.oogokbq.mongodb.net/foodtok?retryWrites=true&w=majority,SECRET_OR_KEY=makeitisagreatapp,ADMIN_EMAIL=mohamed2m2018@gmail.com,ADMIN_PASSWORD=22233322,AWS_ACCESS_KEY_ID=***REMOVED***,AWS_SECRET_ACCESS_KEY=***REMOVED***,AWS_S3_BUCKET=foodtokforever,AWS_REGION=eu-central-1,R2_ACCOUNT_ID=3d5afc8657af28d0d91ec385fc42fb6b,R2_ACCESS_KEY_ID=b0cf2bd92e9c85f3aa5874a20e6f555b,R2_SECRET_ACCESS_KEY=***REMOVED***,R2_BUCKET=feedyum,R2_ENDPOINT=https://3d5afc8657af28d0d91ec385fc42fb6b.r2.cloudflarestorage.com,R2_PUBLIC_URL=https://cdn.feedyum.com,STRIPE_PUBLISHABLE_KEY=***REMOVED***,STRIPE_SECRET_KEY=***REMOVED***,ONESIGNAL_APP_ID=8f642b9d-8d10-4b66-b43a-c1d0345ef13f,ONESIGNAL_API_KEY=***REMOVED***,GOOGLE_MAPS_API_KEY=***REMOVED***"

echo "Done! Secrets updated."
