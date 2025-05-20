#!/usr/bin/env bash
source .env

echo "→ 容器状态"
docker compose ps

echo "→ MySQL ping"
docker exec vue3_sicau-db-1 mysqladmin ping -uroot -p${MYSQL_ROOT_PASSWORD} --silent && echo OK

echo "→ Backend"
curl -fs http://localhost:${BACKEND_PORT:-15200}/api/health && echo

echo "→ Frontend"
curl -I -s http://localhost:${FRONTEND_PORT:-5173} | head -n1
