# Development Guide

## Setup

```bash
# Clone repository
git clone https://github.com/Edlineas/opencode-restore-plugin.git
cd opencode-restore-plugin

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test
```

## Project Structure

```
opencode-restore-plugin/
├── src/
│   ├── index.ts          # Plugin entry point
│   ├── snapshot.ts       # Snapshot management
│   ├── tracker.ts        # File tracking
│   ├── restore.ts        # Restore engine
│   ├── events.ts         # Event listeners
│   └── types.ts          # Type definitions
├── tests/
│   ├── snapshot.test.ts
│   ├── tracker.test.ts
│   └── restore.test.ts
├── docs/
│   ├── API.md
│   └── DEVELOPMENT.md
└── dist/                 # Compiled output
```

## Development Workflow

### 1. Make Changes

Edit source files in `src/`.

### 2. Build

```bash
npm run build
```

### 3. Test

```bash
npm test
```

### 4. Type Check

```bash
npm run type-check
```

## Testing

### Unit Tests

Located in `tests/` directory. Uses Jest framework.

```bash
# Run all tests
npm test

# Run specific test
npm test -- tracker.test.ts

# Watch mode
npm test -- --watch
```

### Test Coverage

```bash
npm test -- --coverage
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use async/await for asynchronous operations
- Prefer const over let
- Use template literals for string concatenation

## Debugging

### Local Testing

```bash
# Link plugin locally
npm link

# In OpenCode config directory
npm link opencode-restore-plugin
```

### Debug Logs

Add console.log statements in development:

```typescript
console.log('[OpenCodeRestore]', 'Debug message')
```

## Release Process

### 1. Update Version

```bash
npm version patch  # 0.1.0 -> 0.1.1
npm version minor  # 0.1.0 -> 0.2.0
npm version major  # 0.1.0 -> 1.0.0
```

### 2. Update CHANGELOG.md

Document changes in CHANGELOG.md.

### 3. Build

```bash
npm run build
```

### 4. Test

```bash
npm test
```

### 5. Publish

```bash
npm publish
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit pull request

## Troubleshooting

### Build Errors

```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose
```

### Type Errors

```bash
# Check types without building
npm run type-check
```

## Resources

- [OpenCode SDK Documentation](https://frank.dev.opencode.ai/docs/sdk/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
