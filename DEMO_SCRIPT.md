# The Shelf — Live Demo Script

Target: ~5-6 minutes live demo + Q&A. Every screen below has been verified against the
running app and the seeded 21-day dataset. Data lives in `data/shelf.db` (committed) —
if it ever gets polluted by ad-hoc testing again, restore it with:

```
node server/seed/seedContent.js && node server/seed/seedHistory.js && node server/seed/seedDemoActions.js
```

## The one-line pitch (say this first, verbatim if you can)

> "Today's algorithms optimize for your attention. The Shelf is an agentic curator that
> optimizes for your *potential* instead — it builds a real, auditable model of who you're
> trying to become, and every day it decides, out loud, what you actually need. Sometimes
> that's a resource. Sometimes it's a hard truth about a contradiction in your behavior.
> Sometimes — deliberately — it's nothing at all."

## Screen-by-screen walkthrough

### 1. Landing page (10-15s, don't linger)
Scroll past the hero once. Say: *"Not a feed — a mirror and an anvil."* Click **Start Your
Journey** and move on quickly. The landing page is heavy (multiple WebGL backgrounds); don't
demo it live longer than necessary.

### 2. Onboarding (30s)
If you're already signed in with seeded data, skip this and jump straight to the dashboard —
don't re-onboard live, it clears the curated demo data. If you *do* want to show onboarding,
mention the **voice input** (mic icon) — it's a real, working Web Speech API integration, a
nice unprompted "oh, that's real" moment.

### 3. Today's Shelf — Day 1 (20s)
Land here after sign-in. Day 1 says **"Today I chose to rest."** Click **"why"** to expand
the rationale: *"Just onboarded. No artifacts or habits yet."* This is the anti-dopamine
promise in action on day one — the AI doesn't manufacture busywork just to have something to
show you.

### 4. Scrub to Day 6 — a Challenge (15s)
Drag the day scrubber to **6**. Intervention flips to **"challenge."** Say: *"It noticed I'd
read enough about containers — time to actually deploy one, not read another article."* This
is the "prove it, don't just consume it" mechanic.

### 5. Scrub to Day 15 — a Counterpoint (20s, important beat)
Drag to **15**. Intervention is **"counterpoint."** Expand "why": it names a real
contradiction — *"clean API design"* as a stated goal vs. actual complexity that crept into
real code. Say: *"It doesn't just cheerlead. When your behavior contradicts what you said you
wanted, it says so, plainly."*

### 6. Scrub to Day 17 — Zero-Item Day (15s, the signature moment)
Drag to **17**. The Shelf goes **empty** — no items, a locked "Zero-Item Day" state. Say:
*"This is the whole thesis in one screen. The AI's own conclusion is that the right amount
of content today is zero. A feed can never do this — it always has something to show you.
This one is allowed to have nothing."*

### 7. Attention Twin (30s)
Click **Attention Twin** in the sidebar. Point at the **Divergence chart**: Potential Index
climbs (31→57 over 21 days) while Attention Potential — the counterfactual "if you'd just
scrolled instead" line — declines. Say: *"This is the gap the whole product exists to
widen."*

### 8. Identity Ledger (30s)
Click **Identity Ledger**. Point at the orange **Tensions** banner at the top — a real
detected contradiction (behavioral pattern vs. a stated claim), not a canned example. Show
the strength meters on 2-3 claims. Mention: *"Every claim here is auditable and editable —
this isn't a black-box embedding, it's a ledger you can read and argue with."*

### 9. Weekly Review — Day 14 (15s)
Scrub back to **Day 14**, click **Weekly Review**. Show the real proposed ledger diff with
its evidence line (*"3 artifacts logged on challenges, 0 on papers"*). Say: *"Every 7 days
it looks back at the pattern of what actually happened and proposes updating the model of
you — you approve or reject each one."*

### 10. Master Orchestrator (20s)
Click **Master Orchestrator**. Hit **"Run Master Synthesis"** live — this is a real,
un-cached Groq call happening in front of them. Point at the Alignment Score and the three
sub-agent status cards. Say: *"This is the supervisor synthesizing what all three agents
know into one verdict, live, right now."*

### 10b. Future Self — Ask Your Future Self chat (20-30s, great Q&A hook)
Click **Future Self** in the sidebar, scroll to the chat panel at the bottom. Click one of the
starter prompts ("Am I on track?") or — better — **let a judge type their own question live**.
The reply is a real, uncached Groq call, roleplaying as the user's future self, grounded in
their actual portrait, markers, and current ledger — it will cite real marker/ledger IDs, not
generic motivational text. Say: *"This is the 'become the self they imagine' part of the brief,
made literal — you can talk to them."* This is the single best live-interrogation moment for
Q&A: hand the keyboard to a judge and let them ask it something themselves.

### 11. Profile → Identity Passport (10s, closing beat)
Click **Profile**, then **Export Agentic Passport**. Say: *"Your identity model isn't locked
in here — you can take it with you and seed any other AI assistant with your real context."*
Close on this — it's the most quotable "we thought about the whole lifecycle" moment.

## Anticipated Q&A

**"How is this different from a recommendation algorithm?"**
A recommender optimizes for engagement/watch-time using implicit signals. This optimizes for
a stated, editable identity model, and its explicit mandate includes *withholding* content —
an outcome a recommender is never designed to produce, because doing nothing generates no
engagement to optimize.

**"What's actually driving the daily decision — is it real reasoning or scripted?"**
The Daily Curator Agent (Groq Llama 3.3 70B) receives the real ledger, recent delivery
history, and observed habits, and picks one of 7 named interventions with cited reasoning.
The 21-day *seed* history for the demo is curated for narrative clarity (so scrubbing through
days tells a coherent story), but the underlying agent is live — the Master Synthesis button
proves that on the spot with an uncached call.

**"What's the tech stack?"** React 18 + Vite, Express + `node:sqlite`, Clerk auth, Groq
(`llama-3.3-70b-versatile`) for all four agents (Onboarding, Daily, Weekly Review, Master
Orchestrator), deployed via Vercel/Render.

**"What happens with a completely blank identity ledger?"** The Daily Agent's own fallback
logic explicitly withholds rather than fabricating a recommendation — "no active ledger rows
to curate against yet" is a real, named code path, not an edge case that falls through to
junk output.

## Known rough edges (don't be caught off guard)

- The landing page has several simultaneous WebGL/animation components; on a slow machine it
  can feel heavy on first load. If it looks janky, don't dwell — move to the dashboard fast.
- If someone re-runs onboarding live, it wipes the curated 21-day story back to a blank
  slate. Only do this deliberately, and know the reseed command above if you need to recover.
