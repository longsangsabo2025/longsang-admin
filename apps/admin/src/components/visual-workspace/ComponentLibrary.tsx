/**
 * Component Library
 * Drag & drop component library for visual workspace
 */

import { ScrollArea } from '@/components/ui/scroll-area';
import { ComponentDefinition } from '@/hooks/useVisualWorkspace';
import { Box, Database, FormInput, Globe, Layout, MousePointerClick, Package } from 'lucide-react';

interface ComponentTemplate {
  id: string;
  name: string;
  icon: typeof Box;
  type: ComponentDefinition['type'];
  componentType?: string;
  description: string;
  template: ComponentDefinition;
}

const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  {
    id: 'button',
    name: 'Button',
    icon: MousePointerClick,
    type: 'uiComponent',
    componentType: 'button',
    description: 'Interactive button component',
    template: {
      id: 'button-template',
      type: 'uiComponent',
      label: 'Button',
      componentType: 'button',
      properties: {
        text: 'Click me',
        variant: 'primary',
      },
      code: `// Button Component
export function Button({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
    >
      {text}
    </button>
  );
}`,
    },
  },
  {
    id: 'form',
    name: 'Form',
    icon: FormInput,
    type: 'uiComponent',
    componentType: 'form',
    description: 'Form with input fields',
    template: {
      id: 'form-template',
      type: 'uiComponent',
      label: 'Form',
      componentType: 'form',
      properties: {
        fields: ['name', 'email'],
      },
      code: `// Form Component
export function Form({ fields }) {
  return (
    <form>
      {fields.map(field => (
        <input
          key={field}
          name={field}
          placeholder={field}
          className="p-2 border rounded"
        />
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}`,
    },
  },
  {
    id: 'card',
    name: 'Card',
    icon: Layout,
    type: 'uiComponent',
    componentType: 'card',
    description: 'Card container component',
    template: {
      id: 'card-template',
      type: 'uiComponent',
      label: 'Card',
      componentType: 'card',
      properties: {
        title: 'Card Title',
      },
      code: `// Card Component
export function Card({ title, children }) {
  return (
    <div className="p-4 border rounded-lg shadow">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      {children}
    </div>
  );
}`,
    },
  },
  {
    id: 'api-service',
    name: 'API Service',
    icon: Globe,
    type: 'apiService',
    description: 'API endpoint service',
    template: {
      id: 'api-template',
      type: 'apiService',
      label: 'API Service',
      sublabel: 'GET /api/endpoint',
      properties: {
        method: 'GET',
        endpoint: '/api/endpoint',
      },
      code: `// API Service
export async function apiCall() {
  const response = await fetch('/api/endpoint', {
    method: 'GET',
  });
  return response.json();
}`,
    },
  },
  {
    id: 'database',
    name: 'Database',
    icon: Database,
    type: 'database',
    description: 'Database connection',
    template: {
      id: 'db-template',
      type: 'database',
      label: 'Database',
      sublabel: 'PostgreSQL',
      properties: {
        type: 'postgresql',
      },
      code: `// Database Connection
export async function dbQuery(query: string) {
  // Database query logic
  return result;
}`,
    },
  },
];

interface ComponentLibraryProps {
  onComponentSelect: (template: ComponentDefinition) => void;
  className?: string;
}

export function ComponentLibrary({ onComponentSelect, className = '' }: ComponentLibraryProps) {
  const handleDragStart = (e: React.DragEvent, template: ComponentTemplate) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(template.template));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className={`flex flex-col h-full bg-[#0f0f0f] ${className}`}>
      <div className="shrink-0 px-4 py-3 border-b border-[#2a2a2a]">
        <h3 className="text-sm font-medium flex items-center gap-2 text-white">
          <Package className="h-4 w-4" />
          Component Library
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {COMPONENT_TEMPLATES.map((template) => {
            const Icon = template.icon;
            return (
              <div
                key={template.id}
                draggable
                onDragStart={(e) => handleDragStart(e, template)}
                onClick={() => {
                  const newComponent = {
                    ...template.template,
                    id: `${template.id}-${Date.now()}`,
                  };
                  onComponentSelect(newComponent);
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] cursor-move hover:bg-[#2a2a2a] hover:border-purple-500/50 transition-colors"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-white">{template.name}</div>
                  <div className="text-xs text-gray-500 truncate">{template.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
