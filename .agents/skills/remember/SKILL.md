---
name: remember
description: Analyzes conversations for valuable insights and updates AGENTS.md or docs/ when patterns, gotchas, domain knowledge, or project-specific rules emerge. Use when you discover something important that Claude should remember across sessions.
---

# Remember — Intelligent Memory Updates

This skill analyzes conversations and persists valuable information to the correct file in the project's knowledge stack.

## When to Use This Skill

Use this skill when:

- The user explicitly says "remember this" or "add this to memory"
- You discover a non-obvious pattern, gotcha, or workflow through debugging
- The user corrects a repeated mistake or clarifies a preference
- You identify a bash command or workflow that couldn't be guessed from code
- A conversation reveals project-specific architectural decisions
- The user mentions "every time we..." or "always do X before Y"
- A conversation reveals business domain knowledge, design rationale, or scope decisions
- A previously-deferred feature is now being implemented (remove from `deferred.md`)

**DO NOT use this skill for:**

- One-off tasks or temporary information
- Things obvious from reading the codebase
- Standard language conventions Claude already knows
- Detailed API documentation (link to docs instead)
- Information that belongs in code, schema, or tests

## Two-Filter Gate

**Filter 1 (entry)**: "Would removing this cause Claude to make mistakes in future sessions?"

- No → skip entirely
- Yes → proceed to Filter 2

**Filter 2 (routing)**: "Could someone learn this by reading code, tests, or AGENTS.md?"

