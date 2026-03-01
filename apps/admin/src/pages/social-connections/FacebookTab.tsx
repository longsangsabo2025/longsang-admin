import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Copy, ExternalLink } from 'lucide-react';
import { PLATFORMS, CREDENTIAL_SUMMARY, getTokenStatusBadge } from './shared';

export interface FacebookTabProps {
  showTokens: boolean;
  copyToClipboard: (text: string, label: string) => void;
}

export const FacebookTab = ({ showTokens, copyToClipboard }: FacebookTabProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">👥</span>
              <div>
                <CardTitle>Facebook Pages</CardTitle>
                <CardDescription>7 Pages connected with permanent tokens</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500">All Tokens Permanent</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Page ID</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Token Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLATFORMS.find((p) => p.id === 'facebook')?.accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell className="font-mono text-xs">{acc.id}</TableCell>
                  <TableCell>{acc.followers?.toLocaleString() || '-'}</TableCell>
                  <TableCell>{getTokenStatusBadge(acc.tokenStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(acc.id, 'Page ID')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={`https://facebook.com/${acc.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Facebook page"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {showTokens && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="text-yellow-600">🔐 Credentials Info</CardTitle>
          </CardHeader>
          <CardContent className="font-mono text-sm space-y-2">
            <p>
              <strong>App ID:</strong> {CREDENTIAL_SUMMARY.facebook.appId}
            </p>
            <p>
              <strong>App Name:</strong> {CREDENTIAL_SUMMARY.facebook.appName}
            </p>
            <p>
              <strong>Token Type:</strong> {CREDENTIAL_SUMMARY.facebook.tokenType}
            </p>
            <p className="text-muted-foreground text-xs">Full tokens stored in .env file</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
