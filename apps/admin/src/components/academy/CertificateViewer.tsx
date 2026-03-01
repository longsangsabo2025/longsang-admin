/**
 * Certificate Viewer Component
 * Display and manage certificates with Canvas-based generation
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Award,
  Calendar,
  Clock,
  ExternalLink,
  Check,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { CertificateService } from '@/lib/academy/certificates.service';
import { CertificateGenerator, CertificateData } from '@/lib/academy/certificate-generator';

interface CertificateViewerProps {
  readonly certificateId?: string;
  readonly verificationCode?: string;
  readonly showVerification?: boolean;
  readonly certificateData?: CertificateData;
  readonly onClose?: () => void;
}

export function CertificateViewer({
  certificateId,
  verificationCode,
  showVerification = false,
  certificateData,
  onClose,
}: CertificateViewerProps) {
  const [verifyCode, setVerifyCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (certificateData && !showVerification) {
      generatePreview();
    }
  }, [certificateData, showVerification]);

  const generatePreview = async () => {
    if (!certificateData) return;
    setIsLoading(true);
    try {
      const canvas = await CertificateGenerator.generateCertificateCanvas(certificateData);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')!;
        canvasRef.current.width = 800;
        canvasRef.current.height = 566;
        ctx.drawImage(canvas, 0, 0, 800, 566);
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast.error('Failed to generate certificate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      const result = await CertificateService.verifyCertificate(verifyCode);
      setVerificationResult(result);
    } catch {
      setVerificationResult({
        valid: false,
        message: 'Error verifying certificate',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDownload = async () => {
    if (!certificateData) {
      // Fallback for old behavior
      const link = document.createElement('a');
      link.href = `/certificates/${certificateId}/download`;
      link.download = `certificate-${certificateId}.pdf`;
      link.click();
      return;
    }

    try {
      await CertificateGenerator.downloadCertificate(certificateData, downloadFormat);
      toast.success(`Certificate downloaded as ${downloadFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download certificate');
    }
  };

  const handleShare = async () => {
    const code = certificateData?.verificationCode || verificationCode;
    const shareUrl = `${globalThis.location.origin}/verify-certificate?code=${code}`;
    const courseName = certificateData?.courseName || 'this course';

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Certificate - ${courseName}`,
          text: `🎓 I just completed "${courseName}" at AINewbieVN Academy!`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(
          `🎓 I just completed "${courseName}" at AINewbieVN Academy!\n\nVerify: ${shareUrl}`
        );
        toast.success('Share link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const copyVerificationCode = async () => {
    const code = certificateData?.verificationCode || verificationCode || '';
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Verification code copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Show enhanced viewer with Canvas if certificateData is provided
  if (certificateData && !showVerification) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-auto">
        <Card className="bg-gray-900 border-gray-800 max-w-4xl w-full my-8">
          <CardHeader className="border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <CardTitle className="text-white">Certificate of Completion</CardTitle>
                  <CardDescription className="text-gray-400">
                    {certificateData.courseName}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
                {onClose && (
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Certificate Preview Canvas */}
            <div className="relative bg-gray-800 rounded-lg p-2 overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-yellow-500" />
                </div>
              )}
              <canvas
                ref={canvasRef}
                className="w-full h-auto rounded"
                style={{ maxHeight: '500px', objectFit: 'contain' }}
              />
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Student Name</p>
                <p className="text-white font-medium">{certificateData.studentName}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Issue Date
                </p>
                <p className="text-white font-medium">{formatDate(certificateData.issueDate)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Total Hours
                </p>
                <p className="text-white font-medium">{certificateData.totalHours} hours</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Completion</p>
                <p className="text-white font-medium">{certificateData.completionPercentage}%</p>
              </div>
            </div>

            {/* Verification Code */}
            <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Verification Code</p>
                  <p className="text-lg font-mono text-purple-400">
                    {certificateData.verificationCode}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyVerificationCode}
                  className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                Verify at: ainewbievn.com/verify-certificate
              </p>
            </div>

            {/* Download Options */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
                {(['png', 'jpeg', 'pdf'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setDownloadFormat(format)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      downloadFormat === format
                        ? 'bg-primary text-primary-foreground'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <Button onClick={handleDownload} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download {downloadFormat.toUpperCase()}
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original verification view
  return (
    <div className="space-y-6">
      {showVerification ? (
        <Card>
          <CardHeader>
            <CardTitle>Verify Certificate</CardTitle>
            <CardDescription>
              Enter the certificate verification code to verify its authenticity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter verification code"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
              />
              <Button onClick={handleVerify} disabled={isVerifying || !verifyCode}>
                {isVerifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            {verificationResult && (
              <div
                className={`p-4 rounded-lg border ${
                  verificationResult.valid
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {verificationResult.valid ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        verificationResult.valid
                          ? 'text-green-900 dark:text-green-400'
                          : 'text-red-900 dark:text-red-400'
                      }`}
                    >
                      {verificationResult.valid ? 'Certificate Valid ✓' : 'Certificate Invalid'}
                    </p>
                    <p
                      className={`text-sm mt-1 ${
                        verificationResult.valid
                          ? 'text-green-800 dark:text-green-300'
                          : 'text-red-800 dark:text-red-300'
                      }`}
                    >
                      {verificationResult.message}
                    </p>

                    {verificationResult.valid && verificationResult.certificate && (
                      <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800 space-y-1 text-sm">
                        <p>
                          <strong>Student:</strong>{' '}
                          {verificationResult.certificate.user?.raw_user_meta_data?.full_name ||
                            'N/A'}
                        </p>
                        <p>
                          <strong>Course:</strong> {verificationResult.certificate.course?.title}
                        </p>
                        <p>
                          <strong>Issued:</strong>{' '}
                          {new Date(verificationResult.certificate.issued_at).toLocaleDateString()}
                        </p>
                        <p>
                          <strong>Certificate #:</strong>{' '}
                          {verificationResult.certificate.certificate_number}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Certificate of Completion</CardTitle>
                <CardDescription>You have successfully completed this course</CardDescription>
              </div>
              <Badge className="bg-green-500">Verified</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Certificate Preview */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-yellow-500/30 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <Award className="h-12 w-12 text-yellow-500 mx-auto" />
                <div className="text-sm text-gray-400">This is to certify that</div>
                <div className="text-2xl font-bold text-white">Student Name</div>
                <div className="text-sm text-gray-400">has successfully completed</div>
                <div className="text-xl font-semibold text-yellow-500">Course Title</div>
                <div className="text-sm text-gray-400">
                  with a final score of <strong className="text-green-500">95%</strong>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-500">Certificate #: CERT-ABC123-XYZ</div>
                  <div className="text-xs text-gray-500">
                    Issued: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button className="gap-2 bg-green-600 hover:bg-green-700" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                Download
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
                Share Certificate
              </Button>
              <Button variant="outline" className="gap-2" onClick={copyVerificationCode}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
            </div>

            {/* Verification Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="pt-6">
                <div className="space-y-2 text-sm">
                  <p className="text-white">
                    <strong>Verification Code:</strong>{' '}
                    <span className="font-mono text-purple-400">{verificationCode}</span>
                  </p>
                  <p className="text-gray-400">
                    Share this code with others to verify the authenticity of this certificate
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Mini certificate card for list views
interface CertificateCardProps {
  certificate: {
    id: string;
    certificate_number: string;
    verification_code: string;
    issued_at: string;
    course?: {
      id: string;
      title: string;
      thumbnail_url?: string;
    };
  };
  studentName: string;
  onView?: () => void;
}

export function CertificateCard({ certificate, studentName, onView }: CertificateCardProps) {
  const handleDownloadQuick = async () => {
    try {
      const data: CertificateData = {
        certificateId: certificate.id,
        certificateNumber: certificate.certificate_number,
        studentName,
        courseName: certificate.course?.title || 'Unknown Course',
        instructorName: 'AINewbieVN Academy',
        issueDate: certificate.issued_at,
        verificationCode: certificate.verification_code,
        completionPercentage: 100,
        totalHours: 10,
      };
      await CertificateGenerator.downloadCertificate(data, 'png');
      toast.success('Certificate downloaded!');
    } catch (error) {
      toast.error('Failed to download');
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800 hover:border-yellow-500/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Thumbnail */}
          <div className="relative w-20 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
            {certificate.course?.thumbnail_url ? (
              <img
                src={certificate.course.thumbnail_url}
                alt={certificate.course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Award className="h-6 w-6 text-yellow-500" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate">
              {certificate.course?.title || 'Course Certificate'}
            </h4>
            <p className="text-xs text-gray-400 mt-1">
              Issued: {new Date(certificate.issued_at).toLocaleDateString('vi-VN')}
            </p>
            <p className="text-xs font-mono text-purple-400 mt-1">
              #{certificate.certificate_number}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onView}
              className="text-yellow-500 hover:text-yellow-400"
            >
              View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadQuick}
              className="text-green-500 hover:text-green-400"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
