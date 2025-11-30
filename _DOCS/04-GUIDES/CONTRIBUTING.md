# Contributing to LongSang Forge

Thank you for your interest in contributing to LongSang Forge! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js 22.20.0 or higher
- npm 10.x or higher
- Git
- Supabase account (for backend features)

### Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/YOUR_USERNAME/long-sang-forge.git
   cd long-sang-forge
   ```

2. **Install dependencies**

   ```bash
   npm install
   cd api && npm install
   ```

3. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/oauth-integration`)
- `fix/` - Bug fixes (e.g., `fix/notification-crash`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### Workflow Steps

1. **Create a branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes**

   - Write code following our [coding standards](#coding-standards)
   - Add tests for new features
   - Update documentation as needed

3. **Test your changes**

   ```bash
   npm run test
   npm run lint
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add OAuth integration"
   ```

5. **Push to your fork**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR from your fork
   - Fill out the PR template
   - Link any related issues

## Coding Standards

### TypeScript/JavaScript

- **Use TypeScript** for all new code
- **Functional components** with hooks (React)
- **Named exports** preferred over default exports
- **Type safety**: Always define types/interfaces

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

export const fetchUser = async (id: string): Promise<User> => {
  // implementation
};

// Avoid
export default function fetchUser(id) {
  // implementation
}
```

### React Components

- Use **functional components** with hooks
- Implement **proper error boundaries**
- Use **memo, useCallback, useMemo** for optimization
- Follow **shadcn/ui** patterns for UI components

```typescript
import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  userId: string;
  onSave: (data: UserData) => void;
}

export const UserProfile = memo(({ userId, onSave }: Props) => {
  const handleSave = useCallback(() => {
    // implementation
  }, [userId]);

  return (
    <div>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
});

UserProfile.displayName = "UserProfile";
```

### File Organization

```
src/
├── components/       # Reusable UI components
│   ├── ui/          # shadcn/ui components
│   └── {feature}/   # Feature-specific components
├── pages/           # Page components
├── hooks/           # Custom hooks
├── lib/             # Utility functions
├── types/           # TypeScript type definitions
└── integrations/    # External service integrations
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Hooks**: camelCase with 'use' prefix (`useAuth.ts`)
- **Utils**: camelCase (`formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

## Testing Guidelines

### Test Structure

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  beforeEach(() => {
    // Setup
  });

  it("should render user name", () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should handle save action", async () => {
    // Test implementation
  });
});
```

### Test Coverage

- **Unit tests**: All utility functions and hooks
- **Integration tests**: API interactions
- **E2E tests**: Critical user flows
- Aim for **80%+ coverage** on new code

### Running Tests

```bash
npm run test              # Run all tests
npm run test:ui           # Run with UI
npm run test:coverage     # Generate coverage report
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements

### Examples

```bash
feat(auth): add OAuth2 integration

- Implement Google OAuth flow
- Add OAuth callback handler
- Update user authentication logic

Closes #123
```

```bash
fix(notifications): prevent crash on empty notification list

Handle edge case where notification list is undefined

Fixes #456
```

## Pull Request Process

### Before Submitting

1. ✅ All tests pass
2. ✅ Code follows style guidelines
3. ✅ Documentation is updated
4. ✅ No console errors or warnings
5. ✅ Commits follow conventional format

### PR Template

When creating a PR, include:

- **Description**: What does this PR do?
- **Motivation**: Why is this change needed?
- **Changes**: List of changes made
- **Testing**: How was this tested?
- **Screenshots**: For UI changes
- **Breaking Changes**: Any breaking changes?
- **Related Issues**: Link to issues

### Review Process

1. **Automated checks** must pass (tests, linting)
2. **At least one approval** from maintainers
3. **All conversations resolved**
4. **No merge conflicts**

### Merging

- PRs are **squash merged** to main branch
- Commit message uses PR title
- Branch is deleted after merge

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [Code Style Guide](./CODE_STYLE.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [API Documentation](./docs/api/)

## Questions?

- 📧 Email: support@longsang.com
- 💬 Discord: [Join our server](https://discord.gg/longsang)
- 📝 GitHub Issues: [Create an issue](https://github.com/longsang/long-sang-forge/issues)

---

Thank you for contributing to LongSang Forge! 🚀
