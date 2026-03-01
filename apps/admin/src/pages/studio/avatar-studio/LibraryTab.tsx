/**
 * Library Tab - Generated content gallery
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Video,
  Image as ImageIcon,
  Wand2,
  Download,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { GeneratedContent } from './types';
import { PLATFORM_CONFIGS } from './constants';

interface LibraryTabProps {
  generatedContent: GeneratedContent[];
}

export function LibraryTab({ generatedContent }: LibraryTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Generated Content Library
        </CardTitle>
        <CardDescription>
          All AI-generated avatar content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {generatedContent.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedContent.map(content => {
              const renderMedia = () => {
                if (content.type === 'video') {
                  return (
                    <video
                      src={content.outputUrl}
                      className="w-full h-full object-cover"
                      controls
                    >
                      <track kind="captions" />
                    </video>
                  );
                }
                return (
                  <img
                    src={content.outputUrl}
                    alt="Generated"
                    className="w-full h-full object-cover"
                  />
                );
              };

              return (
                <Card key={content.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted relative">
                    {content.status === 'completed' && content.outputUrl ? (
                      renderMedia()
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {content.status === 'generating' && (
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        )}
                        {content.status === 'failed' && (
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        )}
                        {content.status === 'pending' && (
                          <Clock className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                    )}

                    {/* Type badge */}
                    <Badge
                      className="absolute top-2 left-2"
                      variant={content.type === 'video' ? 'default' : 'secondary'}
                    >
                      {content.type === 'video' ? <Video className="h-3 w-3 mr-1" /> : <ImageIcon className="h-3 w-3 mr-1" />}
                      {content.type}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground truncate">
                      {content.prompt}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs">
                        {PLATFORM_CONFIGS[content.platform as keyof typeof PLATFORM_CONFIGS]?.icon} {content.platform}
                      </span>
                      {content.status === 'completed' && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No content generated yet</h3>
            <p className="text-muted-foreground text-sm">
              Go to Generate tab to create your first avatar content
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
