#!/bin/sh
# entrypoint.sh

# We are already running as nginx user
envsubst '${PORT} ${FRONTEND_HOST} ${FRONTEND_PORT} ${BACKEND_HOST} ${BACKEND_PORT}' \
    < /etc/nginx/templates/default.conf \
    > /etc/nginx/conf.d/default.conf

# Start nginx
exec nginx -g "daemon off;"