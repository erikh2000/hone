# syntax=docker/dockerfile:1
FROM nginxinc/nginx-unprivileged:stable-alpine

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