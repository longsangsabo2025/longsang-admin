import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Video,
  FileText,
  HelpCircle,
  Code,
  ChevronDown,
  ChevronUp,
  Settings,
  BookOpen,
  Users,
  DollarSign,
  Clock,
  Star,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Section {
  id: string;
  title: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content_type: 'video' | 'article' | 'quiz' | 'code' | 'assignment';
  duration_minutes: number;
  is_preview: boolean;
  order_index: number;
}

const CATEGORIES = [
  'AI & Machine Learning',
  'Automation',
  'Web Development',
  'Mobile Development',
  'Cloud & DevOps',
  'Data Science',
  'Blockchain',
  'Business & Marketing',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const CourseBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!courseId;

  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Course form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    category: '',
    level: 'Beginner',
    price: 0,
    is_free: true,
    is_published: false,
    thumbnail_url: '',
    preview_video_url: '',
    duration_hours: 0,
    requirements: [] as string[],
    what_you_learn: [] as string[],
    tags: [] as string[],
  });

  const [sections, setSections] = useState<Section[]>([]);
  const [newRequirement, setNewRequirement] = useState('');
  const [newWhatYouLearn, setNewWhatYouLearn] = useState('');
  const [newTag, setNewTag] = useState('');

  // Fetch course data if editing
  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course-builder', courseId],
    queryFn: async () => {
      if (!courseId) return null;

      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const { data: sectionsData, error: sectionsError } = await supabase
        .from('course_sections')
        .select(
          `
          *,
          lessons:lessons(*)
        `
        )
        .eq('course_id', courseId)
        .order('order_index');

      if (sectionsError) throw sectionsError;

      return { course, sections: sectionsData };
    },
    enabled: isEditing,
  });

  // Fetch instructors
  const { data: instructors } = useQuery({
    queryKey: ['instructors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('instructors').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  // Load course data into form
  useEffect(() => {
    if (courseData?.course) {
      const course = courseData.course;
      setFormData({
        title: course.title || '',
        description: course.description || '',
        short_description: course.short_description || '',
        category: course.category || '',
        level: course.level || 'Beginner',
        price: course.price || 0,
        is_free: course.is_free ?? true,
        is_published: course.is_published ?? false,
        thumbnail_url: course.thumbnail_url || '',
        preview_video_url: course.preview_video_url || '',
        duration_hours: course.duration_hours || 0,
        requirements: course.requirements || [],
        what_you_learn: course.what_you_learn || [],
        tags: course.tags || [],
      });
    }
    if (courseData?.sections) {
      setSections(courseData.sections);
    }
  }, [courseData]);

  // Save course mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const coursePayload = {
        ...formData,
        total_lessons: sections.reduce((sum, s) => sum + s.lessons.length, 0),
        total_sections: sections.length,
        instructor_id: instructors?.[0]?.id, // Default to first instructor
      };

      let savedCourseId = courseId;

      if (isEditing) {
        const { error } = await supabase.from('courses').update(coursePayload).eq('id', courseId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert(coursePayload)
          .select()
          .single();
        if (error) throw error;
        savedCourseId = data.id;
      }

      // Save sections and lessons
      for (const section of sections) {
        const sectionPayload = {
          course_id: savedCourseId,
          title: section.title,
          description: section.description,
          order_index: section.order_index,
        };

        let savedSectionId = section.id;

        if (section.id.startsWith('new-')) {
          const { data, error } = await supabase
            .from('course_sections')
            .insert(sectionPayload)
            .select()
            .single();
          if (error) throw error;
          savedSectionId = data.id;
        } else {
          const { error } = await supabase
            .from('course_sections')
            .update(sectionPayload)
            .eq('id', section.id);
          if (error) throw error;
        }

        // Save lessons
        for (const lesson of section.lessons) {
          const lessonPayload = {
            section_id: savedSectionId,
            title: lesson.title,
            content_type: lesson.content_type,
            duration_minutes: lesson.duration_minutes,
            is_preview: lesson.is_preview,
            order_index: lesson.order_index,
          };

          if (lesson.id.startsWith('new-')) {
            const { error } = await supabase.from('lessons').insert(lessonPayload);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('lessons')
              .update(lessonPayload)
              .eq('id', lesson.id);
            if (error) throw error;
          }
        }
      }

      return savedCourseId;
    },
    onSuccess: (savedCourseId) => {
      toast.success(isEditing ? 'Đã cập nhật khóa học!' : 'Đã tạo khóa học mới!');
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      if (!isEditing) {
        navigate(`/admin/courses/edit/${savedCourseId}`);
      }
    },
    onError: (error) => {
      toast.error('Lỗi: ' + (error as Error).message);
    },
  });

  // Section management
  const addSection = () => {
    const newSection: Section = {
      id: `new-${Date.now()}`,
      title: `Section ${sections.length + 1}`,
      description: '',
      order_index: sections.length,
      lessons: [],
    };
    setSections([...sections, newSection]);
    setExpandedSections([...expandedSections, newSection.id]);
  };

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)));
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  // Lesson management
  const addLesson = (sectionId: string) => {
    const newLesson: Lesson = {
      id: `new-${Date.now()}`,
      title: 'Bài học mới',
      content_type: 'video',
      duration_minutes: 10,
      is_preview: false,
      order_index: sections.find((s) => s.id === sectionId)?.lessons.length || 0,
    };
    setSections(
      sections.map((s) => (s.id === sectionId ? { ...s, lessons: [...s.lessons, newLesson] } : s))
    );
  };

  const updateLesson = (sectionId: string, lessonId: string, updates: Partial<Lesson>) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              lessons: s.lessons.map((l) => (l.id === lessonId ? { ...l, ...updates } : l)),
            }
          : s
      )
    );
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s
      )
    );
  };

  const toggleSectionExpand = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId) ? prev.filter((id) => id !== sectionId) : [...prev, sectionId]
    );
  };

  // Array field helpers
  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData({ ...formData, requirements: [...formData.requirements, newRequirement.trim()] });
      setNewRequirement('');
    }
  };

  const addWhatYouLearn = () => {
    if (newWhatYouLearn.trim()) {
      setFormData({
        ...formData,
        what_you_learn: [...formData.what_you_learn, newWhatYouLearn.trim()],
      });
      setNewWhatYouLearn('');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const getLessonIcon = (type: Lesson['content_type']) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4" />;
      case 'code':
        return <Code className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? '✏️ Chỉnh Sửa Khóa Học' : '➕ Tạo Khóa Học Mới'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? `Đang sửa: ${formData.title}` : 'Điền thông tin để tạo khóa học'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <Button variant="outline" onClick={() => navigate(`/academy/course/${courseId}`)}>
              <Eye className="w-4 h-4 mr-2" />
              Xem trước
            </Button>
          )}
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">📝 Thông Tin Cơ Bản</TabsTrigger>
          <TabsTrigger value="content">📚 Nội Dung</TabsTrigger>
          <TabsTrigger value="pricing">💰 Giá & Publish</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Cài Đặt</TabsTrigger>
        </TabsList>

        {/* Tab 1: Basic Info */}
        <TabsContent value="basic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Khóa Học</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tên khóa học *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="VD: AI Agent Fundamentals với MCP"
                    />
                  </div>

                  <div>
                    <Label htmlFor="short_description">Mô tả ngắn</Label>
                    <Input
                      id="short_description"
                      value={formData.short_description}
                      onChange={(e) =>
                        setFormData({ ...formData, short_description: e.target.value })
                      }
                      placeholder="1-2 câu mô tả khóa học"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả chi tiết</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả đầy đủ về khóa học..."
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Danh mục *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Cấp độ *</Label>
                      <Select
                        value={formData.level}
                        onValueChange={(value) => setFormData({ ...formData, level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Thời lượng (giờ)</Label>
                    <Input
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) =>
                        setFormData({ ...formData, duration_hours: Number(e.target.value) })
                      }
                      min={0}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* What You'll Learn */}
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Bạn Sẽ Học Được</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newWhatYouLearn}
                      onChange={(e) => setNewWhatYouLearn(e.target.value)}
                      placeholder="VD: Hiểu cách hoạt động của AI Agent"
                      onKeyDown={(e) => e.key === 'Enter' && addWhatYouLearn()}
                    />
                    <Button onClick={addWhatYouLearn} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.what_you_learn.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">✓ {item}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              what_you_learn: formData.what_you_learn.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>📋 Yêu Cầu</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      placeholder="VD: Biết cơ bản về Python"
                      onKeyDown={(e) => e.key === 'Enter' && addRequirement()}
                    />
                    <Button onClick={addRequirement} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.requirements.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="flex-1">• {item}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              requirements: formData.requirements.filter((_, i) => i !== index),
                            })
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Media & Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>🖼️ Ảnh Đại Diện</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {formData.thumbnail_url ? (
                    <img
                      src={formData.thumbnail_url}
                      alt="Thumbnail"
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-muted rounded-lg flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <Input
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="URL ảnh đại diện"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎬 Video Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.preview_video_url}
                    onChange={(e) =>
                      setFormData({ ...formData, preview_video_url: e.target.value })
                    }
                    placeholder="URL video giới thiệu"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏷️ Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Thêm tag"
                      onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tags: formData.tags.filter((_, i) => i !== index),
                          });
                        }}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Course Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>📊 Thống Kê</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sections</span>
                    <span className="font-semibold">{sections.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Bài học</span>
                    <span className="font-semibold">
                      {sections.reduce((sum, s) => sum + s.lessons.length, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Thời lượng</span>
                    <span className="font-semibold">{formData.duration_hours}h</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Content - Sections & Lessons */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>📚 Nội Dung Khóa Học</CardTitle>
                <Button onClick={addSection}>
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Section
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sections.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có nội dung</h3>
                  <p className="mb-4">Bắt đầu bằng cách thêm section đầu tiên</p>
                  <Button onClick={addSection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm Section Đầu Tiên
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections.map((section, sectionIndex) => (
                    <Card key={section.id} className="border-2">
                      {/* Section Header */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleSectionExpand(section.id)}
                      >
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Section {sectionIndex + 1}
                        </span>
                        <Input
                          value={section.title}
                          onChange={(e) => {
                            e.stopPropagation();
                            updateSection(section.id, { title: e.target.value });
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 font-semibold"
                          placeholder="Tên section"
                        />
                        <Badge variant="secondary">{section.lessons.length} bài</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSection(section.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        {expandedSections.includes(section.id) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>

                      {/* Section Content */}
                      {expandedSections.includes(section.id) && (
                        <div className="px-4 pb-4 space-y-3">
                          <Textarea
                            value={section.description}
                            onChange={(e) =>
                              updateSection(section.id, { description: e.target.value })
                            }
                            placeholder="Mô tả section (tùy chọn)"
                            rows={2}
                          />

                          {/* Lessons */}
                          <div className="space-y-2 ml-8">
                            {section.lessons.map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                              >
                                <GripVertical className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground w-6">
                                  {lessonIndex + 1}
                                </span>
                                {getLessonIcon(lesson.content_type)}
                                <Input
                                  value={lesson.title}
                                  onChange={(e) =>
                                    updateLesson(section.id, lesson.id, { title: e.target.value })
                                  }
                                  className="flex-1"
                                  placeholder="Tên bài học"
                                />
                                <Select
                                  value={lesson.content_type}
                                  onValueChange={(value: Lesson['content_type']) =>
                                    updateLesson(section.id, lesson.id, { content_type: value })
                                  }
                                >
                                  <SelectTrigger className="w-28">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="article">Bài viết</SelectItem>
                                    <SelectItem value="quiz">Quiz</SelectItem>
                                    <SelectItem value="code">Code</SelectItem>
                                    <SelectItem value="assignment">Bài tập</SelectItem>
                                  </SelectContent>
                                </Select>
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="number"
                                    value={lesson.duration_minutes}
                                    onChange={(e) =>
                                      updateLesson(section.id, lesson.id, {
                                        duration_minutes: Number(e.target.value),
                                      })
                                    }
                                    className="w-16"
                                    min={1}
                                  />
                                  <span className="text-xs text-muted-foreground">phút</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={lesson.is_preview}
                                    onCheckedChange={(checked) =>
                                      updateLesson(section.id, lesson.id, { is_preview: checked })
                                    }
                                  />
                                  <span className="text-xs">Preview</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeLesson(section.id, lesson.id)}
                                >
                                  <Trash2 className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            ))}

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => addLesson(section.id)}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Thêm Bài Học
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Pricing & Publish */}
        <TabsContent value="pricing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>💰 Giá Khóa Học</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-base">Khóa học miễn phí</Label>
                    <p className="text-sm text-muted-foreground">
                      Học viên có thể truy cập miễn phí
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_free}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_free: checked })}
                  />
                </div>

                {!formData.is_free && (
                  <div>
                    <Label>Giá (VNĐ)</Label>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-muted-foreground" />
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: Number(e.target.value) })
                        }
                        min={0}
                        step={10000}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Hiển thị: {formData.price.toLocaleString()}đ
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>🚀 Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label className="text-base">Công khai khóa học</Label>
                    <p className="text-sm text-muted-foreground">
                      Hiển thị trên Academy cho học viên đăng ký
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_published: checked })
                    }
                  />
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <h4 className="font-medium">Trạng thái:</h4>
                  {formData.is_published ? (
                    <Badge className="bg-green-500">✅ Đã publish</Badge>
                  ) : (
                    <Badge variant="secondary">📝 Draft</Badge>
                  )}
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <h4 className="font-medium">Checklist trước khi publish:</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {formData.title ? '✅' : '❌'} Có tên khóa học
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.description ? '✅' : '❌'} Có mô tả
                    </div>
                    <div className="flex items-center gap-2">
                      {formData.thumbnail_url ? '✅' : '❌'} Có ảnh đại diện
                    </div>
                    <div className="flex items-center gap-2">
                      {sections.length > 0 ? '✅' : '❌'} Có ít nhất 1 section
                    </div>
                    <div className="flex items-center gap-2">
                      {sections.some((s) => s.lessons.length > 0) ? '✅' : '❌'} Có ít nhất 1 bài
                      học
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Settings */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>⚙️ Cài Đặt Nâng Cao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Các cài đặt nâng cao sẽ được thêm trong phiên bản sau...
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Cấu hình certificate tự động</li>
                <li>Drip content (mở khóa nội dung theo thời gian)</li>
                <li>Prerequisites (khóa học yêu cầu trước)</li>
                <li>Discount codes</li>
                <li>Affiliate program</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CourseBuilder;
