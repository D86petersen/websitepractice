# CCNA 200-301 Practice Exam Platform - README

A production-ready, full-stack web application for CCNA 200-301 practice exams with feature parity to commercial engines like Boson ExSim, MeasureUp, and the Cisco Learning Network.

---

## 🆓 Deploy for FREE in 5 Minutes

**👉 [See FREE.md](FREE.md)** for completely free deployment options:

- **Railway** - FREE $5/month credit (5 min deploy) ⭐ Easiest
- **Fly.io** - FREE $5/month credit (5 min deploy) ⭐ Fastest  
- **Oracle Cloud** - FREE Forever (30 min deploy) ⭐ Most Generous
- **Render** - FREE tier (limited performance)

**No credit card. No surprise charges. Completely FREE.**

👉 [FREE_DEPLOYMENT_QUICK.md](FREE_DEPLOYMENT_QUICK.md) for quick start guide

---

## 🎯 Features

### Core Capabilities
- **Multiple Exam Types**: Full simulations (120 questions), domain-focused quizzes, short drills, custom exams
- **Two Study Modes**: 
  - Simulation mode (timed, no feedback, realistic)
  - Study mode (optional timer, instant feedback, learning-focused)
- **Blueprint-Aligned**: 6 CCNA domains with proper weighting:
  - Network Fundamentals (20%)
  - Network Access (20%)
  - IP Connectivity (25%)
  - IP Services (10%)
  - Security Fundamentals (15%)
  - Automation & Programmability (10%)
- **Deterministic Exam Generation**: Reproducible question sampling via seed
- **Detailed Analytics**: Per-domain performance, weak area identification, trends
- **Accessible UI**: WCAG-compliant, keyboard navigation, light/dark mode

### Question Types Supported
- Single-choice (one correct answer)
- Multiple-select (multiple correct answers)
- Drag-and-drop matching
- Short answer / command-based

## 📋 Tech Stack

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + TypeScript + NestJS + PostgreSQL + Prisma |
| **Frontend** | React + Next.js + TailwindCSS |
| **Database** | PostgreSQL 14+ |
| **Deployment** | Docker, AWS/Azure/GCP/Fly.io |
| **API** | REST (GraphQL-ready architecture) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm or npm
- Docker (for PostgreSQL)

### Quick Start

```bash
# 1. Clone repository and install dependencies
git clone <repo>
cd websitepractice

# Backend
cd backend
pnpm install
cp .env.example .env

# Frontend (in another terminal)
cd frontend
pnpm install
cp .env.example .env.local

# 2. Start PostgreSQL
docker-compose up

# 3. Backend setup
cd backend
pnpm run db:migrate      # Run migrations
pnpm run db:seed         # Add sample data (optional)
pnpm run dev             # Start dev server on :3001

# 4. Frontend setup (new terminal)
cd frontend
pnpm run dev             # Start on :3000
```

Visit http://localhost:3000

## 📚 Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, database schema, data flow
- **[API.md](docs/API.md)** - REST API reference with examples
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Production deployment guide (AWS, Azure, GCP, Fly.io)
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Local development setup, testing, troubleshooting

## 🏗️ Project Structure

```
├── backend/                # NestJS API
│   ├── src/
│   │   ├── auth/          # Authentication & JWT
│   │   ├── questions/     # Question & blueprint management
│   │   ├── exams/         # Exam generation & scoring
│   │   ├── sessions/      # User exam sessions
│   │   └── common/        # Shared utilities
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
│
├── frontend/              # Next.js SPA
│   ├── app/              # App router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities & API client
│   └── package.json
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
│
└── docker-compose.yml     # Local dev stack (PostgreSQL, Redis)
```

## 🔐 Security Features

- JWT authentication with HTTP-only cookies
- Role-based access control (Student/Admin)
- Input validation (Zod schemas)
- Rate limiting (login, general endpoints)
- CORS restricted to frontend domain
- Question/answer data integrity during exams
- Encrypted passwords (bcrypt with salt 12)

## 📊 Database Schema Highlights

