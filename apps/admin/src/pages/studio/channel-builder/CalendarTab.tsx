/**
 * Calendar Tab - Content scheduling calendar view
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, Plus, Settings } from 'lucide-react';
import { PLATFORM_CONFIG, type ContentIdea } from './types';

interface CalendarTabProps {
  ideas: ContentIdea[];
}

export function CalendarTab({ ideas }: CalendarTabProps) {
  const scheduledIdeas = ideas.filter(i => i.status === 'scheduled');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Lịch đăng nội dung</h2>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Cài đặt lịch
        </Button>
      </div>

      {/* Simple Calendar View */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-semibold mb-2">Content Calendar</h3>
            <p className="text-sm mb-4">
              Xem và quản lý lịch đăng nội dung tự động
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Tạo lịch đăng đầu tiên
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Bài đăng sắp tới</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduledIdeas.map(idea => (
              <div key={idea.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Clock className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">{idea.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {idea.scheduledAt?.toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {idea.platform.map(p => {
                    const config = PLATFORM_CONFIG[p as keyof typeof PLATFORM_CONFIG];
                    if (!config) return null;
                    return <span key={p} className="text-lg">{config.emoji}</span>;
                  })}
                </div>
              </div>
            ))}
            {scheduledIdeas.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Chưa có bài đăng nào được lên lịch
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
