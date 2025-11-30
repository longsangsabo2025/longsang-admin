import { ContentData } from '../types/automation';

// SEO Score Calculator
export function calculateSEOScore(content: ContentData): number {
  let score = 0;
  let maxScore = 100;
  
  // Title optimization (20 points)
  if (content.seo_title) {
    const titleLength = content.seo_title.length;
    if (titleLength >= 30 && titleLength <= 60) score += 20;
    else if (titleLength >= 20 && titleLength <= 70) score += 15;
    else score += 5;
  }
  
  // Description optimization (20 points)
  if (content.seo_description) {
    const descLength = content.seo_description.length;
    if (descLength >= 120 && descLength <= 160) score += 20;
    else if (descLength >= 100 && descLength <= 180) score += 15;
    else score += 5;
  }
  
  // Keywords optimization (15 points)
  if (content.target_keywords && content.target_keywords.length > 0) {
    score += Math.min(content.target_keywords.length * 5, 15);
  }
  
  // Content length (15 points)
  if (content.body) {
    const wordCount = content.body.split(' ').length;
    if (wordCount >= 300) score += 15;
    else if (wordCount >= 150) score += 10;
    else score += 5;
  }
  
  // Images with alt tags (10 points)
  if (content.images && content.images.length > 0) {
    score += Math.min(content.images.length * 2, 10);
  }
  
  // Tags optimization (10 points)
  if (content.tags && content.tags.length >= 3) {
    score += 10;
  } else if (content.tags && content.tags.length > 0) {
    score += 5;
  }
  
  // Schema markup (10 points)
  if (content.structured_data || content.schema_type) {
    score += 10;
  }
  
  return Math.min(score, maxScore);
}

// Generate SEO-optimized slug
export function generateSEOSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // Remove Vietnamese accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace special characters
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces with hyphens
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 60);
}

// Extract keywords from content
export function extractKeywords(content: string, limit: number = 10): string[] {
  const stopWords = new Set([
    'là', 'của', 'và', 'có', 'được', 'với', 'trong', 'cho', 'từ', 'về',
    'một', 'các', 'này', 'đó', 'để', 'khi', 'đã', 'sẽ', 'không', 'như',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
    'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([word]) => word);
}

// Generate meta description from content
export function generateMetaDescription(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  // Get first meaningful sentences
  const sentences = cleanContent.split(/[.!?]+/);
  let description = '';
  
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed && description.length + trimmed.length <= maxLength - 3) {
      description += (description ? ' ' : '') + trimmed;
    } else {
      break;
    }
  }
  
  // Ensure it ends properly
  if (description.length < maxLength - 3) {
    description += '...';
  }
  
  return description.trim();
}

// Check content readability (Flesch Reading Ease for Vietnamese)
export function calculateReadabilityScore(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);
  const syllables = words.reduce((count, word) => {
    // Simplified syllable counting for Vietnamese
    const vowels = word.match(/[aeiouăâêôơưyáàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/gi);
    return count + Math.max(1, vowels ? vowels.length : 1);
  }, 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Modified Flesch formula for Vietnamese
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  return Math.max(0, Math.min(100, score));
}

// Generate internal linking suggestions
export function generateInternalLinks(content: string, availablePages: Array<{title: string, url: string, keywords: string[]}>): Array<{anchor: string, url: string}> {
  const suggestions: Array<{anchor: string, url: string}> = [];
  const contentLower = content.toLowerCase();
  
  availablePages.forEach(page => {
    page.keywords.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase()) && suggestions.length < 5) {
        // Find the exact match in original content for proper casing
        const regex = new RegExp(keyword, 'gi');
        const match = content.match(regex);
        if (match && !suggestions.find(s => s.url === page.url)) {
          suggestions.push({
            anchor: match[0],
            url: page.url
          });
        }
      }
    });
  });
  
  return suggestions;
}

// Validate SEO requirements
export interface SEOValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
}

export function validateSEO(content: ContentData): SEOValidationResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Title validation
  if (!content.seo_title) {
    issues.push('Missing SEO title');
  } else {
    const titleLength = content.seo_title.length;
    if (titleLength < 30) {
      issues.push('SEO title too short (< 30 characters)');
    } else if (titleLength > 60) {
      issues.push('SEO title too long (> 60 characters)');
    }
  }
  
  // Description validation
  if (!content.seo_description) {
    issues.push('Missing SEO description');
  } else {
    const descLength = content.seo_description.length;
    if (descLength < 120) {
      issues.push('SEO description too short (< 120 characters)');
    } else if (descLength > 160) {
      issues.push('SEO description too long (> 160 characters)');
    }
  }
  
  // Content validation
  if (!content.body) {
    issues.push('Missing content body');
  } else {
    const wordCount = content.body.split(' ').length;
    if (wordCount < 300) {
      suggestions.push('Consider adding more content (current: ' + wordCount + ' words)');
    }
  }
  
  // Keywords validation
  if (!content.target_keywords || content.target_keywords.length === 0) {
    suggestions.push('Add target keywords for better SEO');
  }
  
  // Images validation
  if (!content.images || content.images.length === 0) {
    suggestions.push('Add images to improve engagement');
  }
  
  // Schema markup
  if (!content.schema_type && !content.structured_data) {
    suggestions.push('Add schema markup for better rich snippets');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions
  };
}

// Generate canonical URL
export function generateCanonicalURL(baseUrl: string, slug: string): string {
  return `${baseUrl.replace(/\/$/, '')}/${slug.replace(/^\//, '')}`;
}

// Generate Open Graph image URL
export function generateOGImageURL(title: string, baseUrl: string): string {
  const encodedTitle = encodeURIComponent(title);
  return `${baseUrl}/api/og?title=${encodedTitle}`;
}