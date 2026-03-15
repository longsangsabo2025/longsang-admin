/**
 * 🧠 Add New Knowledge to Brain
 * Run: node scripts/add-new-knowledge.mjs
 */

import OpenAI from 'openai';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new pg.Pool({ 
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:5432/postgres' 
});

const USER_ID = process.env.BRAIN_USER_ID || '89917901-cf15-45c4-a7ad-8c4c9513347e';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// ═══════════════════════════════════════════════════════════════
// NEW KNOWLEDGE TO ADD
// ═══════════════════════════════════════════════════════════════

const NEW_KNOWLEDGE = [
  // ─────────────────────────────────────────────────────────────
  // SABO ECOSYSTEM - More Details
  // ─────────────────────────────────────────────────────────────
  {
    domain: 'SABO Ecosystem',
    title: 'SABO Arena - Reward System',
    content: `# SABO Arena Reward System

## Loại Phần Thưởng
1. **Daily Rewards**: Check-in hàng ngày nhận SABO tokens
2. **Tournament Prizes**: Giải thưởng từ các giải đấu
3. **Achievement Badges**: Huy hiệu thành tích
4. **Referral Bonus**: Thưởng giới thiệu bạn bè

## Token Economics
- Earn rate: 10-100 SABO/game
- Tournament prize pool: 1000-10000 SABO
- Minimum withdrawal: 500 SABO
- Conversion: 1 SABO = 100 VND (planned)

## Tiers & Levels
- Bronze: 0-999 points
- Silver: 1000-4999 points  
- Gold: 5000-19999 points
- Platinum: 20000+ points

## Special Events
- Weekend Double XP
- Holiday Tournaments
- Birthday Rewards
- Anniversary Bonuses`
  },
  {
    domain: 'SABO Ecosystem',
    title: 'SABO Billiards - Services & Pricing',
    content: `# SABO Billiards - TP. Vũng Tàu

## Địa chỉ
123 Đường ABC, Phường XYZ, TP. Vũng Tàu

## Dịch vụ
1. **Billiards Tables**: Pool, Snooker, Carom
2. **Coaching**: 1-1 lessons với HLV chuyên nghiệp
3. **Equipment Sales**: Cues, balls, accessories
4. **Tournaments**: Weekly & monthly events

## Bảng Giá
- Pool table: 30.000đ/giờ
- Snooker: 40.000đ/giờ
- Carom: 35.000đ/giờ
- Member discount: 20% off
- Student discount: 15% off

## Giờ Mở Cửa
- Thứ 2-6: 9:00 - 23:00
- Thứ 7-CN: 8:00 - 24:00

## Contact
- Phone: 0123.456.789
- Facebook: SABO Billiards - TP. Vũng Tàu
- Instagram: @sabobilliard`
  },
  // ─────────────────────────────────────────────────────────────
  // CUSTOMER & BUSINESS
  // ─────────────────────────────────────────────────────────────
  {
    domain: 'Business Logic',
    title: 'Customer Personas',
    content: `# Long Sang Customer Personas

## Persona 1: Solo Developer "Minh"
- **Age**: 25-35
- **Job**: Freelance developer
- **Goals**: Automate repetitive tasks, build faster
- **Pain Points**: Limited time, no team
- **Solutions**: AI Secretary, Solo Hub

## Persona 2: Small Business Owner "Hương"
- **Age**: 35-50
- **Business**: Real estate, retail
- **Goals**: Increase sales, manage social media
- **Pain Points**: No marketing expertise
- **Solutions**: AI Content, Social Media automation

## Persona 3: Content Creator "Tùng"
- **Age**: 20-30
- **Platform**: YouTube, TikTok
- **Goals**: Create more content, grow audience
- **Pain Points**: Time-consuming editing
- **Solutions**: Music Video App, AI Art

## Persona 4: Billiards Enthusiast "Khoa"
- **Age**: 18-40
- **Interest**: Competitive billiards
- **Goals**: Improve skills, win tournaments
- **Pain Points**: No local community
- **Solutions**: SABO Arena, SABO Billiards club`
  },
  {
    domain: 'Business Logic',
    title: 'Sales Funnel & Lead Nurturing',
    content: `# Sales Funnel

## Stage 1: Awareness
- Social media posts
- YouTube tutorials
- Blog content
- SEO

## Stage 2: Interest
- Free trials
- Demo videos
- Email capture
- Lead magnets

## Stage 3: Decision
- Case studies
- Testimonials
- Feature comparisons
- Free consultation

## Stage 4: Action
- Special offers
- Limited time discounts
- Easy onboarding
- Payment plans

## Lead Nurturing Sequence
1. Day 0: Welcome email + quick start guide
2. Day 2: Feature highlight #1
3. Day 5: Success story / case study
4. Day 7: Feature highlight #2
5. Day 10: Offer / discount
6. Day 14: Last chance reminder`
  },
  // ─────────────────────────────────────────────────────────────
  // SOCIAL MEDIA
  // ─────────────────────────────────────────────────────────────
  {
    domain: 'Operations & DevOps',
    title: 'Social Media Accounts & Tokens',
    content: `# Social Media Integration Guide

## Facebook Pages
1. **SABO Billiards - TP. Vũng Tàu** (Main)
   - ID: 118356497898536
   - Fans: 18,850
   - Use: Main billiards promotion

2. **SABO Arena**
   - ID: 719273174600166
   - Use: Gaming platform

3. **AI Newbie VN**
   - ID: 569671719553461
   - Use: AI education

4. **SABO Media**
   - ID: 332950393234346
   - Use: Content creation

## Instagram Accounts
- @sabobilliard - SABO Billiards
- @sabomediavt - SABO Media
- @newbiehocmake - AI Newbie
- @sabobidashop - Billiard Shop

## LinkedIn
- Account: Long Sang
- Token expires: ~60 days from Nov 26, 2025

## Threads
- Account: @baddie.4296

## YouTube
- Channel: Long Sang
- Subscribers: 12
- Videos: 20`
  },
  {
    domain: 'Business Logic',
    title: 'Content Calendar Strategy',
    content: `# Weekly Content Calendar

## Monday: Education Day
- Facebook: Tutorial post
- Instagram: Quick tip
- YouTube: Long-form tutorial

## Tuesday: Engagement Day
- Facebook: Question/Poll
- Instagram: Story quiz
- LinkedIn: Industry insight

## Wednesday: Showcase Day
- Facebook: Product feature
- Instagram: Reel demo
- YouTube: Behind the scenes

## Thursday: Community Day
- Facebook: User story
- Instagram: UGC share
- Threads: Discussion topic

## Friday: Fun Day
- Facebook: Meme/Fun content
- Instagram: Trend participation
- TikTok: Challenge

## Weekend: Promotion
- Saturday: Special offer
- Sunday: Week recap

## Best Posting Times (Vietnam)
- Facebook: 8-9 AM, 12-1 PM, 7-9 PM
- Instagram: 11 AM - 1 PM, 7-9 PM
- LinkedIn: 8-10 AM
- YouTube: 2-4 PM, 7-9 PM`
  },
  // ─────────────────────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────────────────────
  {
    domain: 'Longsang Admin',
    title: 'AI Secretary Features',
    content: `# AI Secretary - Personal AI Assistant

## Core Features
1. **Task Management**: Create, track, prioritize tasks
2. **Calendar Integration**: Schedule meetings, reminders
3. **Email Drafting**: AI-powered email composition
4. **Meeting Notes**: Automatic summarization
5. **Research Assistant**: Quick information lookup

## Supported Integrations
- Google Calendar
- Gmail
- Slack
- Notion
- Trello

## AI Capabilities
- Natural language processing
- Context awareness
- Multi-language support (EN, VI)
- Voice commands (planned)

## Use Cases
- Schedule meetings: "Set up a call with John tomorrow at 2pm"
- Draft emails: "Write a follow-up email to the client"
- Research: "What are the latest AI trends?"
- Reminders: "Remind me to review the report in 2 hours"

## Pricing (Planned)
- Free: 50 queries/month
- Pro: 500 queries/month - $9.99
- Unlimited: $29.99/month`
  },
  {
    domain: 'Longsang Admin',
    title: 'AI Newbie Web - Course Platform',
    content: `# AI Newbie Web - Learn AI Simply

## Mission
Giúp người Việt tiếp cận AI một cách dễ dàng

## Course Categories
1. **AI Basics**: ChatGPT, Claude, Gemini
2. **AI Art**: Midjourney, DALL-E, Stable Diffusion
3. **AI Video**: Runway, Pika, HeyGen
4. **AI Audio**: ElevenLabs, Suno AI
5. **No-Code AI**: Make, Zapier, N8N

## Course Format
- Video lessons: 5-15 minutes each
- Hands-on projects
- Quizzes & assessments
- Certificate upon completion

## Target Audience
- Beginners with zero AI experience
- Vietnamese speakers
- Age: 18-55

## Platform Features
- Progress tracking
- Community forum
- Live Q&A sessions
- Resource library

## Revenue Model
- Individual courses: 199k-499k VND
- Subscription: 149k/month
- Corporate training packages`
  },
  // ─────────────────────────────────────────────────────────────
  // OPERATIONS
  // ─────────────────────────────────────────────────────────────
  {
    domain: 'Operations & DevOps',
    title: 'Daily Operations Checklist',
    content: `# Daily Operations Checklist

## Morning (8:00 - 9:00)
□ Check Sentry for overnight errors
□ Review server health dashboards
□ Check social media notifications
□ Review scheduled posts
□ Check email for urgent issues

## Midday (12:00 - 13:00)
□ Monitor API response times
□ Check database performance
□ Review user feedback/support tickets
□ Post midday social content

## Evening (17:00 - 18:00)
□ Review daily analytics
□ Check deployment status
□ Backup critical data
□ Plan tomorrow's tasks
□ Update project status

## Weekly Tasks
- Monday: Team sync, sprint planning
- Wednesday: Code review session
- Friday: Weekly report, retrospective

## Monthly Tasks
- Week 1: KPI review
- Week 2: Infrastructure audit
- Week 3: Security review
- Week 4: Strategic planning`
  },
  {
    domain: 'Troubleshooting',
    title: 'Facebook API Common Issues',
    content: `# Facebook API Troubleshooting

## Issue: Token Expired (Error 190)
**Symptoms**: "Error validating access token"
**Solution**:
1. Go to Facebook Developer Console
2. Generate new long-lived token
3. Update .env file
4. Restart API server

## Issue: Permission Denied (Error 10)
**Symptoms**: "User does not have permission"
**Solution**:
1. Check app permissions in Meta Business Suite
2. Re-authenticate with required scopes
3. Verify page role (must be Admin)

## Issue: Rate Limiting (Error 4)
**Symptoms**: "Too many calls"
**Solution**:
1. Implement exponential backoff
2. Cache frequently accessed data
3. Batch requests when possible
4. Use webhooks instead of polling

## Issue: Post Not Publishing
**Symptoms**: Post API returns success but no post visible
**Solution**:
1. Check page publishing permissions
2. Verify content doesn't violate policies
3. Check if page is unpublished
4. Review scheduled time settings

## Token Refresh Schedule
- User tokens: Refresh every 60 days
- Page tokens: Permanent (never expire)
- App tokens: Never expire`
  }
];

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

