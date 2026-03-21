#!/bin/sh
if [ -f /etc/letsencrypt/live/omicstrack.com/fullchain.pem ]; then
    echo "SSL cert found — starting with HTTPS..."
    cp /etc/nginx/ssl.conf /etc/nginx/conf.d/default.conf
else
    echo "SSL cert not found — starting HTTP-only for certbot challenge..."
    cp /etc/nginx/http.conf /etc/nginx/conf.d/default.conf
fi

exec nginx -g 'daemon off;'
