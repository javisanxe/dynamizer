# Skill: PR Review for Dynamizer

## When to use this skill
Load this skill whenever the user asks to review a PR, MR, branch, or set of changes in the Dynamizer repository — even if they just say "review this", "check my changes", or "can you review what I've done?".

## Context

- Repo: `/Users/javier.sanchez/Documents/repos/dynamizer`
- Main branch: `master`
- Stack: FastAPI + Socket.IO (Python/Poetry) | Next.js 14 (TypeScript)
- All commands go through `make` — never run raw npm/pytest/uvicorn directly
- All text in code must be in English (no Spanish)

---

## Review Workflow

### Step 1 — Gather context

```bash
# What branch are we on and what's the diff vs main?
git -C /Users/javier.sanchez/Documents/repos/dynamizer diff main...HEAD --stat
git -C /Users/javier.sanchez/Documents/repos/dynamizer log main..HEAD --oneline
```

Read the full diff for each changed file before commenting.

### Step 2 — Run the test suite

```bash
make -C /Users/javier.sanchez/Documents/repos/dynamizer test
```

All tests must pass. If any fail, flag them as **blocking**.

### Step 3 — Static checks

```bash
make -C /Users/javier.sanchez/Documents/repos/dynamizer lint
make -C /Users/javier.sanchez/Documents/repos/dynamizer format-check
```

Lint or format failures are **blocking**.

### Step 4 — Code review checklist

Go through every changed file and verify:

#### General
- [ ] No `console.log`, `print`, or `debugger` statements left in (unless inside a dev-only guard)
- [ ] No secrets, tokens, or credentials hardcoded
- [ ] No commented-out dead code committed
- [ ] All user-facing strings and code comments are in English
- [ ] No unnecessary files added (`.DS_Store`, `*.pyc`, `__pycache__/`, `.env`, etc.)

#### Python / FastAPI / Socket.IO (apps/api)
- [ ] Functions and variables follow `snake_case`
- [ ] Type annotations present on all function signatures
- [ ] Pydantic models use V2 syntax (no V1 `@validator` / `class Config`)
- [ ] New Socket.IO events are documented in `types/events.ts` on the frontend too
- [ ] No synchronous blocking calls inside async handlers
- [ ] New pytest tests cover the new/changed logic

#### TypeScript / Next.js (apps/web)
- [ ] Components follow PascalCase, hooks follow `useXxx` naming
- [ ] `useEffect` dependencies are complete (no stale closures)
- [ ] Socket listeners registered with stable references (via `useCallback`)
- [ ] No direct `localStorage` reads during SSR (must be guarded or inside `useEffect`)
- [ ] New Jest tests cover the new/changed components or hooks

### Step 5 — CHANGELOG check

Open `CHANGELOG.md` and verify that every user-visible change in the diff has a corresponding entry under `[Unreleased]`. If entries are missing, list them as **minor issues**.

### Step 6 — README / docs check

If the PR adds new `make` targets, env vars, API endpoints, Socket.IO events, or changes the setup process, verify that `README.md` (and any other affected docs) are updated. Missing doc updates are **minor issues**.

---

## Output format

Report findings in this structure:

```
## PR Review

### Tests & Lint
- ✅ / ❌ Tests: <pass/fail summary>
- ✅ / ❌ Lint: <pass/fail summary>

### Code Issues
List each issue as:
  - 🔴 BLOCKING  | file:line | description
  - 🟡 MINOR     | file:line | description
  - 💡 SUGGESTION| file:line | description

### CHANGELOG
- ✅ Up to date / 🟡 Missing entries: <list>

### README / Docs
- ✅ Up to date / 🟡 Missing updates: <list>

---

### Verdict
✅ Ready to merge
🟡 Minor issues — can merge after addressing
🔴 Blocking issues — do not merge until fixed
```
