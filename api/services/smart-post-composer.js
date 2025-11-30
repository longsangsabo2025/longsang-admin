/**
 * 🎯 Smart Post Composer
 * 
 * AI-powered post creation that automatically:
 * 1. Generates engaging content based on topic
 * 2. Finds or creates matching images
 * 3. Composes complete posts ready for publishing
 * 
 * @author LongSang Admin
 * @version 1.0.0
 */

const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Image library paths
const MEDIA_LIBRARY = {
  base: 'D:/0.PROJECTS/00-MASTER-ADMIN/longsang-admin/public/media',
  categories: {
    billiards: 'billiards',
    events: 'events', 
    promotions: 'promotions',
    community: 'community',
    general: 'general',
  }
};

// Business context for intelligent decisions
const BUSINESS_CONTEXT = {
  'sabo_arena': {
    name: 'SABO Arena',
    type: 'Billiards Club & Entertainment',
    location: '96 Bạch Đằng, Tân Bình, HCM',
    highlights: [
      'Không gian hiện đại 500m²',
      '12 bàn billiards cao cấp',
      'Giải đấu hàng tuần',
      'Cộng đồng 2000+ thành viên',
      'Cafe & Gaming zone'
    ],
    tone: 'Trẻ trung, năng động, cộng đồng',
    targetAudience: 'Nam 18-35, yêu thích billiards, gaming',
    postGuidelines: {
      idealLength: { min: 100, max: 300 },
      mustInclude: ['emoji', 'hashtag', 'cta'],
      imageRecommended: true,
      bestPostingTimes: ['10:00', '12:00', '19:00', '21:00'],
    },
    brandAssets: {
      logo: '/media/brand/sabo-arena-logo.png',
      colors: ['#1a1a2e', '#e94560', '#16213e'],
      defaultImages: [
        '/media/billiards/arena-interior-1.jpg',
        '/media/billiards/tournament-1.jpg',
        '/media/billiards/community-1.jpg',
      ]
    }
  },
  'sabo_billiards': {
    name: 'SABO Billiards',
    type: 'Billiards Club',
    location: 'Vũng Tàu',
    highlights: ['Bàn xịn', 'View biển', 'Giá sinh viên'],
    tone: 'Thân thiện, gần gũi',
    targetAudience: 'Mọi lứa tuổi, gia đình',
    postGuidelines: {
      idealLength: { min: 80, max: 250 },
      mustInclude: ['emoji', 'hashtag'],
      imageRecommended: true,
    }
  },
  'ai_newbie': {
    name: 'AI Newbie VN',
    type: 'AI Education Community',
    highlights: ['Học AI từ zero', 'Cộng đồng hỗ trợ', 'Thực hành thực tế'],
    tone: 'Học thuật nhưng dễ hiểu, khích lệ',
    targetAudience: 'Người mới học AI, developers',
    postGuidelines: {
      idealLength: { min: 150, max: 400 },
      mustInclude: ['emoji', 'hashtag', 'value'],
      imageRecommended: true,
    }
  },
  'sabo_media': {
    name: 'SABO Media',
    type: 'Creative Production Agency',
    highlights: ['Video production', 'Photography', 'Content creation'],
    tone: 'Sáng tạo, chuyên nghiệp, portfolio-focused',
    targetAudience: 'Businesses, brands cần content',
    postGuidelines: {
      idealLength: { min: 100, max: 300 },
      mustInclude: ['emoji', 'portfolio_link'],
      imageRecommended: true,
    }
  }
};

/**
 * Compose a complete post with content and image
 */
