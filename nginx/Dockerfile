# Stage 1: Build stage
FROM nginx:1.27-alpine AS builder

# Install required packages
RUN apk add --no-cache nginx-mod-http-js nginx-mod-http-keyval

# Stage 2: Final stage
FROM alpine:3.19

# Copy Nginx and NJS modules from builder
COPY --from=builder /usr/sbin/nginx /usr/sbin/
COPY --from=builder /usr/lib/nginx/modules/ /usr/lib/nginx/modules/
COPY --from=builder /etc/nginx/ /etc/nginx/
COPY --from=builder /usr/lib/nginx/ /usr/lib/nginx/

# Install required runtime dependencies
RUN apk add --no-cache \
    pcre2 \
    ca-certificates \
    pcre \
    libgcc \
    libstdc++ \
    zlib \
    libxml2 \
    libedit \
    geoip \
    libxslt \
    && mkdir -p /var/cache/nginx \
    && mkdir -p /var/log/nginx \
    && mkdir -p /etc/nginx/conf.d \
    && mkdir -p /etc/nginx/njs \
    && ln -sf /dev/stdout /var/log/nginx/access.log \
    && ln -sf /dev/stderr /var/log/nginx/error.log \
    && addgroup -S nginx \
    && adduser -D -S -h /var/cache/nginx -s /sbin/nologin -G nginx nginx

# Copy necessary libraries from builder
COPY --from=builder /usr/lib/libxml2.so* /usr/lib/
COPY --from=builder /usr/lib/libexslt.so* /usr/lib/
COPY --from=builder /usr/lib/libgd.so* /usr/lib/
COPY --from=builder /usr/lib/libxslt.so* /usr/lib/

# Modify nginx.conf to load modules
RUN echo 'load_module modules/ngx_http_js_module.so;' > /tmp/nginx.conf && \
    cat /etc/nginx/nginx.conf >> /tmp/nginx.conf && \
    mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Copy our configuration
COPY conf.d/default.conf /etc/nginx/conf.d/
COPY njs/main.js /etc/nginx/njs/

# Set proper permissions
RUN chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx/conf.d \
    && touch /var/run/nginx.pid \
    && chown -R nginx:nginx /var/run/nginx.pid

# Verify the configuration
# RUN nginx -t --dry-run

# Switch to non-root user
USER nginx

# Expose HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]