# Build & Release Guide

## Prerequisites

- Node.js 16+ (18 recommended)
- npm or yarn
- Git

## Local Build

### Step 1: Clone and Setup

```bash
git clone https://github.com/UserMMT/grafana-react-app-panel.git
cd grafana-react-app-panel
npm install
```

### Step 2: Build the Plugin

```bash
npm run build
```

This creates a `dist/` folder with the compiled plugin.

### Step 3: Verify Build

```bash
ls -la dist/
```

You should see:
- `module.js` - Plugin bundle
- `module.js.map` - Source map
- `plugin.json` - Plugin metadata

## Signing (required for strict/self-hosted security policies)

Grafana refuses to load plugins that aren't installed from the official
catalog unless they're signed, or unless the server explicitly allow-lists
them as unsigned. There is no "in between" — pick one:

### Option A: Unsigned + allow-list (fastest, fine for internal/dev use)

In `grafana.ini` (or `GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS` env var):

```ini
[plugins]
allow_loading_unsigned_plugins = grafana-react-app-panel
```

Restart Grafana. No signing step needed. This is what most teams actually
use for internal, self-built panels — "signed" mainly matters for plugins
distributed to third parties or published to the public catalog.

### Option B: Private signature (needed to pass a strict security policy)

1. **Plugin ID can't start with `grafana-`.** That prefix is reserved for
   Grafana Labs' own plugins and Grafana's signing service will reject it.
   Rename the `id` in `plugin.json` to `<your-org-slug>-reactapp-panel`
   (the org slug comes from your Grafana Cloud account — see step 2). This
   also means updating every place that references the plugin ID string:
   `pluginId: 'grafana-react-app-panel'` in `src/utils/api.ts`, the install
   paths in this doc, and the plugins directory name.
2. Create a free Grafana Cloud account at grafana.com if you don't have one
   — this is only used to mint a signing token, it doesn't have to be where
   the plugin actually runs.
3. Generate an **Access Policy Token** with the `plugins:write` /
   `PluginPublisher` scope: grafana.com → your org → Access Policies.
4. Sign the build:

   ```bash
   export GRAFANA_ACCESS_POLICY_TOKEN=glc_xxxxxxxx
   npm run build
   npx @grafana/sign-plugin@latest --rootUrls https://your-grafana-host:3000
   ```

   `--rootUrls` must match the exact origin(s) Grafana serves from. If you
   run dev/staging/prod on different hosts, pass all of them comma-separated
   — a private signature is locked to those root URLs; it will refuse to
   load anywhere else. This writes `dist/MANIFEST.txt`.
5. Ship the whole `dist/` folder (including `MANIFEST.txt`) to the Grafana
   plugins directory and restart. No `allow_loading_unsigned_plugins` entry
   needed — Grafana verifies the manifest checksums itself.

If the root URL changes later (new domain, new environment), you must
re-sign — the manifest won't validate against a different origin.

## Create Release Archives

### Option A: Using Build Script

```bash
chmod +x build.sh
./build.sh
```

This creates:
- `release/grafana-react-app-panel-v1.0.0.tar.gz`
- `release/grafana-react-app-panel-v1.0.0.zip`

### Option B: Manual

```bash
# Create release directory
mkdir -p release

# Create tar.gz
cd dist
tar -czf ../release/grafana-react-app-panel-v1.0.0.tar.gz .
cd ..

# Create ZIP
zip -r release/grafana-react-app-panel-v1.0.0.zip dist

# List artifacts
ls -lh release/
```

## Create GitHub Release

### Step 1: Create Git Tag

```bash
# Tag the release
git tag v1.0.0
git push origin v1.0.0
```

### Step 2: Create GitHub Release

1. Go to: https://github.com/UserMMT/grafana-react-app-panel/releases
2. Click **"Draft a new release"**
3. Choose tag: `v1.0.0`
4. Title: `Grafana React App Panel v1.0.0`
5. Description:

