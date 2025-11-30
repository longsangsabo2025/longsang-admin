import React from 'react';
import { Helmet } from 'react-helmet-async';
import {
  generateOrganizationSchema,
  generateArticleSchema,
  injectSchemaMarkup,
} from '../utils/schema-markup';

interface SEOProps {
  // Basic SEO
  title?: string;
  description?: string;
  keywords?: string[];

  // URLs
  canonical?: string;

  // Open Graph
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile' | 'video' | 'music';
  ogUrl?: string;

  // Twitter
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterSite?: string;
  twitterCreator?: string;

  // Article specific (for blog posts)
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };

  // Schema markup
  schemaType?: 'Article' | 'BlogPosting' | 'NewsArticle' | 'Event' | 'Product' | 'Organization';
  schemaData?: Record<string, any>;

  // Additional meta
  robots?: string;
  language?: string;
}

export const SEOHead: React.FC<SEOProps> = ({
  title = 'SABO ARENA - Premium Sports & Gaming Platform',
  description = 'Experience world-class esports tournaments and gaming events at SABO ARENA. Join the ultimate gaming destination in Vietnam.',
  keywords = ['sabo arena', 'gaming', 'esports', 'vietnam', 'tournaments'],
  canonical,
  ogTitle,
  ogDescription,
  ogImage = '/og-image-default.jpg',
  ogType = 'website',
  ogUrl,
  twitterCard = 'summary_large_image',
  twitterSite = '@saboarena',
  twitterCreator = '@saboarena',
  article,
  schemaType,
  schemaData,
  robots = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  language = 'vi',
}) => {
  const baseUrl = 'https://longsang.org/arena';
  const fullTitle = title.includes('SABO ARENA') ? title : `${title} | SABO ARENA`;
  const finalOgTitle = ogTitle || title;
  const finalOgDescription = ogDescription || description;
  const finalCanonical =
    canonical || (typeof window !== 'undefined' ? window.location.href : baseUrl);
  const finalOgUrl = ogUrl || finalCanonical;

  // Generate schema markup
  let schemaMarkup = '';

  if (schemaType === 'Article' && article) {
    const articleSchema = generateArticleSchema({
      title: finalOgTitle,
      description: finalOgDescription,
      url: finalOgUrl,
      image: `${baseUrl}${ogImage}`,
      author: article.author || 'SABO ARENA Team',
      datePublished: article.publishedTime || new Date().toISOString(),
      dateModified: article.modifiedTime || new Date().toISOString(),
    });
    schemaMarkup = injectSchemaMarkup(articleSchema);
  } else if (schemaType === 'Organization' || !schemaType) {
    const orgSchema = generateOrganizationSchema();
    schemaMarkup = injectSchemaMarkup(orgSchema);
  } else if (schemaData) {
    schemaMarkup = injectSchemaMarkup(schemaData);
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="SABO ARENA Team" />
      <meta name="robots" content={robots} />
      <meta httpEquiv="Content-Language" content={language} />

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={finalOgUrl} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:site_name" content="SABO ARENA" />
      <meta property="og:locale" content="vi_VN" />

      {/* Article-specific Open Graph */}
      {article && ogType === 'article' && (
        <>
          {article.publishedTime && (
            <meta property="article:published_time" content={article.publishedTime} />
          )}
          {article.modifiedTime && (
            <meta property="article:modified_time" content={article.modifiedTime} />
          )}
          {article.author && <meta property="article:author" content={article.author} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags &&
            article.tags.map((tag, index) => (
              <meta key={index} property="article:tag" content={tag} />
            ))}
        </>
      )}

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:site" content={twitterSite} />
      <meta name="twitter:creator" content={twitterCreator} />
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />

      {/* Additional Meta */}
      <meta name="theme-color" content="#1a202c" />
      <meta name="msapplication-TileColor" content="#1a202c" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="format-detection" content="telephone=no" />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://cdn.jsdelivr.net" />

      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//google-analytics.com" />
      <link rel="dns-prefetch" href="//googletagmanager.com" />

      {/* Schema Markup */}
      {schemaMarkup && <div dangerouslySetInnerHTML={{ __html: schemaMarkup }} />}
    </Helmet>
  );
};

// Blog Post SEO Component
interface BlogPostSEOProps {
  post: {
    title: string;
    seo_title?: string;
    seo_description?: string;
    slug: string;
    content: string;
    tags?: string[];
    author?: string;
    published_at: string;
    updated_at?: string;
    featured_image?: string;
  };
}

export const BlogPostSEO: React.FC<BlogPostSEOProps> = ({ post }) => {
  const title = post.seo_title || post.title;
  const description = post.seo_description || generateMetaDescription(post.content);
  const keywords = post.tags || [];
  const canonical = `https://longsang.org/arena/blog/${post.slug}`;

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={[...keywords, 'gaming', 'esports', 'sabo arena']}
      canonical={canonical}
      ogType="article"
      ogImage={post.featured_image || '/og-image-blog.jpg'}
      schemaType="Article"
      article={{
        publishedTime: post.published_at,
        modifiedTime: post.updated_at || post.published_at,
        author: post.author || 'SABO ARENA Team',
        section: 'Gaming',
        tags: post.tags,
      }}
    />
  );
};

// Tournament SEO Component
interface TournamentSEOProps {
  tournament: {
    name: string;
    description: string;
    id: string;
    start_date: string;
    end_date?: string;
    location?: string;
    image?: string;
  };
}

export const TournamentSEO: React.FC<TournamentSEOProps> = ({ tournament }) => {
  const title = `${tournament.name} - Gaming Tournament | SABO ARENA`;
  const description =
    tournament.description ||
    `Join ${tournament.name} tournament at SABO ARENA. Experience competitive gaming at its finest.`;
  const canonical = `https://longsang.org/arena/tournaments/${tournament.id}`;

  // Generate Event schema
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: tournament.name,
    description: tournament.description,
    startDate: tournament.start_date,
    endDate: tournament.end_date || tournament.start_date,
    location: {
      '@type': 'Place',
      name: tournament.location || 'SABO ARENA Platform',
    },
    image: tournament.image
      ? `https://longsang.org/arena${tournament.image}`
      : 'https://longsang.org/arena/og-image-tournament.jpg',
    organizer: {
      '@type': 'Organization',
      name: 'SABO ARENA',
      url: 'https://longsang.org/arena',
    },
  };

  return (
    <SEOHead
      title={title}
      description={description}
      keywords={['tournament', 'gaming', 'esports', 'competition', 'sabo arena']}
      canonical={canonical}
      ogType="article"
      ogImage={tournament.image || '/og-image-tournament.jpg'}
      schemaData={eventSchema}
    />
  );
};

// Helper function (you'll need to import this from your utilities)
function generateMetaDescription(content: string, maxLength: number = 160): string {
  const cleanContent = content.replace(/<[^>]*>/g, '');
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

  if (description.length < maxLength - 3) {
    description += '...';
  }

  return description.trim();
}
