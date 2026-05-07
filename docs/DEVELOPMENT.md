# Development Guide

## Setup

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL 14+
- Docker (optional)

### Quick Start

```bash
# 1. Clone and install
cd backend
pnpm install

cd ../frontend
pnpm install

# 2. Start PostgreSQL (Docker)
docker-compose up

# 3. Set up backend
cd backend
cp .env.example .env
# Edit .env with your database URL

# 4. Run migrations
pnpm run db:migrate

# 5. Seed sample data (optional)
pnpm run db:seed

# 6. Start backend dev server
pnpm run dev

# 7. In another terminal, start frontend
cd frontend
pnpm run dev
```

Open http://localhost:3000

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ccna_exam"

# JWT
JWT_SECRET="your-secret-key-here-min-32-chars"
JWT_EXPIRY="7d"

# Server
NODE_ENV="development"
PORT=3001
API_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Rate limiting
RATE_LIMIT_LOGIN=5
RATE_LIMIT_GENERAL=60

# Exam configuration
PASS_SCORE_PERCENT=70
SCALED_SCORE_MIN=300
SCALED_SCORE_MAX=1000
PASSING_SCALED_SCORE=825

# Logging
LOG_LEVEL="debug"
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

---

## Database

### Migrations

Create a new migration:
```bash
cd backend
pnpm exec prisma migrate dev --name add_users_table
```

Apply pending migrations:
```bash
pnpm run db:migrate
```

View Prisma Studio:
```bash
pnpm run db:studio
```

### Seeding

Create `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create blueprint
  const blueprint = await prisma.examBlueprint.create({
    data: {
      name: 'CCNA 200-301 v1.1 2026',
      description: 'Latest CCNA blueprint',
      effectiveFrom: new Date(),
      domainWeights: {
        NETWORK_FUNDAMENTALS: 0.20,
        NETWORK_ACCESS: 0.20,
        IP_CONNECTIVITY: 0.25,
        IP_SERVICES: 0.10,
        SECURITY_FUNDAMENTALS: 0.15,
        AUTOMATION_PROGRAMMABILITY: 0.10,
      },
      isActive: true,
    },
  });

  // Create domains
  // ...
}

main().catch((e) => console.error(e));
```

Run:
```bash
pnpm run db:seed
```

---

## Project Structure

### Backend

```
backend/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Main module
│   ├── auth/                   # Authentication
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.dto.ts
│   │   └── auth.module.ts
│   ├── questions/              # Questions & Blueprints
│   │   ├── questions.service.ts
│   │   ├── blueprint.service.ts
│   │   ├── questions.controller.ts
│   │   └── questions.module.ts
│   ├── exams/                  # Exam generation & scoring
│   │   ├── exam-generation.service.ts
│   │   ├── scoring.service.ts
│   │   ├── exam-forms.service.ts
│   │   └── exams.module.ts
│   ├── sessions/               # Exam sessions
│   │   ├── sessions.service.ts
│   │   ├── sessions.controller.ts
│   │   └── sessions.module.ts
│   ├── analytics/              # Analytics
│   │   └── analytics.module.ts
│   └── common/                 # Shared utilities
│       ├── prisma.service.ts
│       ├── logger/
│       ├── filters/
│       └── strategies/
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env.example
```

### Frontend

```
frontend/
├── app/                        # Next.js app directory
│   ├── page.tsx               # Home page
│   ├── login/page.tsx         # Login
│   ├── register/page.tsx      # Register
│   ├── exams/page.tsx         # Exam catalog
│   ├── exam/
│   │   ├── take/page.tsx      # Exam taking
│   │   └── results/page.tsx   # Results
│   └── dashboard/page.tsx     # User dashboard
├── components/
│   ├── ui.tsx                 # Base UI components
│   ├── exam-components.tsx    # Exam-specific components
│   └── ...
├── lib/
│   ├── api.ts                 # API client
│   └── store.ts               # State management
├── styles/
│   └── globals.css            # Global styles
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
└── .env.example
```

---

## Testing

### Backend Unit Tests

```bash
cd backend
pnpm test
pnpm test:watch
pnpm test:cov
```

Example test:

```typescript
import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should hash password on register', async () => {
    const result = await service.register({
      email: 'test@example.com',
      password: 'SecurePass123',
    });

    expect(result.email).toBe('test@example.com');
  });
});
```

### Frontend Tests

```bash
cd frontend
pnpm test
```

---

## Code Style & Linting

### Backend

```bash
cd backend
pnpm lint         # Run ESLint
pnpm format       # Format with Prettier
```

### Frontend

```bash
cd frontend
pnpm lint
pnpm format
```

---

## Common Development Tasks

### Add a New Question Type

1. Update `QuestionType` enum in `schema.prisma`
2. Add evaluation logic in `ScoringService.evaluateResponse()`
3. Add UI component in `frontend/components/exam-components.tsx`
4. Add tests

### Add Analytics Endpoint

1. Create method in `AnalyticsService` (backend)
2. Create controller with `@Get()` decorator
3. Add route tests
4. Document in API.md

### Change Database Schema

1. Update `schema.prisma`
2. Generate migration: `pnpm exec prisma migrate dev`
3. Test migration rollback: `pnpm exec prisma migrate resolve`

---

## Deployment Checklist

Before deploying to production:

- [ ] Run full test suite (backend + frontend)
- [ ] Check CHANGELOG for version bump
- [ ] Update environment variables
- [ ] Run database migrations in staging first
- [ ] Verify all API endpoints
- [ ] Test user flows (register → exam → results)
- [ ] Check error handling
- [ ] Review security (CORS, rate limiting, HTTPS)
- [ ] Load test database queries
- [ ] Set up monitoring/logging
- [ ] Create backups
- [ ] Document any breaking changes

---

## Useful Commands

```bash
# Backend
pnpm run dev              # Start dev server
pnpm build                # Build for production
pnpm start                # Run production build
pnpm lint                 # Lint code
pnpm test                 # Run tests
pnpm db:migrate           # Apply migrations
pnpm db:seed              # Seed data
pnpm db:studio            # Open Prisma Studio

# Frontend
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Run production build
pnpm lint                 # Lint code
```

---

## Troubleshooting

### "Database connection refused"
- Check PostgreSQL is running: `docker-compose up`
- Verify DATABASE_URL in .env
- Check security groups (if using cloud DB)

### "Port 3001 already in use"
- Change PORT in .env
- Or kill existing process: `lsof -i :3001`

### "Prisma migration failed"
- Check schema.prisma for syntax errors
- Review migration file (backend/prisma/migrations/)
- Reset: `pnpm exec prisma migrate reset`

### Frontend not fetching from backend
- Check NEXT_PUBLIC_API_URL
- Check CORS settings in backend
- Verify JWT token in cookies/localStorage

