# TC-037: Learner Portfolio — Platform-Hosted with Export Channels

**Status:** accepted
**Created:** 2026-02-24

## Context

The original plan was to store portfolio data on Solid Pods with WebACL zones.
After reconsideration, Solid Pods are not yet practical for this use case.
Instead, the portfolio is a **platform-hosted feature** where learners can:

1. Expose their portfolio on the SkillR system — public page at `/api/v1/portfolio/page/:userId`
2. Download as static HTML bundle — single `.html` file or `.zip` with assets
3. Export to GitHub repo — push portfolio as a GitHub Pages-ready repo (future phase)
4. Share progress on social media — generate shareable cards/links
5. Pod export — deferred to a future phase

## Decision

Portfolio data is stored in a PostgreSQL table (`learner_portfolio_entries`) following the
same domain patterns as sessions, evidence, and endorsements. The portfolio is
always available to authenticated users — no Pod dependency required.

Note: the table is named `learner_portfolio_entries` (not `portfolio_entries`) because
migration 000005 already created a `portfolio_entries` table for evidence data.

### Data Model

- `learner_portfolio_entries` table with UUID PK, user FK, title, description, category,
  visibility, tags array, timestamps
- Categories: `project` | `deliverable` | `example`
- Visibility: `public` | `private`
- Max 50 entries per user, max 10 tags per entry

### Export Channels

| Channel | Status | Description |
|---------|--------|-------------|
| Public page | Implemented | `/api/v1/portfolio/page/:userId` — content negotiation: HTML for browsers (`Accept: text/html`), JSON for API clients (`Accept: application/json`) |
| HTML download | Implemented | Self-contained HTML with inlined CSS |
| ZIP download | Implemented | ZIP archive containing index.html |
| Social sharing | Implemented | WhatsApp, LinkedIn, Email, Copy Link |
| GitHub export | Concept only | Documented for future phase |
| Pod export | Deferred | Depends on Solid Pod maturity |

### API Routes

**Authenticated** (v1 auth group):
- `GET /api/v1/portfolio/entries` — list own entries
- `POST /api/v1/portfolio/entries` — create entry
- `PUT /api/v1/portfolio/entries/:id` — update entry
- `DELETE /api/v1/portfolio/entries/:id` — delete entry
- `POST /api/v1/portfolio/entries/demo` — create demo entries
- `GET /api/v1/portfolio/export?format=html|zip` — export

**Public** (no auth):
- `GET /api/v1/portfolio/page/:userId` — public portfolio (content negotiation: `Accept: text/html` returns rendered HTML page, `Accept: application/json` returns JSON)

### GitHub Export (Future Phase)

The GitHub export flow would:
1. Redirect to GitHub OAuth (scope: `repo`)
2. Create/update `{username}/skillr-portfolio` repo
3. Push README.md, portfolio files, index.html, GitHub Pages workflow

The HTML export already produces a file that works as GitHub Pages `index.html`,
so users can manually upload today.

## Consequences

- Portfolio is immediately available without external dependencies
- Public portfolio pages enable sharing and employer visibility
- HTML export provides offline/portable portfolio
- Social sharing increases platform visibility
- GitHub export path is prepared but not blocked on OAuth integration
