# Code Style Guide

## Overview

This document defines the coding standards and best practices for LongSang Forge. Following these guidelines ensures code consistency, maintainability, and quality.

## General Principles

1. **Write clean, readable code** - Code is read more than written
2. **Follow SOLID principles** - Single responsibility, Open/closed, etc.
3. **Don't Repeat Yourself (DRY)** - Extract reusable logic
4. **Keep It Simple, Stupid (KISS)** - Avoid unnecessary complexity
5. **You Aren't Gonna Need It (YAGNI)** - Don't add unused features

## TypeScript

### File Naming

```typescript
// Components: PascalCase
UserProfile.tsx;
AgentCenter.tsx;

// Hooks: camelCase with 'use' prefix
useAuth.ts;
useToast.ts;

// Utils: camelCase
formatDate.ts;
validateEmail.ts;

// Types: PascalCase
UserProfile.ts;
ApiResponse.ts;

// Constants: UPPER_SNAKE_CASE or camelCase for files
API_CONSTANTS.ts;
config.ts;
```

### Type Definitions

```typescript
// ✅ Good: Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

// ✅ Good: Use type for unions, intersections
type Status = "active" | "inactive" | "pending";
type UserWithRole = User & { role: Role };

// ❌ Avoid: Using 'any'
const data: any = fetchData(); // Bad

// ✅ Good: Use proper typing
const data: User = await fetchData();

// ✅ Good: Use generic types
function fetchItems<T>(url: string): Promise<T[]> {
  // implementation
}

// ✅ Good: Use const assertions for literal types
const ROLES = {
  ADMIN: "admin",
  USER: "user",
} as const;

type Role = (typeof ROLES)[keyof typeof ROLES];
```

### Functions

```typescript
// ✅ Good: Use arrow functions for consistency
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => sum + item.price, 0);
};

// ✅ Good: Explicit return types
const fetchUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// ✅ Good: Use destructuring for parameters
interface CreateUserParams {
  name: string;
  email: string;
  role?: Role;
}

const createUser = async ({ name, email, role = "user" }: CreateUserParams): Promise<User> => {
  // implementation
};

// ❌ Avoid: Too many parameters
const createUser = (name: string, email: string, role: string, age: number, city: string) => {
  // Bad: use object parameter instead
};
```

### Error Handling

```typescript
// ✅ Good: Use try-catch with proper error types
const fetchData = async (): Promise<Data | null> => {
  try {
    const response = await api.get("/data");
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("API Error:", error.message);
    } else {
      console.error("Unknown error:", error);
    }
    return null;
  }
};

// ✅ Good: Create custom error classes
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// ✅ Good: Handle errors at appropriate level
const saveUser = async (user: User): Promise<void> => {
  try {
    await api.post("/users", user);
    toast.success("User saved successfully");
  } catch (error) {
    toast.error("Failed to save user");
    throw error; // Re-throw for upstream handling
  }
};
```

## React Components

### Component Structure

```typescript
import { memo, useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import type { User } from "@/types/user";

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

/**
 * UserProfile component displays and manages user information
 *
 * @param userId - The unique identifier for the user
 * @param onUpdate - Optional callback when user is updated
 */
export const UserProfile = memo(({ userId, onUpdate }: UserProfileProps) => {
  // 1. Hooks
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // 2. Computed values
  const canEdit = useMemo(() => {
    return user?.id === userId || user?.role === "admin";
  }, [user, userId]);

  // 3. Event handlers
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    // Save logic
    onUpdate?.(updatedUser);
  }, [onUpdate]);

  // 4. Early returns
  if (!user) {
    return <div>Loading...</div>;
  }

  // 5. Render
  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      {canEdit && <Button onClick={handleEdit}>Edit</Button>}
    </div>
  );
});

UserProfile.displayName = "UserProfile";
```

### Component Organization

```
components/
├── ui/                    # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   └── dialog.tsx
├── {feature}/             # Feature-specific components
│   ├── FeatureCard.tsx    # Main component
│   ├── FeatureForm.tsx    # Sub-component
│   └── index.ts           # Barrel export
└── common/                # Shared components
    ├── Layout.tsx
    └── ErrorBoundary.tsx
```

### Props and State

```typescript
// ✅ Good: Use interface for props
interface ButtonProps {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

// ✅ Good: Use default values
const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  children,
}: ButtonProps) => {
  // implementation
};

// ✅ Good: Destructure in function parameter
// ❌ Avoid: Using props object directly
const Button = (props: ButtonProps) => {
  return <button>{props.children}</button>; // Bad
};
```

### Hooks

```typescript
// ✅ Good: Custom hook with clear return type
interface UseAuthReturn {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    const user = await authService.login(email, password);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return {
    user,
    login,
    logout,
    isAuthenticated: user !== null,
  };
};

// ✅ Good: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ Good: Use useCallback for event handlers
const handleClick = useCallback(() => {
  // handler logic
}, [dependencies]);
```

### Conditional Rendering

```typescript
// ✅ Good: Early return for loading/error states
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;

// ✅ Good: Ternary for simple conditions
{
  isEditing ? <EditForm /> : <DisplayView />;
}

// ✅ Good: Logical AND for optional rendering
{
  showButton && <Button />;
}

// ✅ Good: Use optional chaining
{
  user?.profile?.avatar && <Avatar src={user.profile.avatar} />;
}

// ❌ Avoid: Nested ternaries
{
  isLoading ? <Spinner /> : error ? <Error /> : data ? <Display /> : <Empty />;
} // Bad
```

