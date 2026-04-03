/**
 * 📋 Channel Config Schema/Template
 * Every channel must export these fields.
 * 
 * Usage: Copy this template to create a new channel:
 *   channels/[channel-name]/config.js
 */

/**
 * @typedef {object} ChannelConfig
 * @property {string} channelId - Unique short ID (e.g. 'riseshine', 'dungdaydi')
 * @property {string} channelName - Display name
 * @property {string} author - Author name 
 * @property {string} publisher - Publisher/channel display
 * @property {string} lang - Language code ('vi', 'en')
 * @property {'markdown' | 'docx'} inputType - Content source type
 * @property {'noir' | 'lotus' | 'minimal'} decorationStyle - SVG decoration set
 * @property {object} imageStyle - { base, palette: { free, paid, premium }, mood }
 * @property {object} themes - { free: BookTheme, paid: BookTheme, premium: BookTheme }
 * @property {Array<EbookDef>} ebooks - Array of ebook definitions
 * @property {object} [chapterImages] - { [ebookId]: Array<{ match?, id?, prompt }> }
 * @property {object} [coverImages] - { [ebookId]: { cover: string, intro?: string } }
 * @property {object} [introQuotes] - { [ebookId]: { text, attribution } }
 * @property {object} [voiceSystem] - System prompt for AI content generation
 * @property {object} [tocParts] - { [prefix]: partTitle } for TOC grouping
 * @property {RegExp} [chapterPattern] - Regex to split DOCX content into chapters
 */

/**
 * @typedef {object} EbookDef
 * @property {string} id - Unique ebook ID
 * @property {string} tier - 'free' | 'paid' | 'premium'
 * @property {string} title - Book title
 * @property {string} subtitle - Book subtitle
 * @property {string} [tagline] - Short tagline
 * @property {string} [file] - DOCX file path (for docx inputType)
 * @property {Array} [chapters] - Chapter definitions (for markdown inputType)
 */

/**
 * @typedef {object} BookTheme
 * @property {string} primary - Primary color hex
 * @property {string} accent - Accent color hex  
 * @property {string} light - Light background hex
 * @property {string} gradient - CSS gradient string
 */

// Template export - copy and fill in:
export const TEMPLATE_CONFIG = {
  channelId: 'my-channel',
  channelName: 'My Channel',
  author: 'Author Name',
  publisher: 'Publisher Name',
  lang: 'vi',
  inputType: 'docx', // or 'markdown'
  decorationStyle: 'minimal', // 'noir', 'lotus', 'minimal'

  themes: {
    free: { primary: '#4A148C', accent: '#7B1FA2', light: '#F3E5F5', gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4A148C 100%)' },
    paid: { primary: '#00695C', accent: '#00897B', light: '#E0F2F1', gradient: 'linear-gradient(135deg, #0a2e2a 0%, #1b4e47 50%, #00695C 100%)' },
    premium: { primary: '#BF360C', accent: '#E64A19', light: '#FBE9E7', gradient: 'linear-gradient(135deg, #2e0a00 0%, #4e1b0a 50%, #BF360C 100%)' },
  },

  imageStyle: {
    base: 'Anime-inspired dreamy realism style. No text, no watermarks. High detail digital painting.',
    palette: {
      free: 'Soft purple and lavender palette.',
      paid: 'Teal and emerald palette.',
      premium: 'Deep orange and amber palette.',
    },
    mood: 'Contemplative, healing, emotionally resonant.',
  },

  ebooks: [
    {
      id: 'my-channel-1-free',
      tier: 'free',
      title: 'Ebook Title',
      subtitle: 'Ebook Subtitle',
      tagline: 'Short tagline',
      file: '/path/to/file.docx', // for docx type
      // chapters: [...],          // for markdown type
    },
  ],

  chapterImages: {},
  coverImages: {},
  introQuotes: {},
};
