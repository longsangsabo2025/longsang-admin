/**
 * Brand Identity Seed Data
 * Creates Owner Portrait and Key Locations for Brain Library
 * 
 * Run this script to populate initial brand data
 */

import { createClient } from '@supabase/supabase-js';

// Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://eiomyfznqctrequrfnmu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

// User ID (from your system)
const USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e';

/**
 * Owner Character Profile - Long Sang
 */
export const OWNER_PROFILE = {
  id: crypto.randomUUID(),
  userId: USER_ID,
  name: 'Long Sang',
  description: 'Solo Founder & Full-Stack Developer. Vietnamese male, professional and approachable appearance. Building AI-powered automation tools.',
  primaryImageId: '', // To be set after image upload
  referenceImageIds: [],
  attributes: {
    gender: 'Male',
    ageRange: '25-35',
    ethnicity: 'Vietnamese/Asian',
    hairColor: 'Black',
    hairStyle: 'Short, professional',
    eyeColor: 'Dark brown',
    bodyType: 'Average',
    height: 'Average',
    distinctiveFeatures: [
      'Friendly smile',
      'Professional demeanor',
      'Tech-savvy appearance'
    ]
  },
  preferredStyles: [
    'Business casual',
    'Smart casual',
    'Tech entrepreneur style'
  ],
  preferredOutfits: [
    'Polo shirt',
    'Button-down shirt',
    'Hoodie with tech logo',
    'Clean simple t-shirt'
  ],
  positivePromptKeywords: [
    'Vietnamese male',
    'professional',
    'confident smile',
    'tech entrepreneur',
    'modern',
    'approachable',
    'friendly',
    'smart casual',
    'high quality',
    '4K'
  ],
  negativePromptKeywords: [
    'blurry',
    'distorted',
    'low quality',
    'cartoon',
    'anime',
    'disfigured'
  ],
  isOwner: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * SABO Billiard Club Location Profile
 */
export const SABO_LOCATION = {
  id: crypto.randomUUID(),
  userId: USER_ID,
  name: 'SABO Billiard Club',
  description: 'Modern billiard club with professional atmosphere. Features multiple pool tables, good lighting, and social gaming environment.',
  type: 'indoor',
  referenceImageIds: [],
  attributes: {
    style: 'Modern sports bar',
    lighting: 'Warm ambient + focused table lights',
    colors: ['Green (tables)', 'Wood tones', 'Warm white', 'Dark accents'],
    features: [
      'Professional billiard tables',
      'Bar area',
      'Lounge seating',
      'Score displays',
      'Cue racks',
      'Modern decor'
    ],
    atmosphere: 'Professional yet relaxed gaming environment'
  },
  positivePromptKeywords: [
    'billiard club',
    'pool tables',
    'modern interior',
    'warm lighting',
    'professional',
    'sports bar atmosphere',
    'green felt tables',
    'wood accents'
  ],
  negativePromptKeywords: [
    'dirty',
    'old',
    'dark',
    'run-down',
    'empty',
    'blurry'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Office/Workspace Location Profile
 */
export const WORKSPACE_LOCATION = {
  id: crypto.randomUUID(),
  userId: USER_ID,
  name: 'Developer Workspace',
  description: 'Modern home office or co-working space setup for full-stack development and content creation.',
  type: 'indoor',
  referenceImageIds: [],
  attributes: {
    style: 'Modern minimalist tech workspace',
    lighting: 'Natural daylight + monitor glow',
    colors: ['White', 'Gray', 'Black', 'Blue accents'],
    features: [
      'Multiple monitors',
      'Standing desk',
      'Mechanical keyboard',
      'Clean cable management',
      'Plants',
      'Tech gadgets'
    ],
    atmosphere: 'Productive, focused, professional'
  },
  positivePromptKeywords: [
    'modern office',
    'developer workspace',
    'multiple monitors',
    'clean desk',
    'tech setup',
    'minimalist',
    'professional',
    'natural light'
  ],
  negativePromptKeywords: [
    'messy',
    'cluttered',
    'dark',
    'old equipment',
    'blurry'
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Style Profile for Brand
 */
export const BRAND_STYLE = {
  id: crypto.randomUUID(),
  userId: USER_ID,
  name: 'LongSang Automation Brand Style',
  description: 'Consistent visual style for all brand materials',
  colorPalette: {
    primary: '#3B82F6',    // Blue
    secondary: '#8B5CF6',  // Purple
    accent: '#06B6D4',     // Cyan
    success: '#22C55E',    // Green
    dark: '#1E293B'        // Slate
  },
  typography: {
    headings: 'Inter, sans-serif',
    body: 'Inter, system-ui',
    code: 'JetBrains Mono, monospace'
  },
  imageStyle: {
    preferredAspectRatios: ['16:9', '1:1', '4:5'],
    preferredFilters: ['modern', 'clean', 'professional'],
    colorGrading: 'Cool tones with warm accents'
  },
  promptTemplates: {
    headshot: 'Professional headshot of Vietnamese male developer, confident smile, wearing {outfit}, gradient blue-purple background, high quality, 4K',
    workspace: 'Modern developer workspace with multiple monitors, clean minimalist setup, natural lighting, professional atmosphere',
    socialBanner: 'Twitter/LinkedIn banner, modern tech aesthetic, gradient blue to purple, minimalist design, "AI-Powered Automation" text'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

/**
 * Seed function to insert data into database
 */
export async function seedBrandData() {
  console.log('🌱 Seeding Brand Identity data...\n');

  try {
    // Insert Character Profile
    console.log('👤 Creating Owner Profile: Long Sang');
    const { data: charData, error: charError } = await supabase
      .from('brain_character_profiles')
      .upsert(OWNER_PROFILE)
      .select();
    
    if (charError) {
      console.log('   ⚠️ Character profile table may not exist, storing locally');
    } else {
      console.log('   ✅ Owner profile created');
    }

    // Insert Location Profiles
    console.log('\n📍 Creating Location Profiles...');
    
    const locations = [SABO_LOCATION, WORKSPACE_LOCATION];
    for (const location of locations) {
      const { error } = await supabase
        .from('brain_location_profiles')
        .upsert(location);
      
      if (error) {
        console.log(`   ⚠️ ${location.name} - table may not exist`);
      } else {
        console.log(`   ✅ ${location.name} created`);
      }
    }

    console.log('\n✨ Brand data seeding complete!');
    console.log('\n📋 Summary:');
    console.log('   - Owner Profile: Long Sang');
    console.log('   - Locations: SABO Billiard Club, Developer Workspace');
    console.log('   - Style: LongSang Automation Brand Style');
    
    return {
      ownerProfile: OWNER_PROFILE,
      locations: [SABO_LOCATION, WORKSPACE_LOCATION],
      brandStyle: BRAND_STYLE
    };

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}

// Export for use in application
export const BRAND_SEED_DATA = {
  owner: OWNER_PROFILE,
  locations: {
    sabo: SABO_LOCATION,
    workspace: WORKSPACE_LOCATION
  },
  style: BRAND_STYLE
};

// Run if called directly
if (typeof window === 'undefined' && process.argv[1]?.includes('brand-seed')) {
  seedBrandData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
