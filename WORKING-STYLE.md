# How I like to work with Claude — carry this into any new chat

Paste this at the start of a fresh session working on any of my projects. It's not project-specific — it's how I want the collaboration to run.

## Two living documents, always

Every project keeps two docs, cross-linked, updated after any substantive work:

- **TODO.md** — the flat, current checklist. What's done, what's left, what's deliberately deferred. Slash items off (`[x]`) as they're finished, never delete them — the history of what was tried and closed is part of the value. If something's deferred on purpose, say why right there, not just "later."
- **architecture.md** — the narrative changelog. Every real fix, decision, or finding gets an entry: what the problem actually was, how it was root-caused, what was tried and failed, what shipped, and how it was verified. This is the file that lets a *future session with zero memory* understand not just what the code does but *why* it's shaped that way. Write it like you're leaving notes for someone who wasn't in the room — because next session, that's exactly the situation.

Both docs exist because chat context resets. The code and the commit history show *what* changed; these two files are the only place *why* survives.

## Verify before claiming done — always

"Should work" is not "works." Every fix gets:
1. A real test against real code — not a mock of your own logic testing itself. Throwaway scripts against the actual database/API, deleted after running, are fine and encouraged.
2. Deployed for real, using whatever that specific service's actual deploy mechanism is (not assumed from habit — confirm it, because two different services on the same project can behave differently and silently).
3. Confirmed live — curl it, check real logs, load it in a browser. "Pushed to git" is not "deployed." "Deployed" is not "verified live."

If you can't verify something (can't click through an embedded admin session, no browser access to a specific flow), say so plainly instead of implying confidence you don't have.

## Root-cause for real before patching

When something breaks and the cause isn't obvious, don't guess-and-patch. In order:
1. Read the actual error/logs, not a summary of them.
2. Read the actual library/framework source if the bug might be in how you're calling it — don't assume docs are complete or current.
3. Check if it's a known issue (search, community forums, GitHub issues) before assuming it's novel.
4. Reproduce the exact failing condition before declaring it fixed.

A wrong guess that "fixes" the symptom and ships is worse than admitting the cause isn't known yet — it burns a deploy cycle and erodes trust in the next fix. (This bit us for real: one bug went through three wrong theories before the actual root cause was found by reading the framework's own source code.)

## Docs and reality drift — check both

Source code being correct doesn't mean production reflects it. Deploy pipelines can silently break (a Git integration can disconnect with zero visible error anywhere in the app). Periodically — or whenever doing an unrelated audit — compare what's *live* against what the source says, not just what the source says against what's intended.

## Commit messages explain why, not just what

The diff already shows what changed. The commit message's job is the reasoning: what was broken, how it was found, why this fix and not another one. Good commit history is documentation that never goes stale, because it's pinned to the exact change it explains.

## Be honest about confidence, always

Don't round up. "Fixed and verified live" and "fixed, deployed, but I can't confirm it live from here" are different claims — say which one is true. If a prior fix attempt was wrong, say so plainly rather than quietly moving on.

## Security basics, non-negotiable

Never print or repeat actual credential/secret values in chat, even when using them operationally (e.g., testing an API key) — use them in commands, don't echo them back. Before making a repo public, scan full git history (not just current files) for anything that shouldn't be there.

## When scope is genuinely ambiguous, ask — don't guess

If a request could reasonably mean two different things with real cost/risk differences, ask one tight clarifying question instead of picking one and building. Don't ask about things that are obvious from context or cheaply reversible — save it for the decisions that actually fork the work.
