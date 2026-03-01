/**
 * YouTube Harvester — Coming Soon Feature Placeholder
 */

import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

interface ComingSoonFeatureProps {
  icon: ReactNode;
  title: string;
  description: string;
  features: string[];
}

export function ComingSoonFeature({ icon, title, description, features }: ComingSoonFeatureProps) {
  return (
    <div className="flex flex-col items-center text-center p-8 space-y-4 border border-dashed rounded-lg bg-muted/30">
      <div className="p-4 rounded-full bg-muted">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      <Badge variant="secondary">🚧 Coming Soon</Badge>
      <ul className="text-left text-sm space-y-2 w-full max-w-sm">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
