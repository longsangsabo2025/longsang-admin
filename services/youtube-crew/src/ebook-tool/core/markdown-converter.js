/**
 * 📝 Generic Markdown → HTML Converter
 * Supports headings, bold, italic, lists, tables, blockquotes, code.
 * Shared across all channels.
 */

/**
 * Convert markdown to HTML with book-quality formatting
 * @param {string} md - Raw markdown content
 * @returns {string} HTML string
 */
export function markdownToHtml(md) {
  let html = md
    // Headings
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="chapter-title">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?!\s)(.+?)(?<!\s)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Blockquotes (multi-line support)
    .replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>')
    // Unordered lists
    .replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[ \t]+[\*\-]\s+(.+)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\.\s+(.+)$/gm, '<li class="numbered">$1</li>')
    // Horizontal rules
    .replace(/^---$/gm, '<div class="section-break">***</div>');

  // Wrap consecutive <li> in <ul>/<ol>
  html = html.replace(/((?:<li class="numbered">.*?<\/li>\n?)+)/g, '<ol>$1</ol>');
  html = html.replace(/((?:<li>(?!class).*?<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Merge nested lists
  html = html.replace(
    /<li class="numbered">([\s\S]*?)<\/li>\s*<\/ol>\s*<ul>([\s\S]*?)<\/ul>/g,
    '<li class="numbered">$1<ul>$2</ul></li></ol>'
  );
  html = html.replace(/<\/ol>\s*<ol>/g, '');
  html = html.replace(/<\/blockquote>\n*<blockquote>/g, '');

  // Markdown tables
  html = html.replace(/(?:^|\n)((?:\|[^\n]+\|\n)+)/g, (match, tableBlock) => {
    const rows = tableBlock.trim().split('\n').filter(r => r.trim());
    if (rows.length < 2) return match;
    const dataRows = rows.filter(r => !/^\|[\s\-:|]+\|$/.test(r));
    if (dataRows.length === 0) return match;

    let tableHtml = '<table>';
    dataRows.forEach((row, i) => {
      const cells = row.split('|').slice(1, -1);
      const tag = i === 0 ? 'th' : 'td';
      tableHtml += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
    });
    tableHtml += '</table>';
    return tableHtml;
  });

  // Paragraphs
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<blockquote') ||
        block.startsWith('<ul') || block.startsWith('<ol') ||
        block.startsWith('<table') || block.startsWith('<div class="section') ||
        block.startsWith('<li')) return block;
    return `<p>${block.replace(/\n/g, '<br/>')}</p>`;
  }).filter(Boolean).join('\n');

  // Clean up <br/> artifacts around block elements
  html = html.replace(/<\/li>\s*<br\/>\s*<li/g, '</li><li');
  html = html.replace(/<\/li>\s*<br\/>\s*<\/(ul|ol)>/g, '</li></$1>');
  html = html.replace(/<br\/>\s*<(ul|ol|table|div)/g, '<$1');
  html = html.replace(/<\/(ul|ol|table|div)>\s*<br\/>/g, '</$1>');
  html = html.replace(/<br\/>\s*<\/p>\s*$/gm, '</p>');

  // Extract block elements trapped inside <p> tags
  html = html.replace(/<p>([\s\S]*?)<\/p>/g, (match, content) => {
    if (!/<(ul|ol|table|div|h[1-4]|blockquote)[\s>]/i.test(content)) return match;
    const blockMatch = content.match(/^([\s\S]*?)(<(?:ul|ol|table|div|h[1-4]|blockquote)[\s>][\s\S]*)$/);
    if (!blockMatch) return match;
    const before = blockMatch[1].replace(/<br\/>\s*$/g, '').trim();
    const rest = blockMatch[2].replace(/<\/p>$/, '');
    if (before) return `<p>${before}</p>\n${rest}`;
    return rest;
  });

  // Wrap orphaned inline content after closing block tags
  html = html.replace(
    /(<\/(ol|ul|div|table)>)\s*((?:<(?:strong|em|b|i|code|a|span)\b[^>]*>|[A-Za-zÀ-ỹ*_"])[\s\S]*?)(?=\s*<(?:ul|ol|table|div|h[1-6]|blockquote|p[ >]|section)|$)/g,
    (match, closer, tag, content) => {
      content = content.trim();
      if (!content || content.length < 3) return match;
      return `${closer}\n<p>${content}</p>`;
    }
  );

  html = html.replace(/<\/p>\s*(<em>[^<]+<\/em>[^<]*)/g, ' $1</p>');

  return html;
}

/**
 * Fix mammoth DOCX table structure.
 * Mammoth outputs all rows inside <thead> with <th> cells and <p> wrappers.
 * Fix: first row = <thead> <th>, rest = <tbody> <td>; strip <p> in cells.
 */
export function fixMammothTables(html) {
  return html.replace(/<table><thead>([\s\S]*?)<\/thead><\/table>/g, (match, inner) => {
    const rows = [...inner.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(m => m[1]);
    if (rows.length === 0) return match;
    const cleanCell = c => c.replace(/<\/?p>/g, '');
    const headerRow = `<tr>${cleanCell(rows[0])}</tr>`;
    const bodyRows = rows.slice(1).map(r => {
      const cleaned = cleanCell(r).replace(/<th(\b[^>]*)>/g, '<td$1>').replace(/<\/th>/g, '</td>');
      return `<tr>${cleaned}</tr>`;
    }).join('');
    return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
  });
}

/**
 * Enhance HTML with framework/action boxes
 */
export function enhanceFrameworks(html) {
  html = html.replace(
    /<h4>(Framework[^<]*|Cách phòng tránh[^<]*|Template[^<]*|Checklist[^<]*|Bài tập[^<]*|Thực hành[^<]*|Action Plan[^<]*|Kế hoạch[^<]*)<\/h4>([\s\S]*?)(?=<h[234]|<div class="section-break"|<div class="framework|<div class="insight|$)/gi,
    '<div class="framework-box"><h4>$1</h4>$2</div>'
  );
  return html;
}

/**
 * Enhance HTML with insight boxes
 */
export function enhanceInsights(html) {
  html = html.replace(
    /<h4>(Bài học[^<]*|Lưu ý[^<]*|Takeaway[^<]*|Key[^<]*|Insight[^<]*|Tóm tắt[^<]*|Điểm mấu chốt[^<]*|Sự thật[^<]*)<\/h4>([\s\S]*?)(?=<h[234]|<div class="section-break"|<div class="framework|<div class="insight|$)/gi,
    '<div class="insight-box"><h4>$1</h4>$2</div>'
  );
  return html;
}

/**
 * Style exercise/example headings
 */
export function enhanceExerciseHeadings(html) {
  html = html.replace(/<h3>(Bài tập[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
  html = html.replace(/<h3>(Thực hành[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
  html = html.replace(/<h3>(BÀI TẬP[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
  html = html.replace(/<h3>(Action[^<]*)<\/h3>/gi, '<h3 class="exercise">📝 $1</h3>');
  html = html.replace(/<h4>(Ví dụ[^<]*)<\/h4>/gi, '<h4 class="example">💬 $1</h4>');
  html = html.replace(/<h4>(Case Study[^<]*)<\/h4>/gi, '<h4 class="example">💬 $1</h4>');
  return html;
}

/**
 * Convert bold standalone sentences to pull-quotes
 */
export function enhancePullQuotes(html) {
  return html.replace(/<p><strong>([^<]{40,180})<\/strong><\/p>/g, (m, txt) => {
    if (/[.!?]$/.test(txt.trim()) && !/□|✓|Bước \d|Group|Pattern/i.test(txt)) {
      return `<div class="pull-quote"><p>${txt}</p></div>`;
    }
    return m;
  });
}
