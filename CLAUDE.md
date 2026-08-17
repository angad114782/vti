# Vook VTI — Project Instructions for Claude Code

## MANDATORY: Update HANDOVER.md After Every Task

After completing ANY code change, fix, or feature — no matter how small — you MUST update both:
- `d:/Projects/vook/vti/HANDOVER.md`
- `d:/Projects/vook/HANDOVER.md` (the mirror — keep identical)

Do NOT wait to be asked. Do NOT skip this step. The update must happen as the final action of every session.

### What to update in HANDOVER.md:

#### Header
- Update the `Generated` date and session number/description.

#### Section 2 — Production Readiness Table
- Re-score any area whose readiness changed (e.g., Settings went from 85% → 92%).

#### Section 3 — TypeScript Status
- Run `npx tsc --noEmit` in both `vti/backend/` and `vti/frontend/` and report the result.
- Update "Last verified Session N: 0 errors / N errors".

#### Section 10 — What Is FULLY DONE
- Add any newly completed features/pages.

#### Section 11 — Known Gaps (P0/P1/P2/P3)
- Mark resolved items with ~~strikethrough~~ and "FIXED Session N."
- Add newly discovered gaps with their exact file path + what's needed.
- Add a "Resolved in Session N" block listing all ✅ items from this session.

#### Section 12 — File Locations
- Add any new utility files, hooks, stores, or components introduced.

#### Section 13 — Suggested Next Steps
- Remove completed items.
- Re-order remaining items by current priority.
- Add any new recommended items discovered during this session.

#### Section 14 — Known Bugs & Gotchas
- Mark fixed bugs with ~~strikethrough~~ and "FIXED Session N."
- Add newly discovered bugs with reproduction steps or file:line reference.

#### Section 15 — Technical Debt & Quality Issues (create if missing, always update)
List anything that is not a bug but should be improved:
- Patterns that are inconsistent across the codebase
- Components or controllers that are too large and should be split
- Missing validation or error handling discovered during this session
- Performance concerns (N+1 queries, large bundle imports, unmemoized callbacks)
- Anything that would confuse a new developer reading the code cold

---

## Error Handling Pattern (established Session 7 — always follow)
- Import `extractError` from `../../utils/errorUtils` (or relative equivalent)
- Import `toast` from `sonner`
- Never use bare `catch {}` or `.catch(() => {})`
- Never repeat the inline cast `(e as { response?: { data?: { message?: string } } })`
- After profile saves via `PATCH /auth/me`, call `setUser()` from `useAuthStore`

## Toast Pattern
- Success actions: `toast.success('...')`
- API failures in catch: `toast.error(extractError(err, 'Fallback message'))`
- Form validation errors (inline): set local error state, do NOT toast
- 5xx errors: handled globally in `src/api/axios.ts` interceptor (don't double-toast)

## Project Stack (quick reference)
- **Backend:** Express 5 + Mongoose + TypeScript → `vti/backend/` → port 5001
- **Frontend:** React 19 + Vite + Tailwind 4 + Zustand + Axios + sonner → `vti/frontend/` → port 5173
- **Dev:** `cd d:/Projects/vook/vti && npm run dev`
- **Type check:** `cd vti/frontend && npx tsc --noEmit` and `cd vti/backend && npx tsc --noEmit`
- **Handover:** `vti/HANDOVER.md` (mirror: `../HANDOVER.md`)
- **Error util:** `vti/frontend/src/utils/errorUtils.ts` → `extractError(err, fallback?)`
- **Auth store:** `vti/frontend/src/store/authStore.ts` → includes `setUser(patch)` action
