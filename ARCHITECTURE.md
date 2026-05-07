# CCNA 200-301 Practice Exam Platform - Architecture

## System Overview

This is a production-ready, full-stack web application for CCNA 200-301 practice exams. The platform mimics commercial certification engines (Boson ExSim, MeasureUp, Cisco Learning Network) while maintaining legal and ethical standards through original questions and explanations.

### Stack
- **Backend**: Node.js + TypeScript + NestJS + PostgreSQL + Prisma
- **Frontend**: React + Next.js + TailwindCSS
- **Deployment**: Docker, environment-based config, suitable for AWS/Azure/GCP/Fly.io/Vercel

### Key Features
1. **Multiple Exam Types**: Full simulations, domain-focused quizzes, short drills, custom exams
2. **Two Modes**: Simulation (immediate feedback withheld, timed) and Study (instant feedback, optional timer)
3. **Blueprint-Aligned**: Question bank mapped to 6 CCNA domains with proper weighting
4. **Dynamic Exam Generation**: Reproducible random sampling following domain percentages and difficulty distribution
5. **Detailed Analytics**: Per-domain breakdown, weak-area identification, performance trends
6. **Role-Based Access**: Student/Admin tiers with appropriate permissions

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js/React)                │
│  - Landing Page   - Exam Catalog   - Exam Taking Experience    │
│  - Results + Review   - Dashboard   - Account Management         │
└────────────────────────────────────────────────────────────────┬┘
                                │
                      REST API (JSON over HTTPS)
                                │
┌────────────────────────────────────────────────────────────────┬┘
│                  Backend API (NestJS + Express)                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   Auth      │  │  Questions   │  │  Exam Sessions   │      │
│  │  Module     │  │  Management  │  │  & Scoring       │      │
│  └─────────────┘  └──────────────┘  └──────────────────┘      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐      │
│  │   Exam      │  │  Blueprint   │  │  Analytics &     │      │
│  │  Generation │  │  Management  │  │  Reporting       │      │
│  └─────────────┘  └──────────────┘  └──────────────────┘      │
│                                                                 │
│  Validation Layer (Zod)  │  Error Handling  │  Logging         │
└────────────────────────────────────────────────────────────────┤
                                │
                    PostgreSQL Database (Prisma ORM)
                                │
