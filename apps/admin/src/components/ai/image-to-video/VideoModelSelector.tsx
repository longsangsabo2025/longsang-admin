import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Clapperboard } from 'lucide-react';
import { VIDEO_MODELS } from './constants';

interface VideoModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function VideoModelSelector({ selectedModel, onModelChange }: VideoModelSelectorProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clapperboard className="h-4 w-4" />
          Chọn AI Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedModel}
          onValueChange={onModelChange}
          className="grid gap-3"
        >
          {VIDEO_MODELS.map((model) => (
            <div
              key={model.id}
              className={`relative flex items-start space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                selectedModel === model.id
                  ? 'border-purple-500 bg-purple-500/5'
                  : 'border-border hover:bg-muted/50'
              }`}
              onClick={() => onModelChange(model.id)}
            >
              <RadioGroupItem value={model.id} id={model.id} className="mt-1" />
              <div className="flex-1">
                <Label htmlFor={model.id} className="font-medium cursor-pointer">
                  {model.name}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {model.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {model.features.map((feature) => (
                    <Badge key={feature} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
