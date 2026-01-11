# Testing the CLI Before Publishing

This guide explains how to manually test the CLI before publishing it to npm.

```bash
# Build program
npm run build

# Link it to global
npm link

# Test help
bsh --help

# Test install command help
bsh install --help

# Test install command (with your actual values)
bsh install ./demo/plugins/store \
   --host https://your-engine-host.com \
   --api-key your-api-key

# unlink it when done
npm unlink -g @bshsolutions/cli
```
