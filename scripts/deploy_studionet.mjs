#!/usr/bin/env node
console.warn("Legacy deploy script is deprecated. Running deploy_studio_next.mjs.");
await import("./deploy_studio_next.mjs");
