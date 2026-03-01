import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Tv } from 'lucide-react';
import { videoFactoryService, type Channel } from '@/services/video-factory.service';
import { CreateChannelDialog } from './CreateChannelDialog';

export const ChannelsTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['video-factory', 'channels'],
    queryFn: () => videoFactoryService.listChannels(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const channels = data?.channels || [];

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Tv className="h-12 w-12 mb-4" />
        <p>No channels configured</p>
        <CreateChannelDialog />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateChannelDialog />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {channels.map((channel: Channel) => (
          <Card key={channel.id} className="hover:border-primary/30 transition-colors">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{channel.name}</CardTitle>
                <Badge variant="outline">{channel.platform}</Badge>
              </div>
              <CardDescription>{channel.niche}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Videos/day:</span>
                  <span className="font-medium">{channel.videos_per_day}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Model:</span>
                  <Badge variant="secondary" className="text-xs">{channel.preferred_model}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Language:</span>
                  <span>{channel.language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
