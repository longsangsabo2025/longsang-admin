/**
 * Continue Learning Component
 * Shows user's in-progress courses with quick access to resume
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, BookOpen, ChevronRight, Flame } from 'lucide-react';
import { useUserEnrollments, useUserStats } from '@/hooks/useAcademy';

export function ContinueLearning() {
  const navigate = useNavigate();
  const { data: enrollmentsData, isLoading } = useUserEnrollments();
  const { data: statsData } = useUserStats();

  const enrollments = enrollmentsData || [];
  const stats = statsData || {
    total_enrollments: 0,
    completed_courses: 0,
    total_watch_time: 0,
    certificates_earned: 0,
  };

  // Filter to in-progress courses (not completed)
  const inProgressCourses = enrollments.filter((e: any) => !e.completed_at && e.course).slice(0, 3); // Show max 3

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (inProgressCourses.length === 0) {
    return null; // Don't show if no courses in progress
  }

  return (
    <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Play className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Tiếp Tục Học</CardTitle>
              <p className="text-sm text-muted-foreground">
                Bạn đang học {inProgressCourses.length} khóa học
              </p>
            </div>
          </div>

          {/* Streak indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-full">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-semibold text-orange-600">
              {stats.total_watch_time > 0 ? Math.floor(stats.total_watch_time / 3600) : 0}h học
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {inProgressCourses.map((enrollment: any) => (
          <div
            key={enrollment.id}
            className="flex items-center gap-4 p-4 bg-background rounded-xl hover:bg-accent/50 transition-colors cursor-pointer group"
            onClick={() => navigate(`/academy/course/${enrollment.course?.id}`)}
          >
            {/* Thumbnail */}
            <div className="relative flex-shrink-0">
              <img
                src={
                  enrollment.course?.thumbnail_url ||
                  'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200'
                }
                alt={enrollment.course?.title}
                className="w-24 h-16 object-cover rounded-lg"
              />
              {/* Play overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <Play className="h-8 w-8 text-white" fill="white" />
              </div>
            </div>

            {/* Course info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {enrollment.course?.level}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {enrollment.course?.category}
                </Badge>
              </div>

              <h3 className="font-semibold text-sm truncate mb-2">{enrollment.course?.title}</h3>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {enrollment.progress?.length || 0} / {enrollment.course?.total_lessons || 0} bài
                  </span>
                  <span>{enrollment.progress_percentage || 0}%</span>
                </div>
                <Progress value={enrollment.progress_percentage || 0} className="h-2" />
              </div>
            </div>

            {/* Continue button */}
            <Button
              size="sm"
              className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Tiếp tục
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* View all link */}
        {enrollments.length > 3 && (
          <div className="text-center pt-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy/my-courses')}>
              Xem tất cả {enrollments.length} khóa học
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
