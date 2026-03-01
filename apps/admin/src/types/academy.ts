/**
 * Academy System TypeScript Types
 * Database schema types for courses, enrollments, and learning paths
 */

export interface Instructor {
  id: string;
  user_id: string;
  name: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
  total_students: number;
  total_courses: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  instructor_id?: string;
  instructor?: Instructor;
  thumbnail_url?: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration_hours: number;
  total_lessons: number;
  language: string;
  price: number;
  original_price?: number;
  is_free: boolean;
  is_published: boolean;
  tags: string[];
  what_you_learn: string[];
  requirements: string[];
  features: string[];
  total_students: number;
  average_rating: number;
  total_reviews: number;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export interface CourseSection {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  lessons?: Lesson[];
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  section_id: string;
  title: string;
  description?: string;
  content_type: 'video' | 'article' | 'quiz' | 'code' | 'assignment';
  video_url?: string;
  article_content?: string;
  duration_minutes: number;
  is_free_preview: boolean;
  order_index: number;
  resources: LessonResource[];
  created_at: string;
  updated_at: string;
}

export interface LessonResource {
  title: string;
  url: string;
  type: 'pdf' | 'code' | 'link' | 'file';
}

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  last_accessed_lesson_id?: string;
  last_accessed_at: string;
  certificate_issued: boolean;
  certificate_url?: string;
}

export interface LessonProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  enrollment_id: string;
  is_completed: boolean;
  watch_time_seconds: number;
  completed_at?: string;
  last_position_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CourseReview {
  id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  course_id: string;
  enrollment_id: string;
  rating: number;
  comment?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface CourseDiscussion {
  id: string;
  course_id: string;
  lesson_id?: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  title: string;
  content: string;
  is_resolved: boolean;
  replies_count: number;
  replies?: DiscussionReply[];
  created_at: string;
  updated_at: string;
}

export interface DiscussionReply {
  id: string;
  discussion_id: string;
  user_id: string;
  user?: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  content: string;
  is_instructor_reply: boolean;
  created_at: string;
  updated_at: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description?: string;
  total_duration_weeks: number;
  order_index: number;
  steps?: LearningPathStep[];
  created_at: string;
  updated_at: string;
}

export interface LearningPathStep {
  id: string;
  path_id: string;
  title: string;
  description?: string;
  duration_weeks: number;
  skills: string[];
  order_index: number;
  courses?: Course[];
  created_at: string;
}

export interface UserLearningPathProgress {
  id: string;
  user_id: string;
  path_id: string;
  current_step_id?: string;
  completed_steps: string[];
  started_at: string;
  updated_at: string;
}

// API Request/Response types

export interface EnrollCourseRequest {
  course_id: string;
}

export interface UpdateProgressRequest {
  lesson_id: string;
  is_completed?: boolean;
  watch_time_seconds?: number;
  last_position_seconds?: number;
}

export interface CreateReviewRequest {
  course_id: string;
  rating: number;
  comment?: string;
}

export interface CreateDiscussionRequest {
  course_id: string;
  lesson_id?: string;
  title: string;
  content: string;
}

export interface CreateReplyRequest {
  discussion_id: string;
  content: string;
}

export interface CourseFilters {
  category?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced';
  is_free?: boolean;
  min_rating?: number;
  search?: string;
  instructor_id?: string;
  tags?: string[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: 'rating' | 'students' | 'updated' | 'price';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Course with full details (for detail page)
export interface CourseWithDetails extends Course {
  instructor: Instructor;
  sections: (CourseSection & { lessons: Lesson[] })[];
  reviews: CourseReview[];
  enrollment?: CourseEnrollment;
  user_progress?: LessonProgress[];
}

// Enrollment with course details
export interface EnrollmentWithCourse extends CourseEnrollment {
  course: Course;
  progress: LessonProgress[];
}
