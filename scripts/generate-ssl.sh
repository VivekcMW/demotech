#!/bin/bash
# Generate SSL certificates for production
# For development: generates self-signed certificates
# For production: replace with certificates from Let's Encrypt or your CA

set -e

CERT_DIR="/etc/ssl/aarogya"
DOMAIN="aarogya-ehr.com"
EMAIL="admin@aarogya-ehr.com"

echo "=== SSL Certificate Generator for Aarogya EHR ==="

# Create certificate directory
mkdir -p "$CERT_DIR"

# Check if certificates already exist
if [ -f "$CERT_DIR/fullchain.pem" ] && [ -f "$CERT_DIR/privkey.pem" ]; then
    echo "Certificates already exist at $CERT_DIR"
    echo "Checking expiration..."
    openssl x509 -enddate -noout -in "$CERT_DIR/fullchain.pem"
    exit 0
fi

if [ "$1" = "prod" ]; then
    echo "Production mode: Using certbot with Let's Encrypt"
    
    # Install certbot if not present
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        apt-get update && apt-get install -y certbot
    fi
    
    # Generate certificates with certbot
    certbot certonly --standalone \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --preferred-challenges http
    
    # Copy certificates to our directory
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$CERT_DIR/"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$CERT_DIR/"
    
    # Set up auto-renewal
    echo "0 12 * * * root certbot renew --quiet && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $CERT_DIR/ && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $CERT_DIR/ && systemctl reload nginx" > /etc/cron.d/certbot-renew
    
    echo "Production certificates generated at $CERT_DIR"
    
else
    echo "Development mode: Generating self-signed certificates"
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/C=IN/ST=Karnataka/L=Bangalore/O=Aarogya EHR/OU=IT/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"
    
    # Set permissions
    chmod 600 "$CERT_DIR/privkey.pem"
    chmod 644 "$CERT_DIR/fullchain.pem"
    
    echo "Self-signed certificates generated at $CERT_DIR"
    echo "Certificate details:"
    openssl x509 -text -noout -in "$CERT_DIR/fullchain.pem" | head -20
fi

echo ""
echo "=== Next Steps ==="
echo "1. Configure nginx to use certificates from $CERT_DIR"
echo "2. Update docker-compose.yml to mount $CERT_DIR"
echo "3. For production, run: $0 prod"