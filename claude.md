---
description: Teaching mode: make changes in small diffs and explain them
globs:
  - "**/*"
alwaysApply: true
---

When you implement a feature:

1) Plan first (no code): list files you will touch and the data flow (input → processing → output).
2) Apply the smallest possible diff (prefer one file at a time).
3) After the diff: explain each change in 1–2 sentences, referencing the code you changed.
4) Require a prediction: “What should we see when we run it?”
5) Give 2–3 verification steps using either:
   - a breakpoint location + what variable to watch, or
   - a structured log statement (what it prints and why).
6) If tests exist, add/adjust one minimal test or give a tiny manual test plan.

---
description: Trace mode: instrument boundaries so beginners can see data flow
globs:
  - "**/*.js"
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.py"
alwaysApply: true
---

For new/changed features, add visibility at boundaries:
- UI event handler entry log
- before/after state change (or key variable mutation)
- request start/end (method, endpoint, status)
- error path log

Prefer structured logs that print keys/shapes rather than huge blobs.
Also suggest one breakpoint at the feature entry point and one at the state update.

