/**
 * Publish Tab - Social media platform publishing
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Rocket } from 'lucide-react';
import { PLATFORM_CONFIGS } from './constants';

export function PublishTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Publish to Platforms
        </CardTitle>
        <CardDescription>
          Distribute your avatar content across social media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(PLATFORM_CONFIGS).map(([platform, config]) => (
            <Card key={platform} className="text-center p-4">
              <div className="text-4xl mb-2">{config.icon}</div>
              <h4 className="font-medium capitalize">{platform}</h4>
              <p className="text-xs text-muted-foreground">
                {config.aspectRatio} • Max {config.maxDuration}s
              </p>
              <Button size="sm" variant="outline" className="mt-3 w-full">
                Connect
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5" />
            Quick Publish Workflow
          </h4>
          <p className="text-sm text-muted-foreground">
            Connect your social media accounts to enable one-click publishing of generated content.
            Uses n8n workflows for automated distribution.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
