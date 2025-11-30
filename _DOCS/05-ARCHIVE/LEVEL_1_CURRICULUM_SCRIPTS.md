# LEVEL 1: QUICK WIN - CURRICULUM SCRIPTS

## "AI làm việc cho bạn" - From Zero to First $500 in 14 Days

---

## MODULE 1.1: YOUR FIRST AI AGENT (Day 1-7)

### 🎯 LESSON 1.1.1: "Tạo AI Agent Đầu Tiên Trong 2 Giờ"

**Duration**: 2 hours | **XP**: 50 points

#### Opening Hook (5 mins)

"Chào mừng! Bạn đang đọc cái này nghĩa là bạn đã quyết định không học AI nữa - mà học cách SỬ DỤNG AI để kiếm tiền. Smart choice!

Trong 2 giờ tới, không có lý thuyết gì cả. Chỉ có 1 mục tiêu duy nhất: **Tạo ra 1 AI agent hoạt động được, deploy lên internet, và có thể show cho khách hàng ngay**.

Lesson này được thiết kế cho người **HOÀN TOÀN MỚI**. Nếu bạn đã biết code - tốt. Nếu chưa - còn tốt hơn (vì bạn sẽ không bị rối bởi technical jargon)."

#### What You'll Build (5 mins)

**🤖 AI Email Assistant**

- Nhận email từ khách hàng
- Tự động phân loại: Sales / Support / Complaint
- Tự động draft reply phù hợp
- Gửi cho bạn approve trước khi send

**Why this agent?**

- Dễ demo (ai cũng dùng email)
- Immediate value (tiết kiệm 2-3 giờ/ngày)
- Easy pricing ($99-299/month)
- Scale được (mọi công ty đều cần)

#### Step-by-Step Build Process (90 mins)

**PART 1: Setup OpenAI Account (15 mins)**

```markdown
1. Vào https://platform.openai.com/signup
2. Verify email + phone
3. Add payment method
4. Generate API key:
   - Click "API Keys" trong dashboard
   - "Create new secret key"
   - Copy và save vào notepad (chỉ show 1 lần!)
   - Name it: "email-assistant-prod"

⚠️ QUAN TRỌNG: 
- Đặt spending limit $10/month (Settings > Billing > Usage limits)
- Với AI agent này, $10 = handle ~2000 emails
- Average cost: $0.005/email processed
```

**PART 2: Get the Starter Code (10 mins)**

```markdown
1. Mở GitHub repository: github.com/longsang-academy/ai-email-assistant
2. Click "Use this template" → "Create new repository"
3. Name: "my-email-assistant"
4. Click "Create repository"
5. Click "Code" → "Download ZIP"
6. Extract vào Desktop/ai-projects/

📁 Folder structure:
my-email-assistant/
├── agent.py           # Main AI logic
├── config.yaml        # Your settings
├── requirements.txt   # Dependencies
└── README.md          # Instructions
```

**PART 3: Configure Your Agent (20 mins)**

Mở file `config.yaml`:

```yaml
# AI Email Assistant Configuration
# Lesson 1.1.1 - Quick Win Academy

# OpenAI Settings
openai:
  api_key: "PASTE_YOUR_API_KEY_HERE"
  model: "gpt-4o-mini"  # Cheaper & faster than GPT-4
  max_tokens: 500
  temperature: 0.3  # Lower = more consistent

# Email Settings
email:
  provider: "gmail"  # or "outlook"
  address: "your.email@gmail.com"
  check_interval: 300  # Check every 5 minutes

# Agent Behavior
agent:
  name: "EmailBot"
  language: "vietnamese"  # or "english"
  auto_reply: false  # Must approve first (safety!)
  
# Classification Rules
classify:
  sales: ["quote", "pricing", "buy", "purchase", "order"]
  support: ["help", "how to", "error", "problem", "issue"]
  complaint: ["refund", "cancel", "bad", "terrible", "disappointed"]

# Reply Templates
templates:
  sales: |
    Thank you for your interest! 
    Our sales team will contact you within 2 hours with a custom quote.
    
  support: |
    We received your support request.
    Our technical team is reviewing and will respond shortly.
    
  complaint: |
    We sincerely apologize for your experience.
    This has been escalated to our management team.
```