└────────────────────────────────────────────────────────────────┘
```

---

## Database Schema (Normalized)

### Core Entities

#### Users
```
- id (UUID, PK)
- email (unique, indexed)
- password_hash
- role (enum: student, admin)
- target_exam_date (nullable)
- timezone
- current_goal_score (nullable, e.g., 825)
- created_at, updated_at
```

#### ExamBlueprint
```
- id (UUID, PK)
- name (e.g., "CCNA 200-301 v1.1 2026")
- description
- effective_from (date)
- effective_to (nullable)
- is_active (boolean)
- domain_weights (JSON: { "network_fundamentals": 0.20, ... })
- created_at, updated_at
```

#### Domain
```
- id (UUID, PK)
- blueprint_id (FK -> ExamBlueprint)
- key (enum-like: NETWORK_FUNDAMENTALS, NETWORK_ACCESS, IP_CONNECTIVITY, IP_SERVICES, SECURITY_FUNDAMENTALS, AUTOMATION_PROGRAMMABILITY)
- name (e.g., "Network Fundamentals")
- weight (0.0 - 1.0)
- created_at
```

#### SubObjective
```
- id (UUID, PK)
- domain_id (FK -> Domain)
- code (e.g., "1.6")
- description (e.g., "Configure and verify IPv4 addressing and subnetting")
- created_at
```

#### Question
```
- id (UUID, PK)
- blueprint_id (FK -> ExamBlueprint)
- domain_id (FK -> Domain)
- sub_objective_id (FK -> SubObjective, nullable)
- stem (text, question text/markdown)
- type (enum: single_choice, multi_select, drag_drop_basic, short_answer)
- difficulty (int: 1-5)
- is_active (boolean, soft delete)
- created_by (FK -> Users)
- created_at, updated_at
```

#### AnswerOption
```
- id (UUID, PK)
- question_id (FK -> Question)
- text (markdown or JSON for drag-drop)
- is_correct (boolean)
- order_index (int)
- explanation_override (nullable, distractor-specific feedback)
```

#### QuestionExplanation
```
- question_id (PK, FK -> Question)
- explanation_markdown (text)
- reference_links (JSON array of URLs)
- created_at, updated_at
```

#### ExamForm
```
- id (UUID, PK)
- blueprint_id (FK -> ExamBlueprint)
- name (e.g., "Full CCNA Simulation v2026.1")
- mode (enum: fixed, dynamic)
- question_count (int)
- time_limit_minutes (int)
- is_public (boolean)
- rules_json (JSON: domain weights override, difficulty mix, type filters)
- created_by (FK -> Users)
- created_at, updated_at
```

#### ExamFormQuestion (for fixed forms only)
```
- exam_form_id (FK -> ExamForm)
- question_id (FK -> Question)
- order_index (int)
- PK: (exam_form_id, question_id)
```

#### UserExamSession
```
- id (UUID, PK)
- user_id (FK -> Users, nullable for guest)
- exam_form_id (FK -> ExamForm)
- mode (enum: simulation, study)
- dynamic_seed (nullable, for reproducibility)
- started_at (timestamp)
- completed_at (nullable)
- total_score_percent (nullable until completed)
- pass_fail (nullable until completed, enum: pass, fail)
- score_scale (nullable, e.g., interpretation of percentage to 300-1000)
- domain_scores (JSON: { "network_fundamentals": 75.0, ... })
- raw_correct_count (int)
- raw_total_count (int)
- created_at, updated_at
```

#### UserResponse
```
- id (UUID, PK)
- session_id (FK -> UserExamSession)
- question_id (FK -> Question)
- selected_option_ids (JSON array of option IDs)
- free_text_answer (nullable, for short answers)
- is_correct (nullable until session complete, or immediately in study mode)
- response_time_ms (int)
- viewed_explanation (boolean, for study mode)
- created_at
```

---

## Data Flow

### Exam Lifecycle

1. **User Selects Exam**
   - Frontend fetches ExamForms from `/exam-forms`
   - User picks one and clicks "Start"

2. **Session Creation**
   - POST `/exam-sessions` with `exam_form_id` and `mode`
   - Backend:
     - Creates UserExamSession record
     - If dynamic ExamForm, generates question set via `ExamGenerationService`
     - Returns session_id, first question, timer info

3. **Exam Taking**
   - Frontend displays current question with options
   - Timer counts down (enforced client-side and server-side)
   - User selects answer(s) → POST `/exam-sessions/:id/answers`
   - Backend stores UserResponse, validates, increments progress
   - **Simulation mode**: returns acknowledgment only
   - **Study mode**: returns correctness + explanation
   - Frontend advances to next question

4. **Session Completion**
   - User clicks "End Exam" or time expires
   - POST `/exam-sessions/:id/complete`
   - Backend:
     - Marks session complete
     - Computes total_score_percent, pass_fail, domain_scores
     - Stores results

5. **Results Review**
   - Frontend calls GET `/exam-sessions/:id/result`
   - Backend returns full breakdown + question-by-question review data

---

## Key Modules

### 1. Auth Module
- Register, login, logout, token refresh
- JWT via HTTP-only cookies
- Password hashing (bcrypt)

### 2. Question Management
- Admin CRUD for questions
- Full-text search, filtering by domain/difficulty/type
- Versioning via blueprint_id

### 3. Exam Generation Service
- Deterministic sampling given seed, blueprint, rules
- Respects domain weights and difficulty distribution
- Supports fixed and dynamic forms

### 4. Scoring & Analytics
- Per-question correctness logic (multi-select, short-answer pattern matching)
- Per-domain aggregation
- Pass/fail threshold (configurable)
- Weak-area detection

### 5. Session Management
- In-memory or Redis cache for active sessions (optional for scalability)
- Session timeout enforcement
- Concurrent session limits per user (optional)

---

## Security Considerations

1. **Authentication**: JWT in HTTP-only cookies, secure flag, SameSite=Strict
2. **Authorization**: Role-based checks on every admin endpoint
3. **Input Validation**: Zod schemas on all request bodies
4. **Data Integrity**: Questions and correct answers never leaked via APIs during exam
5. **Rate Limiting**: 5 attempts/minute on login, 10 sessions/hour per user
6. **Logging**: All significant events logged with user_id, session_id, IP
7. **HTTPS**: Enforced in production
8. **CORS**: Configured for frontend domain only

---

## Deployment

### Development
```bash
# Install dependencies
npm install -g pnpm
cd backend && pnpm install
cd ../frontend && pnpm install

# Start services
docker-compose up  # PostgreSQL + Redis (optional)
cd backend && pnpm dev
cd frontend && pnpm dev
```

### Production
- Containerize both backend and frontend with Docker
- Use environment-based config (DATABASE_URL, JWT_SECRET, etc.)
- Deploy to cloud (AWS ECS, Azure Container Instances, Fly.io, Vercel)
- Set up CloudWatch/Datadog for logging and monitoring
- Use RDS for PostgreSQL (auto-backups, multi-AZ)
- Use CloudFront or similar for CDN on static assets

---

## Scalability & Future Enhancements

1. **Caching**: Add Redis for leaked question sets, session state
2. **Real-time Updates**: WebSocket for live class exams (instructor mode)
3. **AI Explanations**: Extend explanation generation with LLM integration
4. **Mobile App**: Native iOS/Android via React Native or Flutter
5. **Reporting Dashboard**: Admin analytics on user progress, question performance
6. **Adaptive Difficulty**: Adjust question difficulty based on user performance in real-time
