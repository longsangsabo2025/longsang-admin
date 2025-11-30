# COMMUNITY PLATFORM SETUP

## Discord + Telegram Integration for Long Sang Academy

---

## 🎯 OBJECTIVE

Create vibrant community where students:

- Share wins & projects
- Get help from peers & instructors
- Network for business opportunities
- Stay motivated through accountability

---

## 📱 DISCORD SETUP (30 minutes)

### Step 1: Create Server

1. Go to <https://discord.com>
2. Click "Add a Server" → "Create My Own"
3. Name: "Long Sang Academy - AI Agents"
4. Upload logo (purple/cyan gradient)

### Step 2: Create Channels

```
📢 ANNOUNCEMENTS
├── #welcome
├── #rules
└── #announcements

💬 GENERAL
├── #introductions
├── #general-chat
└── #wins-celebrations

📚 LEARNING
├── #lesson-help
├── #code-review
├── #project-showcase
└── #resources

💼 BUSINESS
├── #client-acquisition
├── #pricing-strategy
├── #partnerships
└── #job-board

🎮 LEVEL-BASED (Private channels)
├── #level-1-quick-win
├── #level-2-scale-up
└── #level-3-business-mastery

🤖 BOT COMMANDS
└── #bot-commands
```

### Step 3: Configure Roles

```yaml
Roles:
  - name: "Founder"
    color: Gold
    permissions: Admin
    
  - name: "Instructor"
    color: Purple
    permissions: Manage Channels, Manage Messages
    
  - name: "Level 3 - Business Master"
    color: Cyan
    permissions: Send Messages, Embed Links
    
  - name: "Level 2 - Scaling"
    color: Green
    permissions: Send Messages
    
  - name: "Level 1 - Quick Win"
    color: Blue
    permissions: Send Messages
    
  - name: "New Student"
    color: Gray
    permissions: Read Messages
```

### Step 4: Install Bots

**1. MEE6 Bot (Auto-welcome + XP)**

```
1. Go to: https://mee6.xyz
2. Click "Add to Discord"
3. Select your server
4. Configure:
   - Welcome message in #welcome
   - XP system (link to database)
   - Auto-role on join: "New Student"
```

**Welcome Message Template:**

```
Welcome to Long Sang Academy, {user}! 🎉

You're here to learn one thing: **Make money with AI agents**.

📋 Start here:
1. Read #rules
2. Introduce yourself in #introductions
3. Head to #level-1-quick-win to begin

Questions? Tag @Instructor or ask in #lesson-help.

Let's build! 🚀
```

**2. Apollo Bot (Auto-role based on level)**

```
npm install discord.js @supabase/supabase-js

// bot.js
const { Client } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const client = new Client({ intents: ['Guilds', 'GuildMembers'] });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Sync Discord roles with Academy levels
setInterval(async () => {
  const { data: students } = await supabase
    .from('user_xp')
    .select('user_id, current_level, discord_id');
  
  for (const student of students) {
    const member = await guild.members.fetch(student.discord_id);
    
    // Remove old level roles
    await member.roles.remove(['level-1-role-id', 'level-2-role-id', 'level-3-role-id']);
    
    // Add current level role
    const roleId = {
      1: 'level-1-role-id',
      2: 'level-2-role-id',
      3: 'level-3-role-id'
    }[student.current_level];
    
    await member.roles.add(roleId);
  }
}, 60000); // Every minute

client.login(DISCORD_BOT_TOKEN);
```

**3. Dyno Bot (Moderation)**

```
- Auto-delete spam
- Slow mode in #general-chat (5s cooldown)
- Ban/kick commands for @Instructor role
```

---

## 💬 TELEGRAM INTEGRATION (20 minutes)

### Step 1: Create Channel

1. Open Telegram
2. New Channel → "Long Sang Academy"
3. Make it Public: @longsangacademy
4. Add description:

```
🤖 AI làm việc cho bạn

Learn to build & sell AI agents.
From zero to $10K/month.

Join Discord: discord.gg/longsang
Website: longsang.academy
```

### Step 2: Create Bot

```bash
# Talk to @BotFather on Telegram
/newbot
# Name: Long Sang Academy Bot
# Username: longsangacademy_bot

# Get token: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Set commands
/setcommands

start - Get started with Academy
lessons - View all lessons
submit - Submit your project
leaderboard - Top students
help - Get help
```

### Step 3: Auto-posting Bot

