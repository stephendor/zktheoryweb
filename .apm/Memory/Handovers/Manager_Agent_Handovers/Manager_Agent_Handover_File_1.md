---
agent_type: Manager
agent_id: Manager_1
handover_number: 1
current_phase: "Phase 2: Content Architecture"
active_agents: [Agent_Design_Templates]
---

# Manager Agent Handover File — zktheory.org Research Portfolio Website

## Active Memory Context

**User Directives:**
- User reviewed Phase 1 site via `npm run dev` (NOT `dist/` static files — absolute CSS paths break when opened from disk). Always remind incoming agents and users of this.
- User approved Phase 1 in full after visual review confirmed fonts, maths, code, layout, sidenotes, nav all render correctly.
- User requested this handover due to context window length; no task is blocked or in contention.

**Decisions made this session:**
1. **Astro 6 accepted** — npm resolved 6.1.3 instead of spec'd v5; all plan references updated; all adapters target v6.
2. **`key_claims` shape** — corrected from flat `z.array(z.string())` (task spec error) to `z.array(z.object({ claim: z.string(), detail: z.string() }))` matching PRD §4.3 and ExpandableCard design. Schema patched in `src/content.config.ts` after Task 2.1 completed.
3. **`papers` status enum** — `planned/in-progress` confirmed canonical (not `drafting`). No change needed.
4. **`data-justice` slug** — confirmed canonical (not `data-justice-foundations`). Task 6.1 guidance updated in plan.
5. **`.container-prose--wide`** — Task 1.6 finding: `.prose` CSS Grid inside `.container-prose` (720px) collapses main column to ~476px. Fix is a new `.container-prose--wide` (`≈964px`) in `layout.css`. This is the **first action in Task 2.2a** before building ChapterLayout.
6. **`@tailwindcss/vite`** — Tailwind v4 uses this Vite plugin approach (not `@astrojs/tailwind` which is v3 only). All component agents must know this.
7. **`z` import** — always `import { z } from 'zod'`, NEVER from `astro:content` (deprecated in Astro 6).
8. **Astro 6 content rendering** — use `const { Content, headings } = await render(entry)` (NOT `await entry.render()` which is Astro 5 API).

## Coordination Status

**Producer-Consumer Dependencies:**

- Task 2.1 (Agent_Schema_Platform) → **COMPLETE** → Task 2.2a, 2.2b, 2.2c, 2.3, 2.4, 2.5 can now proceed (all depend on schemas)
- Task 2.2a (Agent_Design_Templates) → **ASSIGNED, NOT STARTED** → blocks Tasks 2.2c, 2.3, 2.4 (all need StickyToC)
- Task 1.5 (Agent_Design_Templates) → **COMPLETE** → Task 2.2b is unblocked (depends on 1.5 only)
- Task 2.2a + 2.2b must both complete before Task 2.2c
- Task 2.9a (Zotero) → **BLOCKING USER ACTION**: agent needs Zotero API key and user ID at task start — remind user before assigning

**Ready for parallel execution after Task 2.2a completes:**
- Task 2.2b (Agent_Design_Templates) — unblocked now (only depends on Task 1.5, already done)
- Task 2.5 (Agent_Design_Templates) — unblocked now (depends on Task 2.1 + Task 1.5, both done)

**Coordination Insights:**
- Agent_Design_System is high-quality on token/CSS architecture; trusts them on implementation details.
- Agent_Infra caught Astro v6/v5 divergence proactively — flag any "install latest" risks to infra agents.
- Agent_Schema_Platform caught PRD vs task-spec divergences — good at cross-referencing; give them the PRD to read directly.
- Agent_Design_Templates is same agent for Tasks 1.5 and 2.2a — good continuity; they know BaseLayout deeply.

## Next Actions

**Immediate (Task 2.2a — already assigned):**
Task assignment prompt was already issued to Agent_Design_Templates before this handover. The incoming Manager Agent should receive the Task 2.2a Final Task Report first. The prompt was included in the previous Manager's last chat message (do NOT reissue it; it has already been given to the user to pass to the agent).

**After Task 2.2a completes:**
- Task 2.2b → Agent_Design_Templates (can be parallelised with 2.2a if desired — it only depends on Task 1.5 which is done)
- Review Task 2.2a log; if `.container-prose--wide` was added correctly, confirm it propagates to Task 2.3 and 2.4 assignments

**Blocked:**
- Task 2.9a (Zotero fetch script) — requires user to provide Zotero API key and user ID. Remind user to have these ready before assigning Task 2.9a. Do NOT assign until user confirms they have the credentials.

**Phase Transition Notes:**
Phase 2 has 12 tasks (2.1 through 2.12). Task 2.12 is the User Review Checkpoint. Phase 2 memory logs are in `.apm/Memory/Phase_02_Content_Architecture/`. All 12 empty log files are pre-created.

## Working Notes

**Key file locations:**
- `src/content.config.ts` — Astro 6 content config (NOT `src/content/config.ts`)
- `src/styles/tokens.css` — all design tokens (source of truth for colours, spacing, fonts)
- `src/styles/layout.css` — grid system; `.container-prose--wide` to be added by Task 2.2a
- `src/styles/prose.css` — `.prose` scoped styles; sidenote CSS Grid
- `src/layouts/BaseLayout.astro` — base shell; all layouts extend this
- `src/components/shared/` — SiteNav, SiteFooter, Sidenote already exist here
- `public/fonts/` — 9 WOFF2 font files (175.4KB total)
- `docs/PRD-Research-Portfolio-Website.md` — source of truth for all content/feature requirements
- `.apm/guides/` — Memory_System_Guide, Memory_Log_Guide, Task_Assignment_Guide (re-read as needed)

**User preferences:**
- Terse, direct communication preferred
- Reports tasks back promptly; no significant delays observed between assignments
- Comfortable with technical detail in task prompts
- Prefers to review via `npm run dev` (local server), not static dist files
