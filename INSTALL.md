# Installation Guide

## Quick Start

### Prerequisites
- Grafana 9.0+ installed
- Access to Grafana plugins directory

### Installation Steps

#### 1. Download Plugin

Go to [Releases](https://github.com/UserMMT/grafana-react-app-panel/releases) and download:
- `grafana-react-app-panel-v1.0.0.tar.gz` (recommended)
- Or `grafana-react-app-panel-v1.0.0.zip`

#### 2. Extract to Plugins Directory

**Linux/Mac:**
```bash
sudo tar -xzf grafana-react-app-panel-v1.0.0.tar.gz -C /var/lib/grafana/plugins/
```

**Windows (Git Bash or PowerShell):**
```powershell
Unzip grafana-react-app-panel-v1.0.0.zip -DestinationPath "C:\Program Files\GrafanaLabs\grafana\data\plugins\"
```

#### 3. Restart Grafana

**Linux:**
```bash
sudo systemctl restart grafana-server
```

**Docker:**
```bash
docker restart <grafana-container>
```

**Windows:**
```powershell
Restart-Service GrafanaService
```

#### 4. Enable Plugin

1. Open Grafana: http://localhost:3000
2. Go to **Configuration** → **Plugins**
3. Search for **"React App Panel"**
4. Click the plugin
5. Click **"Enable"**

#### 5. Create Panel

1. Open any dashboard
2. Click **+ Add panel**
3. Select **"React App Panel"**
4. Click **Edit**

## Verify Installation

You should see:
- Panel title: "React App Panel"
- Two tabs: "Preview" and "Edit Code"
- Instructions to write/upload code

## First Component

### Simple Counter

1. Go to **Edit Code** tab
2. Copy and paste:

```tsx
export default function Counter() {
  const [count, setCount] = React.useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Counter App</h1>
      <p>Count: <strong>{count}</strong></p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(count - 1)}>-1</button>
    </div>
  );
}
```

3. Click **💾 Save Code**
4. Switch to **Preview** tab
5. You should see a working counter!

## Configuration

### Panel Options

- **App Name** - Display name for your app
- **Description** - App description (optional)
- **Component Code** - Your TSX/JSX code

## File Upload

### Upload Component File

1. Go to **Edit Code** tab
2. Click **📁 Upload File**
3. Select a `.tsx` or `.jsx` file
4. Code is loaded automatically
5. Click **💾 Save Code**

## Troubleshooting

### Plugin Not Appearing

**Solution 1:** Check Grafana logs
```bash
sudo journalctl -u grafana-server -f
```

**Solution 2:** Verify plugin directory
```bash
ls -la /var/lib/grafana/plugins/grafana-react-app-panel/
```

Should show:
- `plugin.json`
- `module.js`
- Other files

**Solution 3:** Enable unsigned plugins

Edit `/etc/grafana/grafana.ini`:
```ini
[plugins]
allow_ui_updates = true
allow_loading_unsigned_plugins = grafana-react-app-panel
```

Then restart:
```bash
sudo systemctl restart grafana-server
```

### Component Not Rendering

1. Check browser console (F12 → Console tab)
2. Look for error messages
3. Verify component exports default:
   ```tsx
   export default function MyApp() { ... }
   ```
4. Ensure single root element
5. Use `React.useState` not `useState`

### "Cannot find module"

Only `React` is available globally. Don't import other libraries:

```tsx
// ❌ Wrong
import Button from '@/components/Button';

// ✅ Correct - define inline
const Button = (props) => <button {...props} />;
```

## Next Steps

1. ✅ Read [TSX-EDITOR-README.md](TSX-EDITOR-README.md) for full guide
2. ✅ Check [examples/](examples/) folder for more components
3. ✅ Convert your own components
4. ✅ Connect to backend queries

## Support

- **GitHub Issues**: https://github.com/UserMMT/grafana-react-app-panel/issues
- **Documentation**: [TSX-EDITOR-README.md](TSX-EDITOR-README.md)
- **Examples**: [examples/](examples/)
