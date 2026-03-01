// Types cho App Showcase CMS

export interface AppShowcaseData {
  id: string;
  slug: string; // URL-friendly identifier (e.g., "sabo-arena", "chrono-desk")
  appName: string;
  tagline: string;
  description: string;
  icon?: string; // Emoji hoặc icon cho card preview
  productionUrl?: string; // URL production của app

  // Hero Section
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    stats: {
      users: string;
      rating: string;
      tournaments: string;
    };
    backgroundImage?: string;
  };

  // Branding
  branding: {
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
  };

  // Download Links
  downloads: {
    appStore?: string;
    googlePlay?: string;
  };

  // Social Media Links
  social: {
    facebook?: string;
    instagram?: string;
    youtube?: string;
    tiktok?: string;
    discord?: string;
    twitter?: string;
  };

  // Features Section
  features: AppFeature[];

  // CTA Section
  cta: {
    heading: string;
    description: string;
    rating: {
      score: string;
      totalUsers: string;
    };
  };

  // Metadata
  metadata: {
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    status: 'draft' | 'published';
  };
}

export interface AppFeature {
  id: string;
  title: string;
  description: string;
  icon: string; // Icon name từ lucide-react hoặc react-icons
  screenshot?: string; // URL của screenshot
  badge?: {
    text: string;
    color: string;
  };
  highlights?: string[]; // Các điểm nổi bật
  stats?: {
    label: string;
    value: string;
    icon?: string;
  }[];
}

// Form data types cho Admin
export interface AppShowcaseFormData extends Omit<AppShowcaseData, 'id' | 'metadata'> {
  id?: string;
}
