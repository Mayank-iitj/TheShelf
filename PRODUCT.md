# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user is someone trying to break a doomscroll/short-form-content habit and redirect that attention toward a stated growth goal (e.g. becoming a full-stack developer). They use the app daily, typically in the moments they'd otherwise default to passive attention-content.

## Product Purpose

"The Shelf" is a daily behavior-change coach. Each day it prescribes a single action (the "Shelf" item) drawn from either growth work or attention-reclaiming alternatives, tracks the gap between the user's stated identity claims and their actual behavior, and periodically forces reconciliation between the two.

## Positioning

Two mechanisms operate together, neither alone: (1) an AI coach (Groq-backed) picks one prescribed daily action with visible reasoning (why now, alternatives considered, score breakdown) rather than presenting a list to choose from; (2) the app continuously surfaces contradictions between declared identity ("Identity Ledger" claims) and observed behavior ("Attention Twin"), forced into periodic honest reconciliation via the Weekly Review.

## Operating Context

- A 21-day simulated/scrubbable timeline (Day 1–21) lets the user (or a demo viewer) scrub through the program's progression; this is a core interaction, not a settings control.
- Onboarding is a 7-question interview (Stepper component) that seeds the user's initial Identity Ledger claims.
- Core screens: Today's Shelf (daily prescribed action + rationale trace), Attention Twin (growth vs. attention content ranking + divergence chart), Identity Ledger (claims with strength meters, tensions, purge/edit), Future Self (portrait + reached/unreached markers), Weekly Review (proposed identity-ledger updates to accept/reject).
- Auth via Clerk; a Landing page and Sign-in page exist outside the authenticated app shell.

## Capabilities and Constraints

- Frontend: React 19 + Vite, framer-motion, recharts, lucide-react, ogl (WebGL) available for shader-driven backgrounds.
- **Constraint (user-confirmed): do not modify Landing.jsx or SignInPage.jsx** — redesign scope is the authenticated app shell and its screens only (Shelf, Twin, Ledger, FutureSelf, Review, Onboarding/Stepper, and the shared app chrome: scrubber, header, sidebar).
- **Constraint (user-confirmed): the product name "The Shelf" is fixed.**
- Requested addition: an animated background inside the Stepper component during onboarding question-answering.

## Product Principles

- The AI's reasoning is a feature, not a debug log — rationale, alternatives-considered, and score breakdowns should read as evidence of a coach's judgment, not raw JSON dumped into a UI.
- Growth vs. attention is a load-bearing distinction throughout the product; it should stay visually legible wherever both appear side by side.
- The 21-day scrubber reframes the whole app as a lived history, not just a live dashboard — the chrome around it should reinforce that this is a journey being replayed, not a static settings screen.
- Honesty over encouragement: identity/behavior contradictions and "no review due" empty states are part of the product's value, not gaps to be minimized.
