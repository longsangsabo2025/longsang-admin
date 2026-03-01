import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';
import { type StoredCredential } from './shared';

export interface DatabaseStatusBannerProps {
  dbCredentials: StoredCredential[];
  loading: boolean;
  lastSync: string | null;
  isPlatformInDb: (platformId: string) => boolean;
}

export const DatabaseStatusBanner = ({
  dbCredentials,
  loading,
  lastSync,
  isPlatformInDb,
}: DatabaseStatusBannerProps) => {
  return (
    <Card
      className={`${dbCredentials.length > 0 ? 'bg-green-950 border-green-800' : 'bg-yellow-950 border-yellow-800'}`}
    >
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            <span className="font-medium">
              {loading
                ? 'Loading from Supabase...'
                : `${dbCredentials.length} platforms stored in database`}
            </span>
            {lastSync && (
              <span className="text-xs text-muted-foreground">• Last sync: {lastSync}</span>
            )}
          </div>
          <div className="flex gap-1">
            {dbCredentials.map((cred) => (
              <Badge
                key={cred.platform}
                variant="outline"
                className={isPlatformInDb(cred.platform) ? 'bg-green-900 text-green-300' : ''}
              >
                {cred.platform}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
