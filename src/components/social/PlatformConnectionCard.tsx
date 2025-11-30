/**
 * =================================================================
 * PLATFORM CONNECTION CARD - UI Component for Platform Connections
 * =================================================================
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSocialMediaManager } from "@/lib/social";
import { getSocialCredentialsService } from "@/lib/social/credentials-service";
import type { PlatformConnection, PlatformCredentials, SocialPlatform } from "@/types/social-media";
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface PlatformConnectionCardProps {
  platform: SocialPlatform;
  onConnect?: (platform: SocialPlatform) => void;
  onDisconnect?: (platform: SocialPlatform) => void;
}

const PLATFORM_INFO: Record<
  SocialPlatform,
  { name: string; description: string; icon: string; color: string }
> = {
  linkedin: {
    name: "LinkedIn",
    description: "Professional network - Personal profiles & Company pages",
    icon: "💼",
    color: "bg-blue-600",
  },
  twitter: {
    name: "Twitter/X",
    description: "Microblogging platform - Personal accounts",
    icon: "𝕏",
    color: "bg-black",
  },
  facebook: {
    name: "Facebook",
    description: "Social network - Business Pages only",
    icon: "👥",
    color: "bg-blue-700",
  },
  instagram: {
    name: "Instagram",
    description: "Photo & video sharing - Business accounts",
    icon: "📸",
    color: "bg-gradient-to-br from-purple-600 to-pink-600",
  },
  youtube: {
    name: "YouTube",
    description: "Video platform - Channels",
    icon: "▶️",
    color: "bg-red-600",
  },
  telegram: {
    name: "Telegram",
    description: "Messaging app - Channels & Groups",
    icon: "✈️",
    color: "bg-sky-500",
  },
  discord: {
    name: "Discord",
    description: "Community platform - Channels (via Webhook)",
    icon: "🎮",
    color: "bg-indigo-600",
  },
};

export const PlatformConnectionCard = ({
  platform,
  onConnect,
  onDisconnect,
}: PlatformConnectionCardProps) => {
  const { toast } = useToast();
  const [status, setStatus] = useState<PlatformConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [credentials, setCredentials] = useState<Partial<PlatformCredentials>>({});

  const info = PLATFORM_INFO[platform];
  const manager = getSocialMediaManager();
  const credentialsService = getSocialCredentialsService();

  useEffect(() => {
    loadCredentials();
  }, [platform]);

  const loadCredentials = async () => {
    try {
      const stored = await credentialsService.getCredentials(platform);
      if (stored) {
        setCredentials(stored.credentials);
        // Auto-register with manager
        manager.registerPlatform(platform, stored.credentials, stored.settings);
        await checkStatus();
      }
    } catch (error) {
      console.error("Failed to load credentials:", error);
    }
  };

  const checkStatus = async () => {
    try {
      if (manager.isPlatformRegistered(platform)) {
        const connectionStatus = await manager.getConnectionStatus(platform);
        setStatus(connectionStatus);
      } else {
        setStatus(null);
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Validate required credentials
      if (
        !credentials.accessToken &&
        !credentials.bearerToken &&
        !credentials.botToken &&
        !credentials.webhookUrl
      ) {
        throw new Error("Please provide credentials");
      }

      // Save to database first
      await credentialsService.saveCredentials(platform, credentials as PlatformCredentials);

      // Register platform
      manager.registerPlatform(platform, credentials as PlatformCredentials);

      // Test connection
      const isHealthy = await manager.testConnection(platform);

      if (!isHealthy) {
        throw new Error("Connection test failed");
      }

      // Get updated status and save to database
      const connectionStatus = await manager.getConnectionStatus(platform);
      await credentialsService.updateConnectionStatus(
        platform,
        true,
        undefined,
        connectionStatus.accountInfo
      );

      // Get updated status
      await checkStatus();

      toast({
        title: "✅ Connected",
        description: `${info.name} connected successfully!`,
      });

      onConnect?.(platform);
    } catch (error) {
      // Save error to database
      await credentialsService.updateConnectionStatus(
        platform,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      toast({
        title: "❌ Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      // Delete from database
      await credentialsService.deleteCredentials(platform);

      // Unregister from manager
      manager.unregisterPlatform(platform);
      setStatus(null);
      setCredentials({});

      toast({
        title: "Disconnected",
        description: `${info.name} disconnected`,
      });

      onDisconnect?.(platform);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive",
      });
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const isHealthy = await manager.testConnection(platform);

      // Update status in database
      if (isHealthy) {
        const connectionStatus = await manager.getConnectionStatus(platform);
        await credentialsService.updateConnectionStatus(
          platform,
          true,
          undefined,
          connectionStatus.accountInfo
        );
      } else {
        await credentialsService.updateConnectionStatus(platform, false, "Connection test failed");
      }

      toast({
        title: isHealthy ? "✅ Connection OK" : "❌ Connection Failed",
        description: isHealthy ? "Platform is healthy" : "Failed to connect",
        variant: isHealthy ? "default" : "destructive",
      });

      await checkStatus();
    } catch (error) {
      await credentialsService.updateConnectionStatus(
        platform,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const renderCredentialInputs = () => {
    switch (platform) {
      case "linkedin":
      case "twitter":
        return (
          <div className="space-y-2">
            <Label htmlFor={`${platform}-token`}>
              {platform === "linkedin" ? "Access Token" : "Bearer Token"}
            </Label>
            <Input
              id={`${platform}-token`}
              type="password"
              placeholder="Enter token..."
              value={credentials.accessToken || credentials.bearerToken || ""}
              onChange={(e) =>
                setCredentials({
                  ...credentials,
                  [platform === "linkedin" ? "accessToken" : "bearerToken"]: e.target.value,
                })
              }
            />
          </div>
        );

      case "facebook":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="facebook-token">Page Access Token</Label>
              <Input
                id="facebook-token"
                type="password"
                placeholder="Enter page access token..."
                value={credentials.accessToken || ""}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facebook-page-id">Page ID</Label>
              <Input
                id="facebook-page-id"
                placeholder="Enter page ID..."
                value={credentials.pageId || ""}
                onChange={(e) => setCredentials({ ...credentials, pageId: e.target.value })}
              />
            </div>
          </div>
        );

      case "instagram":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram-token">Access Token</Label>
              <Input
                id="instagram-token"
                type="password"
                placeholder="Enter access token..."
                value={credentials.accessToken || ""}
                onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instagram-account-id">Business Account ID</Label>
              <Input
                id="instagram-account-id"
                placeholder="Enter business account ID..."
                value={credentials.businessAccountId || ""}
                onChange={(e) =>
                  setCredentials({ ...credentials, businessAccountId: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "youtube":
        return (
          <div className="space-y-2">
            <Label htmlFor="youtube-token">Access Token (OAuth 2.0)</Label>
            <Input
              id="youtube-token"
              type="password"
              placeholder="Enter access token..."
              value={credentials.accessToken || ""}
              onChange={(e) => setCredentials({ ...credentials, accessToken: e.target.value })}
            />
          </div>
        );

      case "telegram":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-bot-token">Bot Token</Label>
              <Input
                id="telegram-bot-token"
                type="password"
                placeholder="Enter bot token..."
                value={credentials.botToken || ""}
                onChange={(e) => setCredentials({ ...credentials, botToken: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telegram-channel-id">Channel ID</Label>
              <Input
                id="telegram-channel-id"
                placeholder="@channel_name or ID..."
                value={credentials.channelId || ""}
                onChange={(e) => setCredentials({ ...credentials, channelId: e.target.value })}
              />
            </div>
          </div>
        );

      case "discord":
        return (
          <div className="space-y-2">
            <Label htmlFor="discord-webhook">Webhook URL</Label>
            <Input
              id="discord-webhook"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={credentials.webhookUrl || ""}
              onChange={(e) => setCredentials({ ...credentials, webhookUrl: e.target.value })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 ${info.color} rounded-lg flex items-center justify-center text-2xl`}
            >
              {info.icon}
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {info.name}
                {status?.connected && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
                {status && !status.connected && (
                  <Badge variant="destructive">
                    <XCircle className="w-3 h-3 mr-1" />
                    Disconnected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{info.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status?.connected && status.accountInfo && (
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {status.accountInfo.avatarUrl && (
                <img
                  src={status.accountInfo.avatarUrl}
                  alt={status.accountInfo.displayName}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <p className="font-semibold">{status.accountInfo.displayName}</p>
                <p className="text-sm text-muted-foreground">@{status.accountInfo.username}</p>
              </div>
            </div>
            {status.accountInfo.followerCount !== undefined && (
              <p className="text-sm">
                <strong>Followers:</strong> {status.accountInfo.followerCount.toLocaleString()}
              </p>
            )}
            {status.accountInfo.profileUrl && (
              <a
                href={status.accountInfo.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View Profile <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {!status?.connected && renderCredentialInputs()}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!status?.connected ? (
          <Button onClick={handleConnect} disabled={loading} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Connect
          </Button>
        ) : (
          <>
            <Button onClick={handleTest} disabled={testing} variant="outline" className="flex-1">
              {testing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Test Connection
            </Button>
            <Button onClick={handleDisconnect} variant="destructive" className="flex-1">
              Disconnect
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
