/**
 * Academy - My Certificates Page
 * Shows user's earned certificates with download options
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { GamingSidebar } from '@/components/academy/gaming/GamingSidebar';
import { GamingRightSidebar } from '@/components/academy/gaming/GamingRightSidebar';
import { useUserEnrollments } from '@/hooks/useAcademy';
import { CertificateGenerator } from '@/lib/academy/certificate-generator';
import {
  Award,
  Download,
  Share2,
  ExternalLink,
  CheckCircle,
  Calendar,
  Trophy,
  Medal,
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

export default function AcademyCertificates() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const { data: enrollmentsData, isLoading } = useUserEnrollments();
  const { toast } = useToast();
  const { user } = useAuth();

  const enrollments = Array.isArray(enrollmentsData)
    ? enrollmentsData
    : enrollmentsData?.data || [];

  // Get completed courses with certificates
  const completedCourses = enrollments.filter((e) => e.completed_at);

  const handleDownloadCertificate = async (enrollment: any, format: 'pdf' | 'png') => {
    try {
      setDownloading(enrollment.id);

      const certificateData = {
        studentName: user?.user_metadata?.full_name || user?.email || 'Student',
        courseName: enrollment.course?.title || 'Course',
        completionDate: new Date(enrollment.completed_at),
        certificateId:
          enrollment.certificate_id || `CERT-${enrollment.id.slice(0, 8).toUpperCase()}`,
        instructorName:
          typeof enrollment.course?.instructor === 'object'
            ? enrollment.course?.instructor?.name
            : enrollment.course?.instructor || 'AINewbieVN',
        courseDuration: enrollment.course?.duration_hours || 10,
      };

      if (format === 'pdf') {
        const pdfBlob = await CertificateGenerator.generatePDF(certificateData);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate-${certificateData.certificateId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const dataUrl = await CertificateGenerator.generatePNG(certificateData);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `certificate-${certificateData.certificateId}.png`;
        a.click();
      }

      toast({
        title: 'Certificate Downloaded! 🎉',
        description: `Your certificate has been downloaded as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Failed to download certificate:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = async (enrollment: any) => {
    const shareText = `I just completed "${enrollment.course?.title}" on AINewbieVN Academy! 🎓`;
    const shareUrl = `${window.location.origin}/academy/verify/${enrollment.certificate_id || enrollment.id}`;

    if (navigator.share) {
      await navigator.share({
        title: 'My Certificate',
        text: shareText,
        url: shareUrl,
      });
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      toast({
        title: 'Link Copied! 📋',
        description: 'Certificate link copied to clipboard',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GamingSidebar />

      <main className="ml-0 xl:ml-[280px] mr-0 xl:mr-[300px] pt-[70px] px-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gaming-gradient mb-2">🏆 My Certificates</h1>
          <p className="text-muted-foreground">Your achievements and course completions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-gaming-gold/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-gold/20">
                <Trophy className="h-6 w-6 text-gaming-gold" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCourses.length}</p>
                <p className="text-sm text-muted-foreground">Certificates Earned</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-gaming-purple/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-purple/20">
                <Medal className="h-6 w-6 text-gaming-purple" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {completedCourses.reduce((acc, e) => acc + (e.course?.duration_hours || 0), 0)}h
                </p>
                <p className="text-sm text-muted-foreground">Total Learning Hours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-gaming-cyan/30">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gaming-cyan/20">
                <Award className="h-6 w-6 text-gaming-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">Verified</p>
                <p className="text-sm text-muted-foreground">Blockchain Certified</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <Skeleton className="h-48 rounded-lg mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : completedCourses.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
            <p className="text-muted-foreground mb-6">
              Complete your first course to earn a certificate!
            </p>
            <Button className="gap-2 bg-gaming-purple hover:bg-gaming-purple/80">
              <a href="/academy/my-learning?tab=in-progress">Continue Learning</a>
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedCourses.map((enrollment) => (
              <CertificateCard
                key={enrollment.id}
                enrollment={enrollment}
                onDownload={handleDownloadCertificate}
                onShare={handleShare}
                isDownloading={downloading === enrollment.id}
              />
            ))}
          </div>
        )}
      </main>

      <GamingRightSidebar />
    </div>
  );
}

// Certificate Card Component
function CertificateCard({
  enrollment,
  onDownload,
  onShare,
  isDownloading,
}: {
  enrollment: any;
  onDownload: (enrollment: any, format: 'pdf' | 'png') => void;
  onShare: (enrollment: any) => void;
  isDownloading: boolean;
}) {
  const course = enrollment.course || {};
  const certificateId =
    enrollment.certificate_id || `CERT-${enrollment.id.slice(0, 8).toUpperCase()}`;

  return (
    <Card className="glass-card hover:border-gaming-gold/50 transition-all overflow-hidden group">
      {/* Certificate Preview */}
      <div className="relative bg-gradient-to-br from-gaming-gold/10 via-gaming-purple/10 to-gaming-cyan/10 p-6">
        <div className="absolute top-4 right-4">
          <Badge className="bg-gaming-gold text-black">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        </div>

        <div className="text-center py-8">
          <Award className="h-16 w-16 mx-auto mb-4 text-gaming-gold" />
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
            Certificate of Completion
          </h3>
          <h2 className="text-xl font-bold text-foreground mb-4">
            {course.title || 'Course Title'}
          </h2>
          <p className="text-sm text-muted-foreground">ID: {certificateId}</p>
        </div>

        {/* Decorative border */}
        <div className="absolute inset-4 border-2 border-gaming-gold/20 rounded-lg pointer-events-none" />
      </div>

      {/* Actions */}
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            {enrollment.completed_at
              ? format(new Date(enrollment.completed_at), 'dd MMM yyyy', { locale: vi })
              : 'N/A'}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {course.duration_hours && <span>{course.duration_hours}h completed</span>}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onDownload(enrollment, 'pdf')}
            disabled={isDownloading}
            className="flex-1 gap-2 bg-gaming-purple hover:bg-gaming-purple/80"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'PDF'}
          </Button>
          <Button
            onClick={() => onDownload(enrollment, 'png')}
            disabled={isDownloading}
            variant="outline"
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            PNG
          </Button>
          <Button onClick={() => onShare(enrollment)} variant="outline" size="icon">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
