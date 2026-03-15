/**
 * AI Command Parser
 * Parse natural language commands and convert to visual nodes
 */

import { ComponentDefinition } from '@/hooks/useVisualWorkspace';

interface ParsedCommand {
  action: string;
  components: ComponentDefinition[];
  connections?: Array<{ from: string; to: string }>;
}

/**
 * Parse natural language command to extract components and structure
 */
export async function parseAICommand(command: string): Promise<ParsedCommand> {
  const lowerCommand = command.toLowerCase();

  // Simple keyword-based parsing (can be enhanced with AI later)
  const components: ComponentDefinition[] = [];
  const connections: Array<{ from: string; to: string }> = [];

  // Detect UI components
  if (lowerCommand.includes('login') || lowerCommand.includes('đăng nhập')) {
    components.push({
      id: `login-form-${Date.now()}`,
      type: 'uiComponent',
      label: 'Login Form',
      componentType: 'form',
      sublabel: 'Email & Password',
      properties: {
        fields: ['email', 'password'],
        action: 'login',
      },
      code: `// Login Form Component
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}`,
    });

    // Add auth API if login detected
    if (lowerCommand.includes('api') || lowerCommand.includes('auth')) {
      const authApiId = `auth-api-${Date.now()}`;
      components.push({
        id: authApiId,
        type: 'apiService',
        label: 'Auth API',
        sublabel: 'POST /auth/login',
        properties: {
          method: 'POST',
          endpoint: '/api/auth/login',
        },
      });
      connections.push({
        from: `login-form-${Date.now()}`,
        to: authApiId,
      });
    }
  }

  // Detect button
  if (lowerCommand.includes('button') || lowerCommand.includes('nút')) {
    components.push({
      id: `button-${Date.now()}`,
      type: 'uiComponent',
      label: 'Button',
      componentType: 'button',
      properties: {
        text: extractButtonText(command) || 'Click me',
        variant: 'primary',
      },
      code: `// Button Component
export function Button({ text, onClick }) {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded">
      {text}
    </button>
  );
}`,
    });
  }

  // Detect form
  if (lowerCommand.includes('form') || lowerCommand.includes('biểu mẫu')) {
    components.push({
      id: `form-${Date.now()}`,
      type: 'uiComponent',
      label: 'Form',
      componentType: 'form',
      properties: {
        fields: extractFormFields(command),
      },
      code: `// Form Component
export function Form({ fields }) {
  return (
    <form>
      {fields.map(field => (
        <input key={field} name={field} placeholder={field} />
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}`,
    });
  }

  // Detect card
  if (lowerCommand.includes('card') || lowerCommand.includes('thẻ')) {
    components.push({
      id: `card-${Date.now()}`,
      type: 'uiComponent',
      label: 'Card',
      componentType: 'card',
      properties: {
        title: extractCardTitle(command) || 'Card Title',
      },
      code: `// Card Component
export function Card({ title, children }) {
  return (
    <div className="p-4 border rounded-lg shadow">
      <h3>{title}</h3>
      {children}
    </div>
  );
}`,
    });
  }

  // Detect API
  if (lowerCommand.includes('api') || lowerCommand.includes('service')) {
    const apiMethod = extractAPIMethod(command);
    const apiEndpoint = extractAPIEndpoint(command) || '/api/endpoint';

    components.push({
      id: `api-${Date.now()}`,
      type: 'apiService',
      label: 'API Service',
      sublabel: `${apiMethod || 'GET'} ${apiEndpoint}`,
      properties: {
        method: apiMethod || 'GET',
        endpoint: apiEndpoint,
      },
      code: `// API Service
export async function apiCall() {
  const response = await fetch('${apiEndpoint}', {
    method: '${apiMethod || 'GET'}',
  });
  return response.json();
}`,
    });
  }

  // Detect database
  if (
    lowerCommand.includes('database') ||
    lowerCommand.includes('db') ||
    lowerCommand.includes('cơ sở dữ liệu')
  ) {
    components.push({
      id: `db-${Date.now()}`,
      type: 'database',
      label: 'Database',
      sublabel: 'PostgreSQL',
      properties: {
        type: 'postgresql',
      },
    });
  }

  // If no components detected, create a generic component
  if (components.length === 0) {
    components.push({
      id: `component-${Date.now()}`,
      type: 'customComponent',
      label: 'Component',
      sublabel: 'Custom component',
      properties: {},
      code: `// Custom Component
export function Component() {
  return <div>Component</div>;
}`,
    });
  }

  return {
    action: extractAction(command),
    components,
    connections: connections.length > 0 ? connections : undefined,
  };
}

// Helper functions
function extractAction(command: string): string {
  if (command.toLowerCase().includes('tạo') || command.toLowerCase().includes('create')) {
    return 'create';
  }
  if (command.toLowerCase().includes('sửa') || command.toLowerCase().includes('edit')) {
    return 'edit';
  }
  return 'create';
}

function extractButtonText(command: string): string | null {
  const match = command.match(/button\s+["'](.+?)["']|nút\s+["'](.+?)["']/i);
  return match ? match[1] || match[2] : null;
}

function extractFormFields(command: string): string[] {
  const fields: string[] = [];

  // Common field patterns
  if (command.toLowerCase().includes('email')) fields.push('email');
  if (command.toLowerCase().includes('password')) fields.push('password');
  if (command.toLowerCase().includes('name')) fields.push('name');
  if (command.toLowerCase().includes('phone')) fields.push('phone');

  // Extract from "fields: email, password" pattern
  const match = command.match(/fields?[:\s]+([^,]+(?:,\s*[^,]+)*)/i);
  if (match) {
    const fieldList = match[1].split(',').map((f) => f.trim());
    fields.push(...fieldList);
  }

  return fields.length > 0 ? fields : ['field1', 'field2'];
}

function extractCardTitle(command: string): string | null {
  const match = command.match(/card\s+["'](.+?)["']|thẻ\s+["'](.+?)["']/i);
  return match ? match[1] || match[2] : null;
}

function extractAPIMethod(command: string): string | null {
  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  for (const method of methods) {
    if (command.toUpperCase().includes(method)) {
      return method;
    }
  }
  return null;
}

function extractAPIEndpoint(command: string): string | null {
  const match = command.match(/\/api\/[\w/-]+/i);
  return match ? match[0] : null;
}
