/**
 * Academy - Browse by Category Page
 * Shows courses filtered by category
 */

import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCourses, useUserEnrollments } from '@/hooks/useAcademy';
import { GamingSidebar } from '@/components/academy/gaming/GamingSidebar';
import { GamingRightSidebar } from '@/components/academy/gaming/GamingRightSidebar';
import { GamingCourseCard } from '@/components/academy/gaming/GamingCourseCard';
import {
  Search,
  Filter,
  Grid,
  List,
  Cpu,
  Code,
  Palette,
  Database,
  Link,
  Smartphone,
  Rocket,
  Mail,
  GraduationCap,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';

// Category configuration
const CATEGORIES = {
  'ai-machine-learning': {
    label: 'AI & Machine Learning',
    icon: Cpu,
    emoji: '🔥',
    description: 'Master AI agents, deep learning, and machine learning fundamentals',
  },
  'web-development': {
    label: 'Web Development',
    icon: Code,
    emoji: '📈',
    description: 'Build modern web applications with React, Next.js, and more',
  },
  'ui-ux-design': {
    label: 'UI/UX Design',
    icon: Palette,
    emoji: '⚡',
    description: 'Create beautiful and user-friendly interfaces',
  },
  'data-science': {
    label: 'Data Science',
    icon: Database,
    emoji: '🆕',
    description: 'Analyze data and build predictive models',
  },
  'blockchain-web3': {
    label: 'Blockchain & Web3',
    icon: Link,
    emoji: '💎',
    description: 'Build decentralized applications and smart contracts',
  },
  'mobile-development': {
    label: 'Mobile Development',
    icon: Smartphone,
    emoji: '✨',
    description: 'Create iOS and Android apps with React Native and Flutter',
  },
  'game-development': {
    label: 'Game Development',
    icon: Rocket,
    emoji: '🎯',
    description: 'Build games with Unity, Unreal, and Godot',
  },
  'digital-marketing': {
    label: 'Digital Marketing',
    icon: Mail,
    emoji: '💼',
    description: 'Master SEO, social media, and paid advertising',
  },
};

// Map URL slug to Supabase category name
const CATEGORY_MAP: Record<string, string> = {
  'ai-machine-learning': 'AI & Machine Learning',
  'web-development': 'Web Development',
  'ui-ux-design': 'UI/UX Design',
  'data-science': 'Data Science',
  'blockchain-web3': 'Blockchain & Web3',
  'mobile-development': 'Mobile Development',
  'game-development': 'Game Development',
  'digital-marketing': 'Digital Marketing',
};

export default function AcademyCategory() {
  const { category: categorySlug } = useParams<{ category: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [levelFilter, setLevelFilter] = useState<string | undefined>(
    searchParams.get('level') || undefined
  );

  const categoryName = categorySlug ? CATEGORY_MAP[categorySlug] : undefined;
  const categoryConfig = categorySlug ? CATEGORIES[categorySlug as keyof typeof CATEGORIES] : null;

  const {
    data: coursesData,
    isLoading,
    error,
  } = useCourses(
    {
      category: categoryName,
      level: levelFilter,
      search: searchQuery || undefined,
    },
    { page: 1, limit: 20, sort_by: 'students', sort_order: 'desc' }
  );

  const { data: enrollmentsData } = useUserEnrollments();

  const courses = coursesData?.data || [];
  const enrollments = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.data || [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) {
      params.set('q', searchQuery);
    } else {
      params.delete('q');
    }
    setSearchParams(params);
  };

  const CategoryIcon = categoryConfig?.icon || GraduationCap;

  return (
    <div className="min-h-screen bg-background">
      <GamingSidebar />

      <main className="ml-0 xl:ml-[280px] mr-0 xl:mr-[300px] pt-[70px] px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-gaming-purple/20">
              <CategoryIcon className="h-8 w-8 text-gaming-purple" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gaming-gradient">
                {categoryConfig?.emoji} {categoryConfig?.label || 'All Courses'}
              </h1>
              <p className="text-muted-foreground">
                {categoryConfig?.description || 'Browse all available courses'}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <Card className="glass-card p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 glass-card border-gaming-cyan/30 focus:border-gaming-cyan"
              />
            </form>

            <div className="flex gap-2">
              {/* Level Filter */}
              <select
                value={levelFilter || ''}
                onChange={(e) => setLevelFilter(e.target.value || undefined)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-gaming-purple' : ''}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-gaming-purple' : ''}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {isLoading ? 'Loading...' : `${courses.length} courses found`}
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">{levelFilter || 'All Levels'}</Badge>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load courses. Please try again later.</AlertDescription>
          </Alert>
        )}

        {/* Courses Grid/List */}
        {isLoading ? (
          <div
            className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="glass-card">
                <Skeleton className="aspect-video" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? `No results for "${searchQuery}"`
                : 'No courses available in this category yet'}
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setLevelFilter(undefined);
              }}
              className="bg-gaming-purple hover:bg-gaming-purple/80"
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div
            className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
          >
            {courses.map((course, index) => {
              const isEnrolled = enrollments.some((e) => e.course_id === course.id);
              const enrollment = enrollments.find((e) => e.course_id === course.id);
              const progress = enrollment?.progress || 0;

              return (
                <div
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <GamingCourseCard
                    image={
                      course.thumbnail_url ||
                      'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=600&q=80'
                    }
                    title={course.title}
                    instructor={
                      typeof course.instructor === 'object'
                        ? course.instructor?.name
                        : course.instructor || 'AINewbieVN'
                    }
                    rating={course.rating || 4.5}
                    reviews={course.reviews_count || 0}
                    students={`${Math.floor((course.students_count || 0) / 1000)}K`}
                    duration={`${course.duration_hours || 0}h`}
                    price={course.price || 99}
                    enrolled={isEnrolled}
                    progress={progress}
                    badge={
                      course.students_count && course.students_count > 10000
                        ? { text: 'Bestseller', variant: 'bestseller' }
                        : course.is_new
                          ? { text: 'New', variant: 'new' }
                          : undefined
                    }
                    level={course.level || 'Intermediate'}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <GamingRightSidebar />
    </div>
  );
}