**✏️ YOUR TASK:**

1. Replace `PASTE_YOUR_API_KEY_HERE` với OpenAI key của bạn
2. Change `your.email@gmail.com` thành email thật
3. Adjust `language` nếu muốn English
4. Save file

**PART 4: Install & Run (25 mins)**

**For Windows:**

```powershell
# 1. Mở PowerShell
cd Desktop\ai-projects\my-email-assistant

# 2. Install Python (if needed)
# Download from: https://www.python.org/downloads/
# Check version: python --version

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run agent
python agent.py

# ✅ Should see:
# "🤖 Email Assistant started!"
# "📧 Checking inbox every 5 minutes..."
# "✅ Ready to process emails!"
```

**For Mac:**

```bash
# 1. Open Terminal
cd ~/Desktop/ai-projects/my-email-assistant

# 2. Install dependencies
pip3 install -r requirements.txt

# 3. Run agent
python3 agent.py
```

**PART 5: Test Your Agent (20 mins)**

```markdown
1. Send test email to yourself:
   Subject: "I want to buy 10 licenses"
   Body: "How much does it cost?"

2. Wait ~30 seconds

3. Check agent terminal - should see:
   "📨 New email: I want to buy 10 licenses"
   "🏷️ Classified: SALES"
   "✍️ Draft reply generated"
   "⏸️ Waiting for your approval..."

4. Agent shows draft:
   ---
   Thank you for your interest! 
   Our sales team will contact you within 2 hours...
   ---
   
5. Type 'approve' to send, or 'edit' to modify

6. Check your inbox → reply sent! ✅
```

#### Agent Code Walkthrough (15 mins)

Mở `agent.py` - Let's understand what's happening:

```python
# 1. INITIALIZATION
import openai
import yaml

config = yaml.safe_load(open('config.yaml'))
openai.api_key = config['openai']['api_key']

# 2. EMAIL FETCHING
def check_inbox():
    """Fetch unread emails"""
    emails = gmail_api.get_unread()
    return emails

# 3. AI CLASSIFICATION
def classify_email(email_text):
    """Ask GPT to classify email type"""
    prompt = f"""
    Classify this email into: sales, support, or complaint
    
    Email: {email_text}
    
    Return ONLY one word.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content.lower()

# 4. DRAFT REPLY
def generate_reply(email_type, email_text):
    """Generate appropriate reply using AI"""
    template = config['templates'][email_type]
    
    prompt = f"""
    Use this template: {template}
    
    Personalize it based on: {email_text}
    
    Keep it professional and friendly.
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    
    return response.choices[0].message.content

# 5. MAIN LOOP
while True:
    emails = check_inbox()
    
    for email in emails:
        category = classify_email(email.body)
        reply = generate_reply(category, email.body)
        
        print(f"Draft: {reply}")
        
        if input("Approve? (y/n): ") == 'y':
            send_reply(email, reply)
            
    time.sleep(300)  # Wait 5 minutes
```

**🎓 Key Concepts:**

- **Prompt Engineering**: Câu hỏi đúng = câu trả lời đúng
- **Temperature**: 0.3 = consistent, 0.9 = creative
- **Tokens**: ~$0.002/1000 tokens (1 token ≈ 4 characters)
- **Rate Limits**: Free tier = 3 requests/min

#### Deploy to Production (10 mins)

**Option 1: Run on Your Computer 24/7**

```powershell
# Windows: Create scheduled task
schtasks /create /tn "EmailAgent" /tr "python C:\path\to\agent.py" /sc onstart
```

**Option 2: Deploy to Cloud (Recommended)**

```bash
# Deploy to Railway (free tier: 500 hours/month)
1. Sign up: railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables:
   - OPENAI_API_KEY
   - EMAIL_ADDRESS
5. Click "Deploy"

✅ Agent now runs 24/7 in cloud!
```

#### Assignment: First Demo (15 mins)

**YOUR MISSION:**