**Key Tables:**
- `users` - Student/admin accounts
- `exam_blueprints` - CCNA 200-301 versions
- `domains` - 6 CCNA domains per blueprint
- `questions` - Question bank with types, difficulty, sub-objectives
- `answer_options` - Options per question
- `exam_forms` - Exam configurations (fixed or dynamic)
- `user_exam_sessions` - User attempts with scoring
- `user_responses` - Per-question responses and correctness

**Features:**
- Normalized design for extensibility
- Versioning via blueprint_id
- Soft deletes (is_active flag)
- Audit logging
- Full-text search support

## 🧪 Exam Generation Algorithm

The `ExamGenerationService` implements deterministic sampling:

1. **Domain Distribution**: Allocate questions per domain based on blueprint weights
2. **Difficulty Mix**: Apply 20% easy, 60% medium, 20% hard per domain
3. **Type Filtering**: Respect allowed question types (can exclude short-answer, etc.)
4. **Seeded RNG**: Use Linear Congruential Generator for reproducibility
5. **Shuffle**: Fisher-Yates shuffle with seeded randomness

**Result**: Same seed + blueprint + rules → identical question set, enabling session replay and debugging.

## 📈 Scoring & Analytics

**Per-Session:**
- Overall percentage (0-100%)
- Scaled score (300-1000, estimated; not medically accurate)
- Pass/fail determination (configurable threshold)
- Per-domain breakdown

**Per-Candidate:**
- Exam history with trends
- Weak area identification (< 70% = weak)
- Performance snapshots over time

## 🎨 Frontend UX

- **Landing Page**: Feature overview, exam types, six CCNA domains explained
- **Exam Catalog**: Filter by blueprint/mode, browse available forms
- **Exam Taking**:
  - Real-time timer with warning at 5 min
  - Progress bar and question navigator
  - Flag for review functionality
  - Keyboard navigation support
- **Results Page**: Score summary, domain breakdown, question review, recommendations
- **Dashboard**: Exam history, performance trends, weak areas

## 🚢 Deployment

### Quickstart (Vercel + Fly.io)

```bash
# Frontend to Vercel
cd frontend
vercel --prod

# Backend to Fly.io
cd backend
flyctl deploy
```

### Enterprise (AWS ECS + RDS)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for:
- ECS task definitions
- RDS PostgreSQL setup
- Load balancer configuration
- Auto-scaling policies
- Monitoring with CloudWatch

## 📋 Quality Checklist

- ✅ Clean code separation of concerns (auth, questions, exams, sessions)
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Rate limiting on sensitive endpoints
- ✅ Input validation with Zod schemas
- ✅ Deterministic exam generation (fully tested)
- ✅ Database transactions for data consistency
- ✅ Audit logging for compliance
- ✅ WCAG 2.1 accessibility compliance
- ✅ Mobile-responsive design (375px+)
- ✅ Dark mode support
- ✅ Docker containerization ready
- ✅ Environment-based configuration
- ✅ API documentation with examples
- ✅ Production deployment guide

## 🛠️ Extending the Platform

### Add a New Question Type

1. Update `QuestionType` enum in `schema.prisma`
2. Implement evaluation logic in `ScoringService.evaluateResponse()`
3. Add UI component in frontend `exam-components.tsx`
4. Add test cases

### Add Analytics Endpoint

1. Create method in `AnalyticsService`
2. Add controller route with auth guards
3. Add request/response schema validation
4. Document in API.md

### Support Real-Time Grading

1. Add WebSocket support in NestJS
2. Emit correctness events after each answer
3. Update frontend to subscribe to events
4. Add instructor dashboard for live monitoring

## 📝 License & Attribution

This is an independent educational platform. All questions are original and based on publicly available exam topics and Cisco documentation. Not affiliated with Cisco Systems, Inc.

For official exam resources, visit [Cisco Learning Network](https://learningnetwork.cisco.com).

## 🤝 Contributing

To contribute:

1. Fork and create a branch (`feature/your-feature`)
2. Follow code style (Prettier, ESLint)
3. Add tests for new features
4. Submit pull request with description

## 📞 Support

For issues:
1. Check [DEVELOPMENT.md](docs/DEVELOPMENT.md) troubleshooting
2. Review [API.md](docs/API.md) for endpoint details
3. Check backend logs: `pnpm run dev`
4. Open an issue with error message and steps to reproduce

---

**Built with ❤️ for CCNA learners everywhere.**
