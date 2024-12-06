# Stage 1: Build stage
FROM nginx:1.27-alpine AS builder
# Install required packages
RUN apk add --no-cache nginx-mod-http-js nginx-mod-http-keyval

# Stage 2: Final stage
FROM alpine:3.19

# Install gettext for envsubst and other dependencies
RUN apk add --no-cache \
    gettext \
    nginx-mod-http-js \
    nginx-mod-http-keyval \
    pcre2 \
    ca-certificates \
    pcre \
    libgcc \
    libstdc++ \
    zlib \
    libxml2 \
    libedit \
    geoip \
    libxslt

# Create base nginx directory
RUN mkdir -p /etc/nginx

# Copy Nginx and NJS modules from builder
COPY --from=builder /usr/sbin/nginx /usr/sbin/
COPY --from=builder /usr/lib/nginx/modules/ /usr/lib/nginx/modules/
RUN rm -rf /etc/nginx/*
COPY --from=builder /etc/nginx/ /etc/nginx/
COPY --from=builder /usr/lib/nginx/ /usr/lib/nginx/

# Setup directories and permissions
RUN mkdir -p /var/cache/nginx \
    && mkdir -p /var/log/nginx \
    && mkdir -p /etc/nginx/conf.d \
    && mkdir -p /etc/nginx/njs \
    && mkdir -p /etc/nginx/templates \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx \
    && touch /var/run/nginx.pid \
    && chown nginx:nginx /var/run/nginx.pid \
    && chmod 777 /var/log/nginx

# Copy necessary libraries from builder
COPY --from=builder /usr/lib/libxml2.so* /usr/lib/
COPY --from=builder /usr/lib/libexslt.so* /usr/lib/
COPY --from=builder /usr/lib/libgd.so* /usr/lib/
COPY --from=builder /usr/lib/libxslt.so* /usr/lib/

# Modify nginx.conf to load modules
RUN echo 'load_module modules/ngx_http_js_module.so;' > /tmp/nginx.conf && \
    cat /etc/nginx/nginx.conf >> /tmp/nginx.conf && \
    mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Copy configurations
COPY templates/default.conf /etc/nginx/templates/
COPY njs/main.js /etc/nginx/njs/
COPY entrypoint.sh /entrypoint.sh

ENV PORT=80 \
    FRONTEND_HOST=frontend \
    FRONTEND_PORT=5173 \
    BACKEND_HOST=backend \
    BACKEND_PORT=3000

# Set final permissions
RUN chmod +x /entrypoint.sh && \
    chown -R nginx:nginx /etc/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /var/cache/nginx && \
    chmod 755 /etc/nginx && \
    chmod 777 /etc/nginx/conf.d && \
    chmod 644 /etc/nginx/templates/default.conf && \
    chmod 644 /etc/nginx/conf.d/default.conf

# Switch to nginx user
USER nginx

# Start Nginx using entrypoint script
ENTRYPOINT ["/entrypoint.sh"]