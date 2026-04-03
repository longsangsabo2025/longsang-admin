/**
 * 🎨 Book CSS Generator — Theme-driven print stylesheets
 * Generates professional book CSS from a color theme config.
 */

/**
 * @typedef {object} BookTheme
 * @property {string} primary - Primary color (e.g. '#4A148C')
 * @property {string} accent - Accent color (e.g. '#7B1FA2')
 * @property {string} light - Light background (e.g. '#F3E5F5')
 * @property {string} gradient - CSS gradient for cover page
 */

/**
 * Generate complete book CSS from a theme
 * @param {BookTheme} theme
 * @returns {string} CSS stylesheet
 */
export function getBookCSS(theme) {
  return `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans:wght@400;600;700&display=swap');

:root {
  --primary: ${theme.primary};
  --accent: ${theme.accent};
  --light: ${theme.light};
  --text: #1a1a1a;
  --text-light: #555;
  --text-muted: #888;
  --bg: #fff;
  --border: #ddd;
}

@page { size: B5; margin: 20mm 18mm 22mm 22mm; }
@page :first { margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Noto Serif', 'Georgia', 'Times New Roman', serif;
  font-size: 14pt; line-height: 1.8; color: var(--text); background: var(--bg);
  text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased;
  orphans: 2; widows: 2;
}

/* ─── COVER PAGE ──────────────────────────────────────── */
.cover-page {
  page-break-after: always; position: relative; overflow: hidden;
  min-height: 100vh; text-align: center; padding: 0;
  background: ${theme.gradient}; color: white;
}
.cover-page .cover-bg {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  object-fit: cover; opacity: 0.55; z-index: 0;
}
.cover-page .cover-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 80%, rgba(0,0,0,0.9) 100%);
  z-index: 1;
}
.cover-page .cover-content {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
  min-height: 100vh; padding: 60px 40px 80px;
}
.cover-page .tier-badge {
  display: inline-block; padding: 6px 24px; border: 2px solid var(--accent);
  color: var(--accent); font-family: 'Noto Sans', sans-serif; font-size: 10pt;
  letter-spacing: 4px; text-transform: uppercase; margin-bottom: 24px;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
}
.cover-page .book-title {
  font-size: 34pt; font-weight: 700; line-height: 1.2; margin-bottom: 12px;
  text-shadow: 0 2px 20px rgba(0,0,0,0.6), 0 4px 40px rgba(0,0,0,0.3);
  color: #fff; letter-spacing: 1px;
}
.cover-page .book-subtitle {
  font-size: 16pt; font-style: italic; color: rgba(255,255,255,0.8); margin-bottom: 30px;
  text-shadow: 0 1px 10px rgba(0,0,0,0.5);
}
.cover-page .cover-divider {
  width: 80px; height: 3px; background: var(--accent); margin: 0 auto 24px;
  box-shadow: 0 0 12px var(--accent);
}
.cover-page .author-name {
  font-family: 'Noto Sans', sans-serif; font-size: 18pt; font-weight: 700;
  letter-spacing: 3px; color: rgba(255,255,255,0.95);
  text-shadow: 0 1px 8px rgba(0,0,0,0.4);
}
.cover-page .tagline {
  font-size: 9pt; color: rgba(255,255,255,0.5); margin-top: 8px; letter-spacing: 1px;
}

/* ─── INNER TITLE PAGE ────────────────────────────────── */
.title-page {
  page-break-after: always;
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  min-height: 80vh; text-align: center; padding: 80px 40px;
}
.title-page h1 { font-size: 28pt; color: var(--primary); margin-bottom: 12px; }
.title-page .subtitle { font-size: 15pt; color: var(--text-light); font-style: italic; margin-bottom: 40px; }
.title-page .author { font-family: 'Noto Sans', sans-serif; font-size: 16pt; color: var(--text); font-weight: 600; }
.title-page .publisher { font-size: 10pt; color: var(--text-muted); margin-top: 30px; }

/* ─── INTRO / QUOTE PAGE ──────────────────────────────── */
.intro-page {
  page-break-after: always; display: flex; flex-direction: column;
  justify-content: center; align-items: center;
  min-height: 100vh; text-align: center; padding: 40px;
}
.intro-page .intro-illustration {
  width: 85%; max-width: 440px; border-radius: 12px;
  box-shadow: 0 12px 48px rgba(0,0,0,0.2); object-fit: cover; margin-bottom: 40px;
}
.intro-page .intro-quote {
  font-family: 'Noto Serif', serif; font-size: 14pt; font-style: italic;
  color: var(--primary); line-height: 2; max-width: 400px;
}
.intro-page .intro-attribution {
  font-family: 'Noto Sans', sans-serif; font-size: 10pt; color: var(--text-muted);
  margin-top: 12px; letter-spacing: 2px;
}

/* ─── COPYRIGHT / COLOPHON ────────────────────────────── */
.colophon {
  page-break-after: always; display: flex; flex-direction: column;
  justify-content: flex-end; min-height: 80vh; padding: 80px 40px;
  font-size: 10pt; color: var(--text-muted); line-height: 1.6;
}

/* ─── TABLE OF CONTENTS ───────────────────────────────── */
.toc-page { page-break-after: always; padding: 40px 0; }
.toc-page h2 {
  font-size: 20pt; color: var(--primary); text-align: center;
  margin-bottom: 30px; border: none;
}
.toc-entry {
  display: flex; align-items: baseline; padding: 4px 0;
  border-bottom: 1px dotted var(--border); font-size: 11pt;
}
.toc-num {
  font-family: 'Noto Sans', sans-serif; color: var(--accent);
  font-weight: 600; min-width: 30px;
}
.toc-title { flex: 1; color: var(--text); }
.toc-dots { flex: 0; }
.toc-part {
  font-family: 'Noto Sans', sans-serif; font-size: 9pt;
  color: var(--accent); letter-spacing: 3px; text-transform: uppercase;
  margin: 16px 0 6px; padding-top: 8px; border-top: 1px solid var(--light);
}

/* ─── CHAPTER ─────────────────────────────────────── */
.chapter { page-break-before: always; }
.chapter-header {
  text-align: center; padding: 40px 0 20px; margin-bottom: 16px;
  border-bottom: 2px solid var(--light);
}
.chapter-header .chapter-number {
  font-family: 'Noto Sans', sans-serif; font-size: 9pt; color: var(--accent);
  letter-spacing: 4px; text-transform: uppercase; margin-bottom: 10px;
}
.chapter-header h2.chapter-title {
  font-size: 17pt; color: var(--primary); line-height: 1.3;
  margin: 0; border: none; padding: 0; text-align: center;
}

/* ─── HEADINGS ────────────────────────────────────── */
h1 { font-size: 18pt; color: var(--primary); margin: 28px 0 12px; }
h2 { font-size: 14pt; color: var(--primary); margin: 24px 0 10px; border-bottom: 2px solid var(--light); padding-bottom: 6px; }
h3 { font-size: 11.5pt; color: var(--accent); margin: 18px 0 8px; font-family: 'Noto Sans', sans-serif; }
h4 { font-size: 10pt; color: var(--text); margin: 14px 0 6px; font-family: 'Noto Sans', sans-serif; font-weight: 700; }
h3.exercise {
  background: var(--light); padding: 8px 14px; border-radius: 6px;
  border-left: 4px solid var(--accent); margin: 18px 0 10px;
}

/* ─── TEXT ────────────────────────────────────────── */
p { margin: 0 0 8px; text-align: justify; text-indent: 1.2em; hyphens: auto; }
p:first-of-type, h2 + p, h3 + p, h4 + p, blockquote + p { text-indent: 0; }
.chapter-content > p:first-of-type::first-letter {
  float: left; font-size: 3em; line-height: 0.8;
  padding: 3px 6px 0 0; color: var(--primary); font-weight: 700;
}

blockquote {
  margin: 12px 0; padding: 10px 16px; border-left: 3px solid var(--accent);
  background: var(--light); font-style: italic; color: var(--text-light); border-radius: 0 4px 4px 0;
}
blockquote p { text-indent: 0; margin: 0; }
strong { color: var(--primary); }
em { font-style: italic; }
p.checklist-item { text-indent: 0; padding-left: 1.5em; position: relative; }
p.checklist-item::before { content: '✓'; position: absolute; left: 0; color: var(--accent); font-weight: 700; }

/* ─── LISTS ───────────────────────────────────────── */
ul, ol { margin: 8px 0; padding-left: 1.6em; }
li { margin-bottom: 4px; text-align: justify; }
li strong { color: var(--accent); }

/* ─── TABLE ───────────────────────────────────────── */
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 10pt; border: 1px solid var(--border); }
th { background: var(--light); color: var(--text); padding: 8px 12px; text-align: left; font-family: 'Noto Sans', sans-serif; font-weight: 700; border: 1px solid var(--border); }
th strong { color: var(--primary); }
td { padding: 8px 12px; border: 1px solid var(--border); }
td:empty { min-height: 1.2em; }
tr:nth-child(even) td { background: var(--light); }

/* ─── SECTION BREAK ───────────────────────────────── */
.section-break { text-align: center; margin: 18px 0; font-size: 12pt; color: var(--text-muted); letter-spacing: 8px; }

/* ─── CHAPTER ILLUSTRATION ────────────────────── */
.chapter-illustration { text-align: center; margin: 12px 0 16px; page-break-after: avoid; }
.chapter-illustration img {
  max-width: 80%; max-height: 240px; border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.1); object-fit: cover;
}

/* ─── DECORATIVE SVG ──────────────────────────── */
.svg-divider { text-align: center; margin: 14px 0; color: var(--accent); }
.chapter-ornament { text-align: center; margin: 8px 0 14px; color: var(--accent); }
.chapter-end-ornament { text-align: center; margin: 18px 0 6px; color: var(--text-muted); }

/* ─── PULL QUOTE ──────────────────────────────── */
.pull-quote {
  position: relative; margin: 16px 14px; padding: 14px 20px;
  border: none; font-size: 11pt; font-style: italic;
  color: var(--primary); text-align: center; line-height: 1.5;
  background: linear-gradient(135deg, var(--light) 0%, rgba(255,255,255,0.5) 100%);
  border-radius: 6px;
}
.pull-quote::before {
  content: '\\201C'; position: absolute; top: -6px; left: 8px;
  font-size: 36pt; color: var(--accent); opacity: 0.3; font-family: Georgia, serif;
}
.pull-quote::after {
  content: '\\201D'; position: absolute; bottom: -14px; right: 8px;
  font-size: 36pt; color: var(--accent); opacity: 0.3; font-family: Georgia, serif;
}

/* ─── INSIGHT / FRAMEWORK BOX ─────────────────── */
.insight-box, .framework-box {
  margin: 12px 0; padding: 10px 14px 10px 40px;
  background: var(--light); border-radius: 6px;
  border-left: 3px solid var(--accent); position: relative;
}
.insight-box::before { content: '\\1F4A1'; position: absolute; left: 12px; top: 10px; font-size: 14pt; }
.insight-box p, .framework-box p { text-indent: 0; margin: 4px 0; }

/* ─── ENHANCED CHAPTER HEADER ─────────────────── */
.chapter-header-enhanced {
  text-align: center; padding: 30px 16px 16px; margin-bottom: 12px;
  background: linear-gradient(180deg, var(--light) 0%, rgba(255,255,255,0) 100%);
  border-radius: 0 0 16px 16px;
}

/* ─── PRINT ───────────────────────────────────────── */
.page-break { page-break-after: always; }
h2, h3, h4 { page-break-after: avoid; }
li { page-break-inside: avoid; }
`.trim();
}
