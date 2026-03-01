/**
 * Platform Detail Tabs - Facebook, Instagram, Threads, LinkedIn, YouTube, Pending
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
import { AlertCircle, ExternalLink, Copy, Settings, Zap } from 'lucide-react';
import type { Platform } from './types';
import { PLATFORMS, CREDENTIAL_SUMMARY } from './constants';
import { getTokenStatusBadge } from './helpers';

interface PlatformTabsProps {
  showTokens: boolean;
  copyToClipboard: (text: string, label: string) => void;
  pendingPlatforms: Platform[];
}

export function FacebookTab({ showTokens, copyToClipboard }: Omit<PlatformTabsProps, 'pendingPlatforms'>) {
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
}

export function InstagramTab() {
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
}

export function ThreadsTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧵</span>
              <div>
                <CardTitle>Threads</CardTitle>
                <CardDescription>Meta's text-based conversation app</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                🧵
              </div>
              <div>
                <h3 className="font-bold text-lg">@baddie.4296</h3>
                <p className="text-muted-foreground">Vũng Tàu</p>
                <p className="text-sm font-mono text-muted-foreground">ID: 25295715200066837</p>
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
              {['Post text', 'Post images', 'Post videos', 'Carousels', 'Reply to threads'].map(
                (cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function LinkedInTab({ showTokens }: { showTokens: boolean }) {
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
}

export function YouTubeTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-red-950 border-red-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">▶️</span>
              <div>
                <CardTitle>YouTube</CardTitle>
                <CardDescription>Video sharing platform</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500">🔄 Auto-Refresh</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl">
                ▶️
              </div>
              <div>
                <h3 className="font-bold text-lg">Long Sang</h3>
                <p className="text-muted-foreground">YouTube Channel</p>
                <p className="text-sm font-mono text-muted-foreground">
                  ID: UCh08dvkDfJVJ8f1C-TbXbew
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">12</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">20</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">4,820</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-green-700 bg-green-950">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">
                Có Refresh Token - Token sẽ tự động renew khi hết hạn!
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {['Upload videos', 'Create playlists', 'Update metadata', 'Read analytics'].map(
                (cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                )
              )}
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a
              href="https://youtube.com/channel/UCh08dvkDfJVJ8f1C-TbXbew"
              target="_blank"
              rel="noopener"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Channel on YouTube
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function PendingTab({ pendingPlatforms }: { pendingPlatforms: Platform[] }) {
  return (
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
  );
}
