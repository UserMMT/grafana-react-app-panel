#!/bin/bash

# Build script for Grafana React App Panel
# Creates distribution archives for release

set -e

echo "Building Grafana React App Panel..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build plugin
echo "Building plugin..."
npm run build

# Create archives
echo "Creating distribution archives..."

# Get version from package.json
VERSION=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
echo "Version: $VERSION"

# Create release directory
mkdir -p release

# Create tar.gz archive
echo "Creating tar.gz archive..."
cd dist
tar -czf ../release/grafana-react-app-panel-v${VERSION}.tar.gz .
cd ..

# Create ZIP archive
echo "Creating ZIP archive..."
zip -r release/grafana-react-app-panel-v${VERSION}.zip dist -x "dist/.git*"

echo "Build complete!"
echo ""
echo "Release artifacts:"
ls -lh release/
echo ""
echo "To create a GitHub release:"
echo "  git tag v${VERSION}"
echo "  git push origin v${VERSION}"
