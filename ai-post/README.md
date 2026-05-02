# AI Blog Factory
Autonomous AI Blog Factory for Programmatic SEO and Large-Scale Content Generation.

## 🚀 Speed Start

### 1. Prerequisites
- Node.js v18+ 
- MongoDB (running)
- Redis (running)
- WordPress (with Application Password)

### 2. Install
```bash
npm install
```

### 3. Setup Environment
```bash
cp .env.example .env
# Edit .env with your keys
```

### 4. Run
```bash
# Start the main conductor (Controller + Scheduler)
npm start

# Start workers in a separate process (Scalable)
npm run worker
```

## 📂 Architecture

- `/router`: Intelligent AI Routing with caching and automatic fallbacks.
- `/agents`: 200+ specialized agents for Trends, Keywords, Writing, and SEO.
- `/workflows`: Stateful multi-agent orchestration via LangGraph.
- `/queues`: Distributed task management using BullMQ and Redis.
- `/models`: Mongoose schemas for Posts, Content DNA, and Metrics.
- `/wordpress`: Enterprise-grade WP REST API integration.
- `/content-dna`: Atomic block reuse system to minimize AI costs.

## 🛠 Features
- **Pillar + Cluster Strategy**: Generates daily topical authority clusters.
- **Cost Optimization**: Multi-level caching and Content DNA block reuse.
- **Self-Healing**: Automated retries with exponential backoff and provider fallbacks.
- **Autonomous SEO**: From trend discovery to internal linking and publishing.
