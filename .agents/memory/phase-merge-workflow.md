---
name: phase-merge-workflow
description: After each important phase, merge the working branch into main and push automatically, without asking.
metadata:
  type: feedback
---

When a significant phase of work is finished and its quality gate is green, merge the working branch into `main` and push it — automatically, without asking for confirmation each time.

**Why:** the user wants `main` to be the always-current reference before any new phase starts. Long-lived branches accumulate commits and become unreviewable, and starting a new phase on top of an unmerged branch compounds the problem. They stated this explicitly: "ne me demande plus ça, ça doit être automatique après la [fin] de phase importante".

**How to apply:** finish the phase → run `bun run check` → commit → merge into `main` (fast-forward when possible) → `git push origin main`. Only then start the next phase. This does **not** extend to deleting branches, force-pushing, or tagging releases — those still need explicit approval. Feature work still starts on a short-lived branch per the repo convention in [[../../AGENTS.md]]; the change is only that the merge back is automatic.
