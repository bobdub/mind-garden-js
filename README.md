[Mind Garden Git.io](https://bobdub.github.io/mind-garden-js/)

## Build base path
Production builds always target `/mind-garden-js/`. The `npm run build` command now fails if `VITE_BASE_PATH` is configured to anything else.
