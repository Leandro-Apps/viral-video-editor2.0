#!/bin/zsh
export NODE_PATH="${PLAYWRIGHT_NODE_PATH:-$PWD/node_modules}"
exec node "${0:A:h}/login.js" "$@"
