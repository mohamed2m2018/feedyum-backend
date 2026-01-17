#!/bin/bash

# Configuration
SERVICE_NAME="makeit-be"
REGION="europe-west1"
PROJECT_ID="inseperable-73edb"
ENV_FILE=".env"

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    echo "Please make sure you are running this script from the root directory containing the .env file."
    exit 1
fi

echo "Reading secrets from $ENV_FILE..."

# Initialize an empty string for secrets
SECRETS=""

# Read the file line by line
while IFS= read -r line || [[ -n "$line" ]]; do
    # Skip comments and empty lines
    if [[ "$line" =~ ^#.*$ ]] || [[ -z "$line" ]]; then
        continue
    fi
    
    # Append to SECRETS string with a comma separator
    if [ -z "$SECRETS" ]; then
        SECRETS="$line"
    else
        SECRETS="$SECRETS,$line"
    fi
done < "$ENV_FILE"

if [ -z "$SECRETS" ]; then
    echo "Error: No secrets found in $ENV_FILE"
    exit 1
fi

echo "Deploying secrets to Cloud Run service: $SERVICE_NAME in project: $PROJECT_ID..."

# Deploy using the secrets read from .env
# Using ^,^ as the delimiter which tells gcloud to split by comma
gcloud run services update $SERVICE_NAME \
  --project $PROJECT_ID \
  --region $REGION \
  --set-env-vars "^,^$SECRETS"

echo "Done! Secrets updated."
