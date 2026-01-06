# Testing the CLI Before Publishing

This guide explains how to manually test the CLI before publishing it to npm.

```bash
# Build program
npm run build

# Link it to global
npm link

# Test help
bshg --help

# Test install command help
bshg install --help

# Test install command (with your actual values)
bshg install ./demo/plugins/store \
   --host https://your-engine-host.com \
   --api-key your-api-key

# unlink it when done
npm unlink -g @bshsolutions/cli
```
