# Welcome to your Lovable project

## Project info

**URL**: <https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d>

---

## 🚀 Deployment Commands

```bash
# Deploy everything (database + functions + build)
npm run deploy:all

# Deploy database only
npm run deploy:db

# Deploy Edge Functions only
npm run deploy:functions

# Check Supabase status
npm run supabase:status

# Link to Supabase project
npm run supabase:link
```

---

## 📚 Documentation

| File | Description |
|------|-------------|
| **[SYSTEM_ACTIVATED.md](SYSTEM_ACTIVATED.md)** | 🔥 System status & quick commands |
| **[QUICK_START.md](QUICK_START.md)** | ⚡ Get started in 5 minutes |
| **[AUTOMATION_README.md](AUTOMATION_README.md)** | 📖 Complete system overview |
| **[PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md)** | 🚀 Production deployment guide |
| **[COMPLETION_SUMMARY.md](COMPLETION_SUMMARY.md)** | ✅ Implementation summary |

---

## 🎮 Try It Now

### **1. Access Automation Dashboard**

```
http://localhost:8080/automation
```

### **2. Sign In**

- Click "Sign In"
- Enter your email
- Check email for magic link
- Click link → You're in!

### **3. Test an Agent**

- Click "Content Writer Agent"
- Click "Manual Trigger"
- Watch the magic happen ✨

---

## 🔑 API Keys (Optional)

Add to `.env` for full functionality:

```env
# AI (for real generation)
VITE_OPENAI_API_KEY=sk-your-key
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-your-key

# Email (for auto-sending)
VITE_RESEND_API_KEY=re_your-key

# Social Media (for auto-posting)
VITE_LINKEDIN_ACCESS_TOKEN=your-token
VITE_FACEBOOK_ACCESS_TOKEN=your-token
```

**Without API keys:** System works in mock mode for testing

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI:** OpenAI GPT-4 + Anthropic Claude
- **Email:** Resend + SendGrid
- **Social:** LinkedIn + Facebook APIs
- **Auth:** Supabase Auth (Magic Link)

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1c78c058-532c-4f85-9cd5-a754c6ee895d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
# Secrets added at 2025-11-30 15:55:05
