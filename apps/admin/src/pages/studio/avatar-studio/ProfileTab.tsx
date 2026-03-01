/**
 * Profile Tab - Avatar identity and performance stats
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  User,
  Video,
  Image as ImageIcon,
  TrendingUp,
  CheckCircle,
  Loader2,
  AlertCircle,
  Brain,
  Trash2,
} from 'lucide-react';
import type { AvatarProfile, GeneratedContent } from './types';
import { CONTENT_TEMPLATES } from './constants';

interface ProfileTabProps {
  profile: AvatarProfile;
  profiles: AvatarProfile[];
  activeProfileId: string;
  ownerPortraitCount: number;
  generatedContent: GeneratedContent[];
  onUpdateProfile: (updates: Partial<AvatarProfile>) => void;
  onSaveProfiles: () => void;
  onDeleteProfile: (profileId: string) => void;
  onShowCharacterPicker: () => void;
}

export function ProfileTab({
  profile,
  profiles,
  activeProfileId,
  ownerPortraitCount,
  generatedContent,
  onUpdateProfile,
  onSaveProfiles,
  onDeleteProfile,
  onShowCharacterPicker,
}: ProfileTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Avatar Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Avatar Identity
          </CardTitle>
          <CardDescription>
            Define who your AI avatar represents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => onUpdateProfile({ name: e.target.value })}
              placeholder="Long Sang"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input
              value={profile.role}
              onChange={(e) => onUpdateProfile({ role: e.target.value })}
              placeholder="Founder & CEO"
            />
          </div>
          <div className="space-y-2">
            <Label>Brand</Label>
            <Input
              value={profile.brand}
              onChange={(e) => onUpdateProfile({ brand: e.target.value })}
              placeholder="SABO Arena"
            />
          </div>
          <div className="space-y-2">
            <Label>Personality</Label>
            <Textarea
              value={profile.personality}
              onChange={(e) => onUpdateProfile({ personality: e.target.value })}
              placeholder="Describe the avatar's personality..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Speaking Style</Label>
            <Textarea
              value={profile.speakingStyle}
              onChange={(e) => onUpdateProfile({ speakingStyle: e.target.value })}
              placeholder="How does the avatar speak?"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={onSaveProfiles} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              onClick={onShowCharacterPicker}
              className="flex-1"
            >
              <Brain className="h-4 w-4 mr-2" />
              Từ Brain
            </Button>
            {profiles.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteProfile(activeProfileId)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Xóa profile này"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Avatar Performance
          </CardTitle>
          <CardDescription>
            Content generation statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{ownerPortraitCount}</div>
              <div className="text-sm text-muted-foreground">Portraits</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {generatedContent.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-muted-foreground">Generated</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {generatedContent.filter(c => c.type === 'video').length}
              </div>
              <div className="text-sm text-muted-foreground">Videos</div>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">
                {CONTENT_TEMPLATES.length}
              </div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6">
            <h4 className="font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2">
              {generatedContent.slice(0, 5).map(content => (
                <div key={content.id} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded">
                  {content.type === 'video' ? (
                    <Video className="h-4 w-4 text-blue-500" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-green-500" />
                  )}
                  <span className="truncate flex-1">{content.prompt.slice(0, 40)}...</span>
                  {content.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {content.status === 'generating' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {content.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                </div>
              ))}
              {generatedContent.length === 0 && (
                <p className="text-muted-foreground text-sm">No content generated yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
