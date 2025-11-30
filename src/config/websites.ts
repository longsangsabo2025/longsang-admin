/**
 * 🌐 Website Configuration Manager
 * Central place to manage all websites
 */

export interface WebsiteConfig {
  id: string;
  name: string;
  domain: string;
  description: string;
  category: 'business' | 'ecommerce' | 'blog' | 'portfolio' | 'saas' | 'other';
  targetKeywords: string[];
  competitors?: string[];
  gaPropertyId?: string;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  addedAt: string;
}

// ================================================
// WEBSITES DATABASE
// ================================================

export const websites: WebsiteConfig[] = [
  {
    id: 'long-sang-portfolio',
    name: 'Long Sang Portfolio',
    domain: 'https://longsang.org',
    description: 'Portfolio Website với AI Marketplace, Academy và Investment Portal',
    category: 'portfolio',
    targetKeywords: [
      'long sang',
      'portfolio',
      'ai marketplace',
      'ai academy',
      'investment portal',
      'web developer vietnam',
    ],
    competitors: [],
    priority: 'high',
    isActive: true,
    addedAt: new Date().toISOString(),
  },
  {
    id: 'sabo-arena',
    name: 'SABO ARENA',
    domain: 'https://longsang.org/arena',
    description: 'Sports & Gaming Platform',
    category: 'business',
    targetKeywords: [
      'sabo arena',
      'sports gaming',
      'gaming platform',
      'esports arena',
    ],
    competitors: [
      // Add competitor domains here
    ],
    priority: 'high',
    isActive: true,
    addedAt: new Date().toISOString(),
  },
  // Add more websites here as you expand
  // {
  //   id: 'website-2',
  //   name: 'Website 2',
  //   domain: 'https://example2.com',
  //   description: 'Description',
  //   category: 'business',
  //   targetKeywords: [],
  //   priority: 'medium',
  //   isActive: true,
  //   addedAt: new Date().toISOString(),
  // },
];

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Get active websites only
 */
export const getActiveWebsites = () => {
  return websites.filter(w => w.isActive);
};

/**
 * Get website by ID
 */
export const getWebsiteById = (id: string) => {
  return websites.find(w => w.id === id);
};

/**
 * Get website by domain
 */
export const getWebsiteByDomain = (domain: string) => {
  return websites.find(w => w.domain === domain);
};

/**
 * Get high priority websites
 */
export const getHighPriorityWebsites = () => {
  return websites.filter(w => w.isActive && w.priority === 'high');
};

/**
 * Get websites by category
 */
export const getWebsitesByCategory = (category: WebsiteConfig['category']) => {
  return websites.filter(w => w.isActive && w.category === category);
};

/**
 * Add new website
 */
export const addWebsite = (config: Omit<WebsiteConfig, 'id' | 'addedAt'>) => {
  const newWebsite: WebsiteConfig = {
    ...config,
    id: generateWebsiteId(config.name),
    addedAt: new Date().toISOString(),
  };
  
  websites.push(newWebsite);
  return newWebsite;
};

/**
 * Generate website ID from name
 */
const generateWebsiteId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

/**
 * Get all domains as array (for Google API)
 */
export const getAllDomains = (): string[] => {
  return getActiveWebsites().map(w => w.domain);
};

/**
 * Get primary website (first high priority)
 */
export const getPrimaryWebsite = (): WebsiteConfig | undefined => {
  return getHighPriorityWebsites()[0];
};

export default {
  websites,
  getActiveWebsites,
  getWebsiteById,
  getWebsiteByDomain,
  getHighPriorityWebsites,
  getWebsitesByCategory,
  addWebsite,
  getAllDomains,
  getPrimaryWebsite,
};
