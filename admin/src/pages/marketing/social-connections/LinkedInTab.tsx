import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CREDENTIAL_SUMMARY } from './shared';

export interface LinkedInTabProps {
  showTokens: boolean;
}

export const LinkedInTab = ({ showTokens }: LinkedInTabProps) => {
  return (
    <div className="space-y-4">
      <Card className="bg-blue-950 border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💼</span>
              <div>
                <CardTitle>LinkedIn</CardTitle>
                <CardDescription>Professional networking platform</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl">
                LS
              </div>
              <div>
                <h3 className="font-bold text-lg">Long Sang</h3>
                <p className="text-muted-foreground">longsangautomation@gmail.com</p>
                <p className="text-sm font-mono text-muted-foreground">ID: HhV8LImTty</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Token Status</p>
              <p className="font-medium">✅ Active (60 days)</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">~Jan 25, 2026</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {['Post text', 'Post images', 'Post articles', 'Post documents'].map((cap) => (
                <Badge key={cap} variant="secondary">
                  {cap}
                </Badge>
              ))}
            </div>
          </div>

          {showTokens && (
            <div className="p-3 rounded-lg border border-yellow-700 bg-yellow-950">
              <p className="text-sm">
                <strong>Client ID:</strong> {CREDENTIAL_SUMMARY.linkedin.clientId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
