/**
 * Academy - My Learning Page
 * Shows user's enrolled courses, progress, and completed courses
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserEnrollments, useUserStats } from '@/hooks/useAcademy';
import { useGamification } from '@/hooks/useGamification';
import { GamingSidebar } from '@/components/academy/gaming/GamingSidebar';
import { GamingRightSidebar } from '@/components/academy/gaming/GamingRightSidebar';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Play,
  Star,
  Trophy,
  Target,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function AcademyMyLearning() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'in-progress';
  const [selectedTab, setSelectedTab] = useState(initialTab);

  const { data: enrollmentsData, isLoading: loadingEnrollments } = useUserEnrollments();
  const { data: statsData, isLoading: loadingStats } = useUserStats();
  const { xpSummary } = useGamification();

  const enrollments = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.data || [];

  const stats = statsData || {
    total_enrollments: 0,
    completed_courses: 0,
    total_watch_time: 0,
    certificates_earned: 0,
  };

  // Filter enrollments by status
  const inProgressCourses = enrollments.filter((e) => !e.completed_at && e.progress > 0);
  const notStartedCourses = enrollments.filter(
    (e) => !e.completed_at && (!e.progress || e.progress === 0)
  );
  const completedCourses = enrollments.filter((e) => e.completed_at);

  const formatWatchTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-background">
      <GamingSidebar />

      <main className="ml-0 xl:ml-[280px] mr-0 xl:mr-[300px] pt-[70px] px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gaming-gradient mb-2">📚 My Learning Journey</h1>
          <p className="text-muted-foreground">Track your progress and continue learning</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card border-gaming-purple/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-purple/20">
                <BookOpen className="h-6 w-6 text-gaming-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total_enrollments}</p>
                <p className="text-sm text-muted-foreground">Enrolled Courses</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-gaming-cyan/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-cyan/20">
                <Target className="h-6 w-6 text-gaming-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{inProgressCourses.length}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-gaming-green/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-green/20">
                <CheckCircle className="h-6 w-6 text-gaming-green" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed_courses}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-gaming-orange/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-orange/20">
                <Clock className="h-6 w-6 text-gaming-orange" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatWatchTime(stats.total_watch_time)}</p>
                <p className="text-sm text-muted-foreground">Watch Time</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="glass-card mb-6">
            <TabsTrigger value="in-progress" className="gap-2">
              <Play className="h-4 w-4" />
              In Progress ({inProgressCourses.length})
            </TabsTrigger>
            <TabsTrigger value="not-started" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Not Started ({notStartedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Completed ({completedCourses.length})
            </TabsTrigger>
          </TabsList>

          {loadingEnrollments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-4">
                    <Skeleton className="h-40 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="in-progress">
                {inProgressCourses.length === 0 ? (
                  <EmptyState
                    icon={Play}
                    title="No courses in progress"
                    description="Start a course to begin your learning journey"
                    actionLabel="Browse Courses"
                    actionHref="/academy"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inProgressCourses.map((enrollment) => (
                      <CourseCard key={enrollment.id} enrollment={enrollment} showProgress />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="not-started">
                {notStartedCourses.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="All courses started!"
                    description="Great job! You've started all your enrolled courses"
                    actionLabel="Enroll in More"
                    actionHref="/academy"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notStartedCourses.map((enrollment) => (
                      <CourseCard key={enrollment.id} enrollment={enrollment} />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed">
                {completedCourses.length === 0 ? (
                  <EmptyState
                    icon={Trophy}
                    title="No completed courses yet"
                    description="Keep learning to complete your first course!"
                    actionLabel="Continue Learning"
                    actionHref="/academy/my-learning?tab=in-progress"
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completedCourses.map((enrollment) => (
                      <CourseCard key={enrollment.id} enrollment={enrollment} isCompleted />
                    ))}
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <GamingRightSidebar />
    </div>
  );
}

// Course Card Component
function CourseCard({
  enrollment,
  showProgress,
  isCompleted,
}: {
  enrollment: any;
  showProgress?: boolean;
  isCompleted?: boolean;
}) {
  const course = enrollment.course || {};
  const progress = enrollment.progress || 0;

  return (
    <Card className="glass-card hover:border-gaming-cyan/50 transition-all group">
      <CardContent className="p-0">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden rounded-t-lg">
          <img
            src={
              course.thumbnail_url ||
              'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80'
            }
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isCompleted && (
            <div className="absolute inset-0 bg-gaming-green/20 flex items-center justify-center">
              <CheckCircle className="h-16 w-16 text-gaming-green" />
            </div>
          )}
          {showProgress && (
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-white mt-1">{progress}% complete</p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-gaming-cyan transition-colors">
            {course.title || 'Untitled Course'}
          </h3>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            {course.instructor && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500" />
                {typeof course.instructor === 'object' ? course.instructor.name : course.instructor}
              </span>
            )}
            {course.duration_hours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {course.duration_hours}h
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            {isCompleted ? (
              <>
                <Badge
                  variant="outline"
                  className="bg-gaming-green/10 text-gaming-green border-gaming-green/30"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
                <Link to={`/academy/my-learning/certificates`}>
                  <Button size="sm" variant="ghost" className="gap-2">
                    View Certificate
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Badge
                  variant="outline"
                  className="bg-gaming-purple/10 text-gaming-purple border-gaming-purple/30"
                >
                  {progress > 0 ? `${progress}%` : 'New'}
                </Badge>
                <Link to={`/academy/course/${course.id}`}>
                  <Button size="sm" className="gap-2 bg-gaming-purple hover:bg-gaming-purple/80">
                    {progress > 0 ? 'Continue' : 'Start Learning'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: any;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="glass-card p-12 text-center">
      <Icon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Link to={actionHref}>
        <Button className="gap-2 bg-gaming-purple hover:bg-gaming-purple/80">
          {actionLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </Card>
  );
}
