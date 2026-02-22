#!/usr/bin/env bash
# Generate a self-signed TLS certificate for local development.
# Required for getUserMedia (microphone) which needs a secure context.
#
# Usage: ./scripts/generate-dev-cert.sh
# Output: .certs/localhost-key.pem, .certs/localhost.pem

set -euo pipefail

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/.certs"
mkdir -p "$CERT_DIR"

KEY="$CERT_DIR/localhost-key.pem"
CERT="$CERT_DIR/localhost.pem"

if [ -f "$KEY" ] && [ -f "$CERT" ]; then
  echo "[certs] Certificates already exist in $CERT_DIR"
  echo "[certs] Delete .certs/ and re-run to regenerate."
  exit 0
fi

# Check for mkcert (preferred — adds to system trust store)
if command -v mkcert &>/dev/null; then
  echo "[certs] Using mkcert to generate trusted certificate..."
  mkcert -install 2>/dev/null || true
  mkcert -key-file "$KEY" -cert-file "$CERT" localhost 127.0.0.1 ::1
  echo "[certs] Trusted certificate generated. No browser warnings."
else
  echo "[certs] mkcert not found, using openssl (self-signed, browser will warn)..."
  echo "[certs] Tip: Install mkcert for a better experience: brew install mkcert"
  openssl req -x509 -newkey rsa:2048 -nodes \
    -keyout "$KEY" \
    -out "$CERT" \
    -days 365 \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" \
    2>/dev/null
  echo "[certs] Self-signed certificate generated."
fi

echo "[certs] Key:  $KEY"
echo "[certs] Cert: $CERT"
echo ""
echo "Start dev servers with: npm run dev:all"
