/**
 * Brand Image Generation Prompts
 * Ready-to-use prompts for AI image generation
 * 
 * Use these with Imagen4 or any AI image generator
 */

export const BRAND_IMAGE_PROMPTS = {
  // === PROFILE IMAGES ===
  profileImages: {
    professionalHeadshot: {
      name: 'Professional Headshot',
      aspectRatio: '1:1',
      prompt: `Professional headshot portrait of a confident Vietnamese male developer in his late 20s to early 30s. 
      Wearing a clean navy blue polo shirt. 
      Warm, genuine smile showing approachability.
      Soft gradient background transitioning from blue to purple.
      Studio lighting, high quality, 4K resolution.
      Modern tech entrepreneur aesthetic.
      Sharp focus on face, slight depth of field blur on background.`,
      negativePrompt: 'blurry, distorted, cartoon, anime, low quality, disfigured, extra limbs, bad anatomy'
    },

    casualProfile: {
      name: 'Casual Profile',
      aspectRatio: '1:1',
      prompt: `Friendly Vietnamese male developer in casual setting.
      Wearing a modern tech startup hoodie or clean t-shirt.
      Natural smile, relaxed posture.
      Coffee shop or modern co-working space background, blurred.
      Natural lighting, candid feel.
      High quality, professional photography style.`,
      negativePrompt: 'blurry, distorted, cartoon, anime, low quality, messy background'
    },

    workingAtDesk: {
      name: 'Working at Desk',
      aspectRatio: '16:9',
      prompt: `Vietnamese male developer working at a modern desk setup.
      Multiple monitors showing code and design software.
      Focused expression, typing on mechanical keyboard.
      Minimalist workspace with plants and good cable management.
      Natural daylight from window, warm ambient lighting.
      Clean, professional tech workspace aesthetic.
      High quality, editorial photography style.`,
      negativePrompt: 'messy desk, cluttered, dark, old equipment, blurry, cartoon'
    }
  },

  // === SOCIAL MEDIA BANNERS ===
  socialBanners: {
    twitterBanner: {
      name: 'Twitter/X Banner',
      aspectRatio: '3:1',
      dimensions: '1500x500',
      prompt: `Modern tech banner design for Twitter/X header.
      Gradient background from blue (#3B82F6) to purple (#8B5CF6).
      Abstract geometric shapes suggesting AI and automation.
      Clean minimalist design with subtle grid patterns.
      Space on left for profile overlap.
      Tech startup aesthetic, professional.
      Text-ready design with clear areas.`,
      negativePrompt: 'cluttered, busy, too many colors, text, words, letters'
    },

    linkedinBanner: {
      name: 'LinkedIn Banner',
      aspectRatio: '4:1',
      dimensions: '1584x396',
      prompt: `Professional LinkedIn banner design.
      Corporate yet modern tech aesthetic.
      Subtle gradient from deep blue to indigo.
      Abstract network/connection visualization in background.
      Clean, minimal, professional appearance.
      Suitable for technology/startup professional.`,
      negativePrompt: 'cluttered, cartoon, unprofessional, bright colors'
    },

    youtubeBanner: {
      name: 'YouTube Banner',
      aspectRatio: '16:9',
      dimensions: '2560x1440',
      prompt: `YouTube channel banner for tech tutorial channel.
      Modern gradient background blue to purple.
      Subtle code/terminal elements in background.
      Clean design with space for channel name.
      Tech education aesthetic.
      "LongSang Automation" branding style.`,
      negativePrompt: 'cluttered, childish, unprofessional'
    }
  },

  // === LOGO CONCEPTS ===
  logos: {
    minimalistLogo: {
      name: 'Minimalist Logo',
      aspectRatio: '1:1',
      prompt: `Minimalist logo design for "LongSang Automation".
      Abstract "LS" lettermark or automation/AI symbol.
      Gradient from blue (#3B82F6) to purple (#8B5CF6).
      Clean geometric shapes.
      Modern tech startup aesthetic.
      Works on both light and dark backgrounds.
      Simple, memorable, professional.`,
      negativePrompt: 'complex, detailed, realistic, photographic, text heavy'
    },

    iconLogo: {
      name: 'App Icon Style',
      aspectRatio: '1:1',
      prompt: `App icon design for automation platform.
      Abstract robot/AI head or gear/cog with lightning bolt.
      Blue to purple gradient.
      Clean flat design.
      Works at small sizes (32px to 512px).
      Modern iOS/Android app icon style.`,
      negativePrompt: 'complex, 3D, realistic, too detailed, shadows'
    }
  },

  // === SABO ARENA SPECIFIC ===
  saboArena: {
    appIcon: {
      name: 'SABO Arena App Icon',
      aspectRatio: '1:1',
      prompt: `Mobile app icon for billiard/pool tournament app.
      Stylized pool ball (8-ball or 9-ball) design.
      Modern gradient green to teal.
      Clean flat design with slight depth.
      Works at all sizes.
      Sports app aesthetic.`,
      negativePrompt: 'realistic photo, complex, too detailed'
    },

    promotionalImage: {
      name: 'SABO Arena Promo',
      aspectRatio: '16:9',
      prompt: `Promotional image for billiard tournament app.
      Professional billiard table with balls arranged.
      Modern club atmosphere with neon accents.
      Dramatic lighting on table.
      Empty space for text overlay.
      High quality, cinematic feel.`,
      negativePrompt: 'blurry, dark, empty, people'
    }
  },

  // === CONTENT IMAGES ===
  contentImages: {
    blogHeader: {
      name: 'Blog Post Header',
      aspectRatio: '16:9',
      prompt: `Abstract tech blog header image.
      Flowing gradient from blue to purple.
      Subtle circuit board or code pattern overlay.
      Modern, clean aesthetic.
      Space for text overlay.
      Tech/programming blog style.`,
      negativePrompt: 'text, words, cluttered, realistic photo'
    },

    twitterCard: {
      name: 'Twitter Card Image',
      aspectRatio: '2:1',
      prompt: `Social media card image for tech content.
      Clean gradient background blue-purple.
      Abstract geometric shapes.
      Modern tech aesthetic.
      Minimal design, shareable.`,
      negativePrompt: 'text, cluttered, photos, realistic'
    }
  }
};

/**
 * Quick copy prompts for immediate use
 */
export const QUICK_PROMPTS = {
  headshot: BRAND_IMAGE_PROMPTS.profileImages.professionalHeadshot.prompt,
  twitterBanner: BRAND_IMAGE_PROMPTS.socialBanners.twitterBanner.prompt,
  logo: BRAND_IMAGE_PROMPTS.logos.minimalistLogo.prompt,
  saboIcon: BRAND_IMAGE_PROMPTS.saboArena.appIcon.prompt
};

/**
 * Get all prompts as array for iteration
 */
export function getAllPrompts() {
  const prompts: Array<{
    category: string;
    name: string;
    aspectRatio: string;
    prompt: string;
    negativePrompt: string;
  }> = [];

  for (const [category, items] of Object.entries(BRAND_IMAGE_PROMPTS)) {
    for (const [key, item] of Object.entries(items)) {
      prompts.push({
        category,
        name: (item as any).name,
        aspectRatio: (item as any).aspectRatio,
        prompt: (item as any).prompt,
        negativePrompt: (item as any).negativePrompt
      });
    }
  }

  return prompts;
}

export default BRAND_IMAGE_PROMPTS;
