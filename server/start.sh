#!/bin/sh
set -e

cd server

echo "=== Sekkyaku Server Starting ==="
echo "PORT: ${PORT:-5000}"
echo "DATABASE_URL set: $([ -n \"$DATABASE_URL\" ] && echo 'yes' || echo 'NO - PLEASE SET THIS!')"

if [ -n "$DATABASE_URL" ]; then
  echo "Running database migration..."
  ./node_modules/.bin/prisma db push --skip-generate 2>&1 || echo "Warning: prisma db push failed, continuing anyway..."
else
  echo "WARNING: DATABASE_URL not set. Database features will not work."
fi

echo "Starting server..."
exec node src/index.js