- Yes → route to AGENTS.md (or skip if already there)
- No → route to `docs/` (it's the delta — business domain knowledge no other layer can express)

## Decision Tree — Where Does It Go?

```
1. Tech pattern / command / gotcha / engineering principle?
   → AGENTS.md
     a. Only matters in backend?         → packages/backend/AGENTS.md
     b. Only matters in storefront?      → packages/storefront/AGENTS.md
     c. Cross-package?                   → AGENTS.md (root)

2. Business domain knowledge code/tests/AGENTS.md cannot express?
   → docs/
     a. Entity, module boundary, UA term, domain relationship
        → docs/overview.md
     b. Business rule (status, balance, qty, pricing, edit guard)
        → docs/rules.md
     c. Design rationale — WHY we chose X over Y
        → docs/decisions.md  (APPEND ONLY — never edit/delete existing entries)
     d. Feature we deliberately skip + "when it matters" trigger
        → docs/deferred.md

3. Previously-deferred feature now being implemented?
   → DELETE its row from docs/deferred.md

4. Neither? → Don't store it.
```

**Multi-file rule**: When info spans 2+ files (e.g., a business rule AND its design rationale), update ALL relevant files in one invocation.

## 7 Target Files

| File                            | Scope                                                  | Format conventions                                                                    |
| ------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| `AGENTS.md` (root)              | Cross-package dev rules                                | Sections with headers, code blocks, ✅/❌ comparisons                                 |
| `packages/backend/AGENTS.md`    | Backend-only (Fastify, tRPC, Drizzle, services, tests) | Same as root                                                                          |
| `packages/storefront/AGENTS.md` | Storefront-only (Next.js, React, Playwright, CSS)      | Same as root                                                                          |
| `docs/overview.md`              | Domain map, entities, glossary, system boundary        | Narrative + tables + ASCII diagrams. Add to existing sections                         |
| `docs/rules.md`                 | Business rules by theme (9 sections)                   | Equations, truth tables, step-by-step. Add under existing theme or create new section |
| `docs/decisions.md`             | Design rationale (ADR-style)                           | Terse bullet: `**Decision** — rationale`. Group under domain heading                  |
| `docs/deferred.md`              | What we don't build + trigger conditions               | Table rows: `Feature \| Trigger`. Remove rows when features are built                 |

**Constraints**:

- `decisions.md` is **APPEND ONLY** — never edit or delete existing entries
- `deferred.md` **shrinks** over time — delete rows when features get implemented
- Every `docs/` line must pass the delta test: "Could someone learn this from code/tests/AGENTS.md?" If yes → doesn't belong in `docs/`

## Formatting Rules

### AGENTS.md files

1. **Be concise** — one line if possible, max 2-3 lines per rule
2. **Use emphasis** — "IMPORTANT", "YOU MUST", "CRITICAL" for severity
3. **Show examples** — ✅/❌ comparisons for clarity
4. **Explain why** — brief context if not obvious
5. **Use active voice** — "Run X" not "X should be run"

### docs/ files

- **overview.md**: Match existing Glossary table format (Ukrainian | English | Business meaning). Use ASCII art for diagrams. Narrative prose for context.
- **rules.md**: Code-block equations for formulas. Tables for status/behavior matrices. Place under correct numbered section (1-9). New theme → add as section 10+.
- **decisions.md**: One bullet per decision. Format: `**Short name** — rationale`. Place under correct domain group. New domain → add heading.
- **deferred.md**: Table row: `| Feature name | When it matters |`. Place under correct category heading.

## Workflow

### Step 1: Analyze

**IMPORTANT**: Review the **ENTIRE conversation from the beginning** to identify:

1. **Commands** — bash commands used that aren't obvious from code
2. **Gotchas** — errors encountered with non-obvious fixes
3. **Patterns** — repeated workflows or preferences
4. **Corrections** — things the user had to clarify or fix
5. **Domain knowledge** — business rules, rationale, scope decisions
6. **Deferred removals** — features being implemented that exist in `deferred.md`

### Step 2: Classify

Run the decision tree. For each piece of information:

- Apply Filter 1 (worth persisting?) and Filter 2 (AGENTS.md or docs?)
- Determine the target file(s) — may be multiple
- Determine the section within each target file

### Step 3: Format

Read the target file(s). Match existing formatting conventions for the section you're adding to.

### Step 4: Write

Edit the target file(s) using the Edit tool:

- AGENTS.md: Add to existing section or create new subsection
- docs/overview.md: Add to Glossary, Entity Catalog, or relevant narrative section
- docs/rules.md: Add under correct theme section, matching equation/table format
- docs/decisions.md: Append bullet under correct domain heading
- docs/deferred.md: Add or remove table rows

### Step 5: Report

Tell the user what changed, in which file(s), which section(s), and why:

```
Updated docs/rules.md and docs/decisions.md:
- rules.md > Section 5 (Invoice Revision): Added financial guard for paid invoice edits
- decisions.md > Finance: Appended "Paid invoice changes blocked — supplementary invoice required"

Reason: Business rule discovered during implementation that code alone cannot express.
```

## Examples

### Example 1: Backend Gotcha → Backend AGENTS.md

**Conversation**: Debugging `malformed array literal` error in Drizzle query.

**Target**: `packages/backend/AGENTS.md` > Gotchas

**Update**:

```markdown
**BUG**: `= ANY(${jsArray})` inside `sql` templates does NOT work — use `inArray()`:
\`\`\`typescript
// ❌ BUG - JS array in sql template = runtime error
.where(sql`${Table.col} = ANY(${myArray})`)
// ✅ CORRECT
.where(inArray(Table.col, myArray))
\`\`\`
```

### Example 2: Cross-Package Rule → Root AGENTS.md

**Conversation**: User says "Remember to always run pnpm watch when working on shared package"

**Target**: `AGENTS.md` (root) > Development Workflow

**Update**:

```markdown
**CRITICAL**: Keep `pnpm watch` running when modifying `@vita/shared` to auto-rebuild types.
Without it, dependent packages see stale types until manual rebuild.
```

### Example 3: Business Rule + Rationale → rules.md + decisions.md (Multi-file)

**Conversation**: While implementing invoice editing, discover that paid invoices with total changes are blocked.

**Targets**: `docs/rules.md` > Section 5 + `docs/decisions.md` > Invoices

**Update (rules.md)**:

```markdown
### Financial Guards on Paid Invoices

Paid invoices cannot be edited if the total changes:

- Total increase → create supplementary invoice
- Total decrease → process refund
- Non-financial fields (notes, metadata) → editable regardless of status
```

**Update (decisions.md)**:

```markdown
**Paid invoice total immutable** — changing a paid total creates accounting discrepancies. Supplementary invoices and refunds maintain audit trail integrity.
```

### Example 4: Deferred Feature Removal → deferred.md

**Conversation**: Implementing RBAC, which was previously listed as deferred.

**Target**: `docs/deferred.md` > UI & Permissions

**Action**: DELETE the row `| Fine-grained RBAC | When team grows beyond trust-based access |`

**Report**:

```
Updated docs/deferred.md:
- Removed "Fine-grained RBAC" from UI & Permissions — feature is now being implemented.
```

## Pruning Bloat

If any file grows too large:

1. **Merge related rules** — consolidate similar items
2. **Remove outdated info** — delete rules for removed features
3. **Check placement** — should this be in a different file?
4. **Delta test for docs/** — delete if learnable from code/tests/AGENTS.md
5. **Question each line** — "Would removing this cause mistakes?"

## When to Ask the User

Before updating, ask if:

- You're unsure if something is a one-off or a pattern
- The rule conflicts with existing content
- You're creating a new top-level section
- The information seems temporary or experimental
- Classification is ambiguous (could go in multiple files and you're unsure which is primary)

## Final Checklist

Before marking this skill complete:

- [ ] Identified valuable information from conversation
- [ ] Passed Filter 1: worth persisting? (Yes → proceed)
- [ ] Passed Filter 2: AGENTS.md or docs/? (routed correctly)
- [ ] Chose the correct file(s) — 1 of 7 targets (or multiple for multi-file updates)
- [ ] Chose appropriate section within each file
- [ ] Formatted to match target file conventions
- [ ] Updated file(s) using Edit tool
- [ ] Informed user: what was added/removed, which file(s), which section(s), why
