#!/bin/bash
# Script to generate swagger-spec.json for the API

# Navigate to the API directory if the script is placed elsewhere,
# or assume it's run from apps/api
# cd "$(dirname "$0")" # If script is in apps/api

OUTPUT_FILE="swagger-spec.json"
# Default port, can be overridden by API_PORT in .env or environment
API_PORT=${API_PORT:-3000} 
SWAGGER_JSON_URL="http://localhost:${API_PORT}/api-docs-json" # NestJS default JSON path

echo "Starting API to generate Swagger spec..."

# Start the API in the background.
# This assumes 'npm run start:dev' or similar exists and runs the app.
# Or, if you have a production build, 'npm run start:prod'.
# For an Nx project, it might be 'npx nx serve api --port=${API_PORT}'.
# We need a command that starts the server.
# Using a simple node command on the built output if available:
# Assuming 'dist/apps/api/main.js' is the entry point from Dockerfile.

# Option 1: If you have a start script in apps/api/package.json like "start": "node dist/main.js"
# (Adjust 'dist/main.js' to your actual built main file path from 'dist/apps/api/main.js')
# Ensure the API builds first. This script might need to be run after a build.
# For simplicity, this script assumes the app can be started with a simple node command
# on its built output or via an existing npm script.
# Let's assume 'npx nx serve api' is the command for an Nx setup.
# This command might run in the foreground, so we need to background it and get its PID.

# Check if npx is available
if ! command -v npx &> /dev/null
then
    echo "npx could not be found, please install it or ensure it's in your PATH."
    exit 1
fi

# Check if jq is available for pretty printing JSON (optional)
JQ_AVAILABLE=false
if command -v jq &> /dev/null
then
    JQ_AVAILABLE=true
fi

# Start API - this is tricky as 'nx serve' is for dev and keeps running.
# A better way for spec generation is often to build and run the dist.
# If 'dist/main.js' exists:
if [ -f "dist/main.js" ]; then # Assuming script is run from apps/api
    node dist/main.js &
    SERVER_PID=$!
elif [ -f "../../dist/apps/api/main.js" ]; then # If script is in root and app is in dist/apps/api
     node ../../dist/apps/api/main.js &
     SERVER_PID=$!
else
    echo "Built application main.js not found. Trying 'npx nx serve api'..."
    echo "NOTE: 'nx serve api' might need to be manually stopped after spec generation if it doesn't exit."
    # This is not ideal for scripting as 'nx serve' is a dev server.
    # Consider adding a dedicated 'start:prod-local' script that runs the built app.
    # For now, we'll attempt it but it's a known limitation for robust scripting.
    npx nx serve api --port=${API_PORT} &
    SERVER_PID=$!
    # Give the server a moment to start
    sleep 15 # Increased wait time for dev server
fi


echo "Waiting for API to be available on port ${API_PORT} (PID: ${SERVER_PID})..."
# Wait for the server to be ready (simple sleep, or use curl-retry)
sleep 10 # Adjust as needed, dev server might take longer

echo "Fetching Swagger spec from ${SWAGGER_JSON_URL}..."

TEMP_OUTPUT_FILE="${OUTPUT_FILE}.tmp"

# Try to fetch the Swagger JSON
# The actual path for Swagger JSON is usually /api-docs-json if UI is /api-docs
HTTP_STATUS=$(curl -s -o "${TEMP_OUTPUT_FILE}" -w "%{http_code}" "${SWAGGER_JSON_URL}")

if [ "$HTTP_STATUS" -eq 200 ]; then
    if [ "$JQ_AVAILABLE" = true ] ; then
        jq . "${TEMP_OUTPUT_FILE}" > "${OUTPUT_FILE}" && echo "Swagger spec saved to ${OUTPUT_FILE} (pretty-printed)."
    else
        mv "${TEMP_OUTPUT_FILE}" "${OUTPUT_FILE}" && echo "Swagger spec saved to ${OUTPUT_FILE} (raw). Install jq for pretty-printing."
    fi
    rm -f "${TEMP_OUTPUT_FILE}"
else
    echo "Error fetching Swagger spec. HTTP Status: ${HTTP_STATUS}"
    echo "Content of response (if any) in ${TEMP_OUTPUT_FILE}:"
    cat "${TEMP_OUTPUT_FILE}"
    rm -f "${TEMP_OUTPUT_FILE}"
    # Kill the server if it was started by this script
    if [ ! -z "$SERVER_PID" ]; then
        echo "Stopping API server (PID: ${SERVER_PID})..."
        kill $SERVER_PID
    fi
    exit 1
fi

# Kill the server if it was started by this script
if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping API server (PID: ${SERVER_PID})..."
    kill $SERVER_PID
    wait $SERVER_PID 2>/dev/null # Suppress "Terminated" message
fi
echo "Script finished."
