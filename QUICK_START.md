# Quick Start Guide

Get your React app running in Grafana in 5 minutes!

## Step 1: Install Plugin (1 min)

```bash
# Download
wget https://github.com/UserMMT/grafana-react-app-panel/releases/download/v1.0.0/grafana-react-app-panel-v1.0.0.tar.gz

# Extract
tar -xzf grafana-react-app-panel-v1.0.0.tar.gz -C /var/lib/grafana/plugins/

# Restart Grafana
sudo systemctl restart grafana-server
```

## Step 2: Create Panel (1 min)

1. Open Grafana (http://localhost:3000)
2. Open any dashboard
3. Click **+ Add panel**
4. Select **React App Panel**
5. Click **Edit**

## Step 3: Write Component (1 min)

Go to **Edit Code** tab and paste:

```tsx
export default function HelloWorld() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Hello Grafana! 👋</h1>
      <p>Your first React app is running!</p>
    </div>
  );
}
```

## Step 4: Save & Preview (1 min)

1. Click **💾 Save Code**
2. Switch to **Preview** tab
3. See your component rendered! ✨

## Step 5: Make it Interactive (1 min)

Replace with:

```tsx
export default function InteractiveApp() {
  const [name, setName] = React.useState('');
  const [items, setItems] = React.useState([]);

  const handleAdd = () => {
    if (name.trim()) {
      setItems([...items, { id: Date.now(), text: name }]);
      setName('');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px' }}>
      <h1>Todo List</h1>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add item..."
          style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: '8px 16px',
            backgroundColor: '#0078d4',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {items.map((item) => (
          <li
            key={item.id}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f0f0f0',
              marginBottom: '4px',
              borderRadius: '4px',
            }}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

1. Click **💾 Save Code**
2. Go to **Preview**
3. Try adding items!

## You're Done! 🎉

You now have a working React app in Grafana. Here's what you can do next:

### Next Steps

1. **Explore More Examples**
   - See `examples/` folder in repo
   - Multi-tab apps
   - Data fetching
   - Complex forms

2. **Convert Your Own Components**
   - See [TSX-EDITOR-README.md](TSX-EDITOR-README.md)
   - Migration guide included
   - Step-by-step instructions

3. **Connect to Backend**
   - Query data from your server
   - Store results
   - Update on intervals

4. **Deploy in Production**
   - See [BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md)
   - Docker support
   - CI/CD integration

## Common Tips

### Use React Hooks
```tsx
const [state, setState] = React.useState(initialValue);
const ref = React.useRef(null);
const memoValue = React.useMemo(() => compute(), [deps]);
```

### Styling
```tsx
// Inline styles only (no CSS imports)
style={{ padding: '20px', color: '#333' }}

// Use emotion/css if needed
import { css } from '@emotion/css';
```

### Component Structure
```tsx
// Must export default
export default function MyApp() {
  return (
    <div>Your app here</div>  // Single root element
  );
}
```

### No External Imports
```tsx
// ❌ Can't do this
import Button from '@/components/Button';

// ✅ Do this instead
const Button = (props) => <button {...props} />;
```

## Troubleshooting

### "No default export found"
```tsx
// Must have export default
export default function MyComponent() { ... }
```

### "Cannot read property 'useState'"
```tsx
// Use React.useState, not useState
const [count, setCount] = React.useState(0);
```

### Component not rendering
```tsx
// Must have single root element
return (
  <div>
    {/* All content here */}
  </div>
);
```

### Check browser console (F12) for error details!

## Documentation

- **[TSX-EDITOR-README.md](TSX-EDITOR-README.md)** - Complete guide
- **[INSTALL.md](INSTALL.md)** - Installation help
- **[BUILD_AND_RELEASE.md](BUILD_AND_RELEASE.md)** - Build info
- **[examples/](examples/)** - Working examples

## Support

- **Issues**: https://github.com/UserMMT/grafana-react-app-panel/issues
- **Discussions**: https://github.com/UserMMT/grafana-react-app-panel/discussions

Happy coding! 🚀
