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

# You can override this environment variable to create a proxy route to a custom LLM provider for Hone to use.
# So for example, the API served from https://api.openai.com could be proxied to via https://example.com/hone/custom/api, and it
# would make REST calls to https://example.com/hone/custom/api/v1/chat/completion proxy through to https://api.openai.com/v1/chat/completion.
# This proxying is often needed due to an understandable lack of CORS allowances by API providers. ("understandable" b/c they don't want
# to promote API key exposure.) The proxy puts the custom LLM API and Hone on the same origin, removing the need for a CORS allowance.
# Leave this value as its disabled default unless you are configuring a custom LLM API that is blocked by CORS allowances.
ENV CUSTOM_LLM_PROXY_URL=""

# Nginx configuration file. The philosophy is to limit options to just what is needed - in this case, to serve a 
# single static content web app with WASM execution.
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
        limit_except GET HEAD OPTIONS {
            deny all;
        }
    }

    # Proxy to custom LLM API if configured. (see above comments re CUSTOM_LLM_PROXY_URL)
    location /custom/api/ {
        proxy_pass ${CUSTOM_LLM_PROXY_URL:-http://127.0.0.1:9};
        proxy_ssl_server_name on;
        proxy_ssl_protocols TLSv1.2 TLSv1.3;
    }
}
EOF

# Copy the static content from the local ./dist directory to the Nginx serving directory. Intentionally avoiding building the 
# app files in this Dockerfile to avoid installing dev dependencies in the container.
COPY ./dist /usr/share/nginx/html

# No chmod +x needed for entrypoint.sh as it is already executable in the local directory.
COPY ./scripts/docker/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

# Needed for entrypoint.sh to be able to copy the llmConfig.json file to the Nginx serving directory. entrypoint.sh runs as "nginx" user rather than root.
USER root
RUN mkdir -p /usr/share/nginx/html/custom && chmod 755 /usr/share/nginx/html/custom && chown nginx:nginx /usr/share/nginx/html/custom
USER nginx

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]