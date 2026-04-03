/**
 * 📖 Ebook Tool — Library API (importable, no CLI)
 *
 * Usage:
 *   import { buildOneEbook } from './build-ebook-lib.js';
 *   const result = await buildOneEbook(ebook, channelConfig, { enhance: true });
 */
import mammoth from 'mammoth';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import {
  markdownToHtml, fixMammothTables,
  enhanceFrameworks, enhanceInsights, enhanceExerciseHeadings, enhancePullQuotes,
} from './core/markdown-converter.js';
import { getBookCSS } from './core/book-css.js';
import { buildBookHtml } from './core/html-template.js';
import { renderPdf, saveHtml } from './core/pdf-renderer.js';
import { generateCoverImages, generateChapterImagesById, generateChapterImagesByPattern } from './core/image-generator.js';
import { getDecorations } from './core/decorations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_OUTPUT = join(__dirname, '..', '..', 'output');

function extractDocxChapters(html, channelConfig) {
  // Cleanup
  html = html.replace(/<p>Tôi sẽ viết cho bạn[^<]*<\/p>/g, '');
  html = html.replace(/<p>📊[^<]*<\/p>/g, '');
  html = html.replace(/<p>🔚[^<]*<\/p>/g, '');
  html = html.replace(/<p>📝 Giọng văn[^<]*<\/p>/g, '');
  html = html.replace(/<p>🎯 Mục tiêu[^<]*<\/p>/g, '');
  html = html.replace(/<(h[12])><strong>([^<]*)<\/strong><\/(h[12])>/g, '<$1>$2</$3>');

  const pattern = channelConfig.chapterPattern;
  const parts = html.split(pattern);
  const chapters = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const content = (parts[i + 1] || '').trim();
    if (/^📖/.test(title) || /^CHỮA LÀNH TỪ GỐC RỄ$/.test(title)) continue;
    chapters.push({ title, content });
  }
  return chapters;
}

