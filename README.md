# SchoolReach AI

**AI-Powered School Outreach Tool**

Upload a school list → Map columns → AI-personalize emails via Groq + LangChain → Preview → Send via Resend.

---

## 📋 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| AI | LangChain + Groq (llama-3.3-70b-versatile) |
| Email | Resend |
| CSV | Papa Parse (client) + custom server parser |
| Excel | SheetJS (xlsx) |
| Hosting | Vercel |

---

## ⚠️ Important: No Database

There is **intentionally no database**. Campaign data exists only for the current browser session.

> **Download the results CSV/Excel immediately after sending** if you want to keep a record.

---

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd schoolreach-ai
npm install
```

### 2. Get a Groq API Key (Free)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up or log in
3. Click **API Keys** → **Create API Key**
4. Copy the key (starts with `gsk_...`)

Groq's free tier is generous enough for hundreds of personalized emails.

### 3. Get a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Go to **API Keys** → **Create API Key**
3. Copy the key (starts with `re_...`)

> **Free tier:** 3,000 emails/month. Check [resend.com/pricing](https://resend.com/pricing) for current limits — they may change.

### 4. Verify Your Sender Domain with Resend

> You must verify your domain before Resend will send emails from it.

**Why this is necessary:**  
Email providers use SPF, DKIM, and DMARC DNS records to verify that you own the sending domain and authorize Resend to send on your behalf. Without this, emails will likely land in spam or be rejected.

**Steps:**
1. In Resend dashboard → **Domains** → **Add Domain**
2. Enter your domain (e.g. `yourdomain.com`)
3. Resend shows you DNS records to add:
   - **SPF** — tells receiving servers that Resend is allowed to send for your domain
   - **DKIM** — cryptographically signs your emails to prove they weren't tampered with
   - **DMARC** — tells receiving servers what to do with emails that fail SPF/DKIM
4. Add these DNS records in your domain registrar (Cloudflare, GoDaddy, Namecheap, etc.)
5. Click **Verify** in Resend — verification usually takes 5–15 minutes

**If you don't have a domain**, use **Demo Mode** to test the full workflow without sending real emails.

### 5. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
RESEND_API_KEY=re_your_resend_api_key_here
EMAIL_FROM=Your Name <outreach@yourdomain.com>
EMAIL_REPLY_TO=your-personal-email@gmail.com
```

> **Security:** API keys are **never exposed to the browser**. They are only used server-side in API routes.

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 CSV/Excel Format

Your file should have columns for:

| Column | Required | Notes |
|--------|----------|-------|
| School Name | ✅ Yes | Any column name — you'll map it |
| Email | ✅ Yes | Must be a valid email address |
| Principal Name | Optional | Used for personalized greeting |
| City / Area | Optional | Used for context in AI personalization |
| Board | Optional | CBSE, ICSE, IB, etc. |
| Student Count | Optional | |
| Annual Fee | Optional | |
| Academic Performance | Optional | |
| EdTech Maturity | Optional | High / Medium / Low |
| Primary Pain | Optional | Used by AI for targeted messaging |
| Buying Signal | Optional | |
| Target Score | Optional | Numeric score for filtering |
| Priority | Optional | High / Medium / Low |

Download `public/sample-schools.csv` for a working example.

---

## 🤖 AI Personalization

Uses **Groq** with `llama-3.3-70b-versatile` via **LangChain**.

The AI:
- Personalizes the subject, greeting, opening paragraph, and CTA
- Uses **only facts from the school's CSV row** — never invents data
- Keeps your core proposition intact (~20–30% personalization)
- Falls back to generic template if AI fails for a school

**Demo Mode** simulates AI personalization without using any API credits.

---

## 📧 Email Sending

Emails are sent via **Resend** in small batches of 5 to respect rate limits.

The frontend sends batch by batch — this design avoids long-running Vercel functions and is suitable for prototype campaigns.

> Check current [Resend rate limits](https://resend.com/docs/api-reference/rate-limits) before sending large campaigns.

---

## 🚀 Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial SchoolReach AI"
git remote add origin https://github.com/yourusername/schoolreach-ai.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. **Import Git Repository** → select your repo
3. Vercel auto-detects Next.js — no config needed

### 3. Add Environment Variables on Vercel

In Vercel dashboard → **Settings** → **Environment Variables**, add:

```
GROQ_API_KEY         = gsk_...
RESEND_API_KEY       = re_...
EMAIL_FROM           = Your Name <outreach@yourdomain.com>
EMAIL_REPLY_TO       = your-email@gmail.com
```

### 4. Deploy

Vercel will build and deploy automatically. Your app will be live at `https://your-project.vercel.app`.

### 5. Test the Deployed Version

1. Open the Vercel URL
2. Upload `public/sample-schools.csv` or use **Demo Mode**
3. Send a test email to yourself
4. Verify it arrives (check spam folder if needed)

---

## 🔒 Security Notes

- All API keys are **server-side only** — never sent to the browser
- File uploads are validated for type and size (max 10MB)
- Attachment size is limited to 5MB
- HTML promotional content is sanitized before rendering/sending
- Email addresses are validated before sending

---

## 🔁 Application Workflow

```
Dashboard
  → Upload File (CSV / Excel)
  → Map Columns (auto-detected)
  → Validate Schools
  → Select Recipients (with filters)
  → Compose Email (with template variables)
  → Add Promotional Material (image / PDF / HTML)
  → AI Personalization (Groq + LangChain)
  → Preview Every Email
  → Edit / Regenerate / Exclude
  → Send Test Email
  → Confirm & Send (batch of 5)
  → View Results
  → Download CSV / Excel
```

---

## 🧪 Demo Mode

Demo Mode allows full demonstration **without API keys or real email sending**.

Enable it by clicking **"Try Demo Mode"** on the dashboard or loading the sample CSV.

In Demo Mode:
- AI personalization is simulated locally
- Emails are marked as `DEMO — NOT ACTUALLY SENT`
- All results are clearly labeled as simulated

---

## 📝 License

MIT — for educational and prototype use.
