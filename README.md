# AI-Powered GitHub Code Review Platform (Backend)

A production-ready, multi-agent backend for automated AI code reviews on GitHub Pull Requests.

## 🚀 Key Features
- **Multi-Agent Orchestration**: Powered by LangGraph for parallel execution of Quality, Security, Performance, Architecture, and DevOps agents.
- **Intelligence**: High-precision prompts with confidence scoring and concise remediation advice.
- **Event-Driven Architecture**: Uses BullMQ and Redis for robust, asynchronous job processing.
- **Multi-Tenant SaaS-Ready**: Organization-based isolation with feature flags and concurrency limits.
- **Production Grade**: Token usage tracking, webhook replay protection, and real-time Socket.IO updates.

---

## 🛠️ Step-by-Step Local Setup

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js (v20+)](https://nodejs.org/)
- [Docker & Docker Compose](https://www.docker.com/) (Recommended for easy setup of Redis & MongoDB)
- [ngrok](https://ngrok.com/) (To receive GitHub webhooks locally)

### 2. Physical Setup
```bash
# Clone the repository (once uploaded) or enter the directory
cd ai

# Install dependencies
npm install
```

### 3. Environment Configuration
Copy the template and fill in your credentials:
```bash
cp .env.example .env
```
**Required Keys:**
- `GITHUB_APP_ID`: From your GitHub App settings.
- `GITHUB_PRIVATE_KEY`: Generate a private key in GitHub App settings and paste the content.
- `GITHUB_WEBHOOK_SECRET`: A secret you define for webhook verification.
- `OPENROUTER_API_KEY`: Get one from [OpenRouter](https://openrouter.ai/).

### 4. Database & Cache
Start MongoDB and Redis using Docker:
```bash
docker-compose up -d mongodb redis
```

### 5. Running the Application

#### **Development Mode (Single Terminal)**
```bash
npm run dev:all
```

#### **Production/Continuous Mode (PM2)**
To keep the server and worker running in the background (even if you close your terminal):
```bash
# Start both API and Worker
npx pm2 start ecosystem.config.cjs

# Monitor status
npx pm2 status
npx pm2 logs

# Stop everything
npx pm2 stop all
```

#### **Continuous Tunnel (ngrok)**
To keep your webhook accessible while developing:
```bash
ngrok http 3015 --permanent-domain your-domain.ngrok-free.app
```

---

## 📤 Moving to GitHub

### 1. Initialize Git Locally
```bash
git init
git add .
git commit -m "Initial commit: AI-powered code review platform backend"
```

### 2. Create Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Create a repository named `ai-code-reviewer` (or your choice).
3. Copy the Remote URL (e.g., `https://github.com/username/ai-code-reviewer.git`).

### 3. Push to GitHub
```bash
git remote add origin YOUR_REMOTE_URL
git branch -M main
git push -u origin main
```

---

## 🤖 GitHub App Setup

1. **Create App**: Go to GitHub Settings -> Developer Settings -> GitHub Apps -> New GitHub App.
2. **Permissions**:
   - Repository Permissions -> Pull Requests -> Read & Write.
   - Repository Permissions -> Contents -> Read.
   - Repository Permissions -> Metadata -> Read.
3. **Webhooks**:
   - Use `ngrok` to expose your local port 3000: `ngrok http 3000`.
   - Set Webhook URL to: `https://your-ngrok-url.ngrok-free.app/webhooks/github`.
   - Set Webhook Secret to your `GITHUB_WEBHOOK_SECRET`.
4. **Events**:
   - Subscribe to "Pull request" and "Issue comment" events.
5. **Install**: Install the app on a test repository.

---

## 💓 Health & Verification
- `GET /health`: Liveness check.
- `GET /ready`: Readiness check (DB + Redis connectivity).
