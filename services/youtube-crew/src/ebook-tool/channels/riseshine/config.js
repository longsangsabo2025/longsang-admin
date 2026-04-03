/**
 * Channel Config: Rise & Shine
 * Input type: DOCX files (pre-written books)
 * Style: Anime-inspired dreamy realism — warm, healing, contemplative
 */
export default {
  channelId: 'riseshine',
  channelName: 'Rise & Shine',
  author: 'Rise & Shine',
  publisher: 'Rise & Shine Channel',
  lang: 'vi',
  inputType: 'docx',
  decorationStyle: 'lotus',

  /** Regex to split DOCX HTML into chapters */
  chapterPattern: /<h[12]>((?:📖 (?:EBOOK|THIẾT KẾ)|CHƯƠNG \d+|NGÀY \d+|MODULE \d+|PHẦN \d+|LỜI MỞ ĐẦU|PHẦN KẾT|PHỤ LỤC|GHI CHÚ CỦA TÁC GIẢ|🔖 (?:TRƯỚC KHI|PHẦN KẾT)|CHỮA LÀNH TỪ GỐC RỄ|Chương \d+)[^<]*)<\/h[12]>/gi,

  themes: {
    free: { primary: '#4A148C', accent: '#7B1FA2', light: '#F3E5F5', gradient: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b4e 50%, #4A148C 100%)' },
    paid: { primary: '#00695C', accent: '#00897B', light: '#E0F2F1', gradient: 'linear-gradient(135deg, #0a2e2a 0%, #1b4e47 50%, #00695C 100%)' },
    premium: { primary: '#BF360C', accent: '#E64A19', light: '#FBE9E7', gradient: 'linear-gradient(135deg, #2e0a00 0%, #4e1b0a 50%, #BF360C 100%)' },
  },

  imageStyle: {
    base: 'Anime-inspired dreamy realism style. Warm painterly textures with visible brushstroke quality. Soft atmospheric lighting with bokeh. No text, no watermarks, no words, no letters, no UI elements. High detail digital painting. Full scene illustration.',
    palette: {
      free: 'Soft purple and lavender dominant palette with warm golden light accents. Violet and lilac atmospheric tones.',
      paid: 'Teal and soft emerald dominant palette with warm golden accents. Peaceful seafoam green atmospheric tones.',
      premium: 'Deep warm orange and amber dominant palette with sunset warm accents. Rich burnt sienna atmospheric tones.',
    },
    mood: 'Contemplative, healing, emotionally resonant. Vietnamese characters with natural features.',
  },

  // ─── Ebook Definitions ──────────────────────────────────────
  ebooks: [
    {
      id: 'riseshine-1-free',
      tier: 'free',
      title: 'CHẠM VÀO VẾT THƯƠNG',
      subtitle: '7 Sự Thật Về Bạn Mà Không Ai Nói',
      tagline: 'Cuốn sách nhỏ dành cho người luôn mạnh mẽ nhưng thầm kiệt sức',
      file: 'C:/Users/admin/Downloads/drive-download-20260318T130522Z-1-001/EBOOK 1_.docx',
    },
    {
      id: 'riseshine-2-paid',
      tier: 'paid',
      title: 'CHỮA LÀNH TỪ GỐC RỄ',
      subtitle: 'Hành Trình 30 Ngày Trở Về Với Chính Mình',
      tagline: 'Bạn đã mạnh mẽ đủ lâu rồi. Bây giờ hãy để mình được chữa lành.',
      file: 'C:/Users/admin/Downloads/drive-download-20260318T130522Z-1-001/EBOOK 2.docx',
    },
    {
      id: 'riseshine-3-premium',
      tier: 'premium',
      title: 'THIẾT KẾ LẠI CUỘC ĐỜI',
      subtitle: 'Từ Chữa Lành Đến Khai Phóng Tiềm Năng',
      tagline: 'Bạn đã chữa lành xong. Giờ hãy xây dựng cuộc đời bạn xứng đáng.',
      file: 'C:/Users/admin/Downloads/drive-download-20260318T130522Z-1-001/Ebook3_.docx',
    },
  ],

  // ─── Chapter Image Prompts (by regex match) ─────────────────
  chapterImages: {
    'riseshine-1-free': [
      { match: /TRƯỚC KHI BẠN ĐỌC/i, prompt: 'A young Vietnamese woman with long black hair sitting by a rain-streaked window in warm golden hour light, gently holding an open book close to her chest. Soft amber lamplight illuminates her peaceful, contemplative face. Cozy room with warm wood tones. Welcoming, intimate, safe mood.' },
      { match: /CHƯƠNG 1/i, prompt: 'A young Vietnamese woman standing alone in a vast empty room, slowly removing a heavy metallic suit of armor piece by piece. Underneath, her true self glows with soft warm light. Scattered armor pieces on the ground reflect purple light. Relief, vulnerability, and quiet courage.' },
      { match: /CHƯƠNG 2/i, prompt: 'A Vietnamese adult woman gently kneeling down to hold hands with a small translucent version of herself as a 6-year-old child, in a dreamlike garden with floating soft-glowing memory bubbles containing childhood scenes. Bittersweet tenderness, healing nostalgia. Soft golden light filtering through cherry blossoms.' },
      { match: /CHƯƠNG 3/i, prompt: 'A Vietnamese woman standing at a mystical crossroads in a misty lavender forest. Multiple translucent mirror reflections of similar-looking people appear on each path, each slightly different but repeating the same silhouette. Mysterious, contemplative, self-aware mood. Ethereal purple fog.' },
      { match: /CHƯƠNG 4/i, prompt: 'A Vietnamese family gathered around a traditional dinner table in warm golden lamplight. Translucent golden coins and soft glowing symbols float above like gentle fireflies, connecting the family members with invisible threads of light. Warm nostalgia mixed with complex emotions. Rich amber tones.' },
      { match: /CHƯƠNG 5/i, prompt: 'A Vietnamese woman sitting in a serene meditative pose with eyes closed. Soft colored lights from different chakra points glow from within her body — warm gold at the heart, soft blue at the throat, gentle purple at the crown. Her silhouette radiates gentle healing energy waves. Peaceful body awareness, inner light.' },
      { match: /CHƯƠNG 6/i, prompt: 'A Vietnamese man gently putting down a heavy toolbox full of self-help books and tools, instead picking up a warm glowing paper lantern. He holds the lantern up to illuminate his own reflection in a full-length antique mirror, where his reflection smiles back warmly at him. Self-acceptance, gentle understanding, soft indoor light.' },
      { match: /CHƯƠNG 7/i, prompt: 'A Vietnamese person taking a single small step on a path of softly glowing lotus flowers, each footstep lighting up as they walk forward into golden morning sunrise light. The path leads through a peaceful meadow toward a distant warm horizon. Hope, new beginning, gentle courage.' },
      { match: /PHẦN KẾT/i, prompt: 'A young Vietnamese woman with long black hair standing at the edge of an open golden field at sunrise, arms slightly open, face tilted toward the warm sun with a quiet content half-smile. Her long shadow stretches behind her. Wind gently moves her hair. Liberating, authentic, quietly triumphant mood. Vast open sky.' },
    ],
    'riseshine-2-paid': [
      { match: /LỜI MỞ ĐẦU/i, prompt: 'A Vietnamese woman sitting quietly at a wooden writing desk by a window at dawn. She holds a pen above an open journal, pausing in contemplation. Soft teal morning light streams in. A steaming cup of tea beside her. Calm, intentional, the beginning of a journey. Warm emerald tones.' },
      { match: /PHẦN 1.*NHẬN DIỆN/i, prompt: 'A Vietnamese woman standing before a large ornate antique mirror in a dimly lit teal-green room. Her reflection shows multiple translucent layers of herself — masks, roles, personas — peeling away one by one. The outermost layer dissolves into soft light particles. Self-discovery, recognition. Deep emerald atmosphere.' },
      { match: /^NGÀY 1$/i, prompt: 'A Vietnamese woman sitting alone on a park bench under a large old tree with teal-green leaves. She looks at her own hands with curiosity, as if seeing them for the first time. Soft morning light creates dappled shadows. First step of awareness. Gentle emerald palette.' },
      { match: /PHẦN 2.*CẢM XÚC/i, prompt: 'A Vietnamese woman standing in gentle rain, face tilted upward with eyes closed and a serene expression. The raindrops around her transform into small colorful orbs — each color representing a different emotion: gold for joy, blue for sadness, red for anger, green for peace. She lets them all touch her skin. Emotional openness. Teal-green sky.' },
      { match: /^NGÀY 7$/i, prompt: 'A Vietnamese woman sitting on the floor of a softly lit room, surrounded by translucent colored glass jars. Each jar contains a glowing emotion — one overflows, one is nearly empty. She carefully tends to each one. Emotional inventory. Warm teal lamplight.' },
      { match: /PHẦN 3.*RANH GIỚI/i, prompt: 'A Vietnamese woman standing in a peaceful garden, gently drawing a luminous teal-green line in the air around herself with her fingertip. The line becomes a beautiful protective boundary of soft light — not a wall, but a warm gentle glow. People outside the boundary smile respectfully. Setting boundaries with love. Emerald garden.' },
      { match: /^NGÀY 13$/i, prompt: 'A Vietnamese woman sitting at a crossroads between two paths in a teal bamboo forest. One path is overgrown and dark, the other has soft warm light. She calmly chooses the lighter path. Decisive, empowered. Deep green atmosphere.' },
      { match: /PHẦN 4.*BẢN SẮC/i, prompt: 'A Vietnamese woman sculpting a luminous version of herself from soft teal-green clay in a serene art studio. The sculpture glows warmly from within as she shapes it with gentle care. Scattered tools and half-formed figures surround her. Identity, self-creation, authenticity. Warm studio light.' },
      { match: /^NGÀY 19$/i, prompt: 'A Vietnamese woman looking at a wall covered with photographs of herself at different ages — child, teenager, young adult, present. She connects them with golden threads of light. Life integration, wholeness. Soft emerald-teal tones.' },
      { match: /PHẦN 5.*TRỌN VẸN/i, prompt: 'A Vietnamese woman standing in the center of a circular teal-green garden labyrinth, arms open. All the paths behind her glow with warm golden light showing the journey she walked. Above her, the sky opens into brilliant warm sunrise. Completeness, integration, wholeness. Radiant emerald and gold.' },
      { match: /^NGÀY 25$/i, prompt: 'A Vietnamese woman planting a small glowing seedling in rich dark earth inside a peaceful teal greenhouse. The seedling emits warm golden light. Other mature plants around her glow softly. Growth, nurturing, future. Emerald-green palette.' },
      { match: /PHẦN KẾT/i, prompt: 'A Vietnamese woman standing at the edge of a calm emerald-teal ocean at sunrise. She has just completed a long walk — footprints stretch far behind her in the sand. She looks at the vast horizon with peaceful confidence and a gentle smile. Wind in her hair. Freedom, completion, new beginning. Rich teal and gold.' },
      { match: /PHỤ LỤC/i, prompt: 'A beautifully organized Vietnamese study desk from above — a journal, colored pens, sticky notes with gentle teal hues, small potted plant, and a cup of tea. Everything is arranged with care and intention. Tools for the journey. Clean, organized, inviting. Top-down view. Emerald palette.' },
    ],
    'riseshine-3-premium': [
      { match: /LỜI MỞ ĐẦU/i, prompt: 'A Vietnamese woman standing at the threshold of a grand golden doorway, one foot forward into warm amber light. Behind her, a path of healed milestones fades into soft mist. She carries nothing, hands open. Courage, fresh start. Rich warm orange and gold tones. Dramatic doorway framing.' },
      { match: /MODULE 1.*TÂM TRÍ/i, prompt: 'A Vietnamese woman sitting inside a translucent human brain made of warm amber light circuits and neural pathways. She is calmly rewiring glowing connections with gentle hands. Some old dark circuits dissolve while new golden ones form. Futuristic yet organic. Neural reprogramming. Deep amber palette.' },
      { match: /Chương 1.*Niềm Tin|Hệ Thống Niềm Tin/i, prompt: 'A Vietnamese woman standing in a vast library of floating golden books. She gently removes an old dark book from a shelf and replaces it with a glowing amber one. The replaced books dissolve into light dust. Belief systems, transformation. Warm amber library light.' },
      { match: /MODULE 2.*CẢM XÚC/i, prompt: 'A Vietnamese woman conducting an orchestra of colorful emotional energy waves with graceful hand movements. Each wave has a different warm color — deep orange passion, amber joy, gold compassion, soft red courage. She stands on a floating platform above clouds at sunset. Emotional mastery. Rich sunset palette.' },
      { match: /Chương 5.*Emotional Vocabulary/i, prompt: 'A Vietnamese woman in a warm amber room surrounded by floating translucent word bubbles, each containing a Vietnamese emotion name glowing softly. She reaches out to touch one, and it illuminates her face with understanding. Naming emotions. Warm golden light.' },
      { match: /MODULE 3.*QUAN HỆ/i, prompt: 'Two Vietnamese people sitting face to face in a warm amber garden, connected by threads of soft golden light between their hearts. Around them, some toxic dark threads dissolve while healthy golden ones strengthen. Deep connection, chosen relationships. Sunset amber tones.' },
      { match: /Chương 8.*Attachment/i, prompt: 'A Vietnamese woman gently untangling a complex web of golden threads around her heart. As she untangles each thread, it transforms from dark knotted rope into soft glowing amber silk. Inner child sits beside her helping. Attachment healing. Warm interior light.' },
      { match: /MODULE 4.*SỨ MỆNH/i, prompt: 'A Vietnamese woman architect standing on a hilltop at golden sunrise, drawing luminous blueprint plans in the air with trails of amber light. The blueprints show the structure of a purposeful life — connections, passions, work, meaning. Vast horizon. Purpose and mission. Rich golden-orange sky.' },
      { match: /Chương 12.*Ikigai/i, prompt: 'A Vietnamese woman sitting in the center of four overlapping circles of warm light — amber for passion, gold for talent, orange for purpose, deep gold for livelihood. Where all four overlap, she glows brightest. Ikigai visualization. Peaceful garden setting. Warm golden hour.' },
      { match: /Chương 14.*Flow State/i, prompt: 'A Vietnamese woman in deep creative flow, surrounded by swirling streams of warm amber energy. Her eyes are focused, her posture is graceful and powerful. Time seems frozen — floating objects around her are suspended mid-air. Zone state. Dynamic amber energy.' },
      { match: /PHẦN KẾT/i, prompt: 'A Vietnamese woman standing on the highest peak of a golden mountain range at sunrise, arms wide open to embrace the vast flaming orange-gold horizon. Below her, the entire journey is visible — forests, rivers, valleys — all bathed in warm amber light. She is complete, free, powerful. Triumphant golden sunrise.' },
      { match: /PHỤ LỤC/i, prompt: 'An elegant Vietnamese workspace from above — a leather journal, golden pen, warm amber coffee, architectural blueprints, and a small potted bonsai tree. Everything radiates intention and mastery. Tools for life design. Top-down view. Rich warm amber palette.' },
    ],
  },

  // ─── Cover Image Prompts ────────────────────────────────────
  coverImages: {
    'riseshine-1-free': {
      cover: 'A breathtaking full-page book cover illustration. A young Vietnamese woman with long flowing black hair stands in the center of a vast dreamlike purple cosmos. She gently touches her own chest where a glowing warm golden light radiates outward like a heartbeat. Around her float translucent shards of old emotional armor dissolving into light butterflies. The background is deep purple-to-violet gradient sky with soft nebula clouds and tiny floating light orbs. Dramatic vertical composition. Cinematic wide angle. Extremely detailed, professional book cover quality.',
      intro: 'A serene overhead view of a Vietnamese woman lying peacefully on her back in a shallow pool of calm water surrounded by floating purple lotus flowers and soft golden light reflections. Her eyes are closed, her expression is peaceful and vulnerable. Her long dark hair fans out in the water like silk. Petals drift around her. Ethereal, meditative, healing mood. Bird-eye view composition.',
    },
    'riseshine-2-paid': {
      cover: 'A breathtaking full-page book cover illustration. A Vietnamese woman walking on a winding path through a mystical emerald forest. The path is made of soft glowing stepping stones. Ancient trees with teal-green canopy form a natural cathedral above her. Butterflies made of soft light guide her way. In the distance, a warm golden clearing awaits. Rich teal and emerald tones with golden light. Dramatic vertical composition. Extremely detailed, professional book cover quality.',
      intro: 'A Vietnamese woman sitting in meditation inside a translucent cocoon of soft teal-green light, inside a peaceful bamboo grove. Around her, 30 small floating journal pages drift gently, each emitting a soft warm glow. Transformation, patience, inner work. Overhead soft light rays filter through bamboo leaves. Dreamy emerald palette.',
    },
    'riseshine-3-premium': {
      cover: 'A breathtaking full-page book cover illustration. A Vietnamese woman standing on the peak of a golden mountain at sunrise, arms open wide, looking at a vast infinite horizon of warm amber clouds. Her silhouette is strong and free. Behind her, a winding path of stepping stones through clouds shows the journey she completed. The sun creates a dramatic corona of light around her. Rich orange, amber, and gold tones. Dramatic vertical composition. Extremely detailed, professional book cover quality.',
      intro: 'A Vietnamese architect woman sketching glowing blueprint-like plans in mid-air with light trails from her fingertips. Around her, translucent floating structures emerge — a home, a bridge, a garden — all made of warm amber light. She stands in a vast open golden desert at sunset. Creation, potential, empowerment. Wide golden palette.',
    },
  },

  // ─── Intro Quotes ───────────────────────────────────────────
  introQuotes: {
    'riseshine-1-free': {
      text: 'Bạn không cần phải mạnh mẽ mọi lúc.\nĐôi khi, cho phép mình yếu đuối\nchính là bước đầu tiên của sự chữa lành.',
      attribution: '— Rise & Shine —',
    },
    'riseshine-2-paid': {
      text: 'Chữa lành không phải là quên đi quá khứ.\nMà là học cách sống bình an\nvới những gì đã xảy ra.',
      attribution: '— Rise & Shine —',
    },
    'riseshine-3-premium': {
      text: 'Bạn đã đủ mạnh để chữa lành.\nBây giờ, hãy đủ can đảm\nđể thiết kế lại cuộc đời mình.',
      attribution: '— Rise & Shine —',
    },
  },
};
