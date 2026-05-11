---
name: clarify
description: Identify underspecified areas in a document (spec, requirements, PRD, brief, etc.) by asking targeted clarification questions and encoding answers back into the document. Use when the user has a document with ambiguities, missing decisions, or gaps that need resolution before implementation begins.
---

# Clarify

Detect and reduce ambiguity or missing decision points in a document, then record clarifications directly back into it.

## When to Use

- User has a spec, requirements doc, PRD, design brief, or similar document with gaps
- User wants to tighten up a document before handing it off to implementation
- User says "clarify", "review for gaps", "what's missing", "tighten this spec", etc.
- User uploads or points to a document and wants it stress-tested for completeness

## User Input

The user provides:

1. **A document to clarify** — either uploaded, pasted, or referenced by path.
2. **Optional context** — e.g., "this is for a mobile app", "we're a 3-person team", "focus on security".

If no document is provided, ask the user to supply one before proceeding.

---

## Execution Steps

### 1. Load the Document

- If the user gave a path, read from that path using the `Read` tool.
- If the user pasted content, work with that directly.
- Identify the file format (Markdown, plain text, etc.) and preserve it throughout.

### 2. Ambiguity & Coverage Scan

Perform a structured scan of the document using this taxonomy. For each category, mark status as **Clear**, **Partial**, or **Missing**. This produces an internal coverage map used for question prioritization — do not output the raw map unless no questions will be asked.

**Functional Scope & Behavior:**

- Core user goals & success criteria
- Explicit out-of-scope declarations
- User roles / personas differentiation

**Domain & Data Model:**

- Entities, attributes, relationships
- Identity & uniqueness rules
- Lifecycle / state transitions
- Data volume / scale assumptions

**Interaction & UX Flow:**

- Critical user journeys / sequences
- Error / empty / loading states
- Accessibility or localization notes

**Non-Functional Quality Attributes:**

- Performance (latency, throughput targets)
- Scalability (horizontal/vertical, limits)
- Reliability & availability (uptime, recovery expectations)
- Observability (logging, metrics, tracing signals)
- Security & privacy (authN/Z, data protection, threat assumptions)
- Compliance / regulatory constraints

**Integration & External Dependencies:**

- External services/APIs and failure modes
- Data import/export formats
- Protocol / versioning assumptions

**Edge Cases & Failure Handling:**

- Negative scenarios
- Rate limiting / throttling
- Conflict resolution (e.g., concurrent edits)

**Constraints & Tradeoffs:**

- Technical constraints (language, storage, hosting)
- Explicit tradeoffs or rejected alternatives

**Terminology & Consistency:**

- Canonical glossary terms
- Avoided synonyms / deprecated terms

**Completion Signals:**

- Acceptance criteria testability
- Measurable Definition of Done indicators

**Misc / Placeholders:**

- TODO markers / unresolved decisions
- Ambiguous adjectives ("robust", "intuitive") lacking quantification

For each category with Partial or Missing status, generate a candidate question unless:

- Clarification would not materially change implementation or validation
- Information is better deferred to a later phase (note internally)

### 3. Generate Prioritized Question Queue

Produce (internally) a prioritized queue of clarification questions. The number of questions is **adaptive** — scale to the document's size and ambiguity level:

- **Small/clear documents** (few gaps): 1–3 questions may suffice.
- **Medium documents** (moderate gaps): 5–8 questions typical.
- **Large/ambiguous documents** (many gaps across categories): 10+ questions are appropriate.

There is **no hard cap**. Ask as many questions as needed to resolve all material ambiguities. Quality over brevity — do not skip a high-impact question to stay under an arbitrary limit.

Constraints:

- Every question MUST provide 2–4 concrete options. The user always has an automatic "Other" free-text fallback, so open-ended questions still work — just provide your best-guess options as starting points.
- Only include questions whose answers materially impact architecture, data modeling, task decomposition, test design, UX behavior, operational readiness, or compliance validation.
- **Category coverage balance**: cover the highest-impact unresolved categories first; avoid two low-impact questions when a single high-impact area is unresolved.
- Exclude questions already answered in the document, trivial stylistic preferences, or execution-level details.
- Favor clarifications that reduce downstream rework risk or prevent misaligned acceptance tests.
- Prioritize by **(Impact x Uncertainty)** heuristic — highest first.

### 4. Sequential Questioning Loop (Interactive)

