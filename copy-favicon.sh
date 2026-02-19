#!/bin/bash
cp "$(dirname "$0")/public/logo sfondo.png" "$(dirname "$0")/public/favicon.png"
echo "Copied!"
ls -la "$(dirname "$0")/public/favicon.png"
