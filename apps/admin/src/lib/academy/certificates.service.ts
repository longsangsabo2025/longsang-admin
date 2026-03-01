/**
 * Certificate Management Service
 * Handle certificate generation and verification
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  enrollment_id?: string;
  certificate_number: string;
  issued_at: string;
  certificate_url?: string;
  verification_code: string;
  expires_at?: string;
  is_revoked: boolean;
  revoked_at?: string;
  revoke_reason?: string;
}

export class CertificateService {
  /**
   * Generate certificate number
   */
  private static generateCertificateNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  /**
   * Generate verification code
   */
  private static generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Issue certificate to student
   */
  static async issueCertificate(
    userId: string,
    courseId: string,
    enrollmentId?: string,
    certificateUrl?: string,
    expiresAt?: string
  ) {
    try {
      const certificateNumber = this.generateCertificateNumber();
      const verificationCode = this.generateVerificationCode();

      const { data, error } = await supabase
        .from('course_certificates')
        .insert({
          user_id: userId,
          course_id: courseId,
          enrollment_id: enrollmentId,
          certificate_number: certificateNumber,
          verification_code: verificationCode,
          issued_at: new Date().toISOString(),
          certificate_url: certificateUrl,
          expires_at: expiresAt,
          is_revoked: false,
        })
        .select()
        .single();

      if (error) throw error;

      logger.info('Certificate issued', {
        userId,
        courseId,
        certificateNumber,
      });

      return data as Certificate;
    } catch (error) {
      logger.error('Failed to issue certificate', error);
      throw error;
    }
  }

  /**
   * Get user's certificates
   */
  static async getUserCertificates(userId: string) {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(
          `
          *,
          course:courses(id, title, thumbnail_url)
        `
        )
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      return data as (Certificate & { course: any })[];
    } catch (error) {
      logger.error('Failed to fetch user certificates', error);
      throw error;
    }
  }

  /**
   * Get certificate by verification code
   */
  static async verifyCertificate(verificationCode: string) {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(
          `
          *,
          user:user_id(id, email, raw_user_meta_data),
          course:courses(id, title, instructor_id)
        `
        )
        .eq('verification_code', verificationCode)
        .eq('is_revoked', false)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!data) {
        return {
          valid: false,
          message: 'Certificate not found or has been revoked',
        };
      }

      // Check if expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        return {
          valid: false,
          message: 'Certificate has expired',
        };
      }

      return {
        valid: true,
        certificate: data,
      };
    } catch (error) {
      logger.error('Failed to verify certificate', error);
      throw error;
    }
  }

  /**
   * Revoke certificate
   */
  static async revokeCertificate(certificateId: string, reason: string) {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .update({
          is_revoked: true,
          revoked_at: new Date().toISOString(),
          revoke_reason: reason,
        })
        .eq('id', certificateId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Certificate revoked', { certificateId, reason });
      return data as Certificate;
    } catch (error) {
      logger.error('Failed to revoke certificate', error);
      throw error;
    }
  }

  /**
   * Check if student is eligible for certificate
   */
  static async checkCertificateEligibility(userId: string, courseId: string) {
    try {
      // Get analytics
      const { data: analytics } = await supabase
        .from('learning_analytics')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .single();

      if (!analytics) {
        return {
          eligible: false,
          reason: 'No enrollment found',
        };
      }

      // Check completion percentage
      const completionPercentage =
        analytics.lessons_total > 0
          ? (analytics.lessons_completed / analytics.lessons_total) * 100
          : 0;

      if (completionPercentage < 80) {
        return {
          eligible: false,
          reason: `Course completion is ${Math.round(completionPercentage)}%. Minimum 80% required.`,
        };
      }

      // Check average quiz score
      if (analytics.average_quiz_score && analytics.average_quiz_score < 70) {
        return {
          eligible: false,
          reason: `Average quiz score is ${Math.round(analytics.average_quiz_score)}%. Minimum 70% required.`,
        };
      }

      // Check if already has certificate
      const { data: existingCert } = await supabase
        .from('course_certificates')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('is_revoked', false)
        .single();

      if (existingCert) {
        return {
          eligible: false,
          reason: 'Certificate already issued',
          certificate_id: existingCert.id,
        };
      }

      return {
        eligible: true,
        completion_percentage: Math.round(completionPercentage),
        average_quiz_score: Math.round(analytics.average_quiz_score || 0),
      };
    } catch (error) {
      logger.error('Failed to check certificate eligibility', error);
      throw error;
    }
  }

  /**
   * Get course certificates (for instructor)
   */
  static async getCourseCertificates(courseId: string) {
    try {
      const { data, error } = await supabase
        .from('course_certificates')
        .select(
          `
          *,
          user:user_id(id, email, raw_user_meta_data)
        `
        )
        .eq('course_id', courseId)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      return data as (Certificate & { user: any })[];
    } catch (error) {
      logger.error('Failed to fetch course certificates', error);
      throw error;
    }
  }

  /**
   * Generate certificate PDF URL (placeholder - integrate with actual PDF service)
   */
  static async generateCertificatePDF(
    certificateId: string,
    studentName: string,
    courseName: string,
    issueDate: string
  ): Promise<string> {
    try {
      // This is a placeholder - in production, integrate with a PDF generation service
      // like PDFKit, jsPDF, or a service like Puppeteer
      const pdfUrl = `https://api.example.com/certificates/${certificateId}/pdf`;

      logger.info('Certificate PDF generated', { certificateId });
      return pdfUrl;
    } catch (error) {
      logger.error('Failed to generate certificate PDF', error);
      throw error;
    }
  }

  /**
   * Export certificate as image
   */
  static async exportCertificateImage(certificateId: string): Promise<Blob> {
    try {
      // This is a placeholder - in production, generate actual certificate image
      const response = await fetch(`/api/certificates/${certificateId}/image`);
      const blob = await response.blob();

      logger.info('Certificate image exported', { certificateId });
      return blob;
    } catch (error) {
      logger.error('Failed to export certificate image', error);
      throw error;
    }
  }

  /**
   * Get certificate statistics
   */
  static async getCertificateStats(courseId: string) {
    try {
      const { data: allCerts } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('course_id', courseId);

      const { data: activeCerts } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_revoked', false);

      const { data: revokedCerts } = await supabase
        .from('course_certificates')
        .select('*')
        .eq('course_id', courseId)
        .eq('is_revoked', true);

      return {
        total_issued: allCerts?.length || 0,
        active_certificates: activeCerts?.length || 0,
        revoked_certificates: revokedCerts?.length || 0,
      };
    } catch (error) {
      logger.error('Failed to get certificate stats', error);
      throw error;
    }
  }
}
