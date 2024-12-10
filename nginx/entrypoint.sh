#!/bin/sh
# entrypoint.sh

# We are already running as nginx user
envsubst '${PORT} ${FRONTEND_HOST} ${FRONTEND_PORT} ${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/templates/default.conf \
    > /etc/nginx/conf.d/default.conf

# Adds logs for docker
ln -sf /dev/stdout /var/log/nginx/access.log
ln -sf /dev/stderr /var/log/nginx/error.log
ln -sf /dev/stderr /var/log/nginx/debug.log

# Start nginx
exec nginx -g "daemon off;"