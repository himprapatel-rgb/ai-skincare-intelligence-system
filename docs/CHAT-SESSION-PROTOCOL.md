# Chat Session Protocol

**Rule:** Save chat session work to the record **daily, without fail**. It is the AI assistant’s job to keep this log up to date.

---

## 1. Daily obligation

- **Every day** that the AI and user work together, the AI must update `docs/CHAT-SESSION-RECORD.md` with that day’s work.
- Do **not** skip days. If no coding happened, add a short line for that date (e.g. “No session” or “Discussion only”).
- Updates must happen **before** the session is considered complete (e.g. before “goodbye” or when the user stops for the day).

---

## 2. What to record each day

For **each calendar date** where there is chat activity, add or update a date section with:

- **Date** in format `YYYY-MM-DD` (e.g. `2025-02-03`).
- **What was done:** short bullets (e.g. “Mobile UX CSS”, “GUI audit fixes”, “Bug X in Page Y”).
- **Files touched:** list of files or paths changed/created.
- **Outcome:** one line if useful (e.g. “50 issues audited”, “Focus a11y fixed”).

Keep it brief but enough that someone can see “what happened on this day” without reading the full chat.

---

## 3. Where to record it

- **File:** `docs/CHAT-SESSION-RECORD.md`
- **Order:** Newest date at the **top** of the date-wise log (so the latest day is first), or keep a **month → day** order and add the new day under the correct month.
- **Placeholder for future days:** Do not create future dates; only add a date when that day’s session has occurred.

---

## 4. Checklist for the AI

At the end of a session (or when the user says “save” / “record” / “wrap up”):

1. [ ] Open `docs/CHAT-SESSION-RECORD.md`.
2. [ ] Add or update the section for **today’s date** (YYYY-MM-DD).
3. [ ] List what was done, files touched, and any important outcome.
4. [ ] If the month is new, add a month heading (e.g. `## March 2025`) and put the day under it.
5. [ ] Do not leave the session without this update when work was done.

---

## 5. Example daily entry

```markdown
## February 2025

### 2025-02-04
- Fixed newsletter button staying in "Subscribing…" state (AppLayout).
- Added January 2025 placeholder and February structure to CHAT-SESSION-RECORD.
- Created CHAT-SESSION-PROTOCOL.md (daily save rule).
- **Files:** AppLayout.tsx, CHAT-SESSION-RECORD.md, CHAT-SESSION-PROTOCOL.md (new).
```

This protocol ensures the chat history is saved in the repo **daily without fail** as part of the AI’s job.
