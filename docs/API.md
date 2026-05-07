# REST API Documentation

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All requests require JWT token in one of two formats:

### Option 1: Bearer Token Header
```
Authorization: Bearer <token>
```

### Option 2: HTTP-only Cookie
```
Cookie: accessToken=<token>
```

---

## Auth Endpoints

### Register

**POST** `/auth/register`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "timezone": "America/New_York"
}
```

Response (201):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

### Login

**POST** `/auth/login`

Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

Response (200):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

Note: JWT token is set as HTTP-only cookie automatically.

### Logout

**POST** `/auth/logout` *(requires auth)*

Response (200):
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User

**GET** `/auth/me` *(requires auth)*

Response (200):
```json
{
  "id": "user_123",
  "email": "user@example.com",
  "role": "STUDENT"
}
```

---

## Exam Blueprints

### List Blueprints

**GET** `/blueprints`

Query Parameters:
- `active` (boolean, optional): Filter by active status. Default: true

Response:
```json
[
  {
    "id": "bp_001",
    "name": "CCNA 200-301 v1.1 2026",
    "description": "Latest CCNA blueprint...",
    "effectiveFrom": "2024-01-01T00:00:00Z",
    "effectiveTo": null,
    "isActive": true,
    "domainWeights": {
      "NETWORK_FUNDAMENTALS": 0.20,
      "NETWORK_ACCESS": 0.20,
      "IP_CONNECTIVITY": 0.25,
      "IP_SERVICES": 0.10,
      "SECURITY_FUNDAMENTALS": 0.15,
      "AUTOMATION_PROGRAMMABILITY": 0.10
    }
  }
]
```

### Get Blueprint

**GET** `/blueprints/:id`

Response:
```json
{
  "id": "bp_001",
  "name": "CCNA 200-301 v1.1 2026",
  "domains": [
    {
      "id": "domain_001",
      "key": "NETWORK_FUNDAMENTALS",
      "name": "Network Fundamentals",
      "weight": 0.20,
      "subObjectives": [
        {
          "id": "so_001",
          "code": "1.1",
          "description": "Explain the role and function of network components"
        }
      ]
    }
  ]
}
```

### Get Blueprint Domains

**GET** `/blueprints/:id/domains`

Response:
```json
[
  {
    "id": "domain_001",
    "key": "NETWORK_FUNDAMENTALS",
    "name": "Network Fundamentals",
    "weight": 0.20
  }
]
```

---

## Questions (Admin Only)

### List Questions

**GET** `/questions`

Query Parameters:
- `blueprintId` (string): Filter by blueprint
- `domainId` (string): Filter by domain
- `difficulty` (1-5): Filter by difficulty
- `search` (string): Full-text search in stem
- `skip` (number): Pagination offset. Default: 0
- `take` (number): Pagination limit. Default: 20

Response:
```json
{
  "questions": [
    {
      "id": "q_001",
      "stem": "Which protocol operates at Layer 3 of the OSI model?",
      "type": "SINGLE_CHOICE",
      "difficulty": 2,
      "domainId": "domain_001",
      "subObjectiveId": "so_001",
      "answerOptions": [
        {
          "id": "opt_001",
          "text": "IP",
          "isCorrect": true,
          "orderIndex": 0
        },
        {
          "id": "opt_002",
          "text": "TCP",
          "isCorrect": false,
          "orderIndex": 1
        }
      ],
      "explanation": {
        "explanationMarkdown": "IP (Internet Protocol) operates at Layer 3...",
        "referenceLinks": ["https://..."]
      }
    }
  ],
  "total": 150,
  "skip": 0,
  "take": 20
}
```

### Create Question *(Admin Only)*

**POST** `/questions`

Request:
```json
{
  "blueprintId": "bp_001",
  "domainId": "domain_001",
  "subObjectiveId": "so_001",
  "stem": "What does CIDR stand for?",
  "type": "SINGLE_CHOICE",
  "difficulty": 1,
  "answerOptions": [
    {
      "text": "Classless Inter-Domain Routing",
      "isCorrect": true,
      "explanationOverride": "This is the correct definition"
    },
    {
      "text": "Class Inter-Domain Routing",
      "isCorrect": false
    }
  ],
  "explanation": {
    "explanationMarkdown": "CIDR is a method for allocating IP addresses...",
    "referenceLinks": ["https://..."  ]
  }
}
```

Response (201):
```json
{
  "id": "q_123",
  "stem": "What does CIDR stand for?",
  "...": "..."
}
```

---

## Exam Forms

### List Exam Forms

**GET** `/exam-forms`

Query Parameters:
- `blueprintId` (string): Filter by blueprint
- `skip` (number): Default: 0
- `take` (number): Default: 20

Response:
```json
{
  "forms": [
    {
      "id": "form_001",
      "name": "Full CCNA Simulation v2026.1",
      "mode": "FIXED",
      "questionCount": 120,
      "timeLimitMinutes": 120,
      "isPublic": true,
      "blueprint": {
        "id": "bp_001",
        "name": "CCNA 200-301 v1.1 2026"
      }
    }
  ],
  "total": 15,
  "skip": 0,
  "take": 20
}
```

### Get Exam Form

**GET** `/exam-forms/:id`

Response:
```json
{
  "id": "form_001",
  "name": "Full CCNA Simulation v2026.1",
  "mode": "FIXED",
  "questionCount": 120,
  "timeLimitMinutes": 120,
  "isPublic": true,
  "rulesJson": {}
}
```

---

## Exam Sessions

### Create Session

**POST** `/exam-sessions`

Request:
```json
{
  "examFormId": "form_001",
  "mode": "SIMULATION"
}
```

Response (201):
```json
{
  "sessionId": "session_001",
  "examName": "Full CCNA Simulation v2026.1",
  "totalQuestions": 120,
  "timeLimitMinutes": 120,
  "mode": "SIMULATION",
  "firstQuestion": {
    "id": "q_001",
    "stem": "Which layer of the OSI model...",
    "type": "SINGLE_CHOICE",
    "answerOptions": [
      {
        "id": "opt_001",
        "text": "Option A",
        "orderIndex": 0
      }
    ]
  }
}
```

### Get Current Question

**GET** `/exam-sessions/:id/current`

Query Parameters:
- `questionIndex` (number): Current question index. Default: 0

Response:
```json
{
  "questionIndex": 0,
  "totalQuestions": 120,
  "question": {
    "id": "q_001",
    "stem": "...",
    "answerOptions": [...]
  },
  "userResponse": {
    "selectedOptionIds": [],
    "freeTextAnswer": null
  }
}
```

### Submit Answer

**POST** `/exam-sessions/:id/answers`

Request:
```json
{
  "questionIndex": 0,
  "selectedOptionIds": ["opt_001"],
  "freeTextAnswer": null,
  "responseTimeMs": 15000
}
```

Response (Simulation Mode):
```json
{
  "acknowledged": true
}
```

Response (Study Mode):
```json
{
  "isCorrect": true,
  "correctOptionIds": ["opt_001"],
  "explanation": "Detailed explanation of the correct answer..."
}
```

### Complete Session

**POST** `/exam-sessions/:id/complete`

Response:
```json
{
  "totalScorePercent": 82.5,
  "passFail": "PASS",
  "domainScores": {
    "NETWORK_FUNDAMENTALS": 85.0,
    "NETWORK_ACCESS": 80.0,
    "IP_CONNECTIVITY": 82.0,
    "IP_SERVICES": 75.0,
    "SECURITY_FUNDAMENTALS": 88.0,
    "AUTOMATION_PROGRAMMABILITY": 80.0
  },
  "rawCorrectCount": 99,
  "rawTotalCount": 120,
  "scaledScore": 850
}
```

### Get Session Results

**GET** `/exam-sessions/:id/result`

Response:
```json
{
  "sessionId": "session_001",
  "examName": "Full CCNA Simulation v2026.1",
  "mode": "SIMULATION",
  "totalScore": 82.5,
  "scaledScore": 850,
  "passFail": "PASS",
  "domainScores": { "...": "..." },
  "rawCorrectCount": 99,
  "rawTotalCount": 120,
  "startedAt": "2024-05-01T10:00:00Z",
  "completedAt": "2024-05-01T12:00:00Z",
  "questionReviews": [
    {
      "questionId": "q_001",
      "questionStem": "...",
      "domain": "Network Fundamentals",
      "difficulty": 2,
      "type": "SINGLE_CHOICE",
      "your_answer": [{ "text": "Option A" }],
      "correct_answer": [{ "text": "Option A" }],
      "isCorrect": true,
      "explanation": "...",
      "referenceLinks": ["https://..."]
    }
  ],
  "weakAreas": ["IP_SERVICES"]
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Error message or messages array",
  "error": "Bad Request",
  "timestamp": "2024-05-01T10:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

---

## Rate Limiting

- **Login**: 5 attempts per minute
- **General**: 60 requests per minute
- **Exam submission**: 1 per second per session

