/**
 * 📄 HTML Template Builder — Assembles book pages
 * Generic template that works with any channel config.
 */

/**
 * Build a complete book HTML document
 * @param {object} options
 * @param {object} options.ebook - Ebook definition { id, title, subtitle, tier, tagline }
 * @param {string} options.css - Complete CSS string
 * @param {string} options.chaptersHtml - Rendered chapters HTML
 * @param {Array} options.chapters - Chapter list for TOC
 * @param {string} options.author - Author name
 * @param {string} options.publisher - Publisher/channel name
 * @param {object} [options.coverImages] - { cover?, intro? } as dataUrl strings
 * @param {object} [options.introQuote] - { text, attribution }
 * @param {object} [options.tocConfig] - { parts?: Record<string, string> } for part headers
 * @returns {string} Full HTML document
 */
export function buildBookHtml({
  ebook,
  css,
  chaptersHtml,
  chapters,
  author,
  publisher,
  coverImages = {},
  introQuote = {},
  tocConfig = {},
}) {
  const tierLabel = { free: 'FREE EDITION', paid: 'PREMIUM EDITION', premium: 'ULTIMATE EDITION' }[ebook.tier] || 'EDITION';
  const year = new Date().getFullYear();

  const coverPage = buildCoverPage(ebook, author, coverImages.cover, tierLabel);
  const introPage = buildIntroPage(coverImages.intro, introQuote);
  const titlePage = buildTitlePage(ebook, author, publisher);
  const colophon = buildColophon(ebook, author, publisher, year);
  const toc = buildTOC(chapters, tocConfig.parts);

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${ebook.title} — ${author}</title>
<style>${css}</style>
</head>
<body>

${coverPage}
${introPage}
${titlePage}
${colophon}
${toc}
${chaptersHtml}

</body>
</html>`;
}

function buildCoverPage(ebook, author, coverImageUrl, tierLabel) {
  const coverBg = coverImageUrl
    ? `<img class="cover-bg" src="${coverImageUrl}" alt="" />\n  <div class="cover-overlay"></div>`
    : '';

  return `
<div class="cover-page">
  ${coverBg}
  <div class="cover-content">
    <div class="tier-badge">${tierLabel}</div>
    <div class="book-title">${ebook.title}</div>
    <div class="book-subtitle">${ebook.subtitle || ''}</div>
    <div class="cover-divider"></div>
    <div class="author-name">${author.toUpperCase()}</div>
    ${ebook.tagline ? `<div class="tagline">${ebook.tagline}</div>` : ''}
  </div>
</div>`;
}

function buildIntroPage(introImageUrl, quote) {
  if (!introImageUrl && !quote?.text) return '';
  return `
<div class="intro-page">
  ${introImageUrl ? `<img class="intro-illustration" src="${introImageUrl}" alt="" />` : ''}
  ${quote?.text ? `<div class="intro-quote">${quote.text.replace(/\n/g, '<br/>')}</div>` : ''}
  ${quote?.attribution ? `<div class="intro-attribution">${quote.attribution}</div>` : ''}
</div>`;
}

function buildTitlePage(ebook, author, publisher) {
  return `
<div class="title-page">
  <h1>${ebook.title}</h1>
  <div class="subtitle">${ebook.subtitle || ''}</div>
  <div class="author">${author}</div>
  <div class="publisher">${publisher}</div>
</div>`;
}

function buildColophon(ebook, author, publisher, year) {
  return `
<div class="colophon">
  <p><strong>${ebook.title}</strong></p>
  <p>${ebook.subtitle || ''}</p>
  <p>&nbsp;</p>
  <p>Tác giả: ${author}</p>
  <p>Kênh: ${publisher}</p>
  <p>&nbsp;</p>
  <p>© ${year} ${author}. Bảo lưu mọi quyền.</p>
  <p>Không được phép sao chép, phân phối lại dưới bất kỳ hình thức nào</p>
  <p>mà không có sự đồng ý bằng văn bản của tác giả.</p>
</div>`;
}

function buildTOC(chapters, parts = {}) {
  let html = '<div class="toc-page"><h2>Mục Lục</h2>\n';
  let lastPart = '';

  chapters.forEach((ch, i) => {
    // Check for part headers (by id prefix or title pattern)
    if (parts) {
      for (const [prefix, partTitle] of Object.entries(parts)) {
        const id = ch.id || '';
        const title = ch.title || '';
        if ((id.startsWith(prefix) || new RegExp(prefix, 'i').test(title)) && lastPart !== prefix) {
          html += `<div class="toc-part">${partTitle}</div>\n`;
          lastPart = prefix;
        }
      }
    }

    // Detect part entries by title pattern
    const isPart = /^PHẦN \d+/i.test(ch.title);
    if (isPart) {
      html += `<div class="toc-part">${ch.title}</div>\n`;
    } else {
      const num = String(i + 1).padStart(2, '0');
      html += `<div class="toc-entry"><span class="toc-num">${num}</span><span class="toc-title">${ch.title}</span><span class="toc-dots"></span></div>\n`;
    }
  });

  html += '</div>';
  return html;
}
