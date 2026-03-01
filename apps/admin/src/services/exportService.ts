/**
 * 📤 Export Service
 * Handles exporting production data to various formats
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import type { Scene } from '@/pages/studio/scene-production/types';

export interface ExportData {
  episodeTitle: string;
  seriesTitle?: string;
  scenes: Scene[];
  totalDuration: number;
  exportDate: string;
}

/**
 * Export as JSON
 */
export function exportAsJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  downloadFile(blob, `${sanitizeFilename(data.episodeTitle)}_export.json`);
}

/**
 * Export as CSV
 */
export function exportAsCSV(data: ExportData): void {
  const headers = [
    'Scene #',
    'Description',
    'Duration (s)',
    'Camera Movement',
    'Mood',
    'Visual Prompt',
    'Video Prompt',
    'Dialogue',
    'Status',
    'Image URL',
    'Video URL',
  ];
  
  const rows = data.scenes.map(scene => [
    scene.number,
    `"${scene.description.replace(/"/g, '""')}"`,
    scene.duration,
    scene.cameraMovement,
    scene.mood,
    `"${(scene.visualPrompt || '').replace(/"/g, '""')}"`,
    `"${(scene.videoPrompt || '').replace(/"/g, '""')}"`,
    `"${(scene.dialogue || '').replace(/"/g, '""')}"`,
    scene.status,
    scene.generatedImageUrl || '',
    scene.generatedVideoUrl || '',
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${sanitizeFilename(data.episodeTitle)}_export.csv`);
}

/**
 * Export as HTML (for PDF conversion)
 */
export function exportAsPDF(data: ExportData): void {
  const html = generateHTMLReport(data);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Trigger print dialog
  printWindow.onload = () => {
    printWindow.print();
  };
}

/**
 * Generate HTML report
 */
function generateHTMLReport(data: ExportData): string {
  const scenesHTML = data.scenes.map(scene => `
    <div class="scene">
      <div class="scene-header">
        <span class="scene-number">Scene ${scene.number}</span>
        <span class="scene-duration">${scene.duration}s</span>
        <span class="scene-status status-${scene.status}">${scene.status}</span>
      </div>
      
      <div class="scene-content">
        <div class="field">
          <strong>Description:</strong>
          <p>${escapeHTML(scene.description)}</p>
        </div>
        
        <div class="field">
          <strong>Camera Movement:</strong> ${scene.cameraMovement}
        </div>
        
        <div class="field">
          <strong>Mood:</strong> ${scene.mood}
        </div>
        
        ${scene.visualPrompt ? `
          <div class="field">
            <strong>Visual Prompt:</strong>
            <p class="prompt">${escapeHTML(scene.visualPrompt)}</p>
          </div>
        ` : ''}
        
        ${scene.videoPrompt ? `
          <div class="field">
            <strong>Video Prompt:</strong>
            <p class="prompt">${escapeHTML(scene.videoPrompt)}</p>
          </div>
        ` : ''}
        
        ${scene.dialogue ? `
          <div class="field">
            <strong>Dialogue:</strong>
            <p class="dialogue">${escapeHTML(scene.dialogue)}</p>
          </div>
        ` : ''}
        
        ${scene.generatedImageUrl ? `
          <div class="field">
            <strong>Generated Image:</strong>
            <img src="${scene.generatedImageUrl}" alt="Scene ${scene.number}" class="preview-image" />
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
  
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.episodeTitle} - Production Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #6366f1;
    }
    
    h1 {
      font-size: 32px;
      color: #1e293b;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 18px;
      color: #64748b;
      margin-bottom: 16px;
    }
    
    .meta {
      display: flex;
      justify-content: center;
      gap: 30px;
      font-size: 14px;
      color: #64748b;
    }
    
    .scene {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      break-inside: avoid;
    }
    
    .scene-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f1f5f9;
    }
    
    .scene-number {
      background: #6366f1;
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-weight: 600;
      font-size: 14px;
    }
    
    .scene-duration {
      background: #f1f5f9;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 14px;
      color: #64748b;
    }
    
    .scene-status {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-pending {
      background: #fef3c7;
      color: #92400e;
    }
    
    .status-generating {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .status-completed {
      background: #d1fae5;
      color: #065f46;
    }
    
    .status-error {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .scene-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .field {
      font-size: 14px;
    }
    
    .field strong {
      color: #475569;
      display: block;
      margin-bottom: 4px;
    }
    
    .field p {
      color: #1e293b;
      margin: 0;
    }
    
    .prompt {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #6366f1;
      font-size: 13px;
      white-space: pre-wrap;
    }
    
    .dialogue {
      background: #fefce8;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #eab308;
      font-style: italic;
    }
    
    .preview-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin-top: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    @media print {
      body {
        padding: 20px;
      }
      
      .scene {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎬 ${escapeHTML(data.episodeTitle)}</h1>
    ${data.seriesTitle ? `<div class="subtitle">📺 ${escapeHTML(data.seriesTitle)}</div>` : ''}
    <div class="meta">
      <span><strong>${data.scenes.length}</strong> scenes</span>
      <span><strong>${data.totalDuration}s</strong> total duration</span>
      <span>Exported: ${new Date(data.exportDate).toLocaleString('vi-VN')}</span>
    </div>
  </div>
  
  <div class="scenes">
    ${scenesHTML}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper: Download file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Helper: Sanitize filename
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Helper: Escape HTML
 */
function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
