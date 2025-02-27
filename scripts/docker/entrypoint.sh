#!/bin/sh

NGINX_CONFIG_FILE="/etc/nginx/conf.d/default.conf"
LLM_CONFIG_FILE="/etc/hone/llmConfig.json"
SERVED_CUSTOM_DIR="/usr/share/nginx/html/custom"
FLAG_FILE="/tmp/container_initialized"

# Call parent entrypoint script if it exists
if [ -x "/docker-entrypoint.sh" ]; then
    echo "Calling base image entrypoint..."
    /docker-entrypoint.sh
fi

# Check if the container has already been initialized for Hone.
if [ -f "$FLAG_FILE" ]; then
    echo "Container already initialized, skipping Hone-specific initialization."
    exec "$@"
    # Script exits here.
fi

echo "First-time startup for container. Will initialize Hone-specific configuration."

# If LLM config exists (optional user-mounted volume), extract proxyUrl and copy the file to the Nginx-served custom directory.
# proxyUrl is removed from the file to avoid leaking information about internal endpoints.
if [ -f "$LLM_CONFIG_FILE" ]; then
    echo "Found LLM config file, extracting proxyUrl and copying to served directory..."
    CUSTOM_LLM_PROXY_URL=$(awk -F'"' '/"proxyUrl":/ {print $4}' "$LLM_CONFIG_FILE")
    sed '/"proxyUrl":/d' "$LLM_CONFIG_FILE" > "$SERVED_CUSTOM_DIR/llmConfig.json"
else
    CUSTOM_LLM_PROXY_URL=""
fi

# CSP_WHITELIST: Space-separated list of additional allowed domains for the Content Security Policy header.
# Using a whitelist protects against some kinds of supply chain attacks in the web app that could otherwise exfiltrate sensitive 
# data to untrusted domains.
#
# Explanation of white-listed domains: (web app uses read-only fetches via WebLLM for these):
#   huggingface.co - Configuration files for models.
#   raw.githubusercontent.com - Model-specific WASM for local LLM models.
#   *.hf.co - Hugging face CDN for downloading chunks of LLM model files. Wildcard is present to allow for different regional CDNs.
CSP_WHITELIST="https://huggingface.co https://raw.githubusercontent.com https://*.hf.co"

echo "Creating Nginx configuration file at $NGINX_CONFIG_FILE..."
echo "server {
    listen 8080 default_server;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Disable directory listings and hide server version info.
    autoindex off;
    server_tokens off;

    # Set Content Security Policy header.
    # This policy:
    #   - Uses default-src to allow 'self' and any additional domains from CSP_WHITELIST.
    #   - Specifies script-src explicitly to allow 'self' and 'unsafe-eval' (needed for WebAssembly).
    #   - Blocks plug-ins (object-src 'none') and prevents embedding (frame-ancestors 'none').
    add_header Content-Security-Policy \"default-src 'self' ${CSP_WHITELIST}; script-src 'self' 'unsafe-eval'; object-src 'none'; frame-ancestors 'none';\" always;

    location / {
        limit_except GET HEAD OPTIONS {
            deny all;
        }
    }" > $NGINX_CONFIG_FILE

# If a custom LLM proxy URL was found in the LLM config, add a location block to proxy requests to it.
if [ -n "$CUSTOM_LLM_PROXY_URL" ]; then
    echo "
    location /custom/api/ {
        proxy_pass $CUSTOM_LLM_PROXY_URL;
        proxy_ssl_server_name on;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
    }" >> $NGINX_CONFIG_FILE
fi

echo "}" >> $NGINX_CONFIG_FILE

# Set to avoid redoing initialization on future container starts.
touch "$FLAG_FILE"
echo "Container initialization complete."

# Default command set in Dockerfile is to run nginx, but user may override it.
exec "$@"