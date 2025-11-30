/**
 * 🎠 Carousel Post Creator
 * 
 * Create multi-image carousel posts for Facebook/Instagram
 * 
 * Features:
 * - Generate multiple coherent images
 * - Create story-like sequences
 * - Product showcase carousels
 * - Before/after comparisons
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const fetch = require('node-fetch');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Carousel types and configurations
 */
const CAROUSEL_TYPES = {
  product_showcase: {
    name: 'Product Showcase',
    description: 'Showcase multiple products or features',
    slideCount: { min: 3, max: 10, default: 5 },
    contentStyle: 'product-focused',
  },
  story_sequence: {
    name: 'Story Sequence',
    description: 'Tell a story across multiple slides',
    slideCount: { min: 3, max: 6, default: 4 },
    contentStyle: 'narrative',
  },
  tips_tutorial: {
    name: 'Tips & Tutorial',
    description: 'Educational content with numbered tips',
    slideCount: { min: 3, max: 10, default: 5 },
    contentStyle: 'educational',
  },
  before_after: {
    name: 'Before/After',
    description: 'Comparison or transformation',
    slideCount: { min: 2, max: 4, default: 2 },
    contentStyle: 'comparison',
  },
  event_highlights: {
    name: 'Event Highlights',
    description: 'Highlight moments from an event',
    slideCount: { min: 4, max: 10, default: 6 },
    contentStyle: 'event',
  },
  brand_story: {
    name: 'Brand Story',
    description: 'Tell your brand story',
    slideCount: { min: 3, max: 8, default: 5 },
    contentStyle: 'branding',
  },
};

/**
 * Create a carousel post
 * @param {object} options - Carousel configuration
 * @returns {Promise<object>} Carousel with slides and images
 */
async function createCarousel(options = {}) {
  try {
    const {
      topic,
      type = 'product_showcase',
      slideCount,
      pageId = 'sabo_arena',
      generateImages = true,
      imageStyle = 'modern',
    } = options;

    const carouselType = CAROUSEL_TYPES[type] || CAROUSEL_TYPES.product_showcase;
    const numSlides = slideCount || carouselType.slideCount.default;

    console.log(`🎠 [Carousel] Creating ${type} carousel with ${numSlides} slides for "${topic}"`);

    // Generate carousel content structure
    const content = await generateCarouselContent(topic, {
      type,
      slideCount: numSlides,
      pageId,
      contentStyle: carouselType.contentStyle,
    });

    // Generate images for each slide if requested
    let slides = content.slides;
    if (generateImages) {
      console.log(`🎨 [Carousel] Generating ${slides.length} images...`);
      slides = await generateSlideImages(slides, {
        style: imageStyle,
        pageId,
        theme: content.theme,
      });
    }

    // Generate cover text/caption
    const caption = await generateCarouselCaption(topic, {
      slides,
      type: carouselType.name,
      pageId,
    });

    return {
      success: true,
      carousel: {
        id: `carousel-${Date.now()}`,
        type,
        topic,
        caption,
        slides,
        slideCount: slides.length,
        theme: content.theme,
        hashtags: content.hashtags,
        createdAt: new Date().toISOString(),
      },
      metadata: {
        type: carouselType.name,
        imageGeneration: generateImages,
        estimatedEngagement: estimateEngagement(slides.length, type),
      },
    };
  } catch (error) {
    console.error('[Carousel] Error creating carousel:', error);
    throw error;
  }
}

/**
 * Generate carousel content structure using AI
 */
