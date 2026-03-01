/**
 * Overview Tab - Platform overview cards + Token Expiry Summary table
 */

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
import { CheckCircle2, Clock } from 'lucide-react';
import type { Platform } from './types';

interface OverviewTabProps {
  connectedPlatforms: Platform[];
}

export function OverviewTab({ connectedPlatforms }: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {connectedPlatforms.map((platform) => (
          <Card key={platform.id} className={platform.bgColor}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{platform.icon}</span>
                  <CardTitle className={platform.color}>{platform.name}</CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="bg-green-900 text-green-300 border-green-700"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">{platform.accounts.length} Account(s)</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {platform.accounts.slice(0, 2).map((acc) => (
                      <div key={acc.id}>{acc.username ? `@${acc.username}` : acc.name}</div>
                    ))}
                    {platform.accounts.length > 2 && (
                      <div>+{platform.accounts.length - 2} more...</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {platform.capabilities.slice(0, 3).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
                {platform.notes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">
                    {platform.notes}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Token Expiry Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Token Expiry Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Token Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">👥 Facebook Pages</TableCell>
                <TableCell>Page Access Token</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">♾️ Permanent</Badge>
                </TableCell>
                <TableCell>Never</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">📸 Instagram</TableCell>
                <TableCell>Page Access Token</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">♾️ Permanent</Badge>
                </TableCell>
                <TableCell>Never</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">🧵 Threads</TableCell>
                <TableCell>User Access Token</TableCell>
                <TableCell>
                  <Badge className="bg-blue-500">✅ Active</Badge>
                </TableCell>
                <TableCell>~Jan 25, 2026</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Refresh
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">💼 LinkedIn</TableCell>
                <TableCell>OAuth 2.0 Token</TableCell>
                <TableCell>
                  <Badge className="bg-blue-500">✅ Active</Badge>
                </TableCell>
                <TableCell>~Jan 25, 2026</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Refresh
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">▶️ YouTube</TableCell>
                <TableCell>OAuth 2.0 + Refresh</TableCell>
                <TableCell>
                  <Badge className="bg-green-500">🔄 Auto-Refresh</Badge>
                </TableCell>
                <TableCell>Auto-renew</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