async function composePost(topic, options = {}) {
  const {
    page = 'sabo_arena',
    includeImage = true,
    imageSource = 'auto', // 'auto', 'library', 'generate', 'url'
    customImageUrl = null,
    tone = null,
    length = 'medium', // 'short', 'medium', 'long'
  } = options;

  const context = BUSINESS_CONTEXT[page] || BUSINESS_CONTEXT['sabo_arena'];
  
  console.log(`📝 Composing post for ${context.name}...`);
  console.log(`   Topic: ${topic}`);
  console.log(`   Include image: ${includeImage}`);

  // Step 1: Analyze topic to determine post type and image needs
  const analysis = await analyzePostRequirements(topic, context);
  console.log(`   Analysis:`, analysis);

  // Step 2: Generate optimized content
  const content = await generateOptimizedContent(topic, context, analysis, tone, length);
  console.log(`   Content generated (${content.length} chars)`);

  // Step 3: Get or generate image
  let imageUrl = null;
  let imageSource_used = 'none';
  
  if (includeImage || analysis.needsImage) {
    const imageResult = await getPostImage(analysis, context, customImageUrl, imageSource);
    imageUrl = imageResult.url;
    imageSource_used = imageResult.source;
    console.log(`   Image: ${imageSource_used} - ${imageUrl || 'none'}`);
  }

  // Step 4: Compose final post
  const post = {
    content,
    imageUrl,
    metadata: {
      page,
      topic,
      analysis,
      imageSource: imageSource_used,
      generatedAt: new Date().toISOString(),
      recommendedPostTime: getRecommendedPostTime(context),
    }
  };

  console.log(`✅ Post composed successfully!`);
  return post;
}

/**
 * Analyze topic to understand what type of post and image is needed
 */
async function analyzePostRequirements(topic, context) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Bạn là AI analyzer cho ${context.name} (${context.type}).
Phân tích topic để xác định loại bài post và nhu cầu hình ảnh.

Trả về JSON:
{
  "postType": "announcement|promotion|event|community|educational|entertainment",
  "needsImage": true/false,
  "imageCategory": "billiards|events|promotions|community|general",
  "imageStyle": "photo|graphic|meme|infographic",
  "suggestedImageKeywords": ["keyword1", "keyword2"],
  "urgency": "high|medium|low",
  "callToAction": "suggested CTA text"
}`
      },
      {
        role: 'user',
        content: `Context: ${JSON.stringify(context.highlights)}
Topic: ${topic}`
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  try {
    return JSON.parse(response.choices[0].message.content);
  } catch {
    return {
      postType: 'general',
      needsImage: true,
      imageCategory: 'general',
      imageStyle: 'photo',
      suggestedImageKeywords: [],
      urgency: 'medium',
      callToAction: 'Ghé thăm ngay!'
    };
  }
}

/**
 * Generate optimized content for the post
 */
async function generateOptimizedContent(topic, context, analysis, customTone, length) {
  const lengthGuide = {
    short: { min: 50, max: 100, instruction: 'Rất ngắn gọn, 2-3 câu' },
    medium: { min: 100, max: 250, instruction: 'Vừa phải, 4-6 câu' },
    long: { min: 200, max: 400, instruction: 'Chi tiết, 6-10 câu' },
  };

  const guide = lengthGuide[length] || lengthGuide.medium;
  const tone = customTone || context.tone;

  const systemPrompt = `Bạn là Social Media Expert cho ${context.name}.

🏢 VỀ CHÚNG TÔI:
${context.highlights.map(h => `• ${h}`).join('\n')}

🎯 ĐỐI TƯỢNG: ${context.targetAudience}
🎨 GIỌNG ĐIỆU: ${tone}
📏 ĐỘ DÀI: ${guide.instruction} (${guide.min}-${guide.max} ký tự)

📋 YÊU CẦU BÀI VIẾT:
1. MỞ ĐẦU: Hook hấp dẫn, gây chú ý ngay
2. NỘI DUNG: Giá trị thực, không nói chung chung
3. EMOJI: Sử dụng phù hợp 🎱🔥✨ (không quá 5)
4. CTA: ${analysis.callToAction || 'Kêu gọi hành động rõ ràng'}
5. HASHTAGS: 3-5 hashtags cuối bài

📌 LOẠI BÀI: ${analysis.postType}
${analysis.needsImage ? '🖼️ BÀI NÀY SẼ CÓ ẢNH KÈM - viết content bổ trợ cho ảnh' : ''}

⚠️ QUAN TRỌNG: 
- KHÔNG copy paste topic
- KHÔNG viết quá dài hoặc quá ngắn
- Phải có giá trị thực cho người đọc`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Viết bài về: ${topic}` }
    ],
    temperature: 0.8,
    max_tokens: 500,
  });

  return response.choices[0].message.content;
}

/**
 * Get image for post - from library, URL, or generate
 */
