/**
 * 🖨️ Generic PDF Renderer — Puppeteer-based
 * Handles HTML → PDF with book-quality settings.
 */
import puppeteer from 'puppeteer';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

/**
 * Render HTML string to PDF via headless Chrome
 * @param {object} options
 * @param {string} options.html - Full HTML document
 * @param {string} options.outputPath - PDF file path
 * @param {string} [options.author] - Author name for header
 * @param {string} [options.title] - Book title for header
 * @param {object} [options.pageSize] - { width, height } in mm
 * @param {object} [options.margins] - { top, bottom, left, right } in mm
 * @returns {{ pdfFile: string, sizeMB: string }}
 */
export async function renderPdf({
  html,
  outputPath,
  author = '',
  title = '',
  pageSize = { width: '176mm', height: '250mm' },
  margins = { top: '20mm', bottom: '25mm', left: '22mm', right: '18mm' },
}) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 300000 });
    await page.evaluateHandle('document.fonts.ready');

    await page.pdf({
      path: outputPath,
      width: pageSize.width,
      height: pageSize.height,
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width: 100%; font-size: 8px; font-family: sans-serif; color: #999; padding: 0 40px;">
          <span style="float: left;">${author}</span>
          <span style="float: right;">${title}</span>
        </div>`,
      footerTemplate: `
        <div style="width: 100%; font-size: 9px; font-family: sans-serif; color: #999; text-align: center; padding: 0 40px;">
          <span class="pageNumber"></span>
        </div>`,
      margin: margins,
      preferCSSPageSize: false,
    });

    const pdfBuf = await readFile(outputPath);
    const sizeMB = (pdfBuf.length / (1024 * 1024)).toFixed(2);

    return { pdfFile: outputPath, sizeMB };
  } finally {
    await browser.close();
  }
}

/**
 * Save HTML to file (for debugging/preview)
 */
export async function saveHtml(html, outputPath) {
  const dir = outputPath.substring(0, outputPath.lastIndexOf('/')) || outputPath.substring(0, outputPath.lastIndexOf('\\'));
  await mkdir(dir, { recursive: true });
  await writeFile(outputPath, html, 'utf-8');
  return outputPath;
}
