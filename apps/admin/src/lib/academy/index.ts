/**
 * Academy System - Barrel Export
 * Export all services and types
 */

// Core Services
export { AcademyService } from './service';
export { AssignmentService } from './assignments.service';
export type { Assignment, AssignmentSubmission } from './assignments.service';

export { QuizService } from './quizzes.service';
export type { Quiz, QuizQuestion, QuizOption, QuizAttempt } from './quizzes.service';

export { AnalyticsService } from './analytics.service';
export type { LearningAnalytics } from './analytics.service';

export { CertificateService } from './certificates.service';
export type { Certificate } from './certificates.service';

// Certificate Generator
export {
  CertificateGenerator,
  generateCertificate,
  downloadCertificate,
  uploadCertificate,
} from './certificate-generator';
export type { CertificateData } from './certificate-generator';

// Gamification System
export { GamificationService } from './gamification.service';
export type {
  XPAction,
  UserXPLog,
  UserXPSummary,
  Badge,
  UserBadge,
  LearningStreak,
  LeaderboardEntry,
} from './gamification.service';

// Payment System
export { PaymentService } from './payment.service';
export type {
  SubscriptionPlan,
  UserSubscription,
  CouponCode,
  PaymentOrder,
} from './payment.service';

// Sample Data
export { sampleCourses } from './sampleCourses';
