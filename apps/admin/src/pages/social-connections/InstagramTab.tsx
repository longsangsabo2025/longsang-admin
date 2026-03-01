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
import { ExternalLink } from 'lucide-react';
import { PLATFORMS } from './shared';

export const InstagramTab = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-purple-950 to-pink-950 border-pink-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📸</span>
              <div>
                <CardTitle>Instagram Business Accounts</CardTitle>
                <CardDescription>5 accounts connected via Facebook Pages</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500">Using Page Tokens</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>IG ID</TableHead>
                <TableHead>Followers</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLATFORMS.find((p) => p.id === 'instagram')?.accounts.map((acc) => (
                <TableRow key={acc.id}>
                  <TableCell className="font-medium">{acc.name}</TableCell>
                  <TableCell className="text-pink-600">@{acc.username}</TableCell>
                  <TableCell className="font-mono text-xs">{acc.id}</TableCell>
                  <TableCell>{acc.followers || '-'}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <a
                        href={`https://instagram.com/${acc.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open Instagram profile"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
