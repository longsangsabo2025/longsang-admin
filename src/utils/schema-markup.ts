// Schema Markup Generator cho SEO
export interface SchemaMarkup {
  '@context': string;
  '@type': string;
  name?: string;
  description?: string;
  url?: string;
  image?: string;
  author?: Author;
  publisher?: Organization;
  datePublished?: string;
  dateModified?: string;
}

export interface Author {
  '@type': 'Person';
  name: string;
  url?: string;
}

export interface Organization {
  '@type': 'Organization';
  name: string;
  logo?: string;
  url?: string;
}

// Generate Organization Schema
export function generateOrganizationSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SABO ARENA',
    description: 'Leading sports and gaming platform in Vietnam. Experience world-class esports tournaments and gaming events.',
    url: 'https://longsang.org/arena',
    image: 'https://longsang.org/arena/logo.png',
  };
}

// Generate Article Schema for Blog Posts
export function generateArticleSchema(post: {
  title: string;
  description: string;
  url: string;
  image?: string;
  author: string;
  datePublished: string;
  dateModified: string;
}): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: post.title,
    description: post.description,
    url: post.url,
    image: post.image,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'SABO ARENA',
      logo: 'https://longsang.org/arena/logo.png',
      url: 'https://longsang.org/arena',
    },
    datePublished: post.datePublished,
    dateModified: post.dateModified,
  };
}

// Generate FAQ Schema
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// Generate Event Schema for Gaming Tournaments
export function generateEventSchema(event: {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  image?: string;
  organizer: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description,
    startDate: event.startDate,
    endDate: event.endDate,
    location: {
      '@type': 'Place',
      name: event.location,
    },
    image: event.image,
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
    },
  };
}

// Generate Product Schema for Gaming Services
export function generateProductSchema(product: {
  name: string;
  description: string;
  image: string;
  offers: {
    price: string;
    currency: string;
    availability: string;
  };
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.offers.price,
      priceCurrency: product.offers.currency,
      availability: `https://schema.org/${product.offers.availability}`,
    },
  };
}

// Generate BreadcrumbList Schema
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

// Utility to inject schema into HTML head
export function injectSchemaMarkup(schema: SchemaMarkup | SchemaMarkup[]): string {
  const schemaArray = Array.isArray(schema) ? schema : [schema];
  return schemaArray
    .map(s => `<script type="application/ld+json">${JSON.stringify(s, null, 2)}</script>`)
    .join('\n');
}