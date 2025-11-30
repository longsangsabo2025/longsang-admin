import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Cloud, 
  Mail, 
  MessageSquare, 
  CreditCard, 
  Brain, 
  Database,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: 'storage' | 'email' | 'messaging' | 'payment' | 'ai' | 'database';
  description: string;
  authType: 'oauth' | 'api_key' | 'credentials';
  connected: boolean;
  features: string[];
}

const platforms: PlatformConfig[] = [
  // Cloud Storage
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: <Cloud className="h-8 w-8 text-blue-500" />,
    category: 'storage',
    description: 'Cloud file storage and collaboration',
    authType: 'oauth',
    connected: true,
    features: ['File Storage', 'Document Management', 'Sharing'],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: <Cloud className="h-8 w-8 text-blue-600" />,
    category: 'storage',
    description: 'Cloud file hosting and synchronization',
    authType: 'oauth',
    connected: false,
    features: ['File Sync', '2TB Storage', 'Team Folders'],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: <Cloud className="h-8 w-8 text-blue-700" />,
    category: 'storage',
    description: 'Microsoft cloud storage service',
    authType: 'oauth',
    connected: false,
    features: ['Office Integration', 'File Versioning', 'Sharing'],
  },

  // Email Services
  {
    id: 'sendgrid',
    name: 'SendGrid',
    icon: <Mail className="h-8 w-8 text-blue-500" />,
    category: 'email',
    description: 'Email delivery platform',
    authType: 'api_key',
    connected: false,
    features: ['Transactional Emails', 'Marketing Campaigns', 'Analytics'],
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    icon: <Mail className="h-8 w-8 text-red-500" />,
    category: 'email',
    description: 'Email service for developers',
    authType: 'api_key',
    connected: false,
    features: ['Email API', 'Email Validation', 'Deliverability'],
  },

  // Messaging
  {
    id: 'slack',
    name: 'Slack',
    icon: <MessageSquare className="h-8 w-8 text-purple-500" />,
    category: 'messaging',
    description: 'Team communication platform',
    authType: 'oauth',
    connected: false,
    features: ['Webhooks', 'Bot Integration', 'Channels'],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: <MessageSquare className="h-8 w-8 text-indigo-500" />,
    category: 'messaging',
    description: 'Voice, video, and text communication',
    authType: 'oauth',
    connected: false,
    features: ['Webhooks', 'Bots', 'Voice Channels'],
  },

  // Payment
  {
    id: 'stripe',
    name: 'Stripe',
    icon: <CreditCard className="h-8 w-8 text-purple-600" />,
    category: 'payment',
    description: 'Payment processing platform',
    authType: 'api_key',
    connected: true,
    features: ['Payments', 'Subscriptions', 'Invoices'],
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: <CreditCard className="h-8 w-8 text-blue-600" />,
    category: 'payment',
    description: 'Online payment system',
    authType: 'oauth',
    connected: false,
    features: ['Payments', 'Checkout', 'Recurring Billing'],
  },

  // AI Services
  {
    id: 'openai',
    name: 'OpenAI',
    icon: <Brain className="h-8 w-8 text-green-500" />,
    category: 'ai',
    description: 'GPT-4 and AI models',
    authType: 'api_key',
    connected: true,
    features: ['GPT-4', 'DALL-E', 'Embeddings'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: <Brain className="h-8 w-8 text-orange-500" />,
    category: 'ai',
    description: 'Claude AI assistant',
    authType: 'api_key',
    connected: false,
    features: ['Claude', 'Long Context', 'Safe AI'],
  },

  // Database
  {
    id: 'airtable',
    name: 'Airtable',
    icon: <Database className="h-8 w-8 text-yellow-500" />,
    category: 'database',
    description: 'Spreadsheet-database hybrid',
    authType: 'api_key',
    connected: false,
    features: ['Tables', 'Forms', 'Automations'],
  },
];

export default function PlatformIntegrations() {
  const { toast } = useToast();

  const handleConnect = (platform: PlatformConfig) => {
    if (platform.connected) {
      toast({
        title: "Already connected",
        description: `${platform.name} is already connected to your account.`,
      });
      return;
    }

    if (platform.authType === 'oauth') {
      toast({
        title: "OAuth Flow",
        description: `Opening ${platform.name} authorization window...`,
      });
      // TODO: Implement OAuth flow
      setTimeout(() => {
        toast({
          title: "Connected!",
          description: `${platform.name} has been connected successfully.`,
        });
      }, 2000);
    } else {
      toast({
        title: "API Key Required",
        description: `Please add your ${platform.name} API key in credential manager.`,
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'storage': return <Cloud className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'messaging': return <MessageSquare className="h-5 w-5" />;
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'ai': return <Brain className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      default: return null;
    }
  };

  const categories = Array.from(new Set(platforms.map(p => p.category)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Platform Integrations</h1>
        <p className="text-muted-foreground">
          Connect your favorite platforms to unlock powerful automations
        </p>
      </div>

      {categories.map((category) => {
        const categoryPlatforms = platforms.filter(p => p.category === category);
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

        return (
          <div key={category}>
            <div className="flex items-center gap-2 mb-4">
              {getCategoryIcon(category)}
              <h2 className="text-2xl font-semibold">{categoryName}</h2>
              <Badge variant="secondary">{categoryPlatforms.length}</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryPlatforms.map((platform) => (
                <Card key={platform.id} className={platform.connected ? 'border-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {platform.icon}
                        <div>
                          <CardTitle className="text-lg">{platform.name}</CardTitle>
                          <CardDescription className="text-sm">
                            {platform.description}
                          </CardDescription>
                        </div>
                      </div>
                      {platform.connected && (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Features:</p>
                      <div className="flex flex-wrap gap-1">
                        {platform.features.map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConnect(platform)}
                        className="flex-1"
                        variant={platform.connected ? 'outline' : 'default'}
                      >
                        {platform.connected ? 'Manage' : 'Connect'}
                      </Button>
                      {platform.authType === 'api_key' && !platform.connected && (
                        <Button variant="ghost" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Auth: {platform.authType === 'oauth' ? 'OAuth 2.0' : 'API Key'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