```python
# telegram_bot.py
import telegram
from supabase import create_client

bot = telegram.Bot(token='YOUR_BOT_TOKEN')
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Post new lesson announcements
async def post_new_lesson(lesson):
    message = f"""
🎓 **NEW LESSON AVAILABLE**

{lesson['title']}

{lesson['description']}

Start now: https://longsang.academy/lessons/{lesson['id']}

💰 XP Reward: {lesson['xp_points']}
    """
    
    await bot.send_message(
        chat_id='@longsangacademy',
        text=message,
        parse_mode='Markdown'
    )

# Post student wins
async def post_student_win(user, achievement):
    message = f"""
🏆 **STUDENT WIN!**

{user['name']} just {achievement['type']}!

"AI làm việc cho bạn" in action! 💪

Join us: longsang.academy
    """
    
    await bot.send_message(
        chat_id='@longsangacademy',
        text=message
    )

# Listen for /start command
@bot.message_handler(commands=['start'])
def send_welcome(message):
    bot.reply_to(message, """
Welcome to Long Sang Academy! 🚀

**Quick Links:**
- All Lessons: longsang.academy/lessons
- Discord Community: discord.gg/longsang
- Support: support@longsang.academy

Ready to build your first AI agent?
Type /lessons to begin!
    """)
```

---

## 🔗 INTEGRATION WITH ACADEMY PLATFORM

### Link Discord to User Account

```typescript
// src/lib/discord.ts
export async function linkDiscordAccount(userId: string, discordId: string) {
  const { error } = await supabase
    .from('user_profiles')
    .update({ discord_id: discordId })
    .eq('user_id', userId);
  
  if (!error) {
    // Grant access to Discord server
    await grantDiscordRole(discordId, 'New Student');
  }
}
```

### Auto-post to Discord when student completes lesson

```typescript
// src/lib/discord-webhooks.ts
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/...';

export async function postLessonComplete(user: User, lesson: Lesson) {
  await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: '🎉 Lesson Completed!',
        description: `${user.name} just finished **${lesson.title}**`,
        color: 0x9333EA, // Purple
        fields: [
          { name: 'XP Earned', value: `+${lesson.xp_points}`, inline: true },
          { name: 'Total XP', value: `${user.total_xp}`, inline: true }
        ],
        timestamp: new Date().toISOString()
      }]
    })
  });
}
```

---

## 📊 ENGAGEMENT TACTICS

### Daily Challenges

Post in Discord #bot-commands:

```
🎯 **DAILY CHALLENGE**

Build a simple AI chatbot that:
- Answers FAQs about your business
- Runs in terminal
- Uses GPT-4

First 3 to submit: +50 XP bonus!

Submit in #project-showcase
Deadline: Tonight 11:59 PM
```

### Weekly Live Q&A

```
📅 **WEEKLY LIVE SESSION**

Topic: "How to Close Your First AI Agent Client"

When: Friday 8 PM
Where: Discord Voice Channel #live-sessions

Bring your questions! 🎤
```

### Monthly Competitions

```
🏆 **MONTHLY HACKATHON**

Theme: "Best AI Agent for E-commerce"

Prizes:
🥇 1st: $500 + Featured on website
🥈 2nd: $300 + 1-on-1 consultation
🥉 3rd: $100 + Shoutout on social media

Deadline: End of month
Submit: #project-showcase
```

---

## 🎖️ COMMUNITY GUIDELINES

Post in #rules:

```markdown
# Community Rules

1. **Be Respectful**
   - No spam, harassment, or hate speech
   - Constructive criticism only

2. **Stay On Topic**
   - This is for AI agent development & business
   - Off-topic chat in #general-chat only

3. **Help Each Other**
   - Answer questions when you can
   - Share resources and wins

4. **No Self-Promotion Without Permission**
   - Ask @Instructor before sharing your product/service
   - Helpful resources are always welcome

5. **Protect Privacy**
   - Don't share API keys or passwords
   - Be careful with client information

6. **Give Credit**
   - Cite sources when sharing code/ideas
   - Don't plagiarize projects

**Break the rules?**
1st warning: Timeout (24 hours)
2nd warning: Timeout (7 days)
3rd violation: Permanent ban

Questions? DM @Instructor
```

---

## ✅ SETUP CHECKLIST

- [ ] Discord server created
- [ ] Channels structured
- [ ] Roles configured
- [ ] MEE6 bot installed (welcome messages)
- [ ] Dyno bot installed (moderation)
- [ ] Custom sync bot deployed (level roles)
- [ ] Telegram channel created
- [ ] Telegram bot created & configured
- [ ] Webhook integration with Academy platform
- [ ] Welcome automation tested
- [ ] First 10 students invited

---

**LAUNCH DAY:**

1. Invite founding students (Beta cohort)
2. Post first announcement
3. Host welcome session
4. Start daily challenge routine
5. Monitor engagement for first week

---

**Community = Accountability = Results** 🚀

Students who engage in community are 3x more likely to complete the course and make money.

Build the community. Watch them succeed.
