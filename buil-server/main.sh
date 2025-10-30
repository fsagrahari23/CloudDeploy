#!/bin/bash
set -e

echo "=== Cloning repo ==="
git clone "$GIT_REPOSITORY_URL" /home/app/output

cd /home/app/output

echo "=== Installing dependencies ==="
npm install --production

echo "=== Running script.js from image ==="
cd /home/app
exec node script.js
