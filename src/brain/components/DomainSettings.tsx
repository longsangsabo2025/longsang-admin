/**
 * Domain Settings Component
 * Configure domain agent and preferences
 */

import { useDomain, useUpdateDomain } from "@/brain/hooks/useDomains";
import type { DomainAgentConfig } from "@/brain/types/domain-agent.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface DomainSettingsProps {
  readonly domainId: string;
}

export function DomainSettings({ domainId }: DomainSettingsProps) {
  const { data: domain, isLoading } = useDomain(domainId);
  const updateDomain = useUpdateDomain();

  const [agentConfig, setAgentConfig] = useState<DomainAgentConfig>({
    enabled: true,
    system_prompt: null,
    temperature: 0.7,
    max_tokens: 2000,
    model: "gpt-4o-mini",
    auto_tagging: {
      enabled: false,
      rules: [],
    },
    suggestions: {
      enabled: true,
      max_suggestions: 5,
    },
  });

  useEffect(() => {
    if (domain) {
      // Load agent config from domain (if exists)
      // This would need to be added to the Domain type
      // For now, we'll use defaults
    }
  }, [domain]);

  const handleSave = async () => {
    if (!domain) return;

    try {
      // Update domain with agent config
      // Note: This requires updating the backend to accept agent_config
      await updateDomain.mutateAsync({
        id: domain.id,
        // agent_config: agentConfig, // This would need to be added to UpdateDomainInput
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  if (!domain) {
    return <div>Domain not found</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Domain Settings</h2>
        <p className="text-muted-foreground">Configure agent behavior and preferences</p>
      </div>

      {/* Agent Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Configuration</CardTitle>
          <CardDescription>Configure the AI agent for this domain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Agent */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="agent-enabled">Enable Domain Agent</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI agent to answer questions about this domain
              </p>
            </div>
            <Switch
              id="agent-enabled"
              checked={agentConfig.enabled}
              onCheckedChange={(checked) =>
                setAgentConfig({ ...agentConfig, enabled: checked })
              }
            />
          </div>

          {/* System Prompt */}
          <div>
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={agentConfig.system_prompt || ""}
              onChange={(e) =>
                setAgentConfig({ ...agentConfig, system_prompt: e.target.value || null })
              }
              placeholder="Custom instructions for the agent (optional)"
              className="min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define how the agent should behave when answering questions about this domain
            </p>
          </div>

          {/* Model Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={agentConfig.model || "gpt-4o-mini"}
                onChange={(e) => setAgentConfig({ ...agentConfig, model: e.target.value })}
                placeholder="gpt-4o-mini"
              />
            </div>
            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={agentConfig.temperature || 0.7}
                onChange={(e) =>
                  setAgentConfig({
                    ...agentConfig,
                    temperature: Number.parseFloat(e.target.value) || 0.7,
                  })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              min="100"
              max="4000"
              value={agentConfig.max_tokens || 2000}
              onChange={(e) =>
                setAgentConfig({
                  ...agentConfig,
                  max_tokens: Number.parseInt(e.target.value, 10) || 2000,
                })
              }
            />
          </div>

          {/* Auto-tagging */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-tagging">Auto-tagging</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically suggest tags for new knowledge
                </p>
              </div>
              <Switch
                id="auto-tagging"
                checked={agentConfig.auto_tagging?.enabled || false}
                onCheckedChange={(checked) =>
                  setAgentConfig({
                    ...agentConfig,
                    auto_tagging: {
                      ...agentConfig.auto_tagging,
                      enabled: checked,
                      rules: agentConfig.auto_tagging?.rules || [],
                    },
                  })
                }
              />
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="suggestions">Suggestions</Label>
                <p className="text-sm text-muted-foreground">
                  Show suggested knowledge items
                </p>
              </div>
              <Switch
                id="suggestions"
                checked={agentConfig.suggestions?.enabled !== false}
                onCheckedChange={(checked) =>
                  setAgentConfig({
                    ...agentConfig,
                    suggestions: {
                      ...agentConfig.suggestions,
                      enabled: checked,
                      max_suggestions: agentConfig.suggestions?.max_suggestions || 5,
                    },
                  })
                }
              />
            </div>
            {agentConfig.suggestions?.enabled !== false && (
              <div>
                <Label htmlFor="max-suggestions">Max Suggestions</Label>
                <Input
                  id="max-suggestions"
                  type="number"
                  min="1"
                  max="20"
                  value={agentConfig.suggestions?.max_suggestions || 5}
                  onChange={(e) =>
                    setAgentConfig({
                      ...agentConfig,
                      suggestions: {
                        ...agentConfig.suggestions,
                        max_suggestions: Number.parseInt(e.target.value, 10) || 5,
                      },
                    })
                  }
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateDomain.isPending}>
              {updateDomain.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

