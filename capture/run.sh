#!/bin/zsh
# Run capture.js. Set PLAYWRIGHT_NODE_PATH to a node_modules folder that contains playwright (default: ./node_modules).
export NODE_PATH="${PLAYWRIGHT_NODE_PATH:-$PWD/node_modules}"
exec node "${0:A:h}/capture.js" "$@"