## CSS and Styling

### TailwindCSS

```typescript
// ✅ Good: Use utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// ✅ Good: Use cn() helper for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    "px-4 py-2 rounded",
    variant === 'primary' && "bg-blue-500 text-white",
    variant === 'secondary' && "bg-gray-200 text-gray-800",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>

// ❌ Avoid: Inline styles
<div style={{ padding: '16px', marginTop: '8px' }}> // Bad
```

### Component Variants

```typescript
// ✅ Good: Use class-variance-authority (cva)
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

const Button = ({ variant, size, children }: ButtonProps) => {
  return <button className={buttonVariants({ variant, size })}>{children}</button>;
};
```

## API Integration

### API Client

```typescript
// ✅ Good: Create typed API client
import { supabase } from "@/integrations/supabase/client";

interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export const api = {
  get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
    try {
      const { data, error } = await supabase.from(endpoint).select("*");

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  },

  post: async <T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> => {
    // implementation
  },
};

// ✅ Good: Use API client in components
const { data, error } = await api.get<User[]>("/users");
```

### Data Fetching

```typescript
// ✅ Good: Use TanStack Query
import { useQuery, useMutation } from "@tanstack/react-query";

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: CreateUserInput) => api.post("/users", user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// ✅ Good: Handle loading and error states
const { data, isLoading, error } = useUsers();

if (isLoading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
```

## Comments and Documentation

### JSDoc Comments

````typescript
/**
 * Calculates the total price of items in the cart
 *
 * @param items - Array of cart items
 * @param discount - Optional discount percentage (0-100)
 * @returns Total price after discount
 *
 * @example
 * ```typescript
 * const total = calculateTotal([
 *   { price: 100 },
 *   { price: 200 }
 * ], 10);
 * // Returns: 270 (300 - 10%)
 * ```
 */
export const calculateTotal = (items: CartItem[], discount = 0): number => {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 - discount / 100);
};
````

### Inline Comments

```typescript
// ✅ Good: Explain why, not what
const isValid = validateEmail(email); // Check format before API call

// ❌ Avoid: Obvious comments
const total = price * quantity; // Multiply price by quantity

// ✅ Good: Document complex logic
// Use binary search for O(log n) lookup time on sorted array
const index = binarySearch(sortedArray, target);

// ✅ Good: Mark TODOs with context
// TODO: Implement pagination when dataset exceeds 1000 items
// TODO(john): Refactor after API v2 is released
// FIXME: Handle race condition when multiple saves occur
```

## Testing

### Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { UserProfile } from "./UserProfile";

describe("UserProfile", () => {
  // Setup
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test cases
  it("should render user name", () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("should show edit button for authorized users", async () => {
    const { getByRole } = render(<UserProfile userId="123" />);
    await waitFor(() => {
      expect(getByRole("button", { name: /edit/i })).toBeInTheDocument();
    });
  });

  it("should call onUpdate when save is clicked", async () => {
    const mockUpdate = vi.fn();
    render(<UserProfile userId="123" onUpdate={mockUpdate} />);

    fireEvent.click(screen.getByText("Save"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "123",
        })
      );
    });
  });
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive test names
it("should display error message when email is invalid");
it("should disable submit button while loading");
it("should redirect to login when session expires");

// ❌ Avoid: Vague test names
it("works correctly");
it("test button");
```

## Git Workflow

### Commit Messages

```bash
# ✅ Good: Conventional commits
feat(auth): add OAuth2 integration
fix(api): handle null response in user endpoint
docs: update installation instructions
refactor(ui): extract button variants to separate file
test(auth): add tests for login flow
chore: update dependencies

# ❌ Avoid: Vague commits
fix: bug
update: changes
wip
```

### Branch Naming

```bash
# ✅ Good: Descriptive branch names
feature/oauth-integration
fix/notification-crash
refactor/user-service
docs/api-documentation

# ❌ Avoid: Unclear names
fix
update
my-branch
```

## Performance Best Practices

### React Performance

```typescript
// ✅ Good: Memoize components
export const ExpensiveComponent = memo(({ data }: Props) => {
  // component logic
});

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  // handler
}, [dependencies]);

// ✅ Good: Memoize computed values
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.price - b.price);
}, [items]);

// ✅ Good: Code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
```

### Bundle Size

```typescript
// ✅ Good: Tree-shakeable imports
import { Button } from "@/components/ui/button";

// ❌ Avoid: Import entire library
import * as Icons from "lucide-react"; // Bad

// ✅ Good: Dynamic imports for large libraries
const Chart = lazy(() => import("recharts"));
```

## Security Best Practices

```typescript
// ✅ Good: Validate input
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const validateUser = (input: unknown) => {
  return userSchema.parse(input);
};

// ✅ Good: Sanitize HTML
import DOMPurify from "dompurify";

const SafeHTML = ({ html }: { html: string }) => {
  const clean = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
};

// ❌ Avoid: Direct innerHTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />; // Dangerous!

// ✅ Good: Use environment variables for secrets
const API_KEY = import.meta.env.VITE_API_KEY;

// ❌ Avoid: Hardcode secrets
const API_KEY = "sk_live_abc123"; // Never do this!
```

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Last Updated**: November 17, 2025
**Version**: 1.0.0
