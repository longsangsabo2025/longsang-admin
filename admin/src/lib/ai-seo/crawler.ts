import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  title: string;
  description: string;
  content: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  images: string[];
  links: string[];
  metadata: {
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    language?: string;
  };
  technology: {
    cms?: string;
    framework?: string;
    analytics?: string[];
  };
}

/**
 * Crawl a website and extract content, metadata, and structure
 */
export async function crawlWebsite(domain: string): Promise<CrawlResult> {
  try {
    // Normalize domain
    const url = domain.startsWith('http') ? domain : `https://${domain}`;

    // Fetch HTML
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);

    // Extract title
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';

    // Extract description
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Extract keywords
    const keywords = $('meta[name="keywords"]').attr('content') || '';

    // Extract content (remove script, style, nav, footer)
    $('script, style, nav, footer, header').remove();
    const content = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 5000); // Limit to 5000 chars for AI processing

    // Extract headings
    const headings = {
      h1: $('h1')
        .map((_, el) => $(el).text().trim())
        .get(),
      h2: $('h2')
        .map((_, el) => $(el).text().trim())
        .get(),
      h3: $('h3')
        .map((_, el) => $(el).text().trim())
        .get(),
    };

    // Extract images
    const images = $('img')
      .map((_, el) => $(el).attr('src'))
      .get()
      .filter(Boolean);

    // Extract links
    const links = $('a')
      .map((_, el) => $(el).attr('href'))
      .get()
      .filter(Boolean);

    // Detect technology
    const technology: CrawlResult['technology'] = {};

    // Detect CMS
    if (html.includes('wp-content') || html.includes('wordpress')) {
      technology.cms = 'WordPress';
    } else if (html.includes('Shopify')) {
      technology.cms = 'Shopify';
    } else if (html.includes('wix.com')) {
      technology.cms = 'Wix';
    } else if (html.includes('squarespace')) {
      technology.cms = 'Squarespace';
    }

    // Detect framework
    if (html.includes('react') || html.includes('_react')) {
      technology.framework = 'React';
    } else if (html.includes('vue') || html.includes('_vue')) {
      technology.framework = 'Vue';
    } else if (html.includes('angular') || html.includes('ng-')) {
      technology.framework = 'Angular';
    } else if (html.includes('next')) {
      technology.framework = 'Next.js';
    }

    // Detect analytics
    technology.analytics = [];
    if (html.includes('google-analytics') || html.includes('gtag')) {
      technology.analytics.push('Google Analytics');
    }
    if (html.includes('facebook.com/tr')) {
      technology.analytics.push('Facebook Pixel');
    }

    // Extract metadata
    const metadata = {
      keywords,
      ogTitle: $('meta[property="og:title"]').attr('content'),
      ogDescription: $('meta[property="og:description"]').attr('content'),
      language: $('html').attr('lang') || 'en',
    };

    return {
      url,
      title,
      description,
      content,
      headings,
      images: images.slice(0, 10), // Limit to 10 images
      links: links.slice(0, 20), // Limit to 20 links
      metadata,
      technology,
    };
  } catch (error) {
    console.error('Crawl error:', error);
    throw new Error(`Failed to crawl ${domain}: ${error.message}`);
  }
}

/**
 * Discover sitemap and extract URLs
 */
export async function discoverPages(domain: string): Promise<string[]> {
  try {
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    const sitemapUrl = `${url}/sitemap.xml`;

    // Try to fetch sitemap
    const response = await axios.get(sitemapUrl, { timeout: 5000 });
    const $ = cheerio.load(response.data, { xmlMode: true });

    // Extract URLs from sitemap
    const urls = $('url > loc')
      .map((_, el) => $(el).text())
      .get();

    return urls.length > 0 ? urls : [url]; // Return homepage if no sitemap
  } catch (error) {
    // If sitemap not found, return just the homepage
    const url = domain.startsWith('http') ? domain : `https://${domain}`;
    return [url];
  }
}

/**
 * Analyze domain and return summary for AI
 */
export async function analyzeDomain(domain: string): Promise<string> {
  const crawlData = await crawlWebsite(domain);

  return `
WEBSITE ANALYSIS: ${domain}

Title: ${crawlData.title}
Description: ${crawlData.description}

Technology Stack:
- CMS: ${crawlData.technology.cms || 'Unknown'}
- Framework: ${crawlData.technology.framework || 'Unknown'}
- Analytics: ${crawlData.technology.analytics?.join(', ') || 'None detected'}

Main Headings:
${crawlData.headings.h1
  .slice(0, 5)
  .map((h) => `- ${h}`)
  .join('\n')}

Content Preview (first 1000 chars):
${crawlData.content.slice(0, 1000)}

Current Keywords: ${crawlData.metadata.keywords || 'None specified'}

Language: ${crawlData.metadata.language}
  `.trim();
}
