#!/usr/bin/env node
/**
 * 📖 Ebook Tool — Unified CLI Builder
 *
 * Usage:
 *   node src/ebook-tool/build-ebook.js --channel dungdaydi               # Build all ebooks for channel
 *   node src/ebook-tool/build-ebook.js --channel riseshine --ebook 1     # Build ebook #1 only
 *   node src/ebook-tool/build-ebook.js --channel dungdaydi --ebook 2 --enhance  # With AI images
 *   node src/ebook-tool/build-ebook.js --channel riseshine --pdf-only    # Re-render from HTML
 *   node src/ebook-tool/build-ebook.js --list                            # List all channels
 */
import 'dotenv/config';
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
import { generateImageCached, generateCoverImages, generateChapterImagesById, generateChapterImagesByPattern } from './core/image-generator.js';
import { getDecorations } from './core/decorations.js';
import { loadChannel, listChannels } from './channels/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_OUTPUT = join(__dirname, '..', '..', 'output');

// ─── DOCX → structured chapters ──────────────────────────────
async function extractDocxChapters(filePath, channelConfig) {
  const result = await mammoth.convertToHtml({ path: filePath });
  let html = result.value;

  // Cleanup AI instructions
  html = html.replace(/<p>Tôi sẽ viết cho bạn[^<]*<\/p>/g, '');
  html = html.replace(/<p>📊[^<]*<\/p>/g, '');
  html = html.replace(/<p>🔚[^<]*<\/p>/g, '');
  html = html.replace(/<p>📝 Giọng văn[^<]*<\/p>/g, '');
  html = html.replace(/<p>🎯 Mục tiêu[^<]*<\/p>/g, '');

  // Normalize headings: strip <strong> inside h1/h2
  html = html.replace(/<(h[12])><strong>([^<]*)<\/strong><\/(h[12])>/g, '<$1>$2</$3>');

  // Split by channel's chapter pattern
  const pattern = channelConfig.chapterPattern;
  const parts = html.split(pattern);
  const chapters = [];

  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i].trim();
    const content = (parts[i + 1] || '').trim();
    // Skip book-title headings
    if (/^📖/.test(title) || /^CHỮA LÀNH TỪ GỐC RỄ$/.test(title)) continue;
    chapters.push({ title, content });
  }

  return chapters;
}