1. Send 5 different test emails to yourself:
   - 1 sales inquiry
   - 1 support request
   - 1 complaint
   - 1 general question
   - 1 spam/irrelevant

2. Screenshot agent responses

3. Create simple demo video:
   - Record screen showing inbox
   - Show agent processing emails
   - Show drafted replies
   - Show final sent emails

4. Upload to Google Drive / YouTube (unlisted)

5. Submit link in Discord: #lesson-1-1-1-complete

**🏆 Reward upon completion:**

- +50 XP
- "First Agent Deployed" badge
- Access to Lesson 1.1.2

---

### 🎯 LESSON 1.1.2: "Deploy Agent Lên Cloud & Share với Khách"

**Duration**: 1.5 hours | **XP**: 75 points

#### Why Deploy to Cloud? (5 mins)

**Problem với local computer:**
❌ Phải bật máy 24/7
❌ Mất điện = agent chết
❌ Không professional khi demo
❌ Khó scale

**Cloud benefits:**
✅ 99.9% uptime
✅ Scale tự động
✅ Professional URL
✅ Easy monitoring
✅ Cost: $0-5/month

#### Choose Your Cloud Platform (10 mins)

**3 Options - Pick one:**

| Platform | Pros | Cons | Best For |
|----------|------|------|----------|
| **Railway.app** | Free $5/month credit<br/>Auto deploy from GitHub<br/>Easy setup | Limited free tier | Testing & demos |
| **Render.com** | 750 hours free/month<br/>Auto-sleep saves money | Cold starts (slow wake) | Production MVP |
| **DigitalOcean** | Full control<br/>$4/month | Needs server knowledge | Scaling up |

**📝 Recommendation: Start with Railway**

- Easiest for beginners
- Free for first month
- Upgrade later when profitable

#### Railway Deployment Guide (45 mins)

**STEP 1: Prepare Your Code (10 mins)**

Add `railway.json`:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python agent.py",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

Add `Procfile`:

```
worker: python agent.py
```

Update `requirements.txt`:

```txt
openai==1.3.0
pyyaml==6.0.1
requests==2.31.0
google-auth==2.23.4
google-auth-oauthlib==1.1.0
google-auth-httplib2==0.1.1
google-api-python-client==2.108.0
```

**STEP 2: Push to GitHub (10 mins)**

```bash
# Initialize git
git init
git add .
git commit -m "Initial commit - AI Email Assistant"

# Create repo on GitHub (github.com/new)
# Name: ai-email-assistant-prod

# Push
git remote add origin https://github.com/YOUR_USERNAME/ai-email-assistant-prod.git
git branch -M main
git push -u origin main
```

**STEP 3: Deploy to Railway (15 mins)**

```markdown
1. Go to railway.app
2. Click "Login with GitHub"
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose "ai-email-assistant-prod"
6. Railway auto-detects Python
7. Click "Deploy"

⏳ Wait 2-3 minutes for build...

✅ Build complete!
```

**STEP 4: Configure Environment Variables (10 mins)**

```markdown
1. Click on your project
2. Click "Variables" tab
3. Add:
   - OPENAI_API_KEY = "sk-..."
   - EMAIL_ADDRESS = "your@email.com"
   - EMAIL_PASSWORD = "app_password"
   - ENVIRONMENT = "production"

4. Click "Deploy" to restart with new vars

🔍 Check logs:
- Click "Deployments"
- View "Build Logs"
- Should see: "🤖 Email Assistant started!"
```

#### Monitor Your Agent (10 mins)

**Railway Dashboard:**

- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time output from agent
- **Deployments**: Version history

**Add Health Check Endpoint:**

Update `agent.py`:

```python
from flask import Flask
import threading

app = Flask(__name__)

@app.route('/health')
def health():
    return {
        'status': 'healthy',
        'emails_processed': email_counter,
        'uptime': get_uptime()
    }

# Run Flask in background thread
def run_flask():
    app.run(host='0.0.0.0', port=8080)

threading.Thread(target=run_flask, daemon=True).start()

# Main agent loop continues...
```

**Access at**: `https://your-app.railway.app/health`

#### Create Client Demo Page (20 mins)

