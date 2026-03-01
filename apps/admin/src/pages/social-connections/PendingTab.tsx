import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Settings } from 'lucide-react';
import { type Platform } from './shared';

export interface PendingTabProps {
  pendingPlatforms: Platform[];
}

export const PendingTab = ({ pendingPlatforms }: PendingTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pendingPlatforms.map((platform) => (
          <Card key={platform.id} className="border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl opacity-50">{platform.icon}</span>
                  <CardTitle className="text-muted-foreground">{platform.name}</CardTitle>
                </div>
                <Badge variant="outline">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Not Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{platform.notes}</p>
              <div className="flex flex-wrap gap-1 mb-4">
                {platform.capabilities.map((cap) => (
                  <Badge key={cap} variant="outline" className="text-xs opacity-50">
                    {cap}
                  </Badge>
                ))}
              </div>
              <Button variant="outline" className="w-full" disabled>
                <Settings className="w-4 h-4 mr-2" />
                Setup Required
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
