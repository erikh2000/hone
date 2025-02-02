# syntax=docker/dockerfile:1
FROM nginxinc/nginx-unprivileged:stable-alpine

# CSP_WHITELIST: Space-separated list of additional allowed domains for the Content Security Policy header.
# You can override this environment variable in the container if you need to allow code in the web app to call
# out to other domains beyond those described. Using a whitelist protects against some kinds of supply chain attacks 
# in the web app that could otherwise exfiltrate sensitive data to untrusted domains.
#
# Explanation of default white-listed domains: (web app uses read-only fetches via WebLLM for these):
#   huggingface.co - Configuration files for models.
#   raw.githubusercontent.com - Model-specific WASM for local LLM models.
#   *.hf.co - Hugging face CDN for downloading chunks of LLM model files. Wildcard is present to allow for different regional CDNs.
ENV CSP_WHITELIST="https://huggingface.co https://raw.githubusercontent.com https://*.hf.co"

# I in-lined the Nginx configuration file below so you can see everything in one place. The philosophy is
# to limit options to just what is needed - in this case, to serve a single static content web app with WASM execution.
RUN cat <<EOF > /etc/nginx/conf.d/default.conf
server {
    listen 8080 default_server;
    server_name _;

    # Serve static content from this directory.
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
    add_header Content-Security-Policy "default-src 'self' ${CSP_WHITELIST}; script-src 'self' 'unsafe-eval'; object-src 'none'; frame-ancestors 'none';" always;

    location / {
        # Only allow GET, HEAD, and OPTIONS.
        limit_except GET HEAD OPTIONS {
            deny all;
        }
    }
}
EOF

# Copy the static content from the local ./dist directory to the Nginx serving directory. Intentionally avoiding building the 
# app files in this Dockerfile to avoid installing dev dependencies in the container.
COPY ./dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]