// ─── Build chapters HTML for DOCX input ───────────────────────
function buildDocxChaptersHtml(chapters, ebook, channelConfig, { images, enhance }) {
  const decorations = getDecorations(channelConfig.decorationStyle);
  let html = '';

  chapters.forEach((ch, idx) => {
    const isPart = /^PHẦN \d+/i.test(ch.title);
    const isDay = /^NGÀY \d+/i.test(ch.title);
    const isModule = /^MODULE \d+/i.test(ch.title);

    let content = ch.content;
    // Normalize sub-headings
    content = content.replace(/<h2><strong>([^<]*)<\/strong><\/h2>/g, '<h3>$1</h3>');
    content = content.replace(/<h2>([^<]*)<\/h2>/g, '<h3>$1</h3>');
    content = content.replace(/<h3><strong>([^<]*)<\/strong><\/h3>/g, '<h4>$1</h4>');

    // Exercise headings
    content = content.replace(/<h3>(BÀI TẬP[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
    content = content.replace(/<h3>(Bài tập[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
    content = content.replace(/<h4>(BÀI TẬP[^<]*)<\/h4>/gi, '<h3 class="exercise">📝 $1</h3>');

    // Checkmarks
    content = content.replace(/<p>([✓✔☑]) /g, '<p class="checklist-item">');

    // Fix mammoth tables
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

// ─── Build chapters HTML for Markdown input ───────────────────
async function buildMarkdownChaptersHtml(ebook, channelConfig, outputDir, { chapterImages, enhance }) {
  const decorations = getDecorations(channelConfig.decorationStyle);
  const chaptersDir = join(outputDir, ebook.id, 'chapters');

  if (!existsSync(chaptersDir)) {
    throw new Error(`Chapters directory not found: ${chaptersDir}. Generate chapters first.`);
  }

  let html = '';
  let chapterNum = 0;

  for (const chapter of ebook.chapters) {
    const chapterFile = join(chaptersDir, `${chapter.id}.md`);
    if (!existsSync(chapterFile)) {
      console.warn(`  ⚠️  Missing: ${chapter.id} — skipping`);
      continue;
    }

    chapterNum++;
    const markdown = await readFile(chapterFile, 'utf-8');
    const mdWithoutTitle = markdown.replace(/^## .+\n+/, '');
    let chapterHtml = markdownToHtml(mdWithoutTitle);
    chapterHtml = enhanceFrameworks(chapterHtml);
    chapterHtml = enhanceInsights(chapterHtml);
    chapterHtml = enhanceExerciseHeadings(chapterHtml);

    if (enhance) {
      chapterHtml = enhancePullQuotes(chapterHtml);
      chapterHtml = chapterHtml.replace(/<h3>/g, `${decorations.divider}<h3>`);
    }

    const numStr = String(chapterNum).padStart(2, '0');

    // Header image
    const imageB64 = chapterImages?.get(chapter.id);
    const imageHtml = imageB64
      ? `<div class="chapter-illustration"><img src="${imageB64}" alt="chapter illustration" /></div>`
      : '';

    // Mid-chapter image
    const midImageB64 = chapterImages?.get(chapter.id + '-mid');
    if (midImageB64) {
      const h3Matches = [...chapterHtml.matchAll(/<h3/g)];
      const midImgTag = `<div class="chapter-illustration"><img src="${midImageB64}" alt="illustration" /></div>\n`;
      if (h3Matches.length >= 2) {
        const pos = h3Matches[Math.floor(h3Matches.length / 2)].index;
        chapterHtml = chapterHtml.slice(0, pos) + midImgTag + chapterHtml.slice(pos);
      } else {
        const paraEnds = [...chapterHtml.matchAll(/<\/p>/g)];
        if (paraEnds.length >= 4) {
          const pos = paraEnds[Math.floor(paraEnds.length / 2)].index + 4;
          chapterHtml = chapterHtml.slice(0, pos) + midImgTag + chapterHtml.slice(pos);
        }
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
  <div class="chapter-content">${chapterHtml}</div>
  ${endOrnament}
</div>
`;
    const wordCount = markdown.split(/\s+/).length;
    console.log(`  📄 Ch ${numStr}: ${chapter.title} (${wordCount} words)${imageB64 ? ' 🖼️' : ''}`);
  }

  return html;
}

// ─── Build one ebook (unified) ────────────────────────────────
async function buildOne(ebook, channelConfig, { enhance = false } = {}) {
  const outputDir = join(BASE_OUTPUT, `ebooks-${channelConfig.channelId}`);
  const ebookDir = join(outputDir, ebook.id);
  await mkdir(ebookDir, { recursive: true });

  const theme = channelConfig.themes[ebook.tier];
  const css = getBookCSS(theme);
  const cacheDir = join(ebookDir, 'images');
  const mode = enhance ? '✨ ENHANCED' : 'Standard';
  console.log(`\n📖 Building: "${ebook.title}" (${ebook.tier}) [${mode}]`);

  // ─── Generate images ──────────────────────────
  let chapterImages = null;
  let coverImgs = {};

  if (enhance) {
    const imagePrompts = channelConfig.chapterImages?.[ebook.id] || [];
    const coverPrompts = channelConfig.coverImages?.[ebook.id];
    const imgStyle = channelConfig.imageStyle;

    // Cover images
    if (coverPrompts) {
      console.log('  🎨 Generating cover images...');
      coverImgs = await generateCoverImages(coverPrompts, ebook.tier, imgStyle, cacheDir);
    }

    // Chapter images
    if (imagePrompts.length > 0) {
      console.log('  🎨 Generating chapter images...');
      if (channelConfig.inputType === 'markdown') {
        chapterImages = await generateChapterImagesById(imagePrompts, ebook.tier, imgStyle, cacheDir);
      } else {
        // For DOCX we generate after extracting chapters, using pattern match
        // Store prompts for later
        chapterImages = '__deferred__';
      }
    }
  }

  // ─── Build chapters ───────────────────────────
  let chaptersHtml = '';
  let tocChapters = [];

  if (channelConfig.inputType === 'markdown') {
    chaptersHtml = await buildMarkdownChaptersHtml(ebook, channelConfig, outputDir, {
      chapterImages,
      enhance,
    });
    tocChapters = ebook.chapters;
  } else {
    // DOCX path
    if (!ebook.file || !existsSync(ebook.file)) {
      throw new Error(`DOCX file not found: ${ebook.file}`);
    }
    console.log(`  📄 Extracting from DOCX: ${ebook.file}`);
    const docxChapters = await extractDocxChapters(ebook.file, channelConfig);
    console.log(`  📑 Found ${docxChapters.length} chapters`);
    tocChapters = docxChapters;

    // Deferred pattern-based image generation for DOCX
    let images = null;
    if (chapterImages === '__deferred__' && enhance) {
      const imagePrompts = channelConfig.chapterImages?.[ebook.id] || [];
      images = await generateChapterImagesByPattern(imagePrompts, docxChapters, ebook.tier, channelConfig.imageStyle, cacheDir);
      console.log(`  🖼️ ${images.size} chapter images ready`);
    }

    chaptersHtml = buildDocxChaptersHtml(docxChapters, ebook, channelConfig, { images, enhance });
  }

  if (!chaptersHtml) {
    throw new Error('No chapter content generated');
  }

  // ─── Build TOC ────────────────────────────────
  const tocConfig = {
    chapters: tocChapters,
    parts: channelConfig.tocParts,
    partDetect: channelConfig.inputType === 'docx' ? 'title-regex' : 'id-prefix',
  };

  // ─── Assemble full HTML ───────────────────────
  const introQuote = channelConfig.introQuotes?.[ebook.id];
  const fullHtml = buildBookHtml({
    ebook,
    css,
    chaptersHtml,
    author: channelConfig.author,
    publisher: channelConfig.publisher,
    coverImages: coverImgs,
    introQuote,
    tocConfig,
  });

  // ─── Save HTML ────────────────────────────────
  const suffix = enhance ? '-enhanced' : '-print';
  const htmlPath = join(ebookDir, `${ebook.id}${suffix}.html`);
  await saveHtml(htmlPath, fullHtml);
  console.log(`  💾 HTML: ${htmlPath}`);

  // ─── Render PDF ───────────────────────────────
  console.log('  🖨️ Rendering PDF (B5)...');
  const pdfPath = join(ebookDir, `${ebook.id}.pdf`);
  await renderPdf(fullHtml, pdfPath, {
    author: channelConfig.author,
    title: ebook.title,
  });

  const pdfBuf = await readFile(pdfPath);
  const sizeMB = (pdfBuf.length / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ PDF: ${pdfPath} (${sizeMB} MB)`);

  return { id: ebook.id, pdfPath, sizeMB, chapters: tocChapters.length, enhanced: !!enhance };
}

// ─── PDF-only re-render from existing HTML ────────────────────
async function pdfOnly(ebook, channelConfig) {
  const outputDir = join(BASE_OUTPUT, `ebooks-${channelConfig.channelId}`);
  const ebookDir = join(outputDir, ebook.id);
  const htmlPath = join(ebookDir, `${ebook.id}-print.html`);
  const enhancedPath = join(ebookDir, `${ebook.id}-enhanced.html`);
  const srcFile = existsSync(enhancedPath) ? enhancedPath : htmlPath;

  if (!existsSync(srcFile)) {
    console.error(`  ❌ No HTML found: ${srcFile}`);
    return null;
  }

  console.log(`  🖨️ Re-rendering: ${ebook.title}...`);
  const html = await readFile(srcFile, 'utf-8');
  const pdfPath = join(ebookDir, `${ebook.id}.pdf`);
  await renderPdf(html, pdfPath, { author: channelConfig.author, title: ebook.title });

  const pdfBuf = await readFile(pdfPath);
  const sizeMB = (pdfBuf.length / (1024 * 1024)).toFixed(2);
  console.log(`  ✅ PDF: ${pdfPath} (${sizeMB} MB)`);
  return { id: ebook.id, pdfPath, sizeMB };
}

// ─── CLI ─────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  // --list: show available channels
  if (args.includes('--list')) {
    const channels = await listChannels();
    console.log('\n📋 Available channels:');
    for (const id of channels) {
      const cfg = await loadChannel(id);
      console.log(`  • ${id} — ${cfg.channelName} (${cfg.inputType}, ${cfg.ebooks.length} ebooks)`);
    }
    return;
  }

  // Parse args
  let channelId = null;
  let ebookIndex = null;
  const enhance = args.includes('--enhance');
  const isPdfOnly = args.includes('--pdf-only');

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--channel' && args[i + 1]) { channelId = args[i + 1]; i++; }
    if (args[i] === '--ebook' && args[i + 1]) { ebookIndex = parseInt(args[i + 1], 10) - 1; i++; }
  }

  if (!channelId) {
    console.error('❌ Missing --channel. Use --list to see available channels.');
    process.exit(1);
  }

  const channelConfig = await loadChannel(channelId);
  const selected = ebookIndex !== null
    ? [channelConfig.ebooks[ebookIndex]].filter(Boolean)
    : channelConfig.ebooks;

  if (selected.length === 0) {
    console.error(`❌ Invalid ebook index. Channel "${channelId}" has ${channelConfig.ebooks.length} ebooks.`);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  📖 ${channelConfig.channelName} — Ebook Builder${enhance ? ' ✨ ENHANCED' : ''}${isPdfOnly ? ' 🖨️ PDF-ONLY' : ''}`);
  console.log('═'.repeat(60));

  const results = [];
  for (const ebook of selected) {
    try {
      const result = isPdfOnly
        ? await pdfOnly(ebook, channelConfig)
        : await buildOne(ebook, channelConfig, { enhance });
      if (result) results.push(result);
    } catch (err) {
      console.error(`  ❌ ${ebook.id}: ${err.message}`);
      results.push({ id: ebook.id, error: err.message });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ BUILD COMPLETE');
  results.forEach(r => {
    if (r.error) console.log(`  ❌ ${r.id}: ${r.error}`);
    else console.log(`  📄 ${r.id}: ${r.chapters ?? '?'} chapters, ${r.sizeMB} MB${r.enhanced ? ' ✨' : ''}`);
  });
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('\n💥 Build failed:', err);
  process.exit(1);
});
