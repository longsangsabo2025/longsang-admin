/**
 * 🎭 SVG Decorative Elements — Reusable ornaments and dividers
 */

export const SVG_DIVIDER = `<div class="svg-divider"><svg width="120" height="20" viewBox="0 0 120 20" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="10" x2="50" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/><polygon points="55,5 65,10 55,15" fill="currentColor" opacity="0.4"/><line x1="70" y1="10" x2="110" y2="10" stroke="currentColor" stroke-width="1" opacity="0.3"/></svg></div>`;

export const SVG_DIVIDER_LOTUS = `<div class="svg-divider"><svg width="120" height="30" viewBox="0 0 120 30" xmlns="http://www.w3.org/2000/svg"><path d="M60 5 C55 0, 45 2, 40 10 C35 18, 42 25, 60 28 C78 25, 85 18, 80 10 C75 2, 65 0, 60 5z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/><path d="M60 8 C57 5, 50 6, 47 12 C44 18, 49 23, 60 25 C71 23, 76 18, 73 12 C70 6, 63 5, 60 8z" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/><circle cx="60" cy="15" r="3" fill="currentColor" opacity="0.3"/><line x1="20" y1="15" x2="42" y2="15" stroke="currentColor" stroke-width="0.5" opacity="0.2"/><line x1="78" y1="15" x2="100" y2="15" stroke="currentColor" stroke-width="0.5" opacity="0.2"/></svg></div>`;

export const SVG_DIVIDER_DOTS = `<div class="svg-divider"><svg width="80" height="10" viewBox="0 0 80 10" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="5" r="2" fill="currentColor" opacity="0.2"/><circle cx="40" cy="5" r="3" fill="currentColor" opacity="0.4"/><circle cx="60" cy="5" r="2" fill="currentColor" opacity="0.2"/></svg></div>`;

export const SVG_CHAPTER_ORNAMENT = `<div class="chapter-ornament"><svg width="200" height="30" viewBox="0 0 200 30" xmlns="http://www.w3.org/2000/svg"><line x1="10" y1="15" x2="80" y2="15" stroke="currentColor" stroke-width="0.5" opacity="0.3"/><polygon points="90,8 100,15 90,22" fill="currentColor" opacity="0.25"/><polygon points="110,8 100,15 110,22" fill="currentColor" opacity="0.25"/><line x1="120" y1="15" x2="190" y2="15" stroke="currentColor" stroke-width="0.5" opacity="0.3"/></svg></div>`;

export const SVG_CHAPTER_ORNAMENT_WAVE = `<div class="chapter-ornament"><svg width="200" height="40" viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg"><path d="M30 20 Q50 5, 70 20 Q90 35, 100 20 Q110 5, 130 20 Q150 35, 170 20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/><circle cx="100" cy="20" r="4" fill="currentColor" opacity="0.2"/><line x1="10" y1="20" x2="30" y2="20" stroke="currentColor" stroke-width="0.5" opacity="0.15"/><line x1="170" y1="20" x2="190" y2="20" stroke="currentColor" stroke-width="0.5" opacity="0.15"/></svg></div>`;

export const SVG_CHAPTER_END = `<div class="chapter-end-ornament"><svg width="60" height="20" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg"><rect x="15" y="5" width="10" height="10" fill="currentColor" opacity="0.15" transform="rotate(45,20,10)"/><rect x="35" y="5" width="10" height="10" fill="currentColor" opacity="0.15" transform="rotate(45,40,10)"/></svg></div>`;

export const SVG_CHAPTER_END_DIAMOND = `<div class="chapter-end-ornament"><svg width="60" height="30" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg"><path d="M10 15 L25 5 L30 15 L25 25 Z" fill="currentColor" opacity="0.15"/><path d="M30 15 L35 5 L50 15 L35 25 Z" fill="currentColor" opacity="0.15"/></svg></div>`;

/**
 * Get a decorative set by style name
 * @param {'noir' | 'lotus' | 'minimal'} style
 * @returns {{ divider, chapterOrnament, chapterEnd }}
 */
export function getDecorations(style = 'minimal') {
  switch (style) {
    case 'noir':
      return {
        divider: SVG_DIVIDER,
        chapterOrnament: SVG_CHAPTER_ORNAMENT,
        chapterEnd: SVG_CHAPTER_END,
      };
    case 'lotus':
      return {
        divider: SVG_DIVIDER_DOTS,
        chapterOrnament: SVG_CHAPTER_ORNAMENT_WAVE,
        chapterEnd: SVG_CHAPTER_END_DIAMOND,
      };
    case 'minimal':
    default:
      return {
        divider: SVG_DIVIDER_DOTS,
        chapterOrnament: SVG_CHAPTER_ORNAMENT,
        chapterEnd: SVG_CHAPTER_END,
      };
  }
}
