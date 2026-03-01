import { Card, CardContent } from '@/components/ui/card';
import { type StoredCredential } from './shared';

export interface StatsOverviewProps {
  dbCredentials: StoredCredential[];
  connectedPlatformsCount: number;
  totalAccounts: number;
  getDbCredential: (platformId: string) => StoredCredential | undefined;
  pendingCount: number;
}

export const StatsOverview = ({
  dbCredentials,
  connectedPlatformsCount,
  totalAccounts,
  getDbCredential,
  pendingCount,
}: StatsOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-green-600">
            {dbCredentials.length || connectedPlatformsCount}
          </div>
          <p className="text-sm text-muted-foreground">Platforms in DB</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-blue-600">{totalAccounts}</div>
          <p className="text-sm text-muted-foreground">Total Accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-purple-600">
            {getDbCredential('facebook')?.settings?.totalPages || 7}
          </div>
          <p className="text-sm text-muted-foreground">Facebook Pages</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-pink-600">
            {getDbCredential('instagram')?.settings?.totalAccounts || 5}
          </div>
          <p className="text-sm text-muted-foreground">Instagram Accounts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
          <p className="text-sm text-muted-foreground">Pending Setup</p>
        </CardContent>
      </Card>
    </div>
  );
};
