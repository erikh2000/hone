#!/bin/bash
# Script is for setting environment variables interactively for CLI. Useful for running on local dev environment.

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  echo "This script must be sourced so that variables are available to other scripts. Run it as:"
  echo "  source $0"
  exit 1
fi

read -p "Enter your Bunny.net API Key: " BUNNY_API_KEY
if [ -z "$BUNNY_API_KEY" ]; then
  echo "No API key entered. Exiting."
  return 1 2>/dev/null || exit 1
fi

read -p "Enter your storage zone name: " STORAGE_ZONE_NAME
if [ -z "$STORAGE_ZONE_NAME" ]; then
  echo "No storage zone name entered. Exiting."
  return 1 2>/dev/null || exit 1
fi

read -p "Enter your app name: " APP_NAME
if [ -z "$APP_NAME" ]; then
  echo "No app name entered. Exiting."
  return 1 2>/dev/null || exit 1
fi

# Export the variable for the current shell session
export BUNNY_API_KEY
export STORAGE_ZONE_NAME
export APP_NAME
export COMMIT_HASH="0000000"

# Confirm the variable is set
echo "Environment variables has been set for this session."