```markdown
# Grafana React App Panel v1.0.0

## Features

✅ Built-in TSX/JSX code editor
✅ File upload support  
✅ Live component preview
✅ Code storage in panel options
✅ Full React support
✅ Multi-page app support

## Installation

### Option 1: From Grafana Plugin Repository

```bash
grafana-cli plugins install grafana-react-app-panel
```

### Option 2: Manual Installation

1. Download the plugin archive (tar.gz or zip)
2. Extract to Grafana plugins directory:

```bash
# Linux/Mac
tar -xzf grafana-react-app-panel-v1.0.0.tar.gz -C /var/lib/grafana/plugins/

# or with unzip
unzip grafana-react-app-panel-v1.0.0.zip -d /var/lib/grafana/plugins/
```

3. Restart Grafana:

```bash
sudo systemctl restart grafana-server
```

4. Enable plugin:
   - Go to Configuration → Plugins
   - Search for "React App Panel"
   - Click "Enable"

5. Create a new panel and select "React App Panel"

## Documentation

See [TSX-EDITOR-README.md](https://github.com/UserMMT/grafana-react-app-panel/blob/main/TSX-EDITOR-README.md) for complete usage guide.

## Support

For issues: https://github.com/UserMMT/grafana-react-app-panel/issues
```

6. Upload the release files:
   - Drag & drop `release/grafana-react-app-panel-v1.0.0.tar.gz`
   - Drag & drop `release/grafana-react-app-panel-v1.0.0.zip`

7. Click **"Publish release"**

## Installation from Release

### From tar.gz

```bash
# Download
wget https://github.com/UserMMT/grafana-react-app-panel/releases/download/v1.0.0/grafana-react-app-panel-v1.0.0.tar.gz

# Extract
tar -xzf grafana-react-app-panel-v1.0.0.tar.gz -C /var/lib/grafana/plugins/

# Restart
sudo systemctl restart grafana-server
```

### From ZIP

```bash
# Download
wget https://github.com/UserMMT/grafana-react-app-panel/releases/download/v1.0.0/grafana-react-app-panel-v1.0.0.zip

# Extract
unzip grafana-react-app-panel-v1.0.0.zip -d /var/lib/grafana/plugins/

# Restart
sudo systemctl restart grafana-server
```

## Docker Installation

If using Grafana in Docker:

```bash
docker exec <container-id> bash -c \
  'cd /var/lib/grafana/plugins && \
   wget https://github.com/UserMMT/grafana-react-app-panel/releases/download/v1.0.0/grafana-react-app-panel-v1.0.0.tar.gz && \
   tar -xzf grafana-react-app-panel-v1.0.0.tar.gz'

# Restart container
docker restart <container-id>
```

Or with docker-compose:

```yaml
version: '3'
services:
  grafana:
    image: grafana/grafana:latest
    volumes:
      - ./plugins:/var/lib/grafana/plugins
    environment:
      - GF_PLUGINS_ALLOW_UI_UPDATES=true
```

## Troubleshooting Build

### "npm: command not found"

Install Node.js: https://nodejs.org/

### "dist folder is empty"

Make sure build completed:
```bash
npm run build
echo $?  # Should print 0 for success
```

### Build errors

Check dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Verify Installation

1. In Grafana, go to **Configuration → Plugins**
2. Search for "React App"
3. Should see: **React App Panel** (Status: Enabled)
4. Create new panel and select "React App Panel"

## Version History

- **v1.0.0** (2024-01-25)
  - Initial release
  - TSX/JSX editor
  - Live preview
  - File upload
  - Code storage in panel options

## Next Steps

1. ✅ Build locally: `npm run build`
2. ✅ Create release archives: `./build.sh`
3. ✅ Create GitHub release with tags
4. ✅ Install on Grafana instance
5. ✅ Test with example components

## Support

- **Issues**: https://github.com/UserMMT/grafana-react-app-panel/issues
- **Discussions**: https://github.com/UserMMT/grafana-react-app-panel/discussions
- **Documentation**: [TSX-EDITOR-README.md](TSX-EDITOR-README.md)
