# AI Command Center - Testing Guide

## Test Structure

```
tests/
├── unit/              # Unit tests for individual services
├── integration/       # Integration tests for API flows
├── e2e/              # End-to-end tests with Playwright
├── PRODUCTION_CHECKLIST.md
└── DEPLOYMENT_GUIDE.md
```

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
# Install Playwright first
npx playwright install

# Run E2E tests
npm run test:e2e
```

### All Tests

```bash
npm test
```

## Test Coverage

Target coverage: >80%

```bash
npm run test:coverage
```

## Writing New Tests

### Unit Test Example

```javascript
import { describe, it, expect } from 'vitest';

describe('Service Name', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Integration Test Example

```javascript
import { describe, it, expect } from 'vitest';

describe('API Integration', () => {
  it('should complete full flow', async () => {
    // Test full API flow
  });
});
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Before deployment
- Nightly builds