async function generateCarouselContent(topic, options = {}) {
  const { type, slideCount, pageId, contentStyle } = options;
  const pageContext = getPageContext(pageId);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Bạn là AI Content Creator chuyên tạo carousel posts cho social media.

Business Context:
${JSON.stringify(pageContext, null, 2)}

Carousel Type: ${type} (${contentStyle})

Quy tắc:
1. Mỗi slide phải có tiêu đề ngắn gọn (max 10 từ)
2. Mỗi slide có mô tả chi tiết cho hình ảnh
3. Nội dung phải liên kết logic giữa các slides
4. Slide cuối nên có CTA mạnh
5. Phù hợp với thương hiệu và đối tượng

Trả về JSON:
{
  "theme": "Theme tổng thể của carousel",
  "colorScheme": "Màu sắc gợi ý",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Tiêu đề slide",
      "description": "Mô tả nội dung slide",
      "imagePrompt": "Mô tả chi tiết hình ảnh cần generate",
      "textOverlay": "Text hiển thị trên ảnh (nếu có)"
    }
  ],
  "hashtags": ["hashtag1", "hashtag2"]
}`,
      },
      {
        role: 'user',
        content: `Tạo carousel ${slideCount} slides cho topic: "${topic}"`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content);
}

/**
 * Generate images for each slide
 */
async function generateSlideImages(slides, options = {}) {
  const { style, pageId, theme } = options;
  const results = [];

  // Process in parallel with limit
  const batchSize = 3;
  for (let i = 0; i < slides.length; i += batchSize) {
    const batch = slides.slice(i, i + batchSize);
    
    const batchResults = await Promise.allSettled(
      batch.map(async (slide) => {
        try {
          const imagePrompt = buildImagePrompt(slide, {
            style,
            pageId,
            theme,
            slideNumber: slide.slideNumber,
            totalSlides: slides.length,
          });

          const response = await openai.images.generate({
            model: 'dall-e-3',
            prompt: imagePrompt,
            n: 1,
            size: '1024x1024', // Square for carousel
            quality: 'standard',
          });

          return {
            ...slide,
            imageUrl: response.data[0]?.url,
            imageGenerated: true,
          };
        } catch (error) {
          console.warn(`[Carousel] Image generation failed for slide ${slide.slideNumber}:`, error.message);
          return {
            ...slide,
            imageUrl: null,
            imageGenerated: false,
            imageError: error.message,
          };
        }
      })
    );

    batchResults.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          ...batch[idx],
          imageUrl: null,
          imageGenerated: false,
          imageError: result.reason?.message,
        });
      }
    });

    // Rate limit between batches
    if (i + batchSize < slides.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Build optimized image prompt for DALL-E
 */
function buildImagePrompt(slide, options = {}) {
  const { style, pageId, theme, slideNumber, totalSlides } = options;

  let styleGuide = '';
  switch (style) {
    case 'modern':
      styleGuide = 'Modern, clean design with bold typography. Vibrant colors.';
      break;
    case 'minimalist':
      styleGuide = 'Minimalist, lots of white space, subtle colors.';
      break;
    case 'vibrant':
      styleGuide = 'Bright, energetic colors. Dynamic composition.';
      break;
    case 'professional':
      styleGuide = 'Corporate, professional look. Navy blue and white.';
      break;
    case 'playful':
      styleGuide = 'Fun, cartoon-like elements. Bright primary colors.';
      break;
    default:
      styleGuide = 'Modern social media style, visually appealing.';
  }

  // Add slide context
  let slideContext = '';
  if (slideNumber === 1) {
    slideContext = 'This is the COVER slide - make it eye-catching and inviting to swipe.';
  } else if (slideNumber === totalSlides) {
    slideContext = 'This is the FINAL slide - include call-to-action visual elements.';
  }

  return `${slide.imagePrompt}

Style: ${styleGuide}
Theme: ${theme}
${slideContext}

Important:
- Optimized for social media carousel (square format)
- Text overlay space for: "${slide.textOverlay || slide.title}"
- Cohesive with other slides in the series
- No watermarks or signatures`;
}

/**
 * Generate caption for the entire carousel
 */
async function generateCarouselCaption(topic, options = {}) {
  const { slides, type, pageId } = options;
  const pageContext = getPageContext(pageId);

  const slidesSummary = slides.map(s => `${s.slideNumber}. ${s.title}`).join('\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Viết caption hấp dẫn cho carousel post.

Business: ${pageContext.name} - ${pageContext.business}
Carousel Type: ${type}
Slides:
${slidesSummary}

Quy tắc:
1. Caption phải tạo tò mò, kêu gọi swipe
2. Không quá 300 ký tự
3. Có emoji phù hợp
4. CTA cuối caption
5. Tiếng Việt tự nhiên`,
      },
      {
        role: 'user',
        content: `Viết caption cho carousel về: "${topic}"`,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0].message.content;
}

/**
 * Get page context
 */
function getPageContext(pageId) {
  const contexts = {
    sabo_arena: {
      name: 'SABO Arena',
      business: 'Billiards & Gaming Center HCM',
    },
    sabo_billiards: {
      name: 'SABO Billiards',
      business: 'Premium Billiards Club Vung Tau',
    },
    ai_newbie: {
      name: 'AI Newbie VN',
      business: 'AI Education Community',
    },
    sabo_media: {
      name: 'SABO Media',
      business: 'Media Production',
    },
  };
  return contexts[pageId] || contexts.sabo_arena;
}

/**
 * Estimate engagement based on carousel type
 */
