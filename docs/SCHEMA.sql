-- CreateClause tables for CCNA Exam Platform
-- Database: PostgreSQL 14+

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  "passwordHash" VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
  "targetExamDate" TIMESTAMP,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  "currentGoalScore" INTEGER,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Create exam_blueprints
CREATE TABLE IF NOT EXISTS exam_blueprints (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "effectiveTo" DATE,
  "isActive" BOOLEAN DEFAULT true,
  "domainWeights" JSONB NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_blueprints_is_active ON exam_blueprints("isActive");
CREATE INDEX idx_exam_blueprints_effective_from ON exam_blueprints("effectiveFrom");

-- Domain enum type
CREATE TYPE domain_key_enum AS ENUM (
  'NETWORK_FUNDAMENTALS',
  'NETWORK_ACCESS',
  'IP_CONNECTIVITY',
  'IP_SERVICES',
  'SECURITY_FUNDAMENTALS',
  'AUTOMATION_PROGRAMMABILITY'
);

-- Create domains
CREATE TABLE IF NOT EXISTS domains (
  id VARCHAR(255) PRIMARY KEY,
  "blueprintId" VARCHAR(255) NOT NULL REFERENCES exam_blueprints(id) ON DELETE CASCADE,
  key domain_key_enum NOT NULL,
  name VARCHAR(255) NOT NULL,
  weight NUMERIC(3,2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("blueprintId", key)
);

CREATE INDEX idx_domains_blueprint_id ON domains("blueprintId");

-- Create sub_objectives
CREATE TABLE IF NOT EXISTS sub_objectives (
  id VARCHAR(255) PRIMARY KEY,
  "domainId" VARCHAR(255) NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  code VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_objectives_domain_id ON sub_objectives("domainId");

-- Question type enum
CREATE TYPE question_type_enum AS ENUM (
  'SINGLE_CHOICE',
  'MULTI_SELECT',
  'DRAG_DROP_BASIC',
  'SHORT_ANSWER'
);

-- Create questions
CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(255) PRIMARY KEY,
  "blueprintId" VARCHAR(255) NOT NULL REFERENCES exam_blueprints(id) ON DELETE CASCADE,
  "domainId" VARCHAR(255) NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  "subObjectiveId" VARCHAR(255) REFERENCES sub_objectives(id) ON DELETE SET NULL,
  stem TEXT NOT NULL,
  type question_type_enum NOT NULL,
  difficulty SMALLINT NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5),
  "isActive" BOOLEAN DEFAULT true,
  "createdBy" VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_blueprint_id ON questions("blueprintId");
CREATE INDEX idx_questions_domain_id ON questions("domainId");
CREATE INDEX idx_questions_is_active ON questions("isActive");
CREATE INDEX idx_questions_difficulty ON questions(difficulty);

-- Create answer_options
CREATE TABLE IF NOT EXISTS answer_options (
  id VARCHAR(255) PRIMARY KEY,
  "questionId" VARCHAR(255) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL,
  "orderIndex" INTEGER NOT NULL,
  "explanationOverride" TEXT,
  UNIQUE("questionId", "orderIndex")
);

CREATE INDEX idx_answer_options_question_id ON answer_options("questionId");

-- Create question_explanations
CREATE TABLE IF NOT EXISTS question_explanations (
  "questionId" VARCHAR(255) PRIMARY KEY REFERENCES questions(id) ON DELETE CASCADE,
  "explanationMarkdown" TEXT NOT NULL,
  "referenceLinks" JSONB DEFAULT '[]',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exam form mode enum
CREATE TYPE exam_form_mode_enum AS ENUM ('FIXED', 'DYNAMIC');

-- Create exam_forms
CREATE TABLE IF NOT EXISTS exam_forms (
  id VARCHAR(255) PRIMARY KEY,
  "blueprintId" VARCHAR(255) NOT NULL REFERENCES exam_blueprints(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  mode exam_form_mode_enum NOT NULL,
  "questionCount" INTEGER NOT NULL,
  "timeLimitMinutes" INTEGER NOT NULL,
  "isPublic" BOOLEAN DEFAULT true,
  "rulesJson" JSONB,
  "createdBy" VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_forms_blueprint_id ON exam_forms("blueprintId");
CREATE INDEX idx_exam_forms_is_public ON exam_forms("isPublic");

-- Create exam_form_questions
CREATE TABLE IF NOT EXISTS exam_form_questions (
  "examFormId" VARCHAR(255) NOT NULL REFERENCES exam_forms(id) ON DELETE CASCADE,
  "questionId" VARCHAR(255) NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  "orderIndex" INTEGER NOT NULL,
  PRIMARY KEY ("examFormId", "questionId"),
  UNIQUE("examFormId", "orderIndex")
);

CREATE INDEX idx_exam_form_questions_exam_form_id ON exam_form_questions("examFormId");

-- Exam session mode enum
CREATE TYPE exam_session_mode_enum AS ENUM ('SIMULATION', 'STUDY');

-- Pass/fail enum
CREATE TYPE pass_fail_enum AS ENUM ('PASS', 'FAIL');

-- Create user_exam_sessions
CREATE TABLE IF NOT EXISTS user_exam_sessions (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  "examFormId" VARCHAR(255) NOT NULL REFERENCES exam_forms(id) ON DELETE RESTRICT,
  "blueprintId" VARCHAR(255) NOT NULL REFERENCES exam_blueprints(id) ON DELETE RESTRICT,
  mode exam_session_mode_enum NOT NULL,
  "dynamicSeed" VARCHAR(255),
  "startedAt" TIMESTAMP NOT NULL,
  "completedAt" TIMESTAMP,
  "totalScorePercent" NUMERIC(5,2),
  "passFail" pass_fail_enum,
  "scoreScale" INTEGER,
  "domainScores" JSONB,
  "rawCorrectCount" INTEGER DEFAULT 0,
  "rawTotalCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_exam_sessions_user_id ON user_exam_sessions("userId");
CREATE INDEX idx_user_exam_sessions_exam_form_id ON user_exam_sessions("examFormId");
CREATE INDEX idx_user_exam_sessions_started_at ON user_exam_sessions("startedAt");

-- Create user_responses
CREATE TABLE IF NOT EXISTS user_responses (
  id VARCHAR(255) PRIMARY KEY,
  "sessionId" VARCHAR(255) NOT NULL REFERENCES user_exam_sessions(id) ON DELETE CASCADE,
  "questionId" VARCHAR(255) NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  "selectedOptionIds" JSONB NOT NULL,
  "freeTextAnswer" TEXT,
  "isCorrect" BOOLEAN,
  "responseTimeMs" INTEGER NOT NULL,
  "viewedExplanation" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_responses_session_id ON user_responses("sessionId");
CREATE INDEX idx_user_responses_question_id ON user_responses("questionId");

-- Create user_response_options (reference table)
CREATE TABLE IF NOT EXISTS user_response_options (
  "responseId" VARCHAR(255) NOT NULL REFERENCES user_responses(id) ON DELETE CASCADE,
  "optionId" VARCHAR(255) NOT NULL REFERENCES answer_options(id) ON DELETE RESTRICT,
  PRIMARY KEY ("responseId", "optionId")
);

CREATE INDEX idx_user_response_options_response_id ON user_response_options("responseId");

-- Create audit_log
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  "resourceId" VARCHAR(50),
  details JSONB,
  "ipAddress" VARCHAR(45),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs("userId");
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs("createdAt");
