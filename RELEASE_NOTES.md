# Release Notes

## v1.0.0 (January 25, 2024)

### 🎉 Initial Release

#### Features

✅ **TSX/JSX Code Editor**
- Built-in code editor with syntax highlighting
- File upload support (.tsx, .jsx files)
- Code validation
- Auto-save to panel options

✅ **Live Component Preview**
- Real-time rendering of React components
- Hot reload on code changes
- Error display and debugging
- Suspense boundary support

✅ **Multi-Page Apps**
- Full React support (hooks, state, etc.)
- Tab navigation
- Form handling
- Event listeners

✅ **Full React Ecosystem**
- All React hooks: useState, useEffect, useContext, etc.
- Fragment support
- Error boundaries
- Lazy loading

✅ **Backend Integration Ready**
- Query system for backend calls
- Caching support
- Parameter mapping
- Error handling

#### Components Included

- **AppPanel** - Main panel wrapper
- **CodeEditor** - TSX code editor with upload
- **DynamicComponentRenderer** - Runtime component execution
- **AppPanelOptions** - Configuration UI

#### Documentation

- **TSX-EDITOR-README.md** (17KB) - Complete usage guide
- **BUILD_AND_RELEASE.md** - Build and release instructions
- **INSTALL.md** - Installation guide
- **examples/** - Working examples
  - Counter app
  - Multi-tab dashboard
  - Data fetching

#### Examples Provided

1. **Counter App** - Basic state management
2. **Dashboard App** - Multi-tab navigation
3. **Data Fetching** - API integration pattern

#### Known Limitations

- No external library imports (only React)
- No async imports/dynamic imports
- Component must export default
- Single root element required
- No CSS imports (use inline styles)

#### Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

#### Grafana Compatibility

- Grafana 9.0+
- Grafana 10.0+
- Grafana 11.0+

#### Installation

```bash
tar -xzf grafana-react-app-panel-v1.0.0.tar.gz -C /var/lib/grafana/plugins/
sudo systemctl restart grafana-server
```

See [INSTALL.md](INSTALL.md) for detailed instructions.

#### Migration Guide

See [TSX-EDITOR-README.md](TSX-EDITOR-README.md) for converting existing components.

#### Support

- **Issues**: https://github.com/UserMMT/grafana-react-app-panel/issues
- **Documentation**: [TSX-EDITOR-README.md](TSX-EDITOR-README.md)
- **Examples**: [examples/](examples/)

---

## Roadmap

### Planned for v1.1.0
- [ ] TypeScript IntelliSense support
- [ ] Additional UI component library
- [ ] Backend query integration
- [ ] Data visualization components

### Planned for v1.2.0
- [ ] Local storage persistence
- [ ] Component library sharing
- [ ] Version control for components
- [ ] Performance monitoring

### Under Consideration
- [ ] Grafana plugin repository listing
- [ ] Component marketplace
- [ ] Collaborative editing
- [ ] Advanced debugging tools

---

## Changelog

### 2024-01-25 (v1.0.0)

**Initial Release**
- TSX/JSX code editor
- Live preview system
- File upload support
- Complete documentation
- Working examples

---

## Contributors

- **UserMMT** - Initial development

## License

MIT License - See LICENSE file for details