async function getOrCreateDomain(name) {
  // Check if domain exists
  const existing = await pool.query(
    `SELECT id FROM brain_domains WHERE user_id = $1 AND name = $2`,
    [USER_ID, name]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }
  
  // Create new domain
  const result = await pool.query(
    `INSERT INTO brain_domains (user_id, name, description, color)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [USER_ID, name, `Knowledge about ${name}`, '#3B82F6']
  );
  
  console.log(`📁 Created new domain: ${name}`);
  return result.rows[0].id;
}

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.substring(0, 8000)
  });
  return response.data[0].embedding;
}

async function addKnowledge(item) {
  const domainId = await getOrCreateDomain(item.domain);
  
  // Check if already exists
  const existing = await pool.query(
    `SELECT id FROM brain_knowledge WHERE user_id = $1 AND title = $2`,
    [USER_ID, item.title]
  );
  
  if (existing.rows.length > 0) {
    console.log(`⏭️  Skipped (exists): ${item.title}`);
    return false;
  }
  
  // Generate embedding
  const text = item.title + '\n\n' + item.content;
  const embedding = await generateEmbedding(text);
  
  // Insert
  await pool.query(
    `INSERT INTO brain_knowledge (user_id, domain_id, title, content, content_type, embedding)
     VALUES ($1, $2, $3, $4, 'document', $5)`,
    [USER_ID, domainId, item.title, item.content, '[' + embedding.join(',') + ']']
  );
  
  console.log(`✅ Added: ${item.title}`);
  return true;
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║         🧠 ADD NEW KNOWLEDGE TO BRAIN                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
`);
  
  let added = 0;
  let skipped = 0;
  
  for (const item of NEW_KNOWLEDGE) {
    try {
      const wasAdded = await addKnowledge(item);
      if (wasAdded) added++;
      else skipped++;
      
      // Rate limiting
      await new Promise(r => setTimeout(r, 300));
    } catch (error) {
      console.error(`❌ Error adding ${item.title}:`, error.message);
    }
  }
  
  // Get final count
  const total = await pool.query(
    `SELECT COUNT(*) FROM brain_knowledge WHERE user_id = $1`,
    [USER_ID]
  );
  
  console.log(`
═══════════════════════════════════════════════════════════════════════
📊 RESULTS
═══════════════════════════════════════════════════════════════════════
✅ Added: ${added} new items
⏭️  Skipped: ${skipped} existing items
📚 Total knowledge: ${total.rows[0].count} items
`);
  
  await pool.end();
}

main().catch(console.error);
