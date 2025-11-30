/**
 * Core Logic Distillation Component
 * Interface for triggering and managing core logic distillation
 */

import { useDistillCoreLogic, useCoreLogicVersions } from '@/brain/hooks/useCoreLogic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, History } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface CoreLogicDistillationProps {
  domainId: string;
}

export function CoreLogicDistillation({ domainId }: CoreLogicDistillationProps) {
  const distillMutation = useDistillCoreLogic();
  const { data: versions } = useCoreLogicVersions(domainId);
  const [options, setOptions] = useState({
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4000,
  });

  const handleDistill = async () => {
    try {
      await distillMutation.mutateAsync({
        domainId,
        options: {
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        },
      });
    } catch (error) {
      console.error('Distillation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Core Logic Distillation</h2>
        <p className="text-muted-foreground">
          Extract first principles, mental models, decision rules, and anti-patterns from your
          knowledge
        </p>
      </div>

      {/* Distillation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Start Distillation
          </CardTitle>
          <CardDescription>
            Configure and trigger core logic distillation for this domain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="model">Model</Label>
              <Select
                value={options.model}
                onValueChange={(value) => setOptions({ ...options, model: value })}
              >
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={options.temperature}
                onChange={(e) =>
                  setOptions({ ...options, temperature: Number.parseFloat(e.target.value) || 0.7 })
                }
              />
            </div>

            <div>
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1000"
                max="8000"
                step="500"
                value={options.maxTokens}
                onChange={(e) =>
                  setOptions({ ...options, maxTokens: Number.parseInt(e.target.value, 10) || 4000 })
                }
              />
            </div>
          </div>

          <Button
            onClick={handleDistill}
            disabled={distillMutation.isPending}
            className="w-full"
            size="lg"
          >
            {distillMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Distilling...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Distillation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions && versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </CardTitle>
            <CardDescription>Previous distillation versions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">Version {version.version}</p>
                    <p className="text-sm text-muted-foreground">
                      {version.changeSummary || 'No summary'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(version.lastDistilledAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={version.isActive ? 'default' : 'secondary'}>
                    {version.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
