/**
 * ContentCalendarWidget - Mini calendar for marketing content planning
 * Shows upcoming scheduled posts and allows quick planning
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { cn } from '@/lib/utils';

interface ScheduledContent {
  id: string;
  date: string;
  time: string;
  platform: string;
  type: 'post' | 'story' | 'reel' | 'video';
  title: string;
  status: 'scheduled' | 'posted' | 'failed' | 'draft';
}

interface ContentCalendarWidgetProps {
  projectSlug: string;
  scheduledContent?: ScheduledContent[];
  onAddContent?: (date: string) => void;
}

const PLATFORM_CONFIG: Record<string, { icon: any; color: string }> = {
  facebook: { icon: FaFacebook, color: '#1877f2' },
  instagram: { icon: FaInstagram, color: '#e4405f' },
  tiktok: { icon: FaTiktok, color: '#000000' },
  linkedin: { icon: FaLinkedin, color: '#0a66c2' },
  youtube: { icon: FaYoutube, color: '#ff0000' },
};

const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VN = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

export function ContentCalendarWidget({ 
  projectSlug, 
  scheduledContent = [],
  onAddContent 
}: ContentCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startPadding = firstDay.getDay();
    const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startPadding - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(currentYear, currentMonth - 1, day);
      days.push({
        date: date.toISOString().split('T')[0],
        day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date().toISOString().split('T')[0];
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday: dateStr === today,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date: date.toISOString().split('T')[0],
        day,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Group content by date
  const contentByDate = useMemo(() => {
    const grouped: Record<string, ScheduledContent[]> = {};
    scheduledContent.forEach(content => {
      if (!grouped[content.date]) {
        grouped[content.date] = [];
      }
      grouped[content.date].push(content);
    });
    return grouped;
  }, [scheduledContent]);

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const selectedDateContent = selectedDate ? contentByDate[selectedDate] || [] : [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Content Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[100px] text-center">
              {MONTHS_VN[currentMonth]} {currentYear}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {DAYS_VN.map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((dayInfo, idx) => {
            const hasContent = contentByDate[dayInfo.date]?.length > 0;
            const contentCount = contentByDate[dayInfo.date]?.length || 0;
            
            return (
              <button
                key={idx}
                className={cn(
                  "aspect-square rounded-md text-sm flex flex-col items-center justify-center relative transition-colors",
                  dayInfo.isCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                  dayInfo.isToday && "bg-primary/10 font-bold",
                  selectedDate === dayInfo.date && "ring-2 ring-primary",
                  hasContent && "bg-blue-500/10",
                  "hover:bg-muted"
                )}
                onClick={() => setSelectedDate(dayInfo.date)}
              >
                {dayInfo.day}
                {hasContent && (
                  <div className="absolute bottom-0.5 flex gap-0.5">
                    {contentByDate[dayInfo.date].slice(0, 3).map((content, i) => {
                      const platform = PLATFORM_CONFIG[content.platform];
                      return (
                        <div 
                          key={i}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: platform?.color || '#888' }}
                        />
                      );
                    })}
                    {contentCount > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{contentCount - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Date Content */}
        {selectedDate && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">
                {new Date(selectedDate).toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h4>
              {onAddContent && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 gap-1"
                  onClick={() => onAddContent(selectedDate)}
                >
                  <Plus className="h-3 w-3" /> Thêm
                </Button>
              )}
            </div>
            
            {selectedDateContent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Chưa có nội dung nào được lên lịch
              </p>
            ) : (
              <ScrollArea className="h-[150px]">
                <div className="space-y-2">
                  {selectedDateContent.map(content => {
                    const platform = PLATFORM_CONFIG[content.platform];
                    const Icon = platform?.icon || Calendar;
                    
                    return (
                      <div 
                        key={content.id}
                        className="flex items-center gap-2 p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${platform?.color}20` }}
                        >
                          <Icon className="h-4 w-4" style={{ color: platform?.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{content.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{content.time}</span>
                            <Badge variant="outline" className="text-[10px] px-1 py-0">
                              {content.type}
                            </Badge>
                          </div>
                        </div>
                        {content.status === 'posted' && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {content.status === 'failed' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-[#1877f2]" /> Facebook
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-[#e4405f]" /> Instagram
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-black" /> TikTok
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ContentCalendarWidget;
