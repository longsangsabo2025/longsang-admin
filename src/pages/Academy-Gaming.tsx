/**
 * AI Academy - Professional Learning Platform
 * Connected to Supabase backend
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCourses, useUserEnrollments } from '@/hooks/useAcademy';
import {
  GraduationCap,
  Search,
  Star,
  Clock,
  Users,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  TrendingUp,
  Award,
  Zap,
  Code,
  Brain,
  Sparkles,
  ChevronRight,
  Filter,
  AlertCircle,
} from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [selectedTab, setSelectedTab] = useState('all');

  // Fetch courses from Supabase
  const {
    data: coursesData,
    isLoading,
    error,
  } = useCourses(
    {
      category: selectedCategory !== 'Tất cả' ? selectedCategory : undefined,
      is_free: selectedTab === 'free' ? true : undefined,
      search: searchQuery || undefined,
    },
    { page: 1, limit: 12, sort_by: 'students', sort_order: 'desc' }
  );

  // Fetch user enrollments for "My Courses" tab
  const { data: enrollments } = useUserEnrollments();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#111827] to-[#1E293B] pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96 bg-gray-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1E] via-[#111827] to-[#1E293B] pt-20">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Không thể tải khóa học. Vui lòng thử lại sau.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Determine which courses to display
  const displayedCourses =
    selectedTab === 'my-courses'
      ? enrollments?.map((e) => ({
          ...e.course,
          progress: e.progress_percentage,
        })) || []
      : coursesData?.data || [];

  const categories = [
    { name: 'Tất cả', icon: BookOpen, count: coursesData?.total || 0 },
    { name: 'AI Agents', icon: Brain, count: 12 },
    { name: 'AI Infrastructure', icon: Code, count: 8 },
    { name: 'Chat Interfaces', icon: Sparkles, count: 6 },
    { name: 'Multimodal AI', icon: Zap, count: 4 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <GraduationCap className="h-5 w-5" />
              <span className="text-sm font-medium">AI Academy - Learn from the best</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              Nền tảng đào tạo AI & Automation
              <br />
              <span className="text-yellow-300">hàng đầu Việt Nam</span>
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Học từ các chuyên gia, xây dựng AI agents thực tế, và trở thành AI Engineer chuyên
              nghiệp
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm khóa học: MCP, RAG, LangGraph, Streaming..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-6 text-lg bg-white text-foreground"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mt-12 max-w-2xl mx-auto">
              <div>
                <div className="text-4xl font-bold">20+</div>
                <div className="text-white/80">Khóa học</div>
              </div>
              <div>
                <div className="text-4xl font-bold">15K+</div>
                <div className="text-white/80">Học viên</div>
              </div>
              <div>
                <div className="text-4xl font-bold">4.8★</div>
                <div className="text-white/80">Đánh giá</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* Categories */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Danh mục</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? 'default' : 'outline'}
                  className="whitespace-nowrap"
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {category.name}
                  <Badge variant="secondary" className="ml-2">
                    {category.count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="all">Tất cả khóa học</TabsTrigger>
            <TabsTrigger value="my-courses">Khóa học của tôi</TabsTrigger>
            <TabsTrigger value="free">Miễn phí</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-8">
            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedCourses.map((course) => (
                <Card
                  key={course.id}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/academy/course/${course.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    <img
                      src={
                        course.thumbnail_url ||
                        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800'
                      }
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {course.is_free && (
                      <Badge className="absolute top-2 left-2 bg-green-500">MIỄN PHÍ</Badge>
                    )}
                    {course.progress !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
                        <div
                          className="h-full bg-primary transition-all w-[var(--progress)]"
                          style={{ '--progress': `${course.progress}%` } as React.CSSProperties}
                        />
                      </div>
                    )}
                    <Button
                      size="icon"
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <PlayCircle className="h-6 w-6" />
                    </Button>
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{course.level}</Badge>
                      <Badge variant="secondary">{course.category}</Badge>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {course.subtitle || course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {course.duration_hours}h
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {course.total_lessons} bài
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">
                          {course.average_rating?.toFixed(1) || '5.0'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {course.total_students?.toLocaleString() || 0} học viên
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      {course.is_free ? (
                        <span className="text-2xl font-bold text-green-600">Miễn phí</span>
                      ) : (
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {course.price?.toLocaleString() || 0}đ
                          </div>
                          {course.original_price && course.original_price > course.price && (
                            <div className="text-xs text-muted-foreground line-through">
                              {course.original_price.toLocaleString()}đ
                            </div>
                          )}
                        </div>
                      )}
                      <Button size="sm" className="group/btn">
                        {course.progress ? (
                          <>
                            Tiếp tục
                            <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          <>
                            Đăng ký
                            <ChevronRight className="h-4 w-4 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Progress */}
                    {course.progress !== undefined && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Tiến độ</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        {course.progress === 100 && (
                          <div className="flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Hoàn thành
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {displayedCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Không tìm thấy khóa học</h3>
                <p className="text-muted-foreground">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Chứng chỉ chuyên nghiệp</CardTitle>
              <CardDescription>
                Nhận chứng chỉ sau khi hoàn thành khóa học, được công nhận bởi các doanh nghiệp
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Học theo tiến độ</CardTitle>
              <CardDescription>
                Học mọi lúc mọi nơi, tracking tiến độ real-time, và nhận feedback từ instructors
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Cộng đồng AI</CardTitle>
              <CardDescription>
                Tham gia cộng đồng 15K+ AI enthusiasts, share projects và networking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
