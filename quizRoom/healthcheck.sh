#!/bin/sh
curl -f "http://0.0.0.0:${PORT}/health" || exit 1