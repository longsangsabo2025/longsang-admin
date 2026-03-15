/**
 * Academy System - Barrel Export
 * Export all services and types
 */

export type { LearningAnalytics } from './analytics.service';
export { AnalyticsService } from './analytics.service';
export type { Assignment, AssignmentSubmission } from './assignments.service';
export { AssignmentService } from './assignments.service';
export type { CertificateData } from './certificate-generator';
// Certificate Generator
export {
  CertificateGenerator,
  downloadCertificate,
  generateCertificate,
  uploadCertificate,
} from './certificate-generator';
export type { Certificate } from './certificates.service';

export { CertificateService } from './certificates.service';
export type {
  Badge,
  LeaderboardEntry,
  LearningStreak,
  UserBadge,
  UserXPLog,
  UserXPSummary,
  XPAction,
} from './gamification.service';
// Gamification System
export { GamificationService } from './gamification.service';
export type {
  CouponCode,
  PaymentOrder,
  SubscriptionPlan,
  UserSubscription,
} from './payment.service';
// Payment System
export { PaymentService } from './payment.service';
export type { Quiz, QuizAttempt, QuizOption, QuizQuestion } from './quizzes.service';
export { QuizService } from './quizzes.service';
// Sample Data
export { sampleCourses } from './sampleCourses';
// Core Services
export { AcademyService } from './service';
