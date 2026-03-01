/**
 * 🗺️ SABO ARENA - Sitemap Generator
 * Tạo sitemap.xml theo chuẩn Google
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface SitemapConfig {
  baseUrl: string;
  urls: SitemapUrl[];
}

/**
 * Generate sitemap.xml content
 */
export function generateSitemap(config: SitemapConfig): string {
  const { baseUrl, urls } = config;

  const urlElements = urls
    .map((url) => {
      const { loc, lastmod, changefreq, priority } = url;
      const fullUrl = loc.startsWith('http') ? loc : `${baseUrl}${loc}`;

      let urlXml = `  <url>\n`;
      urlXml += `    <loc>${fullUrl}</loc>\n`;

      if (lastmod) {
        urlXml += `    <lastmod>${lastmod}</lastmod>\n`;
      }

      if (changefreq) {
        urlXml += `    <changefreq>${changefreq}</changefreq>\n`;
      }

      if (priority !== undefined) {
        urlXml += `    <priority>${priority.toFixed(1)}</priority>\n`;
      }

      urlXml += `  </url>`;

      return urlXml;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

/**
 * SABO ARENA Site Structure
 */
export const saboArenaSitemap: SitemapConfig = {
  baseUrl: 'https://longsang.org/arena',
  urls: [
    // Homepage - Highest priority
    {
      loc: '/',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 1.0,
    },

    // Main sections - High priority
    {
      loc: '/tournaments',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: '/players',
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: '/games',
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: '/leaderboard',
      changefreq: 'daily',
      priority: 0.7,
    },

    // Content sections - Medium priority
    {
      loc: '/blog',
      changefreq: 'daily',
      priority: 0.6,
    },
    {
      loc: '/news',
      changefreq: 'daily',
      priority: 0.6,
    },
    {
      loc: '/guides',
      changefreq: 'weekly',
      priority: 0.6,
    },

    // Community - Medium priority
    {
      loc: '/community',
      changefreq: 'weekly',
      priority: 0.5,
    },
    {
      loc: '/teams',
      changefreq: 'weekly',
      priority: 0.5,
    },

    // Static pages - Lower priority
    {
      loc: '/about',
      changefreq: 'monthly',
      priority: 0.4,
    },
    {
      loc: '/contact',
      changefreq: 'monthly',
      priority: 0.4,
    },
    {
      loc: '/faq',
      changefreq: 'monthly',
      priority: 0.3,
    },
    {
      loc: '/terms',
      changefreq: 'yearly',
      priority: 0.2,
    },
    {
      loc: '/privacy',
      changefreq: 'yearly',
      priority: 0.2,
    },
  ],
};

// Generate and log sitemap
if (import.meta.url === `file://${process.argv[1]}`) {
  const sitemap = generateSitemap(saboArenaSitemap);
  console.log(sitemap);
}