Create `index.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Email Assistant - Live Demo</title>
    <style>
        body { 
            font-family: Arial; 
            max-width: 800px; 
            margin: 50px auto;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        .status {
            padding: 20px;
            background: rgba(0,255,0,0.2);
            border-radius: 10px;
            margin: 20px 0;
        }
        .stats {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
        }
        .stat-card {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        .stat-number {
            font-size: 48px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 AI Email Assistant</h1>
        <p>Your 24/7 intelligent email handler</p>
        
        <div class="status">
            <h2>✅ System Status: ONLINE</h2>
            <p>Last checked: <span id="lastCheck"></span></p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number" id="processed">247</div>
                <p>Emails Processed</p>
            </div>
            <div class="stat-card">
                <div class="stat-number">2.3s</div>
                <p>Avg Response Time</p>
            </div>
            <div class="stat-card">
                <div class="stat-number">99.9%</div>
                <p>Accuracy Rate</p>
            </div>
        </div>
        
        <h2>📊 Recent Activity</h2>
        <div id="activity"></div>
        
        <h2>💼 Pricing</h2>
        <p><strong>$149/month</strong> - Unlimited emails, 24/7 support</p>
        <button onclick="alert('Contact: your@email.com')">Get Started</button>
    </div>
    
    <script>
        // Update timestamp
        setInterval(() => {
            document.getElementById('lastCheck').textContent = 
                new Date().toLocaleTimeString();
        }, 1000);
        
        // Fetch live stats
        async function updateStats() {
            const res = await fetch('/health');
            const data = await res.json();
            document.getElementById('processed').textContent = 
                data.emails_processed;
        }
        
        updateStats();
        setInterval(updateStats, 5000);
    </script>
</body>
</html>
```

Deploy này lên Railway static site hoặc Netlify!

#### Assignment: Get Your First Demo Call (10 mins)

**YOUR MISSION:**

1. Deploy agent successfully to Railway
2. Test health endpoint works
3. Create demo page
4. Record 2-min demo video showing:
   - Live dashboard
   - Agent processing email
   - Stats updating real-time

5. Share demo link with 3 people (friends/family)
6. Ask for feedback

**🏆 Reward:**

- +75 XP
- "Cloud Deployed" badge
- Demo template access

---

### 🎯 LESSON 1.1.3: "Customize Agent Cho Industry Cụ Thể"

**Duration**: 2 hours | **XP**: 100 points

*(Similar detailed format for remaining lessons...)*

---

### 🎯 LESSON 1.1.4: "Tính Chi Phí & Đặt Giá Bán"

**Duration**: 1.5 hours | **XP**: 75 points

*(Detailed pricing strategy, cost calculation, ROI demonstration...)*

---

## MODULE 1.2: YOUR FIRST CLIENT (Day 8-14)

### 🎯 LESSON 1.2.1: "Tìm & Approach 10 Potential Clients Trong 2 Ngày"

**Duration**: 3 hours | **XP**: 150 points

*(Cold outreach scripts, LinkedIn strategy, email templates...)*

---

### 🎯 LESSON 1.2.2: "Demo Call Framework: Close 30% Rate"

**Duration**: 2 hours | **XP**: 200 points

*(Demo script, handling objections, closing techniques...)*

---

## 🎓 LEVEL 1 COMPLETION CRITERIA

**To unlock Level 2, you must:**

- ✅ Complete all 6 lessons
- ✅ Earn 650 XP minimum
- ✅ Deploy 1 working agent to cloud
- ✅ Complete 3 demo calls (success or fail)
- ✅ Submit case study in Discord

**Graduation Reward:**

- 🏆 "Quick Win Master" badge
- 💰 +500 bonus XP
- 🎁 Level 2 starter templates
- 📞 1-on-1 strategy call with instructor

---

**REMEMBER:**
Đây không phải course để "học" - đây là BATTLE PLAN để **KIẾM TIỀN**.

Mỗi lesson kết thúc = Bạn có thêm 1 skill kiếm tiền thực tế.

Level 1 done = Bạn đã biết cách close first $500.

Let's go! 🚀
