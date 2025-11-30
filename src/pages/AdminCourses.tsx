import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users,
  Clock,
  DollarSign,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Admin Courses Management Page
 * Dành cho Admin - Quản lý toàn bộ khóa học
 */
const AdminCourses = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all courses
  const { data: courses, isLoading } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(
          `
          *,
          instructor:instructors(name, avatar_url)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredCourses = courses?.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-3xl">📚</span>
          <div>
            <h1 className="text-3xl font-bold">Quản Lý Khóa Học</h1>
            <p className="text-muted-foreground mt-1">
              Dành cho <strong>Admin</strong> - Tạo, sửa, xóa và quản lý tất cả khóa học
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              💡 Tổng số: <strong>{courses?.length || 0} khóa học</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khóa học..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/academy')} variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Xem Academy
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo Khóa Học Mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng khóa học</p>
              <p className="text-2xl font-bold">{courses?.length || 0}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Đã publish</p>
              <p className="text-2xl font-bold">
                {courses?.filter((c) => c.is_published).length || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Khóa miễn phí</p>
              <p className="text-2xl font-bold">{courses?.filter((c) => c.is_free).length || 0}</p>
            </div>
            <DollarSign className="w-8 h-8 text-amber-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tổng học viên</p>
              <p className="text-2xl font-bold">
                {courses?.reduce((sum, c) => sum + (c.total_students || 0), 0).toLocaleString() ||
                  0}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Danh Sách Khóa Học</h2>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : filteredCourses && filteredCourses.length > 0 ? (
            <div className="space-y-4">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <img
                      src={
                        course.thumbnail_url ||
                        'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200'
                      }
                      alt={course.title}
                      className="w-32 h-20 object-cover rounded-lg"
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{course.level}</Badge>
                            <Badge variant="secondary">{course.category}</Badge>
                            {course.is_published ? (
                              <Badge className="bg-green-500">Published</Badge>
                            ) : (
                              <Badge variant="destructive">Draft</Badge>
                            )}
                            {course.is_free && <Badge className="bg-amber-500">Free</Badge>}
                          </div>
                        </div>
                        <div className="text-right">
                          {course.is_free ? (
                            <span className="text-lg font-bold text-green-600">Miễn phí</span>
                          ) : (
                            <span className="text-lg font-bold">
                              {course.price?.toLocaleString()}đ
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {course.duration_hours}h
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.total_lessons} bài
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {course.total_students?.toLocaleString() || 0} học viên
                        </span>
                        <span>⭐ {course.average_rating?.toFixed(1) || '5.0'}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/academy/course/${course.id}`)}
                          className="gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          Xem
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Chưa có khóa học nào</h3>
              <p className="text-muted-foreground mb-4">Tạo khóa học đầu tiên để bắt đầu</p>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Tạo Khóa Học Đầu Tiên
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminCourses;
