# AI AGILE WORKFLOW

This document defines the Agile Development Workflow that the AI (ChatGPT + Comet) must follow at all times for the AI Skincare Intelligence System project.  
It ensures consistent delivery, continuous documentation, and traceable progress through every sprint.

---

# 1. CORE PRINCIPLES

1. **Deliver in small increments.**  
   Break every feature into tiny, testable, reviewable tasks.

2. **Stay aligned with project artifacts:**

   - SRS
   - Product Backlog
   - Active Sprint
   - Project Progress Tracker
   - Architecture Docs

3. **Document every change.**  
   No task is complete until documentation is updated.

4. **Test-first mindset.**  
   AI must consider test requirements for every task.

5. **Simple, clear, and maintainable code.**  
   Avoid complexity and keep structure consistent.

---

# 2. AGILE SPRINT CYCLE (THE LOOP AI MUST FOLLOW)

The AI must always follow this cycle for every sprint:

## Step 1 — Sprint Initialization

The AI generates:

- Sprint Goal
- User Stories
- Acceptance Criteria
- Task Breakdown
- Links to SRS + Backlog
- Updates `/docs/PROJECT_PROGRESS_TRACKER.md`

All stories must follow the format:

**As a <role>, I want <feature> so that <benefit>.**

---

## Step 2 — Task Planning

For each story, the AI creates:

- Task ID
- Description
- Required file changes
- Tests needed
- Acceptance criteria alignment
- Dependencies

Tasks must be added to:

- `/docs/PROJECT_PROGRESS_TRACKER.md`
- GitHub Issues (optional)

---

## Step 3 — Implementation (AI-Guided Development)

### ChatGPT Responsibilities:

- Architecture explanation
- Generate backend + frontend code
- Suggest improvements and refactors
- Prevent anti-patterns
- Provide step-by-step implementation guidance

### Comet Responsibilities:

- Inline code suggestions
- Auto-generate boilerplate
- Suggestions for tests
- Highlight code issues

Both must:

- Keep work aligned with Active Sprint
- Maintain small increments
- Track task progress automatically

---

## Step 4 — Testing

Before marking a task done, the AI must verify:

- Does the code meet acceptance criteria?
- Are tests written where needed?
- Do tests pass?
- Does the feature work in Codespaces?

If not → AI must provide fixes.

---

## Step 5 — Documentation Update

When a task or user story is completed, the AI must update:

1. `/docs/PROJECT_PROGRESS_TRACKER.md`
2. `/docs/sprint-X.Y.md`
3. Architecture notes (if applicable)
4. README sections (if relevant)

Documentation must include:

- Task status
- Test verification
- Notes
- Requirement mapping
- Links to code

---

## Step 6 — CI/CD Validation

Before a task is fully “Done,” the AI must ensure:

- GitHub Actions builds succeed
- Tests pass
- Staging deployment (if configured) is successful

If broken, AI must propose pipeline fixes.

---

## Step 7 — Sprint Review

At end of sprint, the AI generates:

- Completed stories summary
- Demo instructions
- Tested features
- Deployment logs
- Updated progress tracker

---

## Step 8 — Retrospective

AI generates:

- What went well
- What needs improvement
- Risks
- Changes for next sprint

This is added to:
`/docs/sprint-X.Y.md`

---

# 3. AI CONTINUOUS RULES (APPLY 100% OF THE TIME)

### ✓ Always track task progression

Every completed task → update Project Progress Tracker.

### ✓ Always align with requirements

No feature may be generated that violates SRS or backlog.

### ✓ Always maintain documentation accuracy

Code and documentation must never drift apart.

### ✓ Produce modular code

Small, reviewable, testable units.

### ✓ Follow consistent folder structure

- Backend → FastAPI
- Frontend → React/Next.js
- Database → Env-based & migration-ready
- Dev → GitHub Codespaces (via .devcontainer)

### ✓ Cost-aware development

Prefer free-tier hosting and scalable approaches.

### ✓ Ask for clarification when necessary

AI should not guess riskily:

> “Do you want Option A or Option B?”

---

# 4. AI TRIGGER CONDITIONS (WHEN AI ACTS AUTOMATICALLY)

AI should proactively update or make suggestions when:

### 🔹 New file is created

→ Suggest implementation + tests + docs.

### 🔹 File is modified

→ Suggest refactor improvements.

### 🔹 Task marked done

→ Update documentation + status.

### 🔹 New story or requirement appears

→ Update backlog + RTM.

### 🔹 CI/CD fails

→ Suggest pipeline fixes.

### 🔹 New DB or service introduced

→ Update architecture + configs.

### 🔹 A sprint ends

→ Auto-generate Sprint Review + Retrospective.

---

# 5. AGILE VALUES GUIDING AI

1. **Individuals and interactions over processes and tools**
2. **Working software over comprehensive documentation**
3. **Customer collaboration over contract negotiation**
4. **Responding to change over following a plan**

AI should always prioritize real, incremental progress.

---

# 6. SUMMARY OF AI WORKFLOW (ALWAYS TRUE)

## Daily Update Rule

Every day (or on the next working day after holidays/weekends) the AI must:

- Re-check active sprint tasks assigned to it.
- Update `/docs/PROJECT_PROGRESS_TRACKER.md` with any progress or blockers.
- Ensure unit/integration tests for changed code are added or updated.
- Add brief notes to `/docs/sprint-X.Y.md` when a story advances status (In Progress → Review → Done).

This rule enforces that work and documentation never drift: treat it as part of the Definition of Done for any task.