async function getPostImage(analysis, context, customUrl, preferredSource) {
  // If custom URL provided, use it
  if (customUrl) {
    return { url: customUrl, source: 'custom_url' };
  }

  // Try to find from library first
  if (preferredSource === 'auto' || preferredSource === 'library') {
    const libraryImage = await findImageFromLibrary(analysis, context);
    if (libraryImage) {
      return { url: libraryImage, source: 'library' };
    }
  }

  // Try to generate with DALL-E if needed
  if (preferredSource === 'auto' || preferredSource === 'generate') {
    try {
      const generatedImage = await generateImage(analysis, context);
      if (generatedImage) {
        return { url: generatedImage, source: 'generated' };
      }
    } catch (error) {
      console.warn('Image generation failed:', error.message);
    }
  }

  // Fallback to default brand images
  if (context.brandAssets?.defaultImages?.length > 0) {
    const randomDefault = context.brandAssets.defaultImages[
      Math.floor(Math.random() * context.brandAssets.defaultImages.length)
    ];
    return { url: randomDefault, source: 'brand_default' };
  }

  return { url: null, source: 'none' };
}

/**
 * Find matching image from local library
 */
async function findImageFromLibrary(analysis, context) {
  const category = analysis.imageCategory || 'general';
  const categoryPath = path.join(MEDIA_LIBRARY.base, MEDIA_LIBRARY.categories[category] || 'general');

  try {
    if (!fs.existsSync(categoryPath)) {
      console.log(`📁 Media folder not found: ${categoryPath}`);
      return null;
    }

    const files = fs.readdirSync(categoryPath)
      .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f));

    if (files.length === 0) {
      return null;
    }

    // Simple random selection (can be improved with AI matching)
    const selectedFile = files[Math.floor(Math.random() * files.length)];
    return `/media/${category}/${selectedFile}`;
  } catch (error) {
    console.error('Error finding library image:', error);
    return null;
  }
}

/**
 * Generate image using DALL-E
 */
async function generateImage(analysis, context) {
  const keywords = analysis.suggestedImageKeywords || [];
  const style = analysis.imageStyle || 'photo';

  const stylePrompts = {
    photo: 'professional photography, high quality, realistic',
    graphic: 'modern graphic design, clean, professional',
    meme: 'meme style, funny, viral potential',
    infographic: 'infographic style, clean data visualization',
  };

  const prompt = `${context.name} - ${context.type}. 
${keywords.join(', ')}. 
${stylePrompts[style]}. 
Brand colors: modern, professional. 
No text in image.`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    return response.data[0].url;
  } catch (error) {
    console.error('DALL-E generation failed:', error.message);
    return null;
  }
}

/**
 * Get recommended posting time based on business context
 */
function getRecommendedPostTime(context) {
  const times = context.postGuidelines?.bestPostingTimes || ['10:00', '19:00'];
  const now = new Date();
  const currentHour = now.getHours();

  // Find next best time
  for (const time of times) {
    const [hour] = time.split(':').map(Number);
    if (hour > currentHour) {
      return time;
    }
  }

  // If all times passed, recommend first time tomorrow
  return times[0];
}

/**
 * Quick post - simplified interface for common use cases
 */
async function quickPost(topic, page = 'sabo_arena') {
  return composePost(topic, {
    page,
    includeImage: true,
    imageSource: 'auto',
    length: 'medium',
  });
}

/**
 * Create post with specific image
 */
async function postWithImage(topic, imageUrl, page = 'sabo_arena') {
  return composePost(topic, {
    page,
    includeImage: true,
    imageSource: 'url',
    customImageUrl: imageUrl,
    length: 'medium',
  });
}

/**
 * Create promotional post (shorter, more urgent)
 */
async function promotionalPost(topic, page = 'sabo_arena') {
  return composePost(topic, {
    page,
    includeImage: true,
    imageSource: 'auto',
    length: 'short',
    tone: 'Urgent, promotional, FOMO-inducing',
  });
}

/**
 * Create event announcement post
 */
async function eventPost(eventDetails, page = 'sabo_arena') {
  const topic = typeof eventDetails === 'string' 
    ? eventDetails 
    : `${eventDetails.name} - ${eventDetails.date} - ${eventDetails.description}`;
  
  return composePost(topic, {
    page,
    includeImage: true,
    imageSource: 'auto',
    length: 'medium',
    tone: 'Excited, event-focused, community-building',
  });
}

module.exports = {
  composePost,
  quickPost,
  postWithImage,
  promotionalPost,
  eventPost,
  analyzePostRequirements,
  generateOptimizedContent,
  getPostImage,
  BUSINESS_CONTEXT,
};
