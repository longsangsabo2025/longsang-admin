/**
 * Portraits Tab - Owner portrait management and tips
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Camera,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Brain,
} from 'lucide-react';
import type { OwnerPortrait } from './types';

interface PortraitsTabProps {
  ownerPortraits: OwnerPortrait[];
  selectedPortraits: string[];
  onTogglePortrait: (portraitId: string) => void;
  onShowBrainLibrary: () => void;
  onRefresh: () => void;
}

export function PortraitsTab({
  ownerPortraits,
  selectedPortraits,
  onTogglePortrait,
  onShowBrainLibrary,
  onRefresh,
}: PortraitsTabProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Owner Portraits
          </CardTitle>
          <CardDescription>
            Reference photos for AI avatar generation. Upload high-quality photos from different angles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ownerPortraits.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {ownerPortraits.map(portrait => (
                <button
                  type="button"
                  key={portrait.id}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                    selectedPortraits.includes(portrait.id)
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-primary/50'
                  }`}
                  onClick={() => onTogglePortrait(portrait.id)}
                >
                  <img
                    src={portrait.thumbnailUrl || portrait.imageUrl}
                    alt="Owner portrait"
                    className="w-full h-full object-cover"
                  />
                  {selectedPortraits.includes(portrait.id) && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg">
              <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">No portraits uploaded yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Chọn ảnh từ Brain Image Library để làm portraits cho avatar
              </p>
              <Button onClick={onShowBrainLibrary}>
                <Brain className="h-4 w-4 mr-2" />
                Chọn từ Brain Library
              </Button>
            </div>
          )}

          {ownerPortraits.length > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedPortraits.length} portrait(s) selected for generation
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onShowBrainLibrary}>
                  <Brain className="h-4 w-4 mr-2" />
                  Thêm từ Brain Library
                </Button>
                <Button variant="ghost" onClick={onRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips for good portraits */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Tips for Best Results
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-600 dark:text-blue-400">
          <ul className="space-y-2 text-sm">
            <li>✅ <strong>Multiple angles:</strong> Front, side, and 3/4 views</li>
            <li>✅ <strong>Good lighting:</strong> Well-lit, no harsh shadows</li>
            <li>✅ <strong>Various expressions:</strong> Neutral, smiling, serious, presenting</li>
            <li>✅ <strong>Different outfits:</strong> Casual, professional, sporty</li>
            <li>✅ <strong>High resolution:</strong> At least 512x512 pixels</li>
            <li>❌ Avoid: Sunglasses, hats covering face, blurry images</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