function buildDocxChaptersHtml(chapters, channelConfig, { images, enhance }) {
  const decorations = getDecorations(channelConfig.decorationStyle);
  let html = '';

  chapters.forEach((ch, idx) => {
    const isPart = /^PHẦN \d+/i.test(ch.title);
    const isDay = /^NGÀY \d+/i.test(ch.title);
    const isModule = /^MODULE \d+/i.test(ch.title);

    let content = ch.content;
    content = content.replace(/<h2><strong>([^<]*)<\/strong><\/h2>/g, '<h3>$1</h3>');
    content = content.replace(/<h2>([^<]*)<\/h2>/g, '<h3>$1</h3>');
    content = content.replace(/<h3><strong>([^<]*)<\/strong><\/h3>/g, '<h4>$1</h4>');
    content = content.replace(/<h3>(BÀI TẬP[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
    content = content.replace(/<h3>(Bài tập[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
    content = content.replace(/<h4>(BÀI TẬP[^<]*)<\/h4>/gi, '<h3 class="exercise">📝 $1</h3>');
    content = content.replace(/<p>([✓✔☑]) /g, '<p class="checklist-item">');
    content = fixMammothTables(content);

    if (enhance) {
      content = content.replace(/<h3>/g, `${decorations.divider}<h3>`);
      content = enhancePullQuotes(content);
    }

    let label = '';
    if (isDay) label = ch.title;
    else if (isModule) label = ch.title.split('—')[0].trim();
    else if (isPart) label = ch.title;

    const imageDataUrl = images?.get(idx);
    const imageHtml = imageDataUrl
      ? `<div class="chapter-illustration"><img src="${imageDataUrl}" alt="${ch.title}" /></div>`
      : '';

    const ornament = enhance ? decorations.chapterOrnament : '';
    const endOrnament = enhance ? decorations.chapterEnd : '';

    html += `
<div class="chapter">
  <div class="chapter-header${enhance ? ' chapter-header-enhanced' : ''}">
    ${label ? `<div class="chapter-number">${label}</div>` : ''}
    <h2 class="chapter-title">${ch.title}</h2>
    ${ornament}
  </div>
  ${imageHtml}
  <div class="chapter-content">${content}</div>
  ${endOrnament}
</div>
`;
  });
  return html;
}

async function buildMdChaptersHtml(ebook, channelConfig, outputDir, { chapterImages, enhance }) {
  const decorations = getDecorations(channelConfig.decorationStyle);
  const chaptersDir = join(outputDir, ebook.id, 'chapters');
  if (!existsSync(chaptersDir)) throw new Error(`Chapters not found: ${chaptersDir}`);

  let html = '';
  let num = 0;

  for (const chapter of ebook.chapters) {
    const file = join(chaptersDir, `${chapter.id}.md`);
    if (!existsSync(file)) continue;
    num++;

    const md = await readFile(file, 'utf-8');
    let chHtml = markdownToHtml(md.replace(/^## .+\n+/, ''));
    chHtml = enhanceFrameworks(chHtml);
    chHtml = enhanceInsights(chHtml);
    chHtml = enhanceExerciseHeadings(chHtml);

    if (enhance) {
      chHtml = enhancePullQuotes(chHtml);
      chHtml = chHtml.replace(/<h3>/g, `${decorations.divider}<h3>`);
    }

    const numStr = String(num).padStart(2, '0');
    const imageB64 = chapterImages?.get(chapter.id);
    const imageHtml = imageB64
      ? `<div class="chapter-illustration"><img src="${imageB64}" alt="chapter illustration" /></div>`
      : '';

    // Mid-chapter image
    const midImageB64 = chapterImages?.get(chapter.id + '-mid');
    if (midImageB64) {
      const midTag = `<div class="chapter-illustration"><img src="${midImageB64}" alt="illustration" /></div>\n`;
      const h3s = [...chHtml.matchAll(/<h3/g)];
      if (h3s.length >= 2) {
        const pos = h3s[Math.floor(h3s.length / 2)].index;
        chHtml = chHtml.slice(0, pos) + midTag + chHtml.slice(pos);
      }
    }

    const ornament = enhance ? decorations.chapterOrnament : '';
    const endOrnament = enhance ? decorations.chapterEnd : '';

    html += `
<div class="chapter">
  <div class="chapter-header">
    ${ornament}
    <div class="chapter-number">Chương ${numStr}</div>
    <h2 class="chapter-title">${chapter.title}</h2>
  </div>
  ${imageHtml}
  <div class="chapter-content">${chHtml}</div>
  ${endOrnament}
</div>
`;
  }
  return html;
}

/**
 * Build one ebook — the core library function called from API or CLI.
 */
export async function buildOneEbook(ebook, channelConfig, { enhance = false } = {}) {
  const outputDir = join(BASE_OUTPUT, `ebooks-${channelConfig.channelId}`);
  const ebookDir = join(outputDir, ebook.id);
  await mkdir(ebookDir, { recursive: true });

  const theme = channelConfig.themes[ebook.tier];
  const css = getBookCSS(theme);
  const cacheDir = join(ebookDir, 'images');

  // Images
  let chapterImages = null;
  let coverImgs = {};

  if (enhance) {
    const imgPrompts = channelConfig.chapterImages?.[ebook.id] || [];
    const coverPrompts = channelConfig.coverImages?.[ebook.id];
    const imgStyle = channelConfig.imageStyle;

    if (coverPrompts) {
      coverImgs = await generateCoverImages(coverPrompts, ebook.tier, imgStyle, cacheDir);
    }

    if (imgPrompts.length > 0 && channelConfig.inputType === 'markdown') {
      chapterImages = await generateChapterImagesById(imgPrompts, ebook.tier, imgStyle, cacheDir);
    }
  }

  // Chapters
  let chaptersHtml = '';
  let tocChapters = [];

  if (channelConfig.inputType === 'markdown') {
    chaptersHtml = await buildMdChaptersHtml(ebook, channelConfig, outputDir, { chapterImages, enhance });
    tocChapters = ebook.chapters;
  } else {
    if (!ebook.file || !existsSync(ebook.file)) throw new Error(`DOCX not found: ${ebook.file}`);
    const result = await mammoth.convertToHtml({ path: ebook.file });
    const docxChapters = extractDocxChapters(result.value, channelConfig);
    tocChapters = docxChapters;

    let images = null;
    if (enhance) {
      const imgPrompts = channelConfig.chapterImages?.[ebook.id] || [];
      if (imgPrompts.length > 0) {
        images = await generateChapterImagesByPattern(imgPrompts, docxChapters, ebook.tier, channelConfig.imageStyle, cacheDir);
      }
    }

    chaptersHtml = buildDocxChaptersHtml(docxChapters, channelConfig, { images, enhance });
  }

  if (!chaptersHtml) throw new Error('No chapter content');

  const tocConfig = {
    chapters: tocChapters,
    parts: channelConfig.tocParts,
    partDetect: channelConfig.inputType === 'docx' ? 'title-regex' : 'id-prefix',
  };

  const introQuote = channelConfig.introQuotes?.[ebook.id];
  const fullHtml = buildBookHtml({
    ebook, css, chaptersHtml,
    author: channelConfig.author,
    publisher: channelConfig.publisher,
    coverImages: coverImgs,
    introQuote, tocConfig,
  });

  const suffix = enhance ? '-enhanced' : '-print';
  const htmlPath = join(ebookDir, `${ebook.id}${suffix}.html`);
  await saveHtml(htmlPath, fullHtml);

  const pdfPath = join(ebookDir, `${ebook.id}.pdf`);
  await renderPdf(fullHtml, pdfPath, { author: channelConfig.author, title: ebook.title });

  const pdfBuf = await readFile(pdfPath);
  const sizeMB = (pdfBuf.length / (1024 * 1024)).toFixed(2);

  return { id: ebook.id, pdfPath, htmlPath, sizeMB, chapters: tocChapters.length, enhanced: !!enhance };
}
