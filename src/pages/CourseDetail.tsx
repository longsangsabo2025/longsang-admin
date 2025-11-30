/**
 * Course Detail Page
 * Complete learning experience with video player, curriculum, discussions
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Users,
  Star,
  BookOpen,
  Download,
  Share2,
  Heart,
  MessageSquare,
  Award,
  Lock,
  ChevronDown,
  ChevronRight,
  Code,
  FileText,
  Video,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'quiz' | 'code';
  isCompleted: boolean;
  isFree: boolean;
}

interface Section {
  id: string;
  title: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

export default function CourseDetail() {
  const [expandedSections, setExpandedSections] = useState<string[]>(['1']);
  const [currentLesson, setCurrentLesson] = useState<string>('1-1');

  const courseData = {
    id: '1',
    title: 'Xây dựng AI Agent với Model Context Protocol (MCP)',
    subtitle: 'Master modern AI agent development với cutting-edge MCP protocol',
    instructor: {
      name: 'Dr. Nguyễn Văn A',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor',
      title: 'Senior AI Architect',
      students: 50000,
      courses: 12,
      rating: 4.9,
    },
    rating: 4.9,
    reviews: 2847,
    students: 12450,
    lastUpdated: 'Tháng 11/2025',
    duration: '8 giờ',
    level: 'Advanced',
    language: 'Tiếng Việt',
    price: 1990000,
    originalPrice: 2990000,
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200',
    whatYouLearn: [
      'Hiểu sâu về Model Context Protocol và kiến trúc của nó',
      'Xây dựng custom MCP servers với 6+ automation tools',
      'Tích hợp MCP với existing AI workflows (N8N, LangChain)',
      'Implement tool calling và resource management',
      'Best practices cho production deployment',
      'Debugging và monitoring MCP agents',
    ],
    requirements: [
      'Kiến thức cơ bản về TypeScript/JavaScript',
      'Hiểu về REST APIs và async programming',
      'Đã làm việc với OpenAI API hoặc tương tự',
      'Có máy tính với Node.js 18+ installed',
    ],
    features: [
      '24 video lectures với HD quality',
      '12 coding exercises',
      '3 real-world projects',
      'Certificate of completion',
      'Lifetime access',
      'Q&A support',
    ],
  };

  const curriculum: Section[] = [
    {
      id: '1',
      title: 'Introduction to Model Context Protocol',
      isExpanded: true,
      lessons: [
        {
          id: '1-1',
          title: 'What is MCP? Architecture Overview',
          duration: '15:30',
          type: 'video',
          isCompleted: true,
          isFree: true,
        },
        {
          id: '1-2',
          title: 'Setting up Development Environment',
          duration: '12:45',
          type: 'video',
          isCompleted: true,
          isFree: true,
        },
        {
          id: '1-3',
          title: 'MCP Protocol Deep Dive',
          duration: '20:15',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '1-4',
          title: 'Quiz: MCP Fundamentals',
          duration: '10 phút',
          type: 'quiz',
          isCompleted: false,
          isFree: false,
        },
      ],
    },
    {
      id: '2',
      title: 'Building Your First MCP Server',
      isExpanded: false,
      lessons: [
        {
          id: '2-1',
          title: 'Server Architecture & Structure',
          duration: '18:20',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '2-2',
          title: 'Implementing Tools',
          duration: '25:10',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '2-3',
          title: 'Resource Management',
          duration: '22:30',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '2-4',
          title: 'Coding Exercise: Create Automation Tool',
          duration: '45 phút',
          type: 'code',
          isCompleted: false,
          isFree: false,
        },
      ],
    },
    {
      id: '3',
      title: 'Advanced Tool Calling',
      isExpanded: false,
      lessons: [
        {
          id: '3-1',
          title: 'Function Schemas & Validation',
          duration: '16:40',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '3-2',
          title: 'Error Handling Strategies',
          duration: '14:25',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '3-3',
          title: 'Real-world Use Cases',
          duration: '28:15',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
      ],
    },
    {
      id: '4',
      title: 'Integration & Deployment',
      isExpanded: false,
      lessons: [
        {
          id: '4-1',
          title: 'Integrating with N8N Workflows',
          duration: '19:50',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '4-2',
          title: 'Production Deployment Best Practices',
          duration: '21:30',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '4-3',
          title: 'Monitoring & Observability',
          duration: '17:45',
          type: 'video',
          isCompleted: false,
          isFree: false,
        },
        {
          id: '4-4',
          title: 'Final Project: Build Complete MCP Server',
          duration: '2 giờ',
          type: 'code',
          isCompleted: false,
          isFree: false,
        },
      ],
    },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      author: 'Trần Minh B',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
      rating: 5,
      date: '2 ngày trước',
      comment:
        'Khóa học xuất sắc! Giảng viên giải thích rất chi tiết và dễ hiểu. Sau khóa học tôi đã build được MCP server cho công ty.',
      helpful: 47,
    },
    {
      id: '2',
      author: 'Lê Thị C',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
      rating: 5,
      date: '1 tuần trước',
      comment:
        'Content rất up-to-date với công nghệ 2025. Các bài tập thực hành rất hay, giúp tôi hiểu sâu về MCP protocol.',
      helpful: 32,
    },
    {
      id: '3',
      author: 'Phạm Văn D',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
      rating: 4,
      date: '2 tuần trước',
      comment:
        'Khóa học tốt, chỉ có điều một số phần nâng cao hơi khó. Nhưng support team rất nhiệt tình.',
      helpful: 18,
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'video':
        return Video;
      case 'article':
        return FileText;
      case 'code':
        return Code;
      case 'quiz':
        return BookOpen;
    }
  };

  const totalLessons = curriculum.reduce((sum, section) => sum + section.lessons.length, 0);
  const completedLessons = curriculum.reduce(
    (sum, section) => sum + section.lessons.filter((l) => l.isCompleted).length,
    0
  );
  const progressPercent = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Video Section */}
      <div className="bg-black">
        <div className="container mx-auto px-4">
          <div className="aspect-video max-w-5xl mx-auto relative bg-muted flex items-center justify-center">
            <img
              src={courseData.thumbnail}
              alt={courseData.title}
              className="w-full h-full object-cover"
            />
            <Button size="lg" className="absolute inset-0 m-auto w-20 h-20 rounded-full">
              <PlayCircle className="h-10 w-10" />
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">{courseData.level}</Badge>
                <Badge variant="outline">Bestseller</Badge>
                <Badge variant="outline">Updated {courseData.lastUpdated}</Badge>
              </div>
              <h1 className="text-4xl font-bold mb-4">{courseData.title}</h1>
              <p className="text-xl text-muted-foreground mb-6">{courseData.subtitle}</p>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{courseData.rating}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({courseData.reviews.toLocaleString()} ratings)
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {courseData.students.toLocaleString()} học viên
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {courseData.duration}
                </div>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-4 mt-6 p-4 bg-muted rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={courseData.instructor.avatar} />
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{courseData.instructor.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {courseData.instructor.title}
                  </div>
                  <div className="flex items-center gap-4 text-sm mt-1">
                    <span>{courseData.instructor.students.toLocaleString()} students</span>
                    <span>{courseData.instructor.courses} courses</span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {courseData.instructor.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="mb-8">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="curriculum">Chương trình</TabsTrigger>
                <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
                <TabsTrigger value="discussion">Thảo luận</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* What You'll Learn */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bạn sẽ học được gì</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courseData.whatYouLearn.map((item, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Requirements */}
                <Card>
                  <CardHeader>
                    <CardTitle>Yêu cầu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {courseData.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <span className="text-muted-foreground">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Features */}
                <Card>
                  <CardHeader>
                    <CardTitle>Khóa học bao gồm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {courseData.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <Award className="h-4 w-4 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Curriculum Tab */}
              <TabsContent value="curriculum" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {curriculum.length} sections • {totalLessons} lectures • {courseData.duration}{' '}
                      total
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Expand all
                  </Button>
                </div>

                {curriculum.map((section) => (
                  <Card key={section.id}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(section.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {expandedSections.includes(section.id) ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                          <div>
                            <CardTitle className="text-lg">{section.title}</CardTitle>
                            <CardDescription>
                              {section.lessons.length} lectures •{' '}
                              {section.lessons.reduce(
                                (sum, l) => sum + parseInt(l.duration),
                                0
                              )}{' '}
                              min
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    {expandedSections.includes(section.id) && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {section.lessons.map((lesson) => {
                            const Icon = getLessonIcon(lesson.type);
                            return (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => setCurrentLesson(lesson.id)}
                              >
                                <div className="flex items-center gap-3">
                                  {lesson.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : lesson.isFree ? (
                                    <Icon className="h-5 w-5 text-primary" />
                                  ) : (
                                    <Lock className="h-5 w-5 text-muted-foreground" />
                                  )}
                                  <div>
                                    <div className="text-sm font-medium">{lesson.title}</div>
                                    {lesson.isFree && (
                                      <Badge variant="outline" className="text-xs mt-1">
                                        Preview
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <Clock className="h-4 w-4" />
                                  {lesson.duration}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                    <div className="flex items-center gap-6 mt-4">
                      <div className="text-center">
                        <div className="text-5xl font-bold">{courseData.rating}</div>
                        <div className="flex items-center gap-1 mt-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-4 w-4 fill-yellow-400 text-yellow-400"
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">Course Rating</div>
                      </div>
                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-3 mb-2">
                            <Progress value={stars === 5 ? 85 : stars === 4 ? 12 : 3} className="flex-1" />
                            <div className="flex items-center gap-1 text-sm w-20">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {stars}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarImage src={review.avatar} />
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-semibold">{review.author}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex items-center gap-1">
                                  {[...Array(review.rating)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {review.date}
                                </span>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm mb-3">{review.comment}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm">
                              <Heart className="h-4 w-4 mr-1" />
                              Helpful ({review.helpful})
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Discussion Tab */}
              <TabsContent value="discussion">
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Join the Discussion</h3>
                    <p className="text-muted-foreground mb-4">
                      Connect with other students, ask questions, and share your progress
                    </p>
                    <Button>Start a Discussion</Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card>
                <CardContent className="pt-6">
                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl font-bold">
                        {courseData.price.toLocaleString()}đ
                      </span>
                      <span className="text-xl text-muted-foreground line-through">
                        {courseData.originalPrice.toLocaleString()}đ
                      </span>
                    </div>
                    <Badge variant="destructive">-33% OFF</Badge>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3 mb-6">
                    <Button className="w-full" size="lg">
                      Đăng ký ngay
                    </Button>
                    <Button variant="outline" className="w-full">
                      Thêm vào giỏ hàng
                    </Button>
                  </div>

                  {/* Progress (if enrolled) */}
                  <div className="border-t pt-6 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tiến độ của bạn</span>
                      <span className="text-sm font-bold">{progressPercent}%</span>
                    </div>
                    <Progress value={progressPercent} className="mb-2" />
                    <div className="text-xs text-muted-foreground">
                      {completedLessons} / {totalLessons} bài học hoàn thành
                    </div>
                  </div>

                  {/* Quick Links */}
                  <div className="space-y-3 border-t pt-6">
                    <Button variant="ghost" className="w-full justify-start">
                      <Share2 className="h-4 w-4 mr-2" />
                      Chia sẻ khóa học
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Heart className="h-4 w-4 mr-2" />
                      Thêm vào yêu thích
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Tải tài liệu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
