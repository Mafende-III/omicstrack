#!/bin/sh
# If SSL cert doesn't exist yet, start with HTTP-only config to allow certbot challenge
if [ ! -f /etc/letsencrypt/live/omicstrack.com/fullchain.pem ]; then
    echo "SSL cert not found — starting HTTP-only for certbot challenge..."
    cat > /etc/nginx/conf.d/default.conf <<'HTTPONLY'
server {
    listen 80;
    server_name omicstrack.com www.omicstrack.com;
    server_tokens off;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://server:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
HTTPONLY
fi

exec nginx -g 'daemon off;'