function estimateEngagement(slideCount, type) {
  // Carousels typically get higher engagement
  const baseEngagement = 1.5; // 50% higher than single image
  const slideBonus = Math.min(slideCount * 0.1, 0.5); // Up to 50% bonus for more slides
  
  const typeMultiplier = {
    product_showcase: 1.2,
    story_sequence: 1.4,
    tips_tutorial: 1.5,
    before_after: 1.3,
    event_highlights: 1.1,
    brand_story: 1.2,
  };

  return {
    multiplier: (baseEngagement + slideBonus) * (typeMultiplier[type] || 1),
    reason: `Carousel posts get ${Math.round((baseEngagement - 1) * 100)}% more engagement. ${slideCount} slides adds additional visibility.`,
  };
}

/**
 * Quick carousel - simplified creation
 */
async function quickCarousel(topic, options = {}) {
  const carousel = await createCarousel({
    topic,
    generateImages: options.generateImages !== false,
    ...options,
  });

  return {
    success: true,
    carouselId: carousel.carousel.id,
    caption: carousel.carousel.caption,
    slideCount: carousel.carousel.slideCount,
    slides: carousel.carousel.slides.map(s => ({
      number: s.slideNumber,
      title: s.title,
      hasImage: !!s.imageUrl,
      imageUrl: s.imageUrl,
    })),
    hashtags: carousel.carousel.hashtags,
  };
}

/**
 * Create carousel from existing images
 */
async function createFromImages(images, options = {}) {
  const { topic, pageId = 'sabo_arena' } = options;

  // Generate content for existing images
  const slides = images.map((img, idx) => ({
    slideNumber: idx + 1,
    imageUrl: img.url,
    title: img.title || `Slide ${idx + 1}`,
    description: img.description || '',
    imageGenerated: false,
    imageSource: 'provided',
  }));

  // Generate caption
  const caption = await generateCarouselCaption(topic || 'carousel', {
    slides,
    type: 'custom',
    pageId,
  });

  return {
    success: true,
    carousel: {
      id: `carousel-${Date.now()}`,
      type: 'custom',
      topic: topic || 'Custom Carousel',
      caption,
      slides,
      slideCount: slides.length,
      createdAt: new Date().toISOString(),
    },
  };
}

module.exports = {
  // Main API functions (aliased for routes)
  createCarousel,
  getCarousels: async (pageId, options = {}) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    let query = supabase.from('carousels').select('*').order('created_at', { ascending: false });
    if (pageId) query = query.eq('page_id', pageId);
    if (options.status) query = query.eq('status', options.status);
    if (options.limit) query = query.limit(options.limit);
    
    const { data } = await query;
    return data || [];
  },
  getCarousel: async (carouselId) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    const { data } = await supabase.from('carousels').select('*').eq('id', carouselId).single();
    return data;
  },
  publishCarousel: async (carouselId, pageId) => {
    const facebookPublisher = require('./facebook-publisher');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    const { data: carousel } = await supabase.from('carousels').select('*').eq('id', carouselId).single();
    if (!carousel) return { success: false, error: 'Carousel not found' };
    
    // For Facebook, post as album with multiple photos
    const result = await facebookPublisher.createAlbumPost(pageId || carousel.page_id, {
      message: carousel.caption,
      images: carousel.slides.map(s => s.imageUrl).filter(Boolean),
    });
    
    await supabase.from('carousels').update({
      status: 'published',
      published_at: new Date().toISOString(),
      facebook_post_id: result.id,
    }).eq('id', carouselId);
    
    return { success: true, postId: result.id };
  },
  updateSlide: async (carouselId, slideIndex, updates) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    const { data: carousel } = await supabase.from('carousels').select('*').eq('id', carouselId).single();
    if (!carousel) return { success: false, error: 'Carousel not found' };
    
    const slides = [...carousel.slides];
    if (slideIndex < 0 || slideIndex >= slides.length) {
      return { success: false, error: 'Invalid slide index' };
    }
    
    slides[slideIndex] = { ...slides[slideIndex], ...updates };
    
    await supabase.from('carousels').update({ slides }).eq('id', carouselId);
    return { success: true, slide: slides[slideIndex] };
  },
  regenerateImages: async (carouselId) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    
    const { data: carousel } = await supabase.from('carousels').select('*').eq('id', carouselId).single();
    if (!carousel) return { success: false, error: 'Carousel not found' };
    
    const newSlides = await generateSlideImages(carousel.slides, {
      style: 'modern',
      theme: carousel.theme,
    });
    
    await supabase.from('carousels').update({ slides: newSlides }).eq('id', carouselId);
    return { success: true, slides: newSlides };
  },
  deleteCarousel: async (carouselId) => {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL || 'https://diexsbzqwsbpilsymnfb.supabase.co',
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );
    await supabase.from('carousels').delete().eq('id', carouselId);
    return { success: true };
  },
  
  // Original exports
  generateCarouselContent,
  generateSlideImages,
  generateCarouselCaption,
  quickCarousel,
  createFromImages,
  CAROUSEL_TYPES,
};