Present questions using the `AskUserQuestion` tool. This provides a structured UI with selectable options and an automatic "Other" free-text fallback.

**For each question, call `AskUserQuestion` with these required fields:**

- `question` — the full question text, ending with `?`.
- `header` — short category label, max 12 chars (e.g., `"Scope"`, `"Data Model"`, `"Auth"`, `"Edge Cases"`).
- `options` — 2–4 options, each with `label` (1–5 words) and `description` (reasoning/tradeoff). The tool auto-adds an "Other" free-text option, so do not include one manually.
- `multiSelect` — always `false` (clarification questions are single-choice).

**Recommendation:** Place the recommended option first and append `(Recommended)` to its label.

**After the user answers:**

- Record the answer in working memory and move to the next queued question.
- If the answer is ambiguous, ask a single follow-up disambiguation (does not count as a new question).

**Batching:** When questions are independent, batch up to 4 into a single `AskUserQuestion` call. Only batch when answers to earlier questions do not affect later ones.

**Stop asking when:**

- All material ambiguities are resolved, OR
- User signals completion ("done", "good", "no more", "stop", "proceed").

### 5. Integrate Each Answer into the Document

After **each batch** of accepted answers, immediately update the document using the `Edit` tool:

**First integration in this session:**

- Ensure a `## Clarifications` section exists. If missing, create it after the highest-level overview/context section.
- Under it, create a `### Session YYYY-MM-DD` subheading for today's date.

**For every answer:**

- Append a bullet: `- Q: <question> → A: <final answer>`
- Then apply the clarification to the most appropriate section(s):
  - **Functional ambiguity** → Update or add a bullet in Functional Requirements (or equivalent section).
  - **User interaction / actor distinction** → Update User Stories, Actors, or Personas subsection.
  - **Data shape / entities** → Update Data Model section (add fields, types, relationships); note constraints succinctly.
  - **Non-functional constraint** → Add/modify measurable criteria in Non-Functional / Quality Attributes (convert vague adjectives to metrics).
  - **Edge case / negative flow** → Add a bullet under Edge Cases / Error Handling (create subsection if needed).
  - **Terminology conflict** → Normalize the term across the document; retain the original only if necessary with `(formerly referred to as "X")` once.
- If the clarification **invalidates** an earlier ambiguous statement, **replace** it — leave no obsolete contradictory text.

**Write rules:**

- Save the file after each integration (atomic edit to minimize context loss risk).
- Preserve formatting: do not reorder unrelated sections; keep heading hierarchy intact.
- Keep each inserted clarification minimal and testable (avoid narrative drift).

### 6. Validation (After Each Write + Final Pass)

- Clarifications session contains exactly one bullet per accepted answer (no duplicates).
- Updated sections contain no lingering vague placeholders the new answer was meant to resolve.
- No contradictory earlier statement remains.
- Document structure is valid; only allowed new headings: `## Clarifications`, `### Session YYYY-MM-DD`.
- Terminology consistency: same canonical term used across all updated sections.

### 7. Report Completion

After the questioning loop ends (or early termination), provide:

- **Questions asked & answered**: count.
- **Path to updated document**.
- **Sections touched**: list section names.
- **Coverage summary table**:

  | Category            | Status                                    |
  | ------------------- | ----------------------------------------- |
  | Functional Scope    | Resolved / Clear / Deferred / Outstanding |
  | Domain & Data Model | ...                                       |
  | ...                 | ...                                       |

  Status meanings:
  - **Resolved** — was Partial/Missing and addressed in this session.
  - **Clear** — already sufficient in the original document.
  - **Deferred** — better suited for a later phase or user terminated early.
  - **Outstanding** — still Partial/Missing but low impact.

- If any **Outstanding** or **Deferred** remain, recommend whether to proceed or run another clarification pass later.

---

## Behavior Rules

- If **no meaningful ambiguities** are found (or all potential questions would be low-impact), respond: _"No critical ambiguities detected. The document is ready for the next phase."_ and output the coverage summary.
- If **no document** is provided, ask the user to supply one.
- **No hard question limit.** Ask as many as the document demands. A 2-page spec with 1 gap gets 1 question; a 20-page spec with 15 gaps gets 15 questions. Scale naturally.
- Avoid speculative tech stack questions unless the absence blocks functional clarity.
- Respect user early termination signals ("stop", "done", "proceed").
- Use the user's optional context input (e.g., "focus on security") to bias prioritization of the question queue accordingly.
