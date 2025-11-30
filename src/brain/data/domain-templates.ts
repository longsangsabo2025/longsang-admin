/**
 * Domain Templates
 * Pre-configured domain templates for common use cases
 */

import type { CreateDomainInput } from "@/brain/types/brain.types";
import type { DomainAgentConfig } from "@/brain/types/domain-agent.types";

export interface DomainTemplate {
  id: string;
  name: string;
  description: string;
  domain: CreateDomainInput;
  agentConfig: DomainAgentConfig;
}

export const domainTemplates: DomainTemplate[] = [
  {
    id: "business",
    name: "Business & Strategy",
    description: "For business knowledge, strategies, and decision-making",
    domain: {
      name: "Business & Strategy",
      description: "Business knowledge, strategies, and decision-making",
      color: "#3B82F6",
      icon: "briefcase",
    },
    agentConfig: {
      enabled: true,
      system_prompt:
        "You are a business strategy advisor. Provide concise, actionable insights based on business knowledge.",
      temperature: 0.7,
      max_tokens: 2000,
      model: "gpt-4o-mini",
      auto_tagging: {
        enabled: true,
        rules: [],
      },
      suggestions: {
        enabled: true,
        max_suggestions: 5,
      },
    },
  },
  {
    id: "technical",
    name: "Technical & Code",
    description: "For technical documentation, code snippets, and programming knowledge",
    domain: {
      name: "Technical & Code",
      description: "Technical documentation, code snippets, and programming knowledge",
      color: "#10B981",
      icon: "code",
    },
    agentConfig: {
      enabled: true,
      system_prompt:
        "You are a technical expert. Provide accurate, code-focused answers with examples when relevant.",
      temperature: 0.3,
      max_tokens: 3000,
      model: "gpt-4o-mini",
      auto_tagging: {
        enabled: true,
        rules: [],
      },
      suggestions: {
        enabled: true,
        max_suggestions: 5,
      },
    },
  },
  {
    id: "learning",
    name: "Learning & Notes",
    description: "For course notes, study materials, and learning resources",
    domain: {
      name: "Learning & Notes",
      description: "Course notes, study materials, and learning resources",
      color: "#8B5CF6",
      icon: "book",
    },
    agentConfig: {
      enabled: true,
      system_prompt:
        "You are a learning assistant. Help explain concepts clearly and provide study guidance.",
      temperature: 0.6,
      max_tokens: 2000,
      model: "gpt-4o-mini",
      auto_tagging: {
        enabled: true,
        rules: [],
      },
      suggestions: {
        enabled: true,
        max_suggestions: 5,
      },
    },
  },
  {
    id: "personal",
    name: "Personal & Life",
    description: "For personal notes, memories, and life organization",
    domain: {
      name: "Personal & Life",
      description: "Personal notes, memories, and life organization",
      color: "#F59E0B",
      icon: "heart",
    },
    agentConfig: {
      enabled: true,
      system_prompt: "You are a personal assistant. Be friendly and helpful with personal matters.",
      temperature: 0.8,
      max_tokens: 1500,
      model: "gpt-4o-mini",
      auto_tagging: {
        enabled: false,
        rules: [],
      },
      suggestions: {
        enabled: true,
        max_suggestions: 3,
      },
    },
  },
  {
    id: "research",
    name: "Research & Ideas",
    description: "For research notes, ideas, and creative projects",
    domain: {
      name: "Research & Ideas",
      description: "Research notes, ideas, and creative projects",
      color: "#EF4444",
      icon: "lightbulb",
    },
    agentConfig: {
      enabled: true,
      system_prompt:
        "You are a research assistant. Help connect ideas and provide creative insights.",
      temperature: 0.9,
      max_tokens: 2500,
      model: "gpt-4o-mini",
      auto_tagging: {
        enabled: true,
        rules: [],
      },
      suggestions: {
        enabled: true,
        max_suggestions: 7,
      },
    },
  },
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): DomainTemplate | undefined {
  return domainTemplates.find((template) => template.id === id);
}

/**
 * Get all template names
 */
export function getTemplateNames(): string[] {
  return domainTemplates.map((template) => template.name);
}

