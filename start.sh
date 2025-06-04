#!/bin/bash

echo "🚀 Iniciando entorno..."
docker-compose down > /dev/null 2>&1 || true
make build
make up
echo "✅ Accede a http://localhost:5173"
make logs