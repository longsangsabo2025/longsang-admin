/**
 * Certificate PDF Generator
 * Generate beautiful certificates using Canvas API
 */

export interface CertificateData {
  certificateId: string;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  issueDate: string;
  verificationCode: string;
  completionPercentage: number;
  totalHours: number;
  expiresAt?: string;
}

export class CertificateGenerator {
  private static readonly WIDTH = 1200;
  private static readonly HEIGHT = 850;

  /**
   * Generate certificate as Canvas
   */
  static async generateCertificateCanvas(data: CertificateData): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = CertificateGenerator.WIDTH;
    canvas.height = CertificateGenerator.HEIGHT;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      CertificateGenerator.WIDTH,
      CertificateGenerator.HEIGHT
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CertificateGenerator.WIDTH, CertificateGenerator.HEIGHT);

    // Decorative border
    ctx.strokeStyle = 'linear-gradient(90deg, #e94560, #f39c12)';
    ctx.lineWidth = 8;
    ctx.strokeRect(30, 30, CertificateGenerator.WIDTH - 60, CertificateGenerator.HEIGHT - 60);

    // Inner border
    ctx.strokeStyle = 'rgba(233, 69, 96, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, CertificateGenerator.WIDTH - 100, CertificateGenerator.HEIGHT - 100);

    // Corner decorations
    CertificateGenerator.drawCornerDecorations(ctx);

    // Logo/Icon area
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎓', CertificateGenerator.WIDTH / 2, 100);

    // Platform name
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('AINewbieVN Academy', CertificateGenerator.WIDTH / 2, 140);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Georgia';
    ctx.fillText('CERTIFICATE OF COMPLETION', CertificateGenerator.WIDTH / 2, 210);

    // Decorative line
    ctx.strokeStyle = 'rgba(243, 156, 18, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(350, 230);
    ctx.lineTo(850, 230);
    ctx.stroke();

    // "This is to certify that"
    ctx.fillStyle = '#cccccc';
    ctx.font = 'italic 20px Georgia';
    ctx.fillText('This is to certify that', CertificateGenerator.WIDTH / 2, 290);

    // Student Name
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 44px Georgia';
    ctx.fillText(data.studentName, CertificateGenerator.WIDTH / 2, 350);

    // Decorative name underline
    const nameWidth = ctx.measureText(data.studentName).width;
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo((CertificateGenerator.WIDTH - nameWidth) / 2 - 20, 365);
    ctx.lineTo((CertificateGenerator.WIDTH + nameWidth) / 2 + 20, 365);
    ctx.stroke();

    // "has successfully completed"
    ctx.fillStyle = '#cccccc';
    ctx.font = 'italic 20px Georgia';
    ctx.fillText('has successfully completed the course', CertificateGenerator.WIDTH / 2, 410);

    // Course Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Georgia';
    const wrappedCourseName = CertificateGenerator.wrapText(
      ctx,
      data.courseName,
      CertificateGenerator.WIDTH - 200
    );
    let courseY = 460;
    wrappedCourseName.forEach((line) => {
      ctx.fillText(line, CertificateGenerator.WIDTH / 2, courseY);
      courseY += 40;
    });

    // Completion details
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Arial';
    ctx.fillText(
      `Completed ${data.completionPercentage}% of course content • ${data.totalHours} hours of learning`,
      CertificateGenerator.WIDTH / 2,
      courseY + 30
    );

    // Instructor and Date section
    const bottomY = 650;

    // Left: Instructor
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(data.instructorName, 300, bottomY);
    ctx.strokeStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(180, bottomY + 10);
    ctx.lineTo(420, bottomY + 10);
    ctx.stroke();
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Course Instructor', 300, bottomY + 35);

    // Right: Date
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.fillText(CertificateGenerator.formatDate(data.issueDate), 900, bottomY);
    ctx.strokeStyle = '#666666';
    ctx.beginPath();
    ctx.moveTo(780, bottomY + 10);
    ctx.lineTo(1020, bottomY + 10);
    ctx.stroke();
    ctx.fillStyle = '#888888';
    ctx.font = '14px Arial';
    ctx.fillText('Date of Completion', 900, bottomY + 35);

    // Certificate number and verification
    ctx.textAlign = 'center';
    ctx.fillStyle = '#666666';
    ctx.font = '12px monospace';
    ctx.fillText(
      `Certificate ID: ${data.certificateNumber} | Verification Code: ${data.verificationCode}`,
      CertificateGenerator.WIDTH / 2,
      CertificateGenerator.HEIGHT - 70
    );

    // Verify URL
    ctx.fillStyle = '#e94560';
    ctx.font = '14px Arial';
    ctx.fillText(
      'Verify at: ainewbievn.com/verify-certificate',
      CertificateGenerator.WIDTH / 2,
      CertificateGenerator.HEIGHT - 45
    );

    return canvas;
  }

  /**
   * Draw corner decorations
   */
  private static drawCornerDecorations(ctx: CanvasRenderingContext2D): void {
    const corners = [
      { x: 60, y: 60 },
      { x: CertificateGenerator.WIDTH - 60, y: 60 },
      { x: 60, y: CertificateGenerator.HEIGHT - 60 },
      { x: CertificateGenerator.WIDTH - 60, y: CertificateGenerator.HEIGHT - 60 },
    ];

    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;

    corners.forEach((corner, index) => {
      ctx.beginPath();
      if (index === 0) {
        ctx.moveTo(corner.x, corner.y + 30);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x + 30, corner.y);
      } else if (index === 1) {
        ctx.moveTo(corner.x - 30, corner.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x, corner.y + 30);
      } else if (index === 2) {
        ctx.moveTo(corner.x, corner.y - 30);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x + 30, corner.y);
      } else {
        ctx.moveTo(corner.x - 30, corner.y);
        ctx.lineTo(corner.x, corner.y);
        ctx.lineTo(corner.x, corner.y - 30);
      }
      ctx.stroke();
    });
  }

  /**
   * Wrap text to fit within width
   */
  private static wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Format date for display
   */
  private static formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Generate certificate as PNG blob
   */
  static async generateCertificatePNG(data: CertificateData): Promise<Blob> {
    const canvas = await CertificateGenerator.generateCertificateCanvas(data);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate PNG'));
          }
        },
        'image/png',
        1.0
      );
    });
  }

  /**
   * Generate certificate as JPEG blob
   */
  static async generateCertificateJPEG(data: CertificateData): Promise<Blob> {
    const canvas = await CertificateGenerator.generateCertificateCanvas(data);
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to generate JPEG'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  }

  /**
   * Generate certificate as PDF using canvas data
   * Note: For full PDF support, integrate with jsPDF or similar library
   */
  static async generateCertificatePDF(data: CertificateData): Promise<Blob> {
    // Dynamic import jsPDF if available
    try {
      const { jsPDF } = await import('jspdf');
      const canvas = await CertificateGenerator.generateCertificateCanvas(data);
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Create PDF with landscape orientation
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [CertificateGenerator.WIDTH, CertificateGenerator.HEIGHT],
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, CertificateGenerator.WIDTH, CertificateGenerator.HEIGHT);
      return pdf.output('blob');
    } catch (error) {
      // Fallback: Return PNG if jsPDF not available
      console.warn('jsPDF not available, falling back to PNG');
      return CertificateGenerator.generateCertificatePNG(data);
    }
  }

  /**
   * Download certificate
   */
  static async downloadCertificate(
    data: CertificateData,
    format: 'png' | 'jpeg' | 'pdf' = 'png'
  ): Promise<void> {
    let blob: Blob;
    let extension: string;

    switch (format) {
      case 'pdf':
        blob = await CertificateGenerator.generateCertificatePDF(data);
        extension = 'pdf';
        break;
      case 'jpeg':
        blob = await CertificateGenerator.generateCertificateJPEG(data);
        extension = 'jpg';
        break;
      default:
        blob = await CertificateGenerator.generateCertificatePNG(data);
        extension = 'png';
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `certificate-${data.certificateNumber}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Upload certificate to storage
   */
  static async uploadCertificateToStorage(
    data: CertificateData,
    supabaseClient: any
  ): Promise<string> {
    const blob = await CertificateGenerator.generateCertificatePNG(data);
    const fileName = `certificates/${data.certificateId}/${data.certificateNumber}.png`;

    const { data: uploadData, error } = await supabaseClient.storage
      .from('academy')
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabaseClient.storage.from('academy').getPublicUrl(fileName);

    return urlData.publicUrl;
  }

  /**
   * Generate share image for social media
   */
  static async generateShareImage(data: CertificateData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630; // OG image size
    const ctx = canvas.getContext('2d')!;

    // Background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Achievement badge
    ctx.fillStyle = '#e94560';
    ctx.font = '60px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 600, 100);

    // "I just completed"
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText('I just completed', 600, 170);

    // Course name
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 36px Georgia';
    const wrappedName = CertificateGenerator.wrapText(ctx, data.courseName, 1000);
    let y = 230;
    wrappedName.forEach((line) => {
      ctx.fillText(line, 600, y);
      y += 45;
    });

    // "at AINewbieVN Academy"
    ctx.fillStyle = '#cccccc';
    ctx.font = '22px Arial';
    ctx.fillText('at AINewbieVN Academy', 600, y + 30);

    // Student name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`- ${data.studentName}`, 600, y + 90);

    // Verification link
    ctx.fillStyle = '#e94560';
    ctx.font = '16px Arial';
    ctx.fillText(`Verify: ainewbievn.com/verify/${data.verificationCode}`, 600, 580);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to generate share image'));
        },
        'image/png',
        1.0
      );
    });
  }
}

// Export for easy import
export const generateCertificate = CertificateGenerator.generateCertificateCanvas;
export const downloadCertificate = CertificateGenerator.downloadCertificate;
export const uploadCertificate = CertificateGenerator.uploadCertificateToStorage;
