/**
 * Studio Header with profile selector
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Crown, Plus, Sparkles, User } from 'lucide-react';
import type { AvatarProfile } from './types';

interface StudioHeaderProps {
  profiles: AvatarProfile[];
  activeProfileId: string;
  ownerPortraitCount: number;
  onSwitchProfile: (profileId: string) => void;
  onCreateProfile: (name: string) => void;
}

export function StudioHeader({
  profiles,
  activeProfileId,
  ownerPortraitCount,
  onSwitchProfile,
  onCreateProfile,
}: StudioHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Crown className="h-8 w-8 text-yellow-500" />
          SABO AI Avatar Studio
        </h1>
        <p className="text-muted-foreground mt-1">
          AI-powered brand ambassador for SABO Arena marketing
        </p>
      </div>
      <div className="flex items-center gap-3">
        {/* Profile Selector */}
        <div className="flex items-center gap-2">
          <Select value={activeProfileId} onValueChange={onSwitchProfile}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Chọn profile" />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {p.name || 'Unnamed'}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="outline"
            onClick={() => onCreateProfile('Avatar ' + (profiles.length + 1))}
            title="Tạo profile mới"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Badge variant="outline" className="text-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by Gemini + Veo3
        </Badge>
        <Badge variant="secondary" className="text-sm">
          {ownerPortraitCount} portraits loaded
        </Badge>
      </div>
    </div>
  );
}
