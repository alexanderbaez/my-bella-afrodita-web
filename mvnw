#!/bin/sh
DIR="$(dirname "$0")"
exec "$DIR/backend/mvnw" -f "$DIR/backend/pom.xml" "$@"
