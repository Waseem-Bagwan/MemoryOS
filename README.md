<div align="center">

# 🧠 MemoryOS

### The Memory Decision Engine for AI Agents

**MemoryOS is not a memory storage system.**
**It is the intelligence layer that decides what AI agents should remember, update, forget, or ignore.**

<img width="1898" height="944" alt="image" src="https://github.com/user-attachments/assets/ebb44ba0-e5fd-48d8-b122-ada5d003c806" />
<img width="1919" height="948" alt="image" src="https://github.com/user-attachments/assets/27288cc3-24b1-463f-9a06-b843eb2a1223" />
<img width="1898" height="949" alt="image" src="https://github.com/user-attachments/assets/39786548-5a8c-4af1-961e-5f2b3de0bc25" />
<img width="1903" height="944" alt="image" src="https://github.com/user-attachments/assets/75e50a93-76c2-4ddf-98ca-c6521f671e6b" />
<img width="1895" height="951" alt="image" src="https://github.com/user-attachments/assets/5113778d-6063-47f4-b6f9-c895c0967e50" />
<img width="1894" height="943" alt="image" src="https://github.com/user-attachments/assets/5044cfef-ac1b-4c90-a6d5-89f1cee12a84" />



[Live Demo](#) · [Video Walkthrough](#) · [Blog Post](#)

</div>

---

## The Problem

Every AI framework today can store memories. But none of them answer the harder questions:

| Question | Answered by existing tools? |
|---|---|
| Should this message become a memory? | ❌ |
| Does this contradict an existing memory? | ❌ |
| Should an old memory be updated or archived? | ❌ |
| Is this important enough to store at all? | ❌ |
| What should be forgotten? | ❌ |

Developers end up writing hundreds of memory rules themselves. **MemoryOS solves this.**

> **Memory is not storage. Memory is decision making.**

---

## What MemoryOS Does

```
User message: "I moved from Mumbai to Bangalore last month"
                              │
                              ▼
                    ┌─────────────────────┐
                    │   MemoryOS Engine   │
                    │                     │
                    │  • Classify type    │
                    │  • Score importance │
                    │  • Detect conflict  │
                    │  • Make decision    │
                    │  • Distill content  │
                    └─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Decision:        Cognee:          Postgres:
         UPDATE        forget(Mumbai)    archive old
                       remember(Blr)     create new
                                         log decision

Response to developer:
{
  "action": "UPDATE",
  "reasoning": "New location contradicts existing profile memory",
  "distilledContent": "User lives in Bangalore",
  "conflictDetected": true,
  "importance": 0.88,
  "cogneeOperation": "forget(old) + remember(new)",
  "totalLatencyMs": 4200
}
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                           │
│   Chat UI  │  Decision Engine Panel  │  Memory Graph  │ Timeline │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP / REST
┌─────────────────────────────────────────────────────────────────┐
│                     Express + TypeScript                        │
│                                                                 │
│  POST /api/chat/message    POST /api/memory/ingest              │
│  GET  /api/memory          GET  /api/memory/decisions           │
│  POST /api/memory/recall   POST /api/memory/agent-context       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │    MemoryOS Pipeline    │
              │                        │
              │  1. Classify           │  ← GPT-4o-mini
              │  2. Score Importance   │  ← weighted factors
              │  3. Detect Conflicts   │  ← compare existing
              │  4. Distill Content    │  ← clean 3rd person
              │  5. Decide & Execute   │  ← STORE/UPDATE/etc
              │  6. Log Decision       │  ← full audit trail
              └────────────┬───────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌──────────────┐  ┌─────────────┐
   │   Cognee    │  │  PostgreSQL  │  │    Redis    │
   │   Cloud     │  │   (Neon)    │  │  (Upstash)  │
   │             │  │             │  │             │
   │ Graph+Vector│  │  Metadata   │  │  Hot cache  │
   │  remember() │  │  Lifecycle  │  │  Sessions   │
   │  recall()   │  │  DecisionLog│  │  Importance │
   │  forget()   │  │  Relations  │  │  Index      │
   └─────────────┘  └─────────────┘  └─────────────┘
```

### Hot / Cold Memory Architecture

```
Incoming query
      │
      ▼
Redis (hot layer) ──── fast importance index ──── < 5ms
      │ cache miss
      ▼
Cognee (cold layer) ── semantic + graph search ── 500-2000ms
      │
      ▼
Postgres ──────────── metadata + lifecycle ─────── < 20ms
```

---

## Features

### 🔴 Core — Memory Decision Engine
- **STORE** — New memory, classified and distilled before saving
- **UPDATE** — Conflict detected, old memory archived, new one stored
- **MERGE** — Similar memory strengthened and consolidated
- **IGNORE** — Conversational filler filtered out automatically
- **FORGET** — Explicit deletion from all backends

### 🟡 Intelligence Layer
- **Memory Distillation** — Raw messages converted to clean third-person facts
- **Importance Scoring** — 0.0 to 1.0 score based on recency, novelty, task relevance
- **Conflict Detection** — LLM compares new message against top 20 existing memories
- **Memory Classification** — Profile / Preference / Knowledge / Experience

### 🟢 Developer Experience
- **Full Explainability** — Every decision logged with reasoning, confidence, and pipeline timing
- **Audit Trail** — Complete history of every memory operation
- **Background Processing** — Memory ingestion async after chat response (fast UX)
- **Ingest Lock** — Redis-based per-user lock prevents race conditions

### 🔵 Frontend
- **Live Decision Engine Panel** — Watch memory decisions happen in real time
- **Memory Graph** — Interactive React Flow visualization of the memory brain
- **Decision Timeline** — Git-style history of all decisions
- **Explainability Drawer** — DevTools-style pipeline trace for any decision
- **Memory Store** — Search, filter, importance bars, lifecycle badges

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| Node.js + TypeScript | Runtime + type safety |
| Express.js | HTTP server |
| Prisma + PostgreSQL (Neon) | Memory metadata, decision logs, lifecycle |
| Redis (Upstash) | Session cache, importance sorted set, ingest lock |
| Cognee Cloud | Graph + vector memory storage (remember/recall/forget) |
| OpenAI GPT-4o-mini | Memory classification, conflict detection, distillation |
| JSON Web Tokens | Authentication |
| Zod | Request validation |

### Frontend
| Technology | Purpose |
|---|---|
| React + TypeScript + Vite | UI framework |
| Tailwind CSS | Styling with design tokens |
| Framer Motion | Animations and transitions |
| React Flow (@xyflow/react) | Interactive memory graph |
| TanStack Query | Server state management |
| Zustand | Auth state |
| Axios | HTTP client with JWT interceptors |
| React Markdown + Prism | Chat message rendering |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- A free [Neon](https://neon.tech) account (Postgres)
- A free [Upstash](https://upstash.com) account (Redis)
- An [OpenAI](https://platform.openai.com) API key
- A [Cognee Cloud](https://platform.cognee.ai) account

### Backend

```bash
# 1. Clone and install
git clone https://github.com/yourusername/memoryos
cd memoryos/backend
npm install

# 2. Configure environment
cp .env.example .env
# Fill in your keys (see .env.example for all variables)

# 3. Generate Prisma client and run migrations
npm run db:generate
npm run db:migrate
# When prompted for migration name, type: init

# 4. Start development server
npm run dev
# Server starts at http://localhost:3000
```

### Frontend

```bash
cd memoryos/frontend
npm install

# Configure API URL
echo "VITE_API_URL=http://localhost:3000/api" > .env

npm run dev
# App starts at http://localhost:5173
```

### Environment Variables

```env
# Backend (.env)
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://..."        # From Neon dashboard
JWT_SECRET="your-long-random-secret"
REDIS_URL="rediss://..."               # From Upstash TCP tab
OPENAI_API_KEY="sk-..."
COGNEE_API_URL="https://tenant-xxx.aws.cognee.ai"
COGNEE_API_KEY="your-cognee-key"
COGNEE_TENANT_ID="your-tenant-id"
```

---

## API Reference

### Auth
```
POST /api/auth/register   { email, password, name }
POST /api/auth/login      { email, password }
```

### Chat
```
POST /api/chat/message    { message, sessionId }
```

### Memory
```
POST /api/memory/ingest         { content, sessionId }
GET  /api/memory                ?type=&lifecycle=&limit=
GET  /api/memory/decisions      ?sessionId=&limit=
POST /api/memory/recall         { query, limit }
POST /api/memory/agent-context  { query, maxTokens }
GET  /api/memory/context/:sessionId
```

### Example Response — Ingest

```json
{
  "success": true,
  "data": {
    "decision": {
      "action": "UPDATE",
      "reasoning": "New location contradicts existing profile memory about Mumbai",
      "distilledContent": "User lives in Bangalore",
      "confidence": 0.94,
      "importance": 0.88,
      "memoryType": "profile",
      "conflictDetected": true,
      "conflictWithId": "cmr4j5ghg0002...",
      "tags": ["location", "bangalore"],
      "cogneeOperation": "cognee.forget(old) + cognee.remember(new)",
      "redisOperation": "importance index updated",
      "timing": {
        "execute": 3433,
        "total": 6386
      }
    },
    "memoryId": "cmr4j6hpt0006...",
    "sessionId": "session-1"
  }
}
```

---

## Database Schema

```
User ──────┬──── Memory (content, type, lifecycle, importance, tags)
           ├──── Session (active conversation)
           └──── DecisionLog (full audit trail of every decision)

Memory ────┬──── replacesId → archived memory
           └──── replacedById → newer memory
```

---

## Future Improvements

- **Memory Decay Engine** — Time-based decay, low-importance memories auto-expire
- **Reflection Engine** — Periodic synthesis of patterns into higher-order memories
- **Multi-agent Support** — Shared memory with permission scopes (user/team/org)
- **More Adapters** — Mem0, Zep, Qdrant, Pinecone, Weaviate as swappable backends
- **SDK Package** — Publish `@memoryos/sdk` on npm for developers to integrate
- **Streaming** — Stream chat responses token by token
- **Memory Webhooks** — Notify external systems when memories change
- **LangChain Integration** — Drop-in memory provider for LangChain agents

---

## Project Structure

```
memoryos/
├── backend/
│   ├── prisma/schema.prisma          # Database schema
│   └── src/
│       ├── adapters/
│       │   ├── cognee.adapter.ts     # Cognee Cloud API wrapper
│       │   └── redis.adapter.ts      # Redis operations
│       ├── config/                   # env, prisma, redis clients
│       ├── controllers/              # HTTP request handlers
│       ├── middleware/               # Auth (JWT), error handler
│       ├── pipeline/
│       │   ├── analyze.ts            # GPT classification + decision
│       │   ├── decide.ts             # Execute decision on backends
│       │   └── index.ts              # Pipeline orchestrator
│       ├── routes/                   # Express route definitions
│       ├── services/                 # Business logic layer
│       └── types/                    # Shared TypeScript types
│
└── frontend/
    └── src/
        ├── api/                      # Axios client + all API calls
        ├── components/
        │   ├── chat/                 # ChatMessage, ChatInput, TypingIndicator
        │   ├── decision/             # Live Decision Engine panel
        │   ├── drawer/               # Explainability drawer
        │   ├── graph/                # Memory graph nodes + node drawer
        │   ├── layout/               # Sidebar, DashboardLayout
        │   └── ui/                   # Badge, Spinner
        ├── pages/
        │   ├── auth/                 # Login, Register
        │   └── dashboard/            # Chat, Dashboard, Memories, Timeline, Graph
        ├── store/                    # Zustand auth store
        └── types/                    # TypeScript types matching backend
```

---

## Built For

**WeMakeDevs x Cognee Hackathon 2026**

MemoryOS was built to demonstrate that the missing piece in AI agent development is not better storage — it is better **decision making** about what to store.

---

<div align="center">
Built with ❤️ using Cognee · OpenAI · PostgreSQL · Redis · React
</div